// src/pages/Home.jsx
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Stack,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/index";

export default function Home() {
  const navigate = useNavigate();

  // Kullanıcı bilgisi (ileride gerekirse role bazlı içerik göstermek için)
  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  }, []);
  const role = user?.role ?? null;
  const isAdmin = role === "Admin";
  const isManager = role === "Manager";

  // Eyaletler
  const [myClubs, setMyClubs] = useState([]);       // Katıldığım kulüpler
  const [clubsLoading, setClubsLoading] = useState(true);
  const [clubsErr, setClubsErr] = useState("");

  const [events, setEvents] = useState([]);         // Feed (takip ettiğim kulüplerin etkinlikleri)
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsErr, setEventsErr] = useState("");

  // ---- Yardımcılar ----
  const pad = (n) => String(n).padStart(2, "0");

  const parseAsUtc = (s) => {
    if (!s) return null;
    const hasTz = /[zZ]|[+\-]\d{2}:\d{2}$/.test(s);
    const iso = hasTz ? s : s + "Z";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  };

  const fmt = (s) => {
    const d = parseAsUtc(s);
    return d
      ? d.toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })
      : "-";
  };

  // Küçük bir yardımcı: aynı isteği önce /api/*, 404 olursa /*/ ile dene
  const getWithFallback = async (primary, fallback) => {
    try {
      return await api.get(primary);
    } catch (e) {
      const status = e?.response?.status;
      if (status === 404 && fallback) {
        return await api.get(fallback);
      }
      throw e;
    }
  };

  // Katıldığım kulüpleri çek (chip'ler için)
  useEffect(() => {
    let ignore = false;
    (async () => {
      setClubsLoading(true);
      setClubsErr("");
      try {
        // Tercihen: /api/Clubs/joined
        // Backend farklıysa fallback: /Clubs/joined
        const { data } = await getWithFallback("/api/Clubs/joined", "/Clubs/joined");
        if (!ignore) setMyClubs(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!ignore) {
          setMyClubs([]);
          setClubsErr("Kulüp üyeliklerin yüklenemedi.");
        }
      } finally {
        if (!ignore) setClubsLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, []);

  // FEED: Takip edilen kulüplerin etkinlikleri
  // Not: upcomingOnly=false alıyoruz; client’ta küçük bir toleransla süzüyoruz.
  useEffect(() => {
    let ignore = false;
    (async () => {
      setEventsLoading(true);
      setEventsErr("");
      try {
        // includeCancelled=false & upcomingOnly=false
        const { data } = await api.get("/api/Events/feed?includeCancelled=false&upcomingOnly=false");
        if (!ignore) setEvents(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!ignore) {
          setEvents([]);
          setEventsErr("Etkinlik akışı yüklenemedi.");
        }
      } finally {
        if (!ignore) setEventsLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, []);

  // Feed'i tarihe göre sırala + küçük zaman toleransı uygula
  const myFeed = useMemo(() => {
    // Son 12 saatlik tolerans (UTC kaymaları/past sınırı için)
    const TOLERANCE_MS = 12 * 60 * 60 * 1000;
    const now = Date.now();

    // Süz: başlangıç zamanı "şu an - tolerans" sonrası olanlar
    const filtered = (events || []).filter((e) => {
      const t = parseAsUtc(e?.startAt)?.getTime();
      return typeof t === "number" && t >= (now - TOLERANCE_MS);
    });

    // Sırala
    return filtered.sort((a, b) => {
      const da = parseAsUtc(a?.startAt)?.getTime() ?? 0;
      const db = parseAsUtc(b?.startAt)?.getTime() ?? 0;
      return da - db;
    });
  }, [events]);

  return (
    <>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            UniMeet — Ana Sayfa
          </Typography>
          {/* Navigasyon */}
          <Button onClick={() => navigate("/events")} sx={{ mr: 1 }}>
            Etkinlikler
          </Button>
          <Button variant="outlined" onClick={() => navigate("/clubs")}>
            Kulüpler
          </Button>
          {(isAdmin || isManager) && (
            <Button variant="contained" onClick={() => navigate("/manageevents")} sx={{ ml: 1 }}>
              Etkinlik Oluştur
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
        {/* Katıldığım Kulüpler */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1.5 }}>Takip Ettiğin Kulüpler</Typography>

          {clubsLoading ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <CircularProgress size={20} /> <Typography>Yükleniyor…</Typography>
            </Box>
          ) : clubsErr ? (
            <Alert severity="error">{clubsErr}</Alert>
          ) : myClubs.length === 0 ? (
            <Alert
              severity="info"
              action={
                <Button size="small" variant="contained" onClick={() => navigate("/clubs")}>
                  Kulüpleri Gör
                </Button>
              }
            >
              Henüz herhangi bir kulübe katılmadın. Kulüplere katıl ve
              etkinlikleri burada gör.
            </Alert>
          ) : (
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {myClubs.map((c) => (
                <Chip key={c?.clubId ?? c?.name} label={c?.name ?? "Kulüp"} color="primary" variant="outlined" />
              ))}
            </Stack>
          )}
        </Box>

        {/* Feed: Katıldığım kulüplerin etkinlikleri */}
        <Box>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            Senin İçin Etkinlikler
          </Typography>

          {eventsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : eventsErr ? (
            <Alert severity="error">{eventsErr}</Alert>
          ) : myClubs.length === 0 ? (
            <Alert severity="info">
              Kulüplere katıldığında, o kulüplerin etkinlikleri burada listelenecek.
            </Alert>
          ) : myFeed.length === 0 ? (
            <Alert severity="info">
              Takip ettiğin kulüplere ait yaklaşan etkinlik bulunmuyor.
            </Alert>
          ) : (
            <Stack spacing={2}>
              {myFeed.map((e) => (
                <Card key={e.eventId} sx={{ cursor: "default" }}>
                  <CardContent>
                    <Typography variant="h6">{e.title}</Typography>
                    <Typography color="text.secondary">
                      📍 {e.location} — 🕒 {fmt(e.startAt)}
                    </Typography>
                    {e.endAt && (
                      <Typography color="text.secondary">
                        ⏱ Bitiş: {fmt(e.endAt)}
                      </Typography>
                    )}
                    {e.clubName && (
                      <Typography sx={{ mt: 1 }} color="primary">
                        {e.clubName}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Box>
      </Container>
    </>
  );
}
