using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

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

        // Kulüp profil bilgileri
        [MaxLength(500)]
        public string? ProfileImageUrl { get; set; }

        public DateTime? FoundedDate { get; set; }

        [MaxLength(1000)]
        public string? Purpose { get; set; }

        public int? ManagerId { get; set; }

        [ForeignKey("ManagerId")]
        public User? Manager { get; set; }
    }
}
