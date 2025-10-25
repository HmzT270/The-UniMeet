// Models/Event.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UniMeetApi
{
    public class Event
    {
        [Key]
        public int EventId { get; set; }

        [Required, MaxLength(200)]
        public string Title { get; set; } = null!;

        [Required, MaxLength(200)]
        public string Location { get; set; } = null!;

        // UTC saklamayı öneriyorum
        public DateTime StartAt { get; set; }
        public DateTime? EndAt { get; set; }

        [Range(1, int.MaxValue)]
        public int Quota { get; set; }

        // İstersen ileride Club tablosuna FK yaparsın
        public int ClubId { get; set; }

        public string? Description { get; set; }

        public bool IsCancelled { get; set; } = false;

        // audit
        public int CreatedByUserId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
