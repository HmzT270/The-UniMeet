using Microsoft.Extensions.Logging;
using System.Threading;
using System.Threading.Tasks;

namespace UniMeetApi.Services
{
    /// <summary>
    /// Demo/Development amaçlı email sender - gerçek email göndermiyor, sadece log'a yazıyor
    /// </summary>
    public class DemoEmailSender : IEmailSender
    {
        private readonly ILogger<DemoEmailSender> _logger;

        public DemoEmailSender(ILogger<DemoEmailSender> logger)
        {
            _logger = logger;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken = default)
        {
            await Task.Delay(500, cancellationToken); // Gecikmeli yanıt
            
            _logger.LogWarning($"╔════════════════════════════════════════════════════╗");
            _logger.LogWarning($"║  DEMO EMAIL GÖNDERIMI (GERÇEK DEĞİL)             ║");
            _logger.LogWarning($"╠════════════════════════════════════════════════════╣");
            _logger.LogWarning($"║  Alıcı:    {toEmail}");
            _logger.LogWarning($"║  Konu:     {subject}");
            _logger.LogWarning($"╠════════════════════════════════════════════════════╣");
            _logger.LogWarning($"║  İçerik:   ");
            _logger.LogWarning($"║  {htmlBody.Substring(0, Math.Min(100, htmlBody.Length))}...");
            _logger.LogWarning($"╚════════════════════════════════════════════════════╝");
        }
    }
}
