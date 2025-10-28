// src/components/AppLayout.jsx
import { Box, AppBar, Toolbar, Typography, Button, Stack } from "@mui/material";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/home": return "Ana Sayfa";
      case "/events": return "Etkinlikler";
      case "/clubs": return "Kulüpler";
      case "/manageevents": return "Etkinlik Oluştur";
      default: return "";
    }
  };

  // Sağ üst menüde link görünümlü düğme stili
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
    <Box>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
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

            <Button
              variant="contained"
              onClick={() => navigate("/manageevents")}
              sx={{
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.6,
                boxShadow: "none",
              }}
            >
              Etkinlik Oluştur
            </Button>

            {/* Bildirim zili */}
            <NotificationBell />
          </Stack>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
