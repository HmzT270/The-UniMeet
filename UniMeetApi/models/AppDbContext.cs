using Microsoft.EntityFrameworkCore;

namespace UniMeetApi
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users  => Set<User>();
        public DbSet<Event> Events => Set<Event>();
        public DbSet<Club> Clubs => Set<Club>();

    }
}
