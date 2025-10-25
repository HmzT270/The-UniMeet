// Controllers/ClubsController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace UniMeetApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClubsController : ControllerBase
    {
        private readonly AppDbContext _db;
        public ClubsController(AppDbContext db) => _db = db;

        public record ClubDto(int ClubId, string Name);

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
    }
}
