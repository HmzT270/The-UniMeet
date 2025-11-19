using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace UniMeetApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Tüm endpoint'ler authentication gerektiriyor
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly ILogger<AdminController> _logger;

        public AdminController(AppDbContext db, ILogger<AdminController> logger)
        {
            _db = db;
            _logger = logger;
        }

        // İstek/yanıt tipleri
        public record UserDto(int UserId, string Email, string FullName, string Role, bool IsActive);
        public record UpdateUserRoleReq(int UserId, string NewRole);

        // ✅ Tüm kullanıcıları getir (sadece Admin)
        [HttpGet("users")]
        public async Task<ActionResult<List<UserDto>>> GetAllUsers()
        {
            // Kullanıcının role'ünü kontrol et
            var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
            if (roleClaim != "Admin")
                return Forbid("Sadece admin kullanıcılar bu işlemi yapabilir.");

            try
            {
                var users = await _db.Users
                    .OrderBy(u => u.Email)
                    .Select(u => new UserDto(
                        u.UserId,
                        u.Email,
                        u.FullName,
                        u.Role.ToString(),
                        u.IsActive
                    ))
                    .ToListAsync();

                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Kullanıcılar alınırken hata oluştu.");
                return StatusCode(500, new { message = "Kullanıcılar alınırken hata oluştu." });
            }
        }

        // ✅ Kullanıcı rolünü güncelle (sadece Admin)
        [HttpPost("users/{userId}/update-role")]
        public async Task<IActionResult> UpdateUserRole(int userId, [FromBody] UpdateUserRoleReq req)
        {
            // Kullanıcının role'ünü kontrol et
            var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
            if (roleClaim != "Admin")
                return Forbid("Sadece admin kullanıcılar bu işlemi yapabilir.");

            if (req is null || string.IsNullOrWhiteSpace(req.NewRole))
                return BadRequest(new { message = "Geçerli bir rol giriniz." });

            // Geçerli rol kontrol et
            if (!Enum.TryParse<UserRole>(req.NewRole, true, out var newRole))
                return BadRequest(new { message = $"Geçersiz rol: {req.NewRole}. Geçerli roller: Member, Manager, Admin" });

            try
            {
                var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == userId);
                if (user is null)
                    return NotFound(new { message = "Kullanıcı bulunamadı." });

                var oldRole = user.Role;
                user.Role = newRole;
                await _db.SaveChangesAsync();

                _logger.LogInformation($"Kullanıcı {user.Email} rolü {oldRole} → {newRole} olarak güncellendi.");
                return Ok(new { message = $"Rol başarıyla güncellendi: {oldRole} → {newRole}" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Rol güncellenirken hata oluştu.");
                return StatusCode(500, new { message = "Rol güncellenirken hata oluştu." });
            }
        }

        // ✅ Kullanıcının aktif/pasif durumunu değiştir (sadece Admin)
        [HttpPost("users/{userId}/toggle-active")]
        public async Task<IActionResult> ToggleUserActive(int userId)
        {
            // Kullanıcının role'ünü kontrol et
            var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
            if (roleClaim != "Admin")
                return Forbid("Sadece admin kullanıcılar bu işlemi yapabilir.");

            try
            {
                var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == userId);
                if (user is null)
                    return NotFound(new { message = "Kullanıcı bulunamadı." });

                user.IsActive = !user.IsActive;
                await _db.SaveChangesAsync();

                _logger.LogInformation($"Kullanıcı {user.Email} aktif durumu: {user.IsActive}");
                return Ok(new { message = $"Kullanıcı {(user.IsActive ? "aktifleştirildi" : "pasifleştirildi")}." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Kullanıcı durumu değiştirilirken hata oluştu.");
                return StatusCode(500, new { message = "Kullanıcı durumu değiştirilirken hata oluştu." });
            }
        }
    }
}
