// Controllers/ClubsController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace UniMeetApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClubsController : ControllerBase
    {
        private readonly AppDbContext _db;
        public ClubsController(AppDbContext db) => _db = db;

        // Mevcut minimal DTO (mevcut frontend'i kırmamak için korunuyor)
        public record ClubDto(int ClubId, string Name);

        // Yeni DTO: takip bilgisini de içerir (with-following için)
        public record ClubWithFollowDto(int ClubId, string Name, bool IsFollowing);

        // JWT'den kullanıcı Id'yi güvenle al (null olabilir)
        private int? TryGetUserId()
        {
            var s = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(s, out var id) ? id : (int?)null;
        }

        /// <summary>
        /// Tüm kulüplerin basit listesi (AUTH GEREKTİRMEZ) — mevcut davranış değişmedi.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<List<ClubDto>>> GetAll()
        {
            var list = await _db.Clubs
                .AsNoTracking()
                .OrderBy(c => c.Name)
                .Select(c => new ClubDto(c.ClubId, c.Name))
                .ToListAsync();

            return Ok(list);
        }

        /// <summary>
        /// Tüm kulüpler + kullanıcının takip durumuyla birlikte (AUTH GEREKİR).
        /// Frontend "Takip Et / Takibi Bırak" butonları için bunu kullanabilir.
        /// </summary>
        [HttpGet("with-following")]
        [Authorize]
        public async Task<ActionResult<List<ClubWithFollowDto>>> GetAllWithFollowing()
        {
            var uid = TryGetUserId();
            if (uid is null) return Unauthorized();

            var myClubIds = await _db.ClubMembers
                .Where(m => m.UserId == uid.Value)
                .Select(m => m.ClubId)
                .ToListAsync();

            var mySet = new HashSet<int>(myClubIds);

            var list = await _db.Clubs
                .AsNoTracking()
                .OrderBy(c => c.Name)
                .Select(c => new ClubWithFollowDto(
                    c.ClubId,
                    c.Name,
                    mySet.Contains(c.ClubId)
                ))
                .ToListAsync();

            return Ok(list);
        }

        /// <summary>
        /// Kullanıcının takip ettiği kulüpler (AUTH GEREKİR).
        /// Home feed ekranında "takip edilen kulüpler" chip'leri için idealdir.
        /// </summary>
        [HttpGet("joined")]
        [Authorize]
        public async Task<ActionResult<List<ClubDto>>> GetJoined()
        {
            var uid = TryGetUserId();
            if (uid is null) return Unauthorized();

            var clubIds = await _db.ClubMembers
                .Where(m => m.UserId == uid.Value)
                .Select(m => m.ClubId)
                .ToListAsync();

            var clubs = await _db.Clubs
                .AsNoTracking()
                .Where(c => clubIds.Contains(c.ClubId))
                .OrderBy(c => c.Name)
                .Select(c => new ClubDto(c.ClubId, c.Name))
                .ToListAsync();

            return Ok(clubs);
        }

        /// <summary>
        /// Kulübü takip et (idempotent). Zaten takip ediyorsa 204 döner.
        /// </summary>
        [HttpPost("{id:int}/follow")]
        [Authorize]
        public async Task<IActionResult> Follow(int id)
        {
            var uid = TryGetUserId();
            if (uid is null) return Unauthorized();

            var exists = await _db.ClubMembers
                .AnyAsync(m => m.UserId == uid.Value && m.ClubId == id);

            if (!exists)
            {
                _db.ClubMembers.Add(new ClubMember
                {
                    UserId = uid.Value,
                    ClubId = id
                });
                await _db.SaveChangesAsync();
            }

            return NoContent();
        }

        /// <summary>
        /// Kulüp takibini bırak (idempotent). Zaten takip etmiyorsa 204 döner.
        /// </summary>
        [HttpDelete("{id:int}/follow")]
        [Authorize]
        public async Task<IActionResult> Unfollow(int id)
        {
            var uid = TryGetUserId();
            if (uid is null) return Unauthorized();

            var m = await _db.ClubMembers
                .FirstOrDefaultAsync(x => x.UserId == uid.Value && x.ClubId == id);

            if (m != null)
            {
                _db.ClubMembers.Remove(m);
                await _db.SaveChangesAsync();
            }

            return NoContent();
        }
    }
}
