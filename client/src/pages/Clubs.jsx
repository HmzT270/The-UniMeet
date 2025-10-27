import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Button
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/index"; // ✅ import yolu sabitlendi

export default function Clubs() {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // --- ENV'ye göre /api kararını otomatik ver ---
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
  const HAS_API_IN_BASE = /\/api\/?$/i.test(API_BASE);

  // Örn: baseURL /api ile bitiyorsa "/Clubs/..." kullan, değilse "/api/Clubs/..."
  const path = (p) => (HAS_API_IN_BASE ? `/${p.replace(/^\/+/, "")}` : `/api/${p.replace(/^\/+/, "")}`);

  // --- Yardımcılar: önce birincil yolu dene, 404 ise alternatif yolu dene ---
  const getSmart = async (p) => {
    const primary = path(p);
    const alt = HAS_API_IN_BASE ? `/api/${p.replace(/^\/+/, "")}` : `/${p.replace(/^\/+/, "")}`;
    try {
      return await api.get(primary);
    } catch (e) {
      if (e?.response?.status === 404) return await api.get(alt);
      throw e;
    }
  };

  const postSmart = async (p, body) => {
    const primary = path(p);
    const alt = HAS_API_IN_BASE ? `/api/${p.replace(/^\/+/, "")}` : `/${p.replace(/^\/+/, "")}`;
    try {
      return await api.post(primary, body);
    } catch (e) {
      if (e?.response?.status === 404) return await api.post(alt, body);
      throw e;
    }
  };

  const deleteSmart = async (p) => {
    const primary = path(p);
    const alt = HAS_API_IN_BASE ? `/api/${p.replace(/^\/+/, "")}` : `/${p.replace(/^\/+/, "")}`;
    try {
      return await api.delete(primary);
    } catch (e) {
      if (e?.response?.status === 404) return await api.delete(alt);
      throw e;
    }
  };
  // -------------------------------------------------------------------

  const handle401 = () => {
    setErr("Oturum doğrulanamadı. Lütfen tekrar giriş yap.");
  };

  const fetchClubs = async () => {
    setLoading(true);
    setErr("");
    try {
      // Kullanıcıya göre takip bilgisi de gelir
      const { data } = await getSmart("Clubs/with-following");
      setClubs(Array.isArray(data) ? data : []);
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401) {
        handle401();
      } else {
        setErr(e?.response?.data || "Kulüpler yüklenemedi.");
      }
      setClubs([]);
    } finally {
      setLoading(false);
    }
  };

  const follow = async (clubId) => {
    try {
      await postSmart(`Clubs/${clubId}/follow`);
      fetchClubs();
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401) handle401();
      else setErr(e?.response?.data || "Takip işlemi başarısız oldu.");
    }
  };

  const unfollow = async (clubId) => {
    try {
      await deleteSmart(`Clubs/${clubId}/follow`);
      fetchClubs();
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401) handle401();
      else setErr(e?.response?.data || "Takibi bırakma işlemi başarısız oldu.");
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  return (
    <>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            UniMeet — Kulüpler
          </Typography>
          <Button onClick={() => navigate("/home")} variant="outlined">Ana Sayfa</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="h5">Kayıtlı Kulüpler</Typography>
          <Chip label={`${clubs.length} kulüp`} color="primary" variant="outlined" />
          <Button onClick={fetchClubs} size="small" variant="text">Yenile</Button>
        </Box>

        {err && (
          <Alert
            severity="error"
            action={
              err.toLowerCase().includes("giriş") ? (
                <Button color="inherit" size="small" onClick={() => navigate("/")}>
                  Tekrar Giriş Yap
                </Button>
              ) : null
            }
            sx={{ mb: 2 }}
          >
            {String(err)}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : clubs.length === 0 ? (
          <Alert severity="info">Henüz kayıtlı kulüp bulunmuyor.</Alert>
        ) : (
          <Grid container spacing={2}>
            {clubs.map((c) => (
              <Grid item key={c?.clubId ?? c?.id ?? c?.name} xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{c?.name ?? "Kulüp"}</Typography>

                    {c?.description && (
                      <Typography color="text.secondary" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
                        {c.description}
                      </Typography>
                    )}

                    <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {typeof c?.memberCount === "number" && (
                        <Chip size="small" label={`Üye: ${c.memberCount}`} />
                      )}
                      {c?.createdAt && (
                        <Chip
                          size="small"
                          variant="outlined"
                          label={new Date(c.createdAt).toLocaleDateString("tr-TR")}
                        />
                      )}
                    </Box>

                    <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                      {c?.isFollowing ? (
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => unfollow(c.clubId)}
                        >
                          Takibi Bırak
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => follow(c.clubId)}
                        >
                          Takip Et
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </>
  );
}
