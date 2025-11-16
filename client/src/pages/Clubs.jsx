import {
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
import { api } from "../api/index"; // import yolu sabitlendi

export default function Clubs() {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // --- ENV'ye göre /api kararını otomatik ver ---
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
  const HAS_API_IN_BASE = /\/api\/?$/i.test(API_BASE);

  // baseURL /api ile bitiyorsa "/Clubs/..." kullan, değilse "/api/Clubs/..."
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
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Box sx={{ mt: { xs: 2, sm: 4 }, mb: 3, display: "flex", alignItems: "center", gap: { xs: 1, sm: 2 }, flexWrap: "wrap" }}>
          <Typography variant="h5" sx={{ fontWeight: 600, fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
            Kayıtlı Kulüpler
          </Typography>
          <Chip 
            label={`${clubs.length} kulüp`} 
            color="primary" 
            variant="filled"
            sx={{ fontWeight: 600, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
          />
          <Button 
            onClick={fetchClubs} 
            size="small" 
            variant="text"
            sx={{
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              "&:hover": {
                backgroundColor: "rgba(106, 76, 255, 0.08)",
              },
            }}
          >
            🔄 Yenile
          </Button>
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
            sx={{ 
              mb: 2, 
              borderRadius: 2,
              border: "1px solid rgba(211, 47, 47, 0.3)",
            }}
          >
            {String(err)}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress sx={{ color: "#6a4cff" }} />
          </Box>
        ) : clubs.length === 0 ? (
          <Alert 
            severity="info" 
            sx={{ 
              borderRadius: 2,
              border: "1px solid rgba(2, 136, 209, 0.3)",
            }}
          >
            Henüz kayıtlı kulüp bulunmuyor.
          </Alert>
        ) : (
          <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
            {clubs.map((c) => (
              <Grid item key={c?.clubId ?? c?.id ?? c?.name} xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      transform: "translateY(-6px) scale(1.02)",
                      boxShadow: "0 16px 40px rgba(106, 76, 255, 0.18)",
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: { xs: 2, sm: 3 } }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5, fontSize: { xs: "1.1rem", sm: "1.25rem" } }}>
                      {c?.name ?? "Kulüp"}
                    </Typography>

                    {c?.description && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          mt: 1, 
                          mb: 2,
                          whiteSpace: "pre-wrap",
                          lineHeight: 1.6,
                          fontSize: { xs: "0.875rem", sm: "0.875rem" },
                        }}
                      >
                        {c.description}
                      </Typography>
                    )}

                    <Box sx={{ mt: 1.5, display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {typeof c?.memberCount === "number" && (
                        <Chip 
                          size="small" 
                          label={`👥 ${c.memberCount} üye`}
                          sx={{
                            backgroundColor: "rgba(106, 76, 255, 0.1)",
                            fontWeight: 600,
                            fontSize: { xs: "0.7rem", sm: "0.75rem" },
                            transition: "all 0.2s ease-in-out",
                            "&:hover": {
                              backgroundColor: "rgba(106, 76, 255, 0.2)",
                              transform: "translateY(-1px)",
                            },
                          }}
                        />
                      )}
                      {c?.createdAt && (
                        <Chip
                          size="small"
                          variant="outlined"
                          label={`📅 ${new Date(c.createdAt).toLocaleDateString("tr-TR")}`}
                          sx={{
                            fontSize: { xs: "0.7rem", sm: "0.75rem" },
                            transition: "all 0.2s ease-in-out",
                            "&:hover": {
                              borderColor: "#6a4cff",
                              backgroundColor: "rgba(106, 76, 255, 0.05)",
                              transform: "translateY(-1px)",
                            },
                          }}
                        />
                      )}
                    </Box>

                    <Box sx={{ mt: 2.5, display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {c?.isFollowing ? (
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => unfollow(c.clubId)}
                          sx={{
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 600,
                            fontSize: { xs: "0.75rem", sm: "0.875rem" },
                            "&:hover": {
                              transform: "translateY(-2px)",
                              boxShadow: "0 4px 12px rgba(211, 47, 47, 0.2)",
                            },
                          }}
                        >
                          ✖ Takibi Bırak
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => follow(c.clubId)}
                          sx={{
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 600,
                            fontSize: { xs: "0.75rem", sm: "0.875rem" },
                            boxShadow: "0 4px 12px rgba(106, 76, 255, 0.2)",
                            "&:hover": {
                              transform: "translateY(-2px)",
                              boxShadow: "0 6px 18px rgba(106, 76, 255, 0.3)",
                            },
                          }}
                        >
                          ✓ Takip Et
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
