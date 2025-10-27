using System;

namespace UniMeetApi
{
    public class ClubMember
    {
        public int UserId { get; set; }
        public int ClubId { get; set; }
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

        // Navigasyonlar (User ve Club senin projende bu adlarla var)
        public User User { get; set; } = default!;
        public Club Club { get; set; } = default!;
    }
}
