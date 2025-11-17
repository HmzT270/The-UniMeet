// src/components/NotificationBell.jsx
import { useEffect, useState } from "react";
import {
  IconButton, Badge, Menu, Box, Typography, Divider, Button,
  MenuList, MenuItem, ListItemText
} from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import { api } from "../api/index";
import { useNavigate } from "react-router-dom";

const SEEN_KEY = "um_seen_event_ids_v1";          // "yeni" tekilleştirme
const READ_KEY = "um_read_event_ids_v1";          // okundu takibi (rozet)
const LIST_KEY = "um_notify_list_v1";             // bildirim listesi (kalıcı)
const INTERVAL_MS = 60 * 1000;
const MAX_LIST = 15;
const TZ = "Europe/Istanbul";

// ---- storage helpers ----
const loadSet = (key) => {
  try { return new Set(JSON.parse(localStorage.getItem(key) || "[]")); }
  catch { return new Set(); }
};
const saveSet = (key, set) => {
  try { localStorage.setItem(key, JSON.stringify(Array.from(set))); } catch {}
};
const loadList = () => {
  try {
    const arr = JSON.parse(localStorage.getItem(LIST_KEY) || "[]");
    // id’leri string’e normalize et (eşleşme sorununu önler)
    return Array.isArray(arr) ? arr.map(x => ({ ...x, id: String(x.id) })) : [];
  } catch {
    return [];
  }
};
const saveList = (arr) => {
  try { localStorage.setItem(LIST_KEY, JSON.stringify(arr)); } catch {}
};

// Naive ISO (timezone’suz) gelirse UTC varsay
const parseUTC = (s) => {
  if (!s) return null;
  const hasTz = /[zZ]|[+\-]\d{2}:\d{2}$/.test(s);
  const d = new Date(hasTz ? s : s + "Z");
  return isNaN(d.getTime()) ? null : d;
};

export default function NotificationBell() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [items, setItems] = useState([]);          // {id,title,clubName,startAt,when,ts}
  const [unreadCount, setUnreadCount] = useState(0);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();

  const formatWhen = (iso) => {
    const d = parseUTC(iso);
    if (!d) return "-";
    return d.toLocaleString("tr-TR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: TZ,
      hour12: false
    });
  };

  // unread = list − readSet
  const recalcUnread = (list) => {
    const readSet = loadSet(READ_KEY);
    const count = list.reduce((acc, e) => acc + (readSet.has(String(e.id)) ? 0 : 1), 0);
    setUnreadCount(count);
  };

  async function fetchNewlyCreated(initial = false) {
    try {
      const { data } = await api.get("/api/Events/feed?upcomingOnly=false&includeCancelled=false");
      const feed = Array.isArray(data) ? data : [];

      const seen = loadSet(SEEN_KEY);

      // İlk girişte mevcut feed'i "görülmüş" say → bildirim üretme (spam önleme)
      if (initial && seen.size === 0) {
        feed.forEach(e => seen.add(String(e.eventId ?? e.id)));
        saveSet(SEEN_KEY, seen);
        // elde var olan yerel liste ve unread korunur
      }

      // Yeni düşenleri tespit et
      const newly = feed
        .filter(e => !seen.has(String(e.eventId ?? e.id)))
        .map(e => ({
          id: String(e.eventId ?? e.id),
          title: e.title,
          clubName: e.clubName || "Kulüp",
          startAt: e.startAt,
          when: formatWhen(e.startAt),
          ts: Date.now(),
        }));

      if (newly.length > 0) {
        // Mevcut kalıcı listeyi getir → yeni öğeleri üste ekle → MAX_LIST
        const current = loadList();
        const merged = [...newly, ...current.filter(x => !newly.find(n => n.id === x.id))].slice(0, MAX_LIST);

        saveList(merged);
        setItems(merged);

        newly.forEach(n => seen.add(n.id));
        saveSet(SEEN_KEY, seen);

        recalcUnread(merged);
      } else if (!initial) {
        // yeni yoksa da mevcut listeye göre rozet tazele
        recalcUnread(loadList());
      }
    } catch {
      /* sessiz geç */
    }
  }

  // Mount: önce yerel listeyi yükle (navigasyon sonrası korunsun), sonra fetch
  useEffect(() => {
    const stored = loadList();
    setItems(stored);
    recalcUnread(stored);

    fetchNewlyCreated(true);
    const id = setInterval(() => fetchNewlyCreated(false), INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  // Tek bildirimi okundu say + listeden çıkar + kalıcı kaydet + rozet azalt + ANA SAYFAYA İLGİLİ ETKİNLİKLE GİT
  const markOneReadAndGo = (id) => {
    const strId = String(id);

    // 1) okundu seti
    const readSet = loadSet(READ_KEY);
    if (!readSet.has(strId)) {
      readSet.add(strId);
      saveSet(READ_KEY, readSet);
    }

    // 2) listeden çıkar (hem state hem localStorage)
    const updated = items.filter(i => String(i.id) !== strId);
    setItems(updated);
    saveList(updated);

    // 3) rozet güncelle
    recalcUnread(updated);

    // 4) menüyü kapat + Home’a yönlendir (ilgili etkinlik pop-up’ı açılsın)
    setAnchorEl(null);
    navigate("/home", { state: { openEventId: strId } });
  };

  // (opsiyonel) tümünü okundu say
  const markAllRead = () => {
    const readSet = loadSet(READ_KEY);
    items.forEach(i => readSet.add(String(i.id)));
    saveSet(READ_KEY, readSet);
    recalcUnread(items);
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen} aria-label="bildirimler" sx={{ ml: 1 }}>
        <Badge badgeContent={unreadCount} max={99} color="primary">
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
          <Box sx={{ px: 1.5, py: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Yeni etkinlikler (üyeliklerin)
            </Typography>
            {items.length > 0 && (
              <Button size="small" onClick={markAllRead}>Tümünü okundu say</Button>
            )}
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
                    key={e.id}
                    onClick={() => markOneReadAndGo(e.id)}
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
