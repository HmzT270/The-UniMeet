import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/index";
import { Box, Paper, Typography, TextField, Button, Alert, CircularProgress, Stack } from "@mui/material";

export default function Verify() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [expiresAt, setExpiresAt] = useState(null);
  const [expiresAtLocal, setExpiresAtLocal] = useState(null);
  const [timeZoneName, setTimeZoneName] = useState("");
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [error, setError] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const fetchInfo = async () => {
      if (!token) {
        setError("Token bulunamadı. Maildeki linki tekrar açmayı deneyin.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data } = await api.get("/api/Auth/verify-email", { params: { token } });
        setEmail(data.email);
        setAlreadyCompleted(Boolean(data.alreadyCompleted));
        setExpiresAt(data.expiresAtUtc || null);
        setExpiresAtLocal(data.expiresAtLocal || null);
        setTimeZoneName(data.timeZoneDisplayName || "");
        setError("");
      } catch (err) {
        const msg = err?.response?.data || "Token doğrulanamadı.";
        setError(typeof msg === "string" ? msg : "Token doğrulanamadı.");
      } finally {
        setLoading(false);
      }
    };

    fetchInfo();
  }, [token]);

  const expiryText = useMemo(() => {
    const source = expiresAtLocal || expiresAt;
    if (!source) return "";
    try {
      return new Date(source).toLocaleString("tr-TR");
    } catch (error) {
      return "";
    }
  }, [expiresAt, expiresAtLocal]);

  const submit = async () => {
    setFormError("");
    setSuccessMsg("");

    if (!password || password.length < 8) {
      setFormError("Şifre en az 8 karakter olmalı.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Şifreler eşleşmiyor.");
      return;
    }

    try {
      setSubmitLoading(true);
      await api.post("/api/Auth/set-password", {
        token,
        password,
        confirmPassword,
      });
      setSuccessMsg("Şifren oluşturuldu. Artık giriş yapabilirsin.");
    } catch (err) {
      const msg = err?.response?.data || "Şifre belirlenemedi.";
      setFormError(typeof msg === "string" ? msg : "Şifre belirlenemedi.");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f5f7ff 0%, #ffffff 50%, #faf5ff 100%)",
        p: 2,
      }}
    >
      <Paper
        sx={{
          width: "100%",
          maxWidth: 520,
          borderRadius: 4,
          p: { xs: 3, sm: 4 },
          border: "1px solid rgba(106, 76, 255, 0.15)",
          boxShadow: "0 20px 60px rgba(106, 76, 255, 0.12)",
        }}
      >
        <Stack spacing={3}>
          <Typography variant="h5" fontWeight={700} textAlign="center">
            E-Postanı Doğrula ve Şifreni Oluştur
          </Typography>

          {loading && (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <CircularProgress color="primary" />
              <Typography variant="body2" mt={2} color="text.secondary">
                Token doğrulanıyor...
              </Typography>
            </Box>
          )}

          {!loading && error && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {!loading && !error && (
            <>
              {successMsg && (
                <Alert severity="success" sx={{ borderRadius: 2 }}>
                  {successMsg}
                </Alert>
              )}

              {formError && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  {formError}
                </Alert>
              )}

              {alreadyCompleted && (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  Bu token daha önce kullanılmış. Giriş ekranına dönüp hesabınla giriş yapabilirsin.
                </Alert>
              )}

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Doğrulanan e-posta
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {email}
                </Typography>
                {expiryText && (
                  <Typography variant="body2" color="text.secondary" mt={0.5}>
                    Link son kullanma: {expiryText}
                    {timeZoneName ? ` (${timeZoneName})` : ""}
                  </Typography>
                )}
              </Box>

              {!alreadyCompleted && !successMsg && (
                <Stack spacing={2}>
                  <TextField
                    label="Yeni Şifre"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <TextField
                    label="Yeni Şifre (Tekrar)"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <Button
                    variant="contained"
                    size="large"
                    onClick={submit}
                    disabled={submitLoading}
                  >
                    {submitLoading ? "Kaydediliyor..." : "Şifremi Oluştur"}
                  </Button>
                </Stack>
              )}

              {(successMsg || alreadyCompleted) && (
                <Button
                  variant="outlined"
                  onClick={() => navigate("/")}
                  sx={{ borderRadius: 2 }}
                >
                  Giriş ekranına dön
                </Button>
              )}
            </>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}
