using System.ComponentModel.DataAnnotations;

namespace UniMeetApi
{
    public enum UserRole
    {
        Member,
        Manager,
        Admin
    }

    public class User
    {
        [Key]
        public int UserId { get; set; }

        [Required, EmailAddress]
        public string Email { get; set; } = null!;

        // Login’de ad-soyad sormuyoruz ama modelde kalsın (zorunluysa e-postanın @ öncesini dolduracağız)
        [Required]
        public string FullName { get; set; } = null!;

        // Şifreyi hash’li saklayacağız
        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        public UserRole Role { get; set; } = UserRole.Member;

        public bool IsActive { get; set; } = true;

        // ✅ Sadece Manager’lar için doldurulacak: yönettiği kulübün ID’si
        public int? ManagedClubId { get; set; }
    }
}
