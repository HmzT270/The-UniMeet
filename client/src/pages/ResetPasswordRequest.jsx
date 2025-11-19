import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/index";
import { Button, TextField, Stack, Typography, Paper, Alert, Box } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

// 12 haneli öğrenci numarası + @dogus.edu.tr
const emailRegex = /^\d{12}@dogus\.edu\.tr$/;

export default function ResetPasswordRequest() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("info"); // "info" | "error" | "success"
  const navigate = useNavigate();

  const isValidEmail = (e) => emailRegex.test(String(e || "").trim().toLowerCase());

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      setMsg("E-posta şu formatta olmalı: 111111111111@dogus.edu.tr (12 haneli öğrenci numarası)");
      setMsgType("error");
      return;
    }

    try {
      setLoading(true);
      await api.post("/api/Auth/request-password-reset", {
        email: normalizedEmail,
      });

      setMsgType("success");
      setMsg("Şifre sıfırlama kodu e-posta adresine gönderildi. Lütfen e-postanızı kontrol edin ve 10 dakika içinde kodu kullanın.");
      // E-postayı localStorage'a kaydet
      localStorage.setItem("resetEmail", normalizedEmail);
      setEmail("");

      // 2 saniye sonra doğrulama sayfasına yönlendir
      setTimeout(() => {
        navigate("/reset-password-confirm");
      }, 2000);
    } catch (e) {
      const errMsg = e?.response?.data?.message || e?.response?.data || "İstek gönderilemedi. Tekrar deneyin.";
      setMsg(typeof errMsg === "string" ? errMsg : "İstek gönderilemedi.");
      setMsgType("error");
    } finally {
      setLoading(false);
    }
  };

  const showFormatError = !!email && !isValidEmail(email);

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
          maxWidth: 460,
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
            🔐
          </Box>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, fontSize: { xs: "1.5rem", sm: "1.75rem" } }}>
            Şifreni Sıfırla
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
            E-posta adresini gir, sana sıfırlama kodu göndereceğiz
          </Typography>
        </Box>

        <Stack spacing={3} component="form" onSubmit={submit}>
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
            label="Okul E-Posta"
            placeholder="111111111111@dogus.edu.tr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={showFormatError}
            helperText={
              showFormatError
                ? "E-posta formatı: 12 haneli öğrenci no + @dogus.edu.tr"
                : ""
            }
            onKeyDown={(e) => e.key === "Enter" && submit(e)}
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

          <Button
            fullWidth
            variant="contained"
            size="large"
            type="submit"
            disabled={loading}
            sx={{
              py: 1.8,
              fontSize: "1.05rem",
              fontWeight: 600,
              borderRadius: 2,
              textTransform: "none",
              boxShadow: "0 6px 20px rgba(106, 76, 255, 0.3)",
              "&:hover": {
                boxShadow: "0 8px 28px rgba(106, 76, 255, 0.4)",
                transform: "translateY(-2px)",
              },
            }}
          >
            {loading ? "Gönderiliyor..." : "Kodu Gönder"}
          </Button>

          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 2 }}>
            Ardından kodu gir ve yeni şifreni belirle
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
