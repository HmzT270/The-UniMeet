using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace UniMeetApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EventsController : ControllerBase
    {
        private readonly AppDbContext _db;
        public EventsController(AppDbContext db) => _db = db;

        // === DTOs ===
        public record EventDto(
            int EventId,
            string Title,
            string Location,
            DateTime StartAt,
            DateTime? EndAt,
            int Quota,
            int ClubId,
            string? ClubName,
            string? Description,
            bool IsCancelled
        );

        public record CreateEventRequest(
            string Title,
            string Location,
            DateTime StartAt,
            DateTime? EndAt,
            int Quota,
            int ClubId,
            string? Description
        );

        public record UpdateEventRequest(
            string Title,
            string Location,
            DateTime StartAt,
            DateTime? EndAt,
            int Quota,
            int ClubId,
            string? Description,
            bool? IsCancelled
        );

        // === Helpers ===
        private bool TryGetUserId(out int userId)
        {
            userId = 0;
            var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(idStr, out userId);
        }

        private static bool IsAdmin(User u) => u.Role == UserRole.Admin;
        private static bool IsManager(User u) => u.Role == UserRole.Manager;

        // Manager sadece kendi kulübü için işlem yapabilir (Create/Update/Delete)
        private static bool ManagerOwnsClub(User u, int clubId)
            => IsManager(u) && u.ManagedClubId.HasValue && u.ManagedClubId.Value == clubId;

        // === Everyone can view ===
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<List<EventDto>>> GetAll([FromQuery] bool includeCancelled = false)
        {
            var query = _db.Events.AsNoTracking();

            if (!includeCancelled)
                query = query.Where(e => !e.IsCancelled);

            var list = await query
                .OrderBy(e => e.StartAt)
                .Select(e => new EventDto(
                    e.EventId,
                    e.Title,
                    e.Location,
                    e.StartAt,
                    e.EndAt,
                    e.Quota,
                    e.ClubId,
                    _db.Clubs.Where(c => c.ClubId == e.ClubId).Select(c => (string?)c.Name).FirstOrDefault(),
                    e.Description,
                    e.IsCancelled
                ))
                .ToListAsync();

            return Ok(list);
        }

        [HttpGet("{id:int}")]
        [AllowAnonymous]
        public async Task<ActionResult<EventDto>> GetById(int id)
        {
            var e = await _db.Events.AsNoTracking().FirstOrDefaultAsync(x => x.EventId == id);
            if (e is null) return NotFound("Etkinlik bulunamadı.");

            var clubName = await _db.Clubs
                .Where(c => c.ClubId == e.ClubId)
                .Select(c => (string?)c.Name)
                .FirstOrDefaultAsync();

            var dto = new EventDto(
                e.EventId,
                e.Title,
                e.Location,
                e.StartAt,
                e.EndAt,
                e.Quota,
                e.ClubId,
                clubName,
                e.Description,
                e.IsCancelled
            );

            return Ok(dto);
        }

        // === ManagersOnly (Manager/Admin) ===
        [HttpPost]
        [Authorize(Policy = "ManagersOnly")]
        public async Task<ActionResult<EventDto>> Create([FromBody] CreateEventRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Title))
                return BadRequest("Etkinlik adı zorunludur.");
            if (string.IsNullOrWhiteSpace(req.Location))
                return BadRequest("Etkinlik yeri zorunludur.");
            if (req.Quota < 1)
                return BadRequest("Kontenjan en az 1 olmalıdır.");
            if (req.EndAt.HasValue && req.EndAt.Value < req.StartAt)
                return BadRequest("Bitiş, başlangıçtan önce olamaz.");

            if (!TryGetUserId(out var userId))
                return Unauthorized("Kullanıcı bilgisi alınamadı.");

            var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == userId);
            if (user is null || !user.IsActive) return Unauthorized("Kullanıcı bulunamadı veya pasif.");

            // ✅ KURAL: Admin serbest; Manager sadece kendi kulübü için
            if (!IsAdmin(user) && !ManagerOwnsClub(user, req.ClubId))
                return Forbid($"Yalnızca yöneticisi olduğunuz kulüp için etkinlik oluşturabilirsiniz. (Sizin kulübünüz: {user.ManagedClubId?.ToString() ?? "tanımsız"})");

            var entity = new Event
            {
                Title = req.Title.Trim(),
                Location = req.Location.Trim(),
                StartAt = DateTime.SpecifyKind(req.StartAt, DateTimeKind.Utc),
                EndAt = req.EndAt.HasValue ? DateTime.SpecifyKind(req.EndAt.Value, DateTimeKind.Utc) : null,
                Quota = req.Quota,
                ClubId = req.ClubId,
                Description = string.IsNullOrWhiteSpace(req.Description) ? null : req.Description.Trim(),
                IsCancelled = false,
                CreatedByUserId = user.UserId,
                CreatedAt = DateTime.UtcNow
            };

            _db.Events.Add(entity);
            await _db.SaveChangesAsync();

            var clubName = await _db.Clubs
                .Where(c => c.ClubId == entity.ClubId)
                .Select(c => (string?)c.Name)
                .FirstOrDefaultAsync();

            var dto = new EventDto(
                entity.EventId,
                entity.Title,
                entity.Location,
                entity.StartAt,
                entity.EndAt,
                entity.Quota,
                entity.ClubId,
                clubName,
                entity.Description,
                entity.IsCancelled
            );

            return CreatedAtAction(nameof(GetById), new { id = entity.EventId }, dto);
        }

        [HttpPut("{id:int}")]
        [Authorize(Policy = "ManagersOnly")]
        public async Task<ActionResult<EventDto>> Update(int id, [FromBody] UpdateEventRequest req)
        {
            var e = await _db.Events.FirstOrDefaultAsync(x => x.EventId == id);
            if (e is null) return NotFound("Etkinlik bulunamadı.");

            if (string.IsNullOrWhiteSpace(req.Title))
                return BadRequest("Etkinlik adı zorunludur.");
            if (string.IsNullOrWhiteSpace(req.Location))
                return BadRequest("Etkinlik yeri zorunludur.");
            if (req.Quota < 1)
                return BadRequest("Kontenjan en az 1 olmalıdır.");
            if (req.EndAt.HasValue && req.EndAt.Value < req.StartAt)
                return BadRequest("Bitiş, başlangıçtan önce olamaz.");

            if (!TryGetUserId(out var userId))
                return Unauthorized("Kullanıcı bilgisi alınamadı.");

            var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == userId);
            if (user is null || !user.IsActive) return Unauthorized("Kullanıcı bulunamadı veya pasif.");

            // ✅ KURAL: Admin serbest; Manager sadece KENDİ kulübüne ait etkinliği güncelleyebilir
            var targetClubId = req.ClubId; // kulübü değiştirmeye de izin veriyorsak bu değer önemli
            if (!IsAdmin(user) && !ManagerOwnsClub(user, targetClubId))
                return Forbid("Yalnızca yöneticisi olduğunuz kulüp için güncelleme yapabilirsiniz.");

            e.Title = req.Title.Trim();
            e.Location = req.Location.Trim();
            e.StartAt = DateTime.SpecifyKind(req.StartAt, DateTimeKind.Utc);
            e.EndAt = req.EndAt.HasValue ? DateTime.SpecifyKind(req.EndAt.Value, DateTimeKind.Utc) : null;
            e.Quota = req.Quota;
            e.ClubId = req.ClubId;
            e.Description = string.IsNullOrWhiteSpace(req.Description) ? null : req.Description.Trim();

            if (req.IsCancelled.HasValue)
                e.IsCancelled = req.IsCancelled.Value;

            await _db.SaveChangesAsync();

            var clubName = await _db.Clubs
                .Where(c => c.ClubId == e.ClubId)
                .Select(c => (string?)c.Name)
                .FirstOrDefaultAsync();

            var dto = new EventDto(
                e.EventId,
                e.Title,
                e.Location,
                e.StartAt,
                e.EndAt,
                e.Quota,
                e.ClubId,
                clubName,
                e.Description,
                e.IsCancelled
            );

            return Ok(dto);
        }

        [HttpDelete("{id:int}")]
        [Authorize(Policy = "ManagersOnly")]
        public async Task<IActionResult> Cancel(int id)
        {
            var e = await _db.Events.FirstOrDefaultAsync(x => x.EventId == id);
            if (e is null) return NotFound("Etkinlik bulunamadı.");

            if (!TryGetUserId(out var userId))
                return Unauthorized("Kullanıcı bilgisi alınamadı.");

            var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == userId);
            if (user is null || !user.IsActive) return Unauthorized("Kullanıcı bulunamadı veya pasif.");

            // ✅ KURAL: Admin serbest; Manager sadece KENDİ kulübüne ait etkinliği iptal edebilir
            if (!IsAdmin(user) && !ManagerOwnsClub(user, e.ClubId))
                return Forbid("Yalnızca yöneticisi olduğunuz kulüp için iptal işlemi yapabilirsiniz.");

            e.IsCancelled = true;
            await _db.SaveChangesAsync();
            return NoContent();
        }

        // === ✅ YENİ: 24 saat içindeki etkinlikler (kullanıcının kulüpleri) ===
        [HttpGet("upcoming")]
        [Authorize]
        public async Task<ActionResult<List<EventDto>>> Upcoming([FromQuery] bool includeCancelled = false)
        {
            if (!TryGetUserId(out var userId))
                return Unauthorized("Kullanıcı bilgisi alınamadı.");

            // Kullanıcının üye olduğu kulüpler
            var myClubIds = await _db.ClubMembers
                .Where(m => m.UserId == userId)
                .Select(m => m.ClubId)
                .ToListAsync();

            if (myClubIds.Count == 0)
                return Ok(new List<EventDto>());

            var now = DateTime.UtcNow;
            var until = now.AddHours(24);

            var query = _db.Events.AsNoTracking()
                .Where(e =>
                    myClubIds.Contains(e.ClubId) &&
                    e.StartAt > now &&
                    e.StartAt <= until
                );

            if (!includeCancelled)
                query = query.Where(e => !e.IsCancelled);

            var list = await query
                .OrderBy(e => e.StartAt)
                .Select(e => new EventDto(
                    e.EventId,
                    e.Title,
                    e.Location,
                    e.StartAt,
                    e.EndAt,
                    e.Quota,
                    e.ClubId,
                    _db.Clubs.Where(c => c.ClubId == e.ClubId).Select(c => (string?)c.Name).FirstOrDefault(),
                    e.Description,
                    e.IsCancelled
                ))
                .ToListAsync();

            return Ok(list);
        }

        // === ✅ Takip edilen kulüplerin etkinlikleri (Home feed) ===
        [HttpGet("feed")]
        [Authorize]
        public async Task<ActionResult<List<EventDto>>> Feed(
            [FromQuery] bool upcomingOnly = true,
            [FromQuery] bool includeCancelled = false)
        {
            if (!TryGetUserId(out var userId))
                return Unauthorized("Kullanıcı bilgisi alınamadı.");

            // Kullanıcının takip ettiği kulüpler
            var myClubIds = await _db.ClubMembers
                .Where(m => m.UserId == userId)
                .Select(m => m.ClubId)
                .ToListAsync();

            // Hiç kulüp takip etmiyorsa boş liste dön
            if (myClubIds.Count == 0) return Ok(new List<EventDto>());

            var now = DateTime.UtcNow;

            var query = _db.Events.AsNoTracking()
                .Where(e => myClubIds.Contains(e.ClubId));

            if (!includeCancelled)
                query = query.Where(e => !e.IsCancelled);

            if (upcomingOnly)
                query = query.Where(e => e.StartAt >= now);

            var list = await query
                .OrderBy(e => e.StartAt)
                .Select(e => new EventDto(
                    e.EventId,
                    e.Title,
                    e.Location,
                    e.StartAt,
                    e.EndAt,
                    e.Quota,
                    e.ClubId,
                    _db.Clubs.Where(c => c.ClubId == e.ClubId).Select(c => (string?)c.Name).FirstOrDefault(),
                    e.Description,
                    e.IsCancelled
                ))
                .ToListAsync();

            return Ok(list);
        }
    }
}
