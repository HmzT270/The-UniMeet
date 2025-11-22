import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/index";
import { Button, TextField, Stack, Typography, Paper, Alert, Box } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

// 12 haneli öğrenci numarası + @dogus.edu.tr
const emailRegex = /^\d{12}@dogus\.edu\.tr$/;

export default function FirstTimeVerification() {
  const [firstTimeEmail, setFirstTimeEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [verificationErr, setVerificationErr] = useState("");
  const [verificationMsg, setVerificationMsg] = useState("");
  const [verificationLoading, setVerificationLoading] = useState(false);
  const navigate = useNavigate();

  const isValidEmail = (e) => emailRegex.test(String(e || "").trim().toLowerCase());

  const requestVerification = async () => {
    setVerificationErr("");
    setVerificationMsg("");

    const normalizedEmail = firstTimeEmail.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      setVerificationErr("E-posta formatı: 12 haneli öğrenci no + @dogus.edu.tr");
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setVerificationErr("Ad ve soyadı doldurmak zorunludur.");
      return;
    }

    try {
      setVerificationLoading(true);
      await api.post("/api/Auth/request-verification", { 
        email: normalizedEmail,
        fullName: `${firstName.trim()} ${lastName.trim()}`
      });
      setVerificationMsg("Doğrulama bağlantısı mail kutuna gönderildi. 15 dakika içinde kullanmalısın.");
      setFirstTimeEmail("");
      setFirstName("");
      setLastName("");
    } catch (e) {
      const msg = e?.response?.data || "Gönderim başarısız.";
      setVerificationErr(typeof msg === "string" ? msg : "Gönderim başarısız.");
    } finally {
      setVerificationLoading(false);
    }
  };

  const showFormatError = !!firstTimeEmail && !isValidEmail(firstTimeEmail);

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
            ✉️
          </Box>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, fontSize: { xs: "1.5rem", sm: "1.75rem" } }}>
            Kayıt Ol
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
            E-posta adresini gir, doğrulama linki gönderelim
          </Typography>
        </Box>

        <Stack spacing={2.5}>
          {verificationErr && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {verificationErr}
            </Alert>
          )}
          {verificationMsg && (
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              {verificationMsg}
            </Alert>
          )}

          <Typography variant="subtitle1" fontWeight={600}>
            İlk defa giriş yapacaksan mailine doğrulama linki gönderelim.
          </Typography>

          <TextField
            fullWidth
            label="Ad"
            placeholder="Ahmet"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={verificationLoading}
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
            label="Soyad"
            placeholder="Yılmaz"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={verificationLoading}
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
            label="Okul E-Posta"
            placeholder="111111111111@dogus.edu.tr"
            value={firstTimeEmail}
            onChange={(e) => setFirstTimeEmail(e.target.value)}
            error={showFormatError}
            helperText={
              showFormatError
                ? "E-posta formatı: 12 haneli öğrenci no + @dogus.edu.tr"
                : ""
            }
            disabled={verificationLoading}
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
            variant="outlined"
            onClick={requestVerification}
            disabled={verificationLoading || !isValidEmail(firstTimeEmail) || !firstName.trim() || !lastName.trim()}
            sx={{ fontWeight: 600, borderRadius: 2 }}
          >
            {verificationLoading ? "Gönderiliyor..." : "Doğrulama Linki Gönder"}
          </Button>

          <Typography variant="body2" color="text.secondary">
            Mailine gelen bağlantıya tıklayıp yeni şifreni 2 kez yazarak oluşturduktan sonra buradan giriş yapabilirsin.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
