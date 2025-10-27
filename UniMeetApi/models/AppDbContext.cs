using Microsoft.EntityFrameworkCore;

namespace UniMeetApi
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users  => Set<User>();
        public DbSet<Event> Events => Set<Event>();
        public DbSet<Club> Clubs => Set<Club>();

        // ✅ YENİ:
        public DbSet<ClubMember> ClubMembers => Set<ClubMember>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ClubMembers konfigürasyonu
            modelBuilder.Entity<ClubMember>(e =>
            {
                e.HasKey(x => new { x.UserId, x.ClubId }); // composite PK
                e.HasIndex(x => x.UserId);
                e.HasIndex(x => x.ClubId);

                e.HasOne(x => x.User)
                 .WithMany() // istersen User içine ICollection<ClubMember> Members ekleyip .WithMany(u => u.Members) yapabilirsin
                 .HasForeignKey(x => x.UserId)
                 .OnDelete(DeleteBehavior.Cascade);

                e.HasOne(x => x.Club)
                 .WithMany() // istersen Club içine ICollection<ClubMember> Members ekleyip .WithMany(c => c.Members) yapabilirsin
                 .HasForeignKey(x => x.ClubId)
                 .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
