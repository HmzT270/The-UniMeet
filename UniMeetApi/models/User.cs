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

        public bool EmailConfirmed { get; set; } = true;

        public string? VerificationToken { get; set; }

        public DateTime? VerificationTokenExpiresAt { get; set; }

        public bool RequiresPasswordReset { get; set; } = false;

        public DateTime? PasswordSetAt { get; set; }

        // Şifre sıfırlama alanları
        public string? ResetCode { get; set; }

        public DateTime? ResetCodeExpiresAt { get; set; }
    }
}
