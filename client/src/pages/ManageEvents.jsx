import { useEffect, useState, useMemo } from "react";
import {
  AppBar, Toolbar, Typography, Container, Paper, Stack,
  TextField, Button, Snackbar, Alert, Box, FormControl,
  InputLabel, Select, MenuItem
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { api } from "../api/index";

export default function ManageEvents() {
  const navigate = useNavigate();

  // ---- Kullanıcı bilgisi (role & managedClubId) ----
  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  }, []);
  const role = user?.role ?? null;
  const managedClubId = user?.managedClubId ?? null;
  const isManager = role === "Manager";
  const isAdmin = role === "Admin";

  // ---- Form state ----
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState(""); // YYYY-MM-DD
  const [startTime, setStartTime] = useState(""); // HH:mm
  const [endDate, setEndDate] = useState("");     // YYYY-MM-DD
  const [endTime, setEndTime] = useState("");     // HH:mm
  const [quota, setQuota] = useState("");
  const [clubId, setClubId] = useState("");
  const [description, setDescription] = useState("");

  // ---- UI state ----
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [okOpen, setOkOpen] = useState(false);

  // ---- Kulüp listesi ----
  const [clubs, setClubs] = useState([]);
  const [clubsLoading, setClubsLoading] = useState(true);

  // --- Helpers (bugünün tarih/saat stringleri) ---
  const pad = (n) => String(n).padStart(2, "0");

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }, []);
  const nowTimeStr = useMemo(() => {
    const d = new Date();
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }, []);

  // Min değerler
  const startDateMin = todayStr;
  const startTimeMin = startDate === todayStr ? nowTimeStr : undefined;

  // End min: en az start ile aynı veya sonrası olmalı;
  // tarih aynıysa saat min = startTime
  const endDateMin = startDate || todayStr;
  const endTimeMin =
    endDate && startDate && endDate === startDate
      ? (startTime || nowTimeStr)
      : undefined;

  // ---- Kulüpleri yükle (Manager ise tek kulüp) ----
  useEffect(() => {
    let ignore = false;
    setClubsLoading(true);

    api.get("/api/Clubs")
      .then(res => {
        if (ignore) return;
        const list = Array.isArray(res.data) ? res.data : [];

        if (isManager && managedClubId) {
          const onlyMine = list.filter(c => c.clubId === managedClubId);
          setClubs(onlyMine);
          if (onlyMine.length > 0) setClubId(String(onlyMine[0].clubId));
        } else {
          setClubs(list);
        }
      })
      .catch(err => {
        console.error("Clubs fetch error:", err);
        setClubs([]);
      })
      .finally(() => { if (!ignore) setClubsLoading(false); });

    return () => { ignore = true; };
  }, [isManager, managedClubId]);

  // Datetime yardımcıları
  const toIso = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return null;
    const d = new Date(`${dateStr}T${timeStr}`);
    return isNaN(d.getTime()) ? null : d.toISOString();
  };
  const isPast = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return false;
    return new Date(`${dateStr}T${timeStr}`).getTime() < Date.now();
  };
  const compareDt = (d1, t1, d2, t2) => {
    // d1/t1 ile d2/t2'yi kıyasla: -1 küçük, 0 eşit, 1 büyük
    const a = new Date(`${d1}T${t1}`).getTime();
    const b = new Date(`${d2}T${t2}`).getTime();
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  };

  // Doğrulama
  const validate = () => {
    if (!title.trim()) return "Etkinlik adı zorunludur.";
    if (!location.trim()) return "Etkinlik yeri zorunludur.";
    if (!startDate) return "Başlangıç tarihi zorunludur.";
    if (!startTime) return "Başlangıç saati zorunludur.";
    if (isPast(startDate, startTime))
      return "Geçmiş başlangıç tarih/saat seçilemez.";

    if (!endDate) return "Bitiş tarihi zorunludur.";
    if (!endTime) return "Bitiş saati zorunludur.";
    if (isPast(endDate, endTime))
      return "Geçmiş bitiş tarih/saat seçilemez.";

    // end >= start
    if (compareDt(endDate, endTime, startDate, startTime) < 0)
      return "Bitiş zamanı başlangıçtan önce olamaz.";

    if (!quota || isNaN(Number(quota)) || Number(quota) <= 0)
      return "Kontenjan pozitif bir sayı olmalıdır.";
    if (!clubId) return "Lütfen bir kulüp seçin.";
    if (isManager && managedClubId && parseInt(clubId, 10) !== managedClubId)
      return "Sadece yöneticisi olduğunuz kulüp için etkinlik oluşturabilirsiniz.";
    return "";
  };

  const hasErrors = !!validate();

  const handleSubmit = async () => {
    setError("");
    const v = validate();
    if (v) { setError(v); return; }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        location: location.trim(),
        startAt: toIso(startDate, startTime),
        endAt: toIso(endDate, endTime),
        quota: Number(quota),
        clubId: parseInt(clubId, 10),
        description: description.trim() || null,
      };

      await api.post("/api/Events", payload);

      setOkOpen(true);
      navigate("/home");
    } catch (e) {
      const msg = e?.response?.data || "Etkinlik oluşturulamadı.";
      setError(typeof msg === "string" ? msg : "Etkinlik oluşturulamadı.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>UniMeet — Etkinlik Oluştur</Typography>
          <Button onClick={() => navigate("/home")}>Ana Sayfa</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Etkinlik Bilgileri</Typography>

          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField label="Etkinlik Adı" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <TextField label="Yer" value={location} onChange={(e) => setLocation(e.target.value)} required />

            {/* Başlangıç */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <TextField
                label="Başlangıç Tarihi"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: startDateMin }}
                required
              />
              <TextField
                label="Başlangıç Saati"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={startTimeMin ? { min: startTimeMin } : {}}
                required
              />
            </Box>

            {/* Bitiş */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <TextField
                label="Bitiş Tarihi"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: endDateMin }}
                required
              />
              <TextField
                label="Bitiş Saati"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={endTimeMin ? { min: endTimeMin } : {}}
                required
              />
            </Box>

            <TextField
              label="Kontenjan"
              type="number"
              inputProps={{ min: 1 }}
              value={quota}
              onChange={(e) => setQuota(e.target.value)}
              required
            />

            <FormControl fullWidth required>
              <InputLabel id="club-label">Kulüp</InputLabel>
              <Select
                labelId="club-label"
                label="Kulüp"
                value={clubId}
                onChange={(e) => setClubId(e.target.value)}
                disabled={clubsLoading || (isManager && !!managedClubId)}
              >
                {clubs.map((c) => (
                  <MenuItem key={c.clubId} value={String(c.clubId)}>
                    {c.name}
                  </MenuItem>
                ))}
                {!clubsLoading && clubs.length === 0 && (
                  <MenuItem disabled>Hiç kulüp bulunamadı</MenuItem>
                )}
              </Select>
            </FormControl>

            <TextField
              label="Etkinlik Açıklaması"
              multiline
              minRows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 1 }}>
              <Button variant="outlined" onClick={() => navigate("/home")}>Vazgeç</Button>
              <Button variant="contained" onClick={handleSubmit} disabled={submitting || hasErrors}>
                {submitting ? "Kaydediliyor..." : "Oluştur"}
              </Button>
            </Box>
          </Stack>
        </Paper>
      </Container>

      <Snackbar
        open={okOpen}
        autoHideDuration={2500}
        onClose={() => setOkOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity="success" variant="filled" sx={{ width: "100%" }}>
          Etkinlik başarıyla oluşturuldu.
        </Alert>
      </Snackbar>
    </>
  );
}
