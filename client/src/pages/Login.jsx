// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/index";
import { Button, TextField, Stack, Typography, Paper, Alert, Box } from "@mui/material";

// 12 haneli öğrenci numarası + @dogus.edu.tr
const emailRegex = /^\d{12}@dogus\.edu\.tr$/;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const isValidEmail = (e) => emailRegex.test(String(e || "").trim().toLowerCase());

  const submit = async () => {
    setErr("");
    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      setErr("E-posta şu formatta olmalı: 111111111111@dogus.edu.tr (12 haneli öğrenci numarası)");
      return;
    }
    if (!password.trim()) {
      setErr("Şifre zorunludur.");
      return;
    }

    try {
      setLoading(true);

      // baseURL yalnızca host+port; endpoint mutlaka /api ile başlasın
      const { data } = await api.post("/api/Auth/login", {
        email: normalizedEmail,
        password: password.trim(),
      });

      // Beklenen alanlar: userId, email, fullName, role, managedClubId, token
      if (!data?.token) {
        setErr("Giriş başarılı görünüyor ama token gelmedi.");
        return;
      }

      // Token'ı sakla (auth header için)
      localStorage.setItem("token", data.token);

      // Kullanıcı bilgisini sakla — managedClubId dahil
      localStorage.setItem(
        "user",
        JSON.stringify({
          userId: data.userId,
          email: data.email,
          fullName: data.fullName,
          role: data.role,
          managedClubId: data.managedClubId ?? null,
        })
      );

      navigate("/home");
    } catch (e) {
      const msg = e?.response?.data || "Giriş başarısız.";
      setErr(typeof msg === "string" ? msg : "Giriş başarısız.");
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
        <Box sx={{ textAlign: "center", mb: { xs: 3, sm: 4 } }}>
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
            🎓
          </Box>
          <Typography variant="h4" className="unimeet-logo" sx={{ mb: 1.5, fontSize: { xs: "1.75rem", sm: "2rem" } }}>
            <span className="uni">Uni</span>
            <span className="meet">Meet</span>
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500, fontSize: { xs: "0.875rem", sm: "1rem" } }}>
            Hesabına giriş yap ve etkinlikleri keşfet ✨
          </Typography>
        </Box>

        <Stack spacing={3}>
          {err && (
            <Alert 
              severity="error" 
              sx={{ 
                borderRadius: 2,
                border: "1px solid rgba(211, 47, 47, 0.3)",
              }}
            >
              {err}
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
            onKeyDown={(e) => e.key === "Enter" && submit()}
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
            label="Şifre"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
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
            onClick={submit}
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
            {loading ? "Giriş yapılıyor..." : "Giriş Yap 🚀"}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
