using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

// JWT & Claims
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace UniMeetApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IConfiguration _cfg;

        public AuthController(AppDbContext db, IConfiguration cfg)
        {
            _db = db;
            _cfg = cfg;
        }

        // İstek/yanıt tipleri
        public record LoginReq(string Email, string Password);

        // ✅ ManagedClubId ve Token ekli
        public record LoginRes(int UserId, string Email, string FullName, string Role, int? ManagedClubId, string Token);

        // Basit SHA256 hash (demo). Üretimde ASP.NET Identity / BCrypt önerilir.
        private static string Sha256(string input)
        {
            using var sha = SHA256.Create();
            var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(input));
            var sb = new StringBuilder();
            foreach (var b in bytes) sb.Append(b.ToString("x2"));
            return sb.ToString();
        }

        [HttpPost("login")]
        [AllowAnonymous] // ✅ Global authorize olsa bile giriş serbest
        public async Task<ActionResult<LoginRes>> Login([FromBody] LoginReq req)
        {
            if (req is null) return BadRequest("Geçersiz istek.");

            var email = (req.Email ?? "").Trim().ToLowerInvariant();
            var password = (req.Password ?? "").Trim();
            if (string.IsNullOrWhiteSpace(email)) return BadRequest("E-posta zorunludur.");
            if (string.IsNullOrWhiteSpace(password)) return BadRequest("Şifre zorunludur.");

            // appsettings.json: "AllowedEmailDomain": "dogus.edu.tr"
            var allowed = (_cfg["AllowedEmailDomain"] ?? "dogus.edu.tr").Trim().ToLowerInvariant();

            // 12 haneli öğrenci no + @allowed
            var rx = new Regex($@"^(\d{{12}})@{Regex.Escape(allowed)}$", RegexOptions.IgnoreCase);
            if (!rx.IsMatch(email))
                return BadRequest($"E-posta 12 haneli öğrenci no + @{allowed} formatında olmalı. Örn: 202203011029@{allowed}");

            // Kullanıcıyı bul/oluştur
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

            if (user is null)
            {
                // İlk kez giriş: kullanıcıyı oluştur (FullName zorunlu olduğundan local-part'ı kullanıyoruz)
                user = new User
                {
                    Email = email,
                    FullName = email.Split('@')[0],   // örn: 202203011029
                    PasswordHash = Sha256(password),
                    Role = UserRole.Member,           // Varsayılan rol
                    IsActive = true,
                    ManagedClubId = null              // Varsayılan: yok
                };
                _db.Users.Add(user);
                await _db.SaveChangesAsync();
            }
            else
            {
                if (!user.IsActive) return BadRequest("Hesap pasif.");
                if (!string.Equals(user.PasswordHash, Sha256(password), StringComparison.OrdinalIgnoreCase))
                    return BadRequest("Şifre hatalı.");
            }

            // --- JWT üretimi ---
            var issuer = _cfg["Jwt:Issuer"] ?? "";
            var audience = _cfg["Jwt:Audience"] ?? "";
            var key = _cfg["Jwt:Key"];

            if (string.IsNullOrWhiteSpace(key))
                return StatusCode(500, "JWT Key yapılandırılmamış. Lütfen appsettings.json içinde 'Jwt:Key' giriniz.");

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(ClaimTypes.Role, user.Role.ToString())
            };

            // (Opsiyonel) Manager’ın kulübü claim'i
            if (user.ManagedClubId.HasValue)
                claims.Add(new Claim("ManagedClubId", user.ManagedClubId.Value.ToString()));

            var expires = DateTime.UtcNow.AddHours(8); // token ömrü
            var token = new JwtSecurityToken(
                issuer: string.IsNullOrWhiteSpace(issuer) ? null : issuer,
                audience: string.IsNullOrWhiteSpace(audience) ? null : audience,
                claims: claims,
                notBefore: DateTime.UtcNow,
                expires: expires,
                signingCredentials: credentials
            );

            var jwt = new JwtSecurityTokenHandler().WriteToken(token);

            return new LoginRes(
                user.UserId,
                user.Email,
                user.FullName,
                user.Role.ToString(),
                user.ManagedClubId,  // ✅ Frontend’de Select’i kısıtlamak için kullanılıyor
                jwt
            );
        }
    }
}
