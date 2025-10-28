// src/components/NotificationBell.jsx
import { useEffect, useState } from "react";
import {
  IconButton, Badge, Menu, Box, Typography, Divider, Button,
  MenuList, MenuItem, ListItemText
} from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import { api } from "../api/index";

const SEEN_KEY = "um_seen_event_ids_v1";
const INTERVAL_MS = 60 * 1000;
const MAX_LIST = 15;
const TZ = "Europe/Istanbul";

// Naive ISO (timezone’suz) gelirse UTC varsay: "2025-10-29T00:41:00" -> "2025-10-29T00:41:00Z"
const parseUTC = (s) => {
  if (!s) return null;
  const hasTz = /[zZ]|[+\-]\d{2}:\d{2}$/.test(s);
  const d = new Date(hasTz ? s : s + "Z");
  return isNaN(d.getTime()) ? null : d;
};

const loadSeen = () => {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]")); }
  catch { return new Set(); }
};
const saveSeen = (set) => {
  try { localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(set))); } catch {}
};

export default function NotificationBell() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const open = Boolean(anchorEl);

  const formatWhen = (iso) => {
    const d = parseUTC(iso);
    if (!d) return "-";
    return d.toLocaleString("tr-TR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: TZ,             // <<— saat farkını düzelt
      hour12: false
    });
  };

  async function fetchNewlyCreated(initial = false) {
    try {
      const { data } = await api.get("/api/Events/feed?upcomingOnly=false&includeCancelled=false");
      const list = Array.isArray(data) ? data : [];

      const seen = loadSeen();
      // İlk girişte mevcutları “görülmüş” sayıp bildirimi sıfırdan başlatıyoruz.
      if (initial && seen.size === 0) {
        list.forEach(e => seen.add(String(e.eventId ?? e.id)));
        saveSeen(seen);
        return;
      }

      const newly = list
        .filter(e => !seen.has(String(e.eventId ?? e.id)))
        .map(e => ({
          id: String(e.eventId ?? e.id),
          title: e.title,
          clubName: e.clubName || "Kulüp",
          startAt: e.startAt
        }));

      if (newly.length > 0) {
        setItems(prev => {
          const next = [
            ...newly.map(n => ({
              ...n,
              when: formatWhen(n.startAt),
              ts: Date.now()
            })),
            ...prev
          ];
          return next.slice(0, MAX_LIST);
        });
        setUnreadCount(prev => prev + newly.length);
        newly.forEach(n => seen.add(n.id));
        saveSeen(seen);
      }
    } catch {
      /* sessiz geç */
    }
  }

  useEffect(() => {
    fetchNewlyCreated(true);
    const id = setInterval(() => fetchNewlyCreated(false), INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const handleOpen = (e) => { setAnchorEl(e.currentTarget); setUnreadCount(0); };
  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen} aria-label="bildirimler" sx={{ ml: 1 }}>
        <Badge badgeContent={unreadCount} max={9} color="primary">
          {unreadCount > 0 ? <NotificationsActiveIcon /> : <NotificationsNoneIcon />}
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{ sx: { width: 360, p: 0.5 } }}
      >
        <Box>
          <Box sx={{ px: 1.5, py: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Yeni etkinlikler (üyeliklerin)
            </Typography>
          </Box>
          <Divider />
          {items.length === 0 ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Üye olduğun kulüplerden yeni etkinlik bildirimi yok.
              </Typography>
              <Box sx={{ textAlign: "right", mt: 1 }}>
                <Button size="small" onClick={() => fetchNewlyCreated(false)}>Yenile</Button>
              </Box>
            </Box>
          ) : (
            <>
              <MenuList dense>
                {items.map((e) => (
                  <MenuItem
                    key={`${e.id}-${e.ts}`}
                    onClick={() => { window.location.href = "/events"; }}
                  >
                    <ListItemText
                      primary={`"${e.title}" — ${e.clubName}`}
                      secondary={`Başlangıç: ${e.when}`}
                      primaryTypographyProps={{ noWrap: true }}
                      secondaryTypographyProps={{ noWrap: true }}
                    />
                  </MenuItem>
                ))}
              </MenuList>
              <Divider />
              <Box sx={{ display: "flex", justifyContent: "space-between", p: 1 }}>
                <Button size="small" onClick={() => fetchNewlyCreated(false)}>Yenile</Button>
                <Button size="small" onClick={handleClose}>Kapat</Button>
              </Box>
            </>
          )}
        </Box>
      </Menu>
    </>
  );
}
