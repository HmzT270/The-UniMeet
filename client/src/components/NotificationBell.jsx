import { useEffect, useState } from "react";
import {
  IconButton, Badge, Menu, Box, Typography, Divider, Button, MenuList, MenuItem, ListItemText
} from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import { api } from "../api/index";

function toLocal(d) { return new Date(d); }

export default function NotificationBell() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [items, setItems] = useState([]); // 24 saat içindeki etkinlikler
  const [unreadCount, setUnreadCount] = useState(0);
  const open = Boolean(anchorEl);

  async function fetchUpcoming() {
    try {
      const { data } = await api.get("/api/Events/upcoming");
      const now = new Date();
      const in24h = 24 * 60 * 60 * 1000;

      const list = (Array.isArray(data) ? data : [])
        .map(e => ({ ...e, start: toLocal(e.startAt ?? e.startTimeUtc ?? e.startTime) }))
        .filter(e => {
          const dt = e.start.getTime() - now.getTime();
          return dt > 0 && dt <= in24h;
        })
        .sort((a, b) => a.start - b.start);

      setItems(list);
      setUnreadCount(list.length);
    } catch (err) {
      console.warn("upcoming fetch hatası:", err?.response?.status, err?.message);
      setItems([]);
      setUnreadCount(0);
    }
  }

  useEffect(() => {
    fetchUpcoming();
    const id = setInterval(fetchUpcoming, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const handleOpen = (e) => {
    setAnchorEl(e.currentTarget);
    setUnreadCount(0); // açınca okundu say
  };
  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen} aria-label="bildirimler" sx={{ ml: 1 }}>
        <Badge badgeContent={unreadCount} max={9}>
          {unreadCount > 0 ? <NotificationsActiveIcon /> : <NotificationsNoneIcon />}
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{ sx: { width: 340, p: 0.5 } }}
      >
        {/* ✅ TEK SARMALEYICI: Artık Menu’nun doğrudan çocuğu Fragment değil */}
        <Box>
          <Box sx={{ px: 1.5, py: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Hatırlatmalar (24 saat)
            </Typography>
          </Box>
          <Divider />

          {items.length === 0 ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Yaklaşan 24 saat içinde etkinlik yok.
              </Typography>
              <Box sx={{ textAlign: "right", mt: 1 }}>
                <Button size="small" onClick={fetchUpcoming}>Yenile</Button>
              </Box>
            </Box>
          ) : (
            <>
              <MenuList dense>
                {items.map((e) => {
                  const gun = e.start.toLocaleDateString("tr-TR", { year: "numeric", month: "2-digit", day: "2-digit" });
                  const saat = e.start.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
                  return (
                    <MenuItem
                      key={e.eventId ?? e.id}
                      onClick={() => { window.location.href = `/events/${e.eventId ?? e.id}`; }}
                    >
                      <ListItemText
                        primary={e.title}
                        secondary={`Başlangıç: ${gun} ${saat}`}
                        primaryTypographyProps={{ noWrap: true }}
                        secondaryTypographyProps={{ noWrap: true }}
                      />
                    </MenuItem>
                  );
                })}
              </MenuList>
              <Divider />
              <Box sx={{ display: "flex", justifyContent: "space-between", p: 1 }}>
                <Button size="small" onClick={fetchUpcoming}>Yenile</Button>
                <Button size="small" onClick={handleClose}>Kapat</Button>
              </Box>
            </>
          )}
        </Box>
      </Menu>
    </>
  );
}
