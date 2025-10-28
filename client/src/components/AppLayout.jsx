// src/components/AppLayout.jsx 
import { Box, AppBar, Toolbar, Typography, Button, Stack } from "@mui/material";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import NotificationBell from "./NotificationBell";

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
    px: 1.5,
    py: 0.75,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "primary.main",
    minWidth: "auto",
    borderRadius: 1,
    "&:hover": {
      backgroundColor: "transparent",
      textDecoration: "underline",
      textUnderlineOffset: "4px",
    },
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Kenardan kenara tam genişlik */}
      <AppBar
        position="fixed"
        color="default"
        elevation={1}
        sx={{
          left: 0,
          right: 0,
          m: 0,
          px: 0,
          borderRadius: 0,
          width: "100vw",
        }}
      >
        <Toolbar sx={{ px: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            UniMeet — {getPageTitle()}
          </Typography>

          <Stack direction="row" spacing={1.25} alignItems="center">
            <Button onClick={() => navigate("/home")} sx={linkBtnSx}>
              Ana Sayfa
            </Button>
            <Button onClick={() => navigate("/events")} sx={linkBtnSx}>
              Etkinlikler
            </Button>
            <Button onClick={() => navigate("/clubs")} sx={linkBtnSx}>
              Kulüpler
            </Button>

            {/* 🔒 Sadece Admin/Manager görsün */}
            {(isAdmin || isManager) && (
              <Button
                variant="contained"
                onClick={() => navigate("/manageevents")}
                sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, boxShadow: "none" }}
              >
                Etkinlik Oluştur
              </Button>
            )}

            {/* Bildirim zili */}
            <NotificationBell />
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Spacer: AppBar sabit olduğu için içerik aşağı insin */}
      <Toolbar />

      <Box sx={{ p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
