using System.ComponentModel.DataAnnotations;

namespace UniMeetApi
{
    public class Club
    {
        [Key]
        public int ClubId { get; set; }

        [Required, MaxLength(200)]
        public string Name { get; set; } = null!;

        [MaxLength(500)]
        public string? Description { get; set; }
    }
}
