// src/components/AppLayout.jsx 
import { Box, AppBar, Toolbar, Typography, Button, Stack, Fab } from "@mui/material";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import NotificationBell from "./NotificationBell";
import LogoutIcon from "@mui/icons-material/Logout";

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // 🔐 Rol bilgisi: localStorage'daki "user"
  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  }, []);
  const role = user?.role ?? null;
  const isAdmin = role === "Admin";
  const isManager = role === "Manager";

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/home": return "Ana Sayfa";
      case "/events": return "Etkinlikler";
      case "/clubs": return "Kulüpler";
      case "/manageevents": return "Etkinlik Oluştur";
      default: return "";
    }
  };

  const linkBtnSx = {
    px: 2,
    py: 1,
    fontSize: 14,
    fontWeight: 600,
    color: "text.primary",
    minWidth: "auto",
    borderRadius: 2,
    position: "relative",
    "&:hover": {
      backgroundColor: "rgba(106, 76, 255, 0.1)",
      color: "primary.main",
      transform: "translateY(-1px)",
    },
    "&:active": {
      transform: "translateY(0)",
    },
  };

  const handleLogout = () => {
    localStorage.removeItem("user"); // sadece user bilgisini temizle
    navigate("/");                  // Login route'u: "/"
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          background: "linear-gradient(135deg, #6a4cff 0%, #8c6fff 100%)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 3 }, py: 1.5 }}>
          <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", gap: { xs: 1.5, sm: 3 }, flexWrap: "wrap" }}>
            <Box
              sx={{
                bgcolor: "white",
                px: { xs: 1, sm: 1.5 },
                py: 0.5,
                borderRadius: 2,
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
              }}
            >
              <Typography 
                variant="h6" 
                className="unimeet-logo" 
                sx={{ 
                  fontSize: { xs: "1.25rem", sm: "1.5rem" },
                  cursor: "pointer",
                  "&:hover": {
                    opacity: 0.8,
                  },
                }}
                onClick={() => navigate("/home")}
              >
                <span className="uni">Uni</span>
                <span className="meet">Meet</span>
              </Typography>
            </Box>
            {getPageTitle() && (
              <Box
                sx={{
                  display: { xs: "none", sm: "block" },
                  px: 2,
                  py: 0.5,
                  bgcolor: "rgba(255, 255, 255, 0.2)",
                  borderRadius: 2,
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                }}
              >
                <Typography variant="body2" sx={{ color: "white", fontWeight: 600, fontSize: "0.85rem" }}>
                  {getPageTitle()}
                </Typography>
              </Box>
            )}
          </Box>

          <Stack direction="row" spacing={{ xs: 0.5, sm: 0.5 }} alignItems="center">
            <Button 
              onClick={() => navigate("/home")} 
              sx={{
                ...linkBtnSx,
                color: "white",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                px: { xs: 1, sm: 2 },
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 0.15)",
                  transform: "translateY(-1px)",
                },
              }}
            >
              Ana Sayfa
            </Button>
            <Button 
              onClick={() => navigate("/events")} 
              sx={{
                ...linkBtnSx,
                color: "white",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                px: { xs: 1, sm: 2 },
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 0.15)",
                  transform: "translateY(-1px)",
                },
              }}
            >
              Etkinlikler
            </Button>
            <Button 
              onClick={() => navigate("/clubs")} 
              sx={{
                ...linkBtnSx,
                color: "white",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                px: { xs: 1, sm: 2 },
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 0.15)",
                  transform: "translateY(-1px)",
                },
              }}
            >
              Kulüpler
            </Button>

            {(isAdmin || isManager) && (
              <Button
                variant="contained"
                onClick={() => navigate("/manageevents")}
                sx={{ 
                  ml: { xs: 0.5, sm: 1 },
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  px: { xs: 1.5, sm: 2 },
                  fontWeight: 600,
                  bgcolor: "white",
                  color: "white",
                  background: "linear-gradient(135deg, #6a4cff 0%, #8c6fff 100%)",
                  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.2)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #563bff 0%, #7a5cff 100%)",
                    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.25)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <span style={{ display: { xs: "none", sm: "inline" } }}>✨ </span>Etkinlik Oluştur
              </Button>
            )}

            <NotificationBell sx={{ color: "white" }} />
          </Stack>
        </Toolbar>
      </AppBar>

      <Toolbar />

      <Box sx={{ p: 3, maxWidth: 1400, mx: "auto" }}>
        <Outlet />
      </Box>

      {/* Sağ altta çıkış butonu */}
      <Fab
        color="error"
        onClick={handleLogout}
        sx={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 9999,
        }}
      >
        <LogoutIcon />
      </Fab>
    </Box>
  );
}
