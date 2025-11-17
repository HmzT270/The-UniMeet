using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

// JWT & Claims
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using UniMeetApi.Services;
using Microsoft.Extensions.Hosting;

namespace UniMeetApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IConfiguration _cfg;
        private readonly IEmailSender _emailSender;
        private readonly ILogger<AuthController> _logger;
        private readonly IHostEnvironment _env;

        public AuthController(AppDbContext db, IConfiguration cfg, IEmailSender emailSender, ILogger<AuthController> logger, IHostEnvironment env)
        {
            _db = db;
            _cfg = cfg;
            _emailSender = emailSender;
            _logger = logger;
            _env = env;
        }

        // İstek/yanıt tipleri
        public record LoginReq(string Email, string Password);

        // ✅ ManagedClubId ve Token ekli
        public record LoginRes(int UserId, string Email, string FullName, string Role, int? ManagedClubId, string Token);

        public record RequestVerificationReq(string Email);

        public record RequestVerificationRes(string Email, bool EmailSent, DateTime ExpiresAtUtc, DateTime ExpiresAtLocal, string TimeZoneDisplayName);

        public record VerifyEmailRes(string Email, bool AlreadyCompleted, DateTime? ExpiresAtUtc, DateTime? ExpiresAtLocal, string? TimeZoneDisplayName);

        public record SetPasswordReq(string Token, string Password, string ConfirmPassword);

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

            var emailCheck = TryNormalizeStudentEmail(req.Email);
            if (!emailCheck.IsValid) return BadRequest(emailCheck.ErrorMessage);

            var password = (req.Password ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(password)) return BadRequest("Şifre zorunludur.");

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == emailCheck.NormalizedEmail);
            if (user is null)
                return BadRequest("Bu e-posta ile kayıt bulunamadı. Önce doğrulama e-postası isteyin.");

            if (!user.IsActive)
                return BadRequest("Hesap pasif. Lütfen yöneticiyle iletişime geçin.");

            if (!user.EmailConfirmed)
                return BadRequest("E-posta doğrulaması tamamlanmamış. Mail kutundaki bağlantıyı kullanın.");

            if (user.RequiresPasswordReset || string.IsNullOrWhiteSpace(user.PasswordHash))
                return BadRequest("Şifre oluşturmanız gerekiyor. Doğrulama e-postasındaki linki kullanın.");

            if (!string.Equals(user.PasswordHash, Sha256(password), StringComparison.OrdinalIgnoreCase))
                return BadRequest("Şifre hatalı.");

            // --- JWT üretimi ---
            var issuer = _cfg["Jwt:Issuer"] ?? string.Empty;
            var audience = _cfg["Jwt:Audience"] ?? string.Empty;
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
                user.ManagedClubId,
                jwt
            );
        }

        [HttpPost("request-verification")]
        [AllowAnonymous]
        public async Task<ActionResult<RequestVerificationRes>> RequestVerification([FromBody] RequestVerificationReq req)
        {
            if (req is null) return BadRequest("Geçersiz istek.");

            var emailCheck = TryNormalizeStudentEmail(req.Email);
            if (!emailCheck.IsValid) return BadRequest(emailCheck.ErrorMessage);

            var email = emailCheck.NormalizedEmail;
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

            if (user is null)
            {
                user = new User
                {
                    Email = email,
                    FullName = email.Split('@')[0],
                    PasswordHash = string.Empty,
                    Role = UserRole.Member,
                    IsActive = true,
                    ManagedClubId = null,
                    EmailConfirmed = false,
                    RequiresPasswordReset = true
                };
                _db.Users.Add(user);
            }
            else
            {
                if (!user.IsActive)
                    return BadRequest("Bu hesap pasif durumda. Lütfen yöneticiyle iletişime geçin.");

                if (user.EmailConfirmed && !user.RequiresPasswordReset)
                    return BadRequest("Bu e-posta zaten doğrulanmış ve kullanıma hazır. Giriş yapmayı deneyebilirsiniz.");

                user.RequiresPasswordReset = true;
                user.EmailConfirmed = false;
            }

            var token = GenerateVerificationToken();
            var expiresAtUtc = DateTime.UtcNow.AddMinutes(15);
            user.VerificationToken = token;
            user.VerificationTokenExpiresAt = expiresAtUtc;

            await _db.SaveChangesAsync();

            var verificationLink = BuildVerificationUrl(token);
            var tzInfo = GetClientTimeZone();
            var expiresAt = user.VerificationTokenExpiresAt ?? expiresAtUtc;
            var expiresAtLocal = ConvertUtcToClientTime(expiresAt, tzInfo);
            var htmlBody = BuildVerificationEmailBody(user.FullName, verificationLink, expiresAtLocal, tzInfo.DisplayName);

            try
            {
                await _emailSender.SendEmailAsync(email, "UniMeet | E-posta doğrulama", htmlBody);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Doğrulama e-postası gönderilemedi: {Email}", email);
                var devMessage = $"Doğrulama e-postası gönderilemedi. Hata: {ex.Message}";
                var safeMessage = "Doğrulama e-postası gönderilemedi. Bir süre sonra tekrar deneyin.";
                return StatusCode(500, _env.IsDevelopment() ? devMessage : safeMessage);
            }

            return new RequestVerificationRes(email, true, expiresAt, expiresAtLocal, tzInfo.DisplayName);
        }

        [HttpGet("verify-email")]
        [AllowAnonymous]
        public async Task<ActionResult<VerifyEmailRes>> VerifyEmail([FromQuery] string token)
        {
            if (string.IsNullOrWhiteSpace(token)) return BadRequest("Token zorunludur.");

            var user = await _db.Users.FirstOrDefaultAsync(u => u.VerificationToken == token);
            if (user is null)
                return NotFound("Token geçersiz veya süresi dolmuş.");

            if (!user.VerificationTokenExpiresAt.HasValue || user.VerificationTokenExpiresAt.Value < DateTime.UtcNow)
                return BadRequest("Token süresi dolmuş. Yeni bir doğrulama talep etmelisiniz.");

            var tzInfo = GetClientTimeZone();
            var expiresUtc = user.VerificationTokenExpiresAt;
            var expiresLocal = expiresUtc.HasValue ? ConvertUtcToClientTime(expiresUtc.Value, tzInfo) : (DateTime?)null;
            return new VerifyEmailRes(user.Email, user.EmailConfirmed && !user.RequiresPasswordReset, expiresUtc, expiresLocal, tzInfo.DisplayName);
        }

        [HttpPost("set-password")]
        [AllowAnonymous]
        public async Task<IActionResult> SetPassword([FromBody] SetPasswordReq req)
        {
            if (req is null) return BadRequest("Geçersiz istek.");

            var token = (req.Token ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(token)) return BadRequest("Token zorunludur.");

            var password = (req.Password ?? string.Empty).Trim();
            var confirmPassword = (req.ConfirmPassword ?? string.Empty).Trim();

            if (password.Length < 8)
                return BadRequest("Şifre en az 8 karakter olmalıdır.");

            if (!string.Equals(password, confirmPassword, StringComparison.Ordinal))
                return BadRequest("Şifreler eşleşmiyor.");

            var user = await _db.Users.FirstOrDefaultAsync(u => u.VerificationToken == token);
            if (user is null)
                return BadRequest("Token geçersiz.");

            if (!user.VerificationTokenExpiresAt.HasValue || user.VerificationTokenExpiresAt.Value < DateTime.UtcNow)
                return BadRequest("Token süresi dolmuş. Yeni doğrulama isteyin.");

            user.PasswordHash = Sha256(password);
            user.EmailConfirmed = true;
            user.RequiresPasswordReset = false;
            user.PasswordSetAt = DateTime.UtcNow;
            user.VerificationToken = null;
            user.VerificationTokenExpiresAt = null;

            await _db.SaveChangesAsync();

            return Ok(new { message = "Şifre oluşturuldu. Artık giriş yapabilirsiniz." });
        }

        private (bool IsValid, string NormalizedEmail, string ErrorMessage) TryNormalizeStudentEmail(string? email)
        {
            var normalized = (email ?? string.Empty).Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(normalized))
                return (false, string.Empty, "E-posta zorunludur.");

            var allowed = (_cfg["AllowedEmailDomain"] ?? "dogus.edu.tr").Trim().ToLowerInvariant();
            var rx = new Regex(@"^(\d{12})@" + Regex.Escape(allowed) + "$", RegexOptions.IgnoreCase);
            if (!rx.IsMatch(normalized))
                return (false, string.Empty, $"E-posta 12 haneli öğrenci no + @{allowed} formatında olmalı. Örn: 202203011029@{allowed}");

            return (true, normalized, string.Empty);
        }

        private static string GenerateVerificationToken()
        {
            Span<byte> buffer = stackalloc byte[32];
            RandomNumberGenerator.Fill(buffer);
            return Convert.ToHexString(buffer).ToLowerInvariant();
        }

        private string BuildVerificationUrl(string token)
        {
            var baseUrl = _cfg["Client:BaseUrl"];
            if (string.IsNullOrWhiteSpace(baseUrl))
                baseUrl = "http://localhost:5173";

            var trimmed = baseUrl.TrimEnd('/');
            return $"{trimmed}/verify?token={Uri.EscapeDataString(token)}";
        }

        private TimeZoneInfo GetClientTimeZone()
        {
            var tzId = _cfg["Client:TimeZoneId"];
            if (!string.IsNullOrWhiteSpace(tzId))
            {
                try
                {
                    return TimeZoneInfo.FindSystemTimeZoneById(tzId);
                }
                catch (TimeZoneNotFoundException)
                {
                    _logger.LogWarning("Time zone '{TimeZoneId}' bulunamadı. Local time kullanılacak.", tzId);
                }
                catch (InvalidTimeZoneException)
                {
                    _logger.LogWarning("Time zone '{TimeZoneId}' geçersiz. Local time kullanılacak.", tzId);
                }
            }

            return TimeZoneInfo.Local;
        }

        private static DateTime ConvertUtcToClientTime(DateTime utcTime, TimeZoneInfo tz)
        {
            var utc = DateTime.SpecifyKind(utcTime, DateTimeKind.Utc);
            return TimeZoneInfo.ConvertTimeFromUtc(utc, tz);
        }

        private static string BuildVerificationEmailBody(string fullName, string verificationLink, DateTime expiresAtLocal, string timeZoneDisplayName)
        {
            var safeName = string.IsNullOrWhiteSpace(fullName) ? "Öğrenci" : fullName;
            var expiresText = expiresAtLocal.ToString("dd.MM.yyyy HH:mm", CultureInfo.InvariantCulture);

            var sb = new StringBuilder();
            sb.AppendLine($"<p>Merhaba {safeName},</p>");
            sb.AppendLine("<p>UniMeet hesabını aktifleştirmek ve ilk şifreni belirlemek için aşağıdaki butona tıkla.</p>");
            sb.AppendLine($"<p style='text-align:center;margin:32px 0'>"
                + $"<a href='{verificationLink}' style='display:inline-block;padding:12px 24px;background:#6a4cff;color:#fff;text-decoration:none;border-radius:6px;font-weight:600'>Şifre Oluştur</a>"
                + "</p>");
            sb.AppendLine("<p>Bağlantı tek kullanımlık olup " + expiresText + " (" + timeZoneDisplayName + ") tarihine kadar geçerlidir. Süresi dolarsa giriş ekranından yeni bir doğrulama isteyebilirsin.</p>");
            sb.AppendLine("<p>Eğer bu talebi sen oluşturmadıysan bu e-postayı yok sayabilirsin.</p>");
            sb.AppendLine("<p>UniMeet Ekibi</p>");
            return sb.ToString();
        }
    }
}
