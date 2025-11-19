using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net;
using System.Net.Mail;
using System.Threading;
using System.Threading.Tasks;

namespace UniMeetApi.Services
{
    public class SmtpSettings
    {
        public string Host { get; set; } = string.Empty;
        public int Port { get; set; } = 587;
        public bool EnableSsl { get; set; } = true;
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FromAddress { get; set; } = string.Empty;
        public string FromName { get; set; } = "UniMeet";
    }

    public class SmtpEmailSender : IEmailSender
    {
        private readonly SmtpSettings _settings;
        private readonly ILogger<SmtpEmailSender> _logger;

        public SmtpEmailSender(IOptions<SmtpSettings> options, ILogger<SmtpEmailSender> logger)
        {
            _settings = options.Value;
            _logger = logger;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(_settings.Host))
                throw new InvalidOperationException("SMTP Host yapılandırılmamış (appsettings.json -> Smtp).");

            if (string.IsNullOrWhiteSpace(_settings.FromAddress))
                throw new InvalidOperationException("Gönderici adresi (Smtp:FromAddress) belirtilmeli.");

            using var message = new MailMessage()
            {
                From = new MailAddress(_settings.FromAddress, _settings.FromName ?? "UniMeet"),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };
            message.To.Add(new MailAddress(toEmail));

            using var client = new SmtpClient(_settings.Host, _settings.Port)
            {
                EnableSsl = _settings.EnableSsl,
                Credentials = new NetworkCredential(_settings.Username, _settings.Password),
                Timeout = 10000 // 10 saniye timeout
            };

            try
            {
                await client.SendMailAsync(message, cancellationToken);
                _logger.LogInformation($"Email başarıyla gönderildi: {toEmail}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"SMTP gönderimi başarısız oldu. Host: {_settings.Host}, Port: {_settings.Port}, Kullanıcı: {_settings.Username}");
                throw;
            }
        }
    }
}
