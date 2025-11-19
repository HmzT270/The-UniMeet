import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/index";
import { Button, TextField, Stack, Typography, Paper, Alert, Box, InputAdornment } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

// 12 haneli öğrenci numarası + @dogus.edu.tr
const emailRegex = /^\d{12}@dogus\.edu\.tr$/;

export default function ResetPasswordConfirm() {
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("info"); // "info" | "error" | "success"
  const [completed, setCompleted] = useState(false);
  const navigate = useNavigate();

  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const passwordValid = newPassword.length >= 8;

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (!code.trim()) {
      setMsg("Sıfırlama kodunu giriniz.");
      setMsgType("error");
      return;
    }

    if (newPassword.length < 8) {
      setMsg("Şifre en az 8 karakter olmalıdır.");
      setMsgType("error");
      return;
    }

    if (!passwordsMatch) {
      setMsg("Şifreler eşleşmiyor.");
      setMsgType("error");
      return;
    }

    try {
      setLoading(true);
      // localStorage'den e-postayı al (ResetPasswordRequest sayfasından)
      const email = localStorage.getItem("resetEmail");
      if (!email) {
        setMsg("E-posta bilgisi bulunamadı. Baştan başlayın.");
        setMsgType("error");
        return;
      }
      await api.post("/api/Auth/verify-reset-code", {
        email: email,
        code: code.trim(),
        newPassword: newPassword,
      });

      localStorage.removeItem("resetEmail");
      setCompleted(true);
      setMsgType("success");
      setMsg("Şifren başarıyla değiştirildi! Giriş sayfasına yönlendiriliyorsun...");

      // 2 saniye sonra login sayfasına yönlendir
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (e) {
      const errMsg = e?.response?.data?.message || e?.response?.data || "Şifre değişikliği başarısız. Tekrar deneyin.";
      setMsg(typeof errMsg === "string" ? errMsg : "Şifre değişikliği başarısız.");
      setMsgType("error");
    } finally {
      setLoading(false);
    }
  };

  if (completed) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f5f7ff 0%, #ffffff 50%, #faf5ff 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 5 },
            maxWidth: 460,
            width: "90%",
            borderRadius: 4,
            position: "relative",
            zIndex: 1,
            border: "1px solid rgba(106, 76, 255, 0.12)",
            boxShadow: "0 20px 60px rgba(106, 76, 255, 0.1)",
            textAlign: "center",
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 70, color: "#4caf50", mb: 2 }} />
          <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
            Başarılı! ✅
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Şifreni başarıyla sıfırladın. Giriş sayfasına yönlendiriliyorsun...
          </Typography>
          <Button
            variant="contained"
            fullWidth
            onClick={() => navigate("/")}
            sx={{ mt: 2 }}
          >
            Giriş Sayfasına Git
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f5f7ff 0%, #ffffff 50%, #faf5ff 100%)",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: "-10%",
          right: "-5%",
          width: "400px",
          height: "400px",
          background: "radial-gradient(circle, rgba(106, 76, 255, 0.08) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(60px)",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          bottom: "-10%",
          left: "-5%",
          width: "350px",
          height: "350px",
          background: "radial-gradient(circle, rgba(106, 76, 255, 0.06) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(60px)",
        },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 5 },
          maxWidth: 500,
          width: "90%",
          borderRadius: 4,
          position: "relative",
          zIndex: 1,
          border: "1px solid rgba(106, 76, 255, 0.12)",
          boxShadow: "0 20px 60px rgba(106, 76, 255, 0.1), 0 0 0 1px rgba(106, 19, 80, 0.58)",
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/")}
            sx={{ color: "#6a4cff", textTransform: "none", fontWeight: 600 }}
          >
            Geri Dön
          </Button>
        </Box>

        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Box
            sx={{
              width: { xs: 60, sm: 70 },
              height: { xs: 60, sm: 70 },
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6a4cff 0%, #8c6fff 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
              fontSize: { xs: "1.75rem", sm: "2rem" },
              boxShadow: "0 8px 24px rgba(106, 76, 255, 0.25)",
            }}
          >
            🔑
          </Box>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, fontSize: { xs: "1.5rem", sm: "1.75rem" } }}>
            Yeni Şifre Belirle
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
            Gelen kodu ve yeni şifreni giriniz
          </Typography>
        </Box>

        <Stack spacing={2.5} component="form" onSubmit={submit}>
          {msg && (
            <Alert
              severity={msgType === "error" ? "error" : msgType === "success" ? "success" : "info"}
              sx={{
                borderRadius: 2,
                border: msgType === "error" ? "1px solid rgba(211, 47, 47, 0.3)" : "1px solid rgba(25, 118, 210, 0.3)",
              }}
            >
              {msg}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Sıfırlama Kodu"
            placeholder="Gelen kodu giriniz"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={loading}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  boxShadow: "0 4px 12px rgba(106, 76, 255, 0.08)",
                },
                "&.Mui-focused": {
                  boxShadow: "0 4px 16px rgba(106, 76, 255, 0.15)",
                },
              },
            }}
          />

          <TextField
            fullWidth
            label="Yeni Şifre"
            type="password"
            placeholder="En az 8 karakter"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            error={!!newPassword && !passwordValid}
            helperText={newPassword && !passwordValid ? "Şifre en az 8 karakter olmalıdır" : ""}
            disabled={loading}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  boxShadow: "0 4px 12px rgba(106, 76, 255, 0.08)",
                },
                "&.Mui-focused": {
                  boxShadow: "0 4px 16px rgba(106, 76, 255, 0.15)",
                },
              },
            }}
            InputProps={{
              endAdornment: passwordValid && newPassword && (
                <InputAdornment position="end" sx={{ color: "#4caf50" }}>
                  ✓
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Şifreyi Onayla"
            type="password"
            placeholder="Şifreyi tekrar giriniz"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={!!confirmPassword && !passwordsMatch}
            helperText={confirmPassword && !passwordsMatch ? "Şifreler eşleşmiyor" : ""}
            disabled={loading}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  boxShadow: "0 4px 12px rgba(106, 76, 255, 0.08)",
                },
                "&.Mui-focused": {
                  boxShadow: "0 4px 16px rgba(106, 76, 255, 0.15)",
                },
              },
            }}
            InputProps={{
              endAdornment: passwordsMatch && confirmPassword && (
                <InputAdornment position="end" sx={{ color: "#4caf50" }}>
                  ✓
                </InputAdornment>
              ),
            }}
          />

          <Button
            fullWidth
            variant="contained"
            size="large"
            type="submit"
            disabled={loading || !code.trim() || !passwordValid || !passwordsMatch}
            sx={{
              py: 1.8,
              fontSize: "1.05rem",
              fontWeight: 600,
              borderRadius: 2,
              textTransform: "none",
              boxShadow: "0 6px 20px rgba(106, 76, 255, 0.3)",
              "&:hover:not(:disabled)": {
                boxShadow: "0 8px 28px rgba(106, 76, 255, 0.4)",
                transform: "translateY(-2px)",
              },
            }}
          >
            {loading ? "Değiştiriliyor..." : "Şifreyi Değiştir"}
          </Button>

          <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center", display: "block", mt: 1 }}>
            Kodun 10 dakika içinde geçerlidir
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
