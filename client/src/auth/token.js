// src/auth/token.js

function base64UrlDecode(input) {
  if (!input) return null;
  input = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = input.length % 4;
  if (pad) input += "=".repeat(4 - pad);
  try {
    return atob(input);
  } catch {
    return null;
  }
}

export function getToken() {
  // Hem localStorage hem sessionStorage kontrol et
  return localStorage.getItem("token") || sessionStorage.getItem("token") || null;
}

export function getTokenPayload() {
  const token = getToken();
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const json = base64UrlDecode(parts[1]);
  if (!json) return null;
  try {
    const payload = JSON.parse(json);
    // Geçici debug:
    // eslint-disable-next-line no-console
    console.log("[Auth] JWT payload:", payload);
    return payload;
  } catch {
    return null;
  }
}

function normalizeToArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    // "Admin,Manager" gibi virgüllü gelebilir
    return value.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [String(value)];
}

export function getUserRole() {
  const payload = getTokenPayload();
  if (!payload) return null;

  // En yaygın olası role claim alanları:
  const candidates = [
    payload.role,
    payload.Role,
    payload.roles,
    payload.Roles,
    payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"],
    payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/roles"]
  ];

  // Ek güvenlik: payload içinde "role" geçen tüm anahtarları da tara
  Object.keys(payload).forEach((k) => {
    if (/role/i.test(k) && !candidates.includes(payload[k])) {
      candidates.push(payload[k]);
    }
  });

  // Hepsini diziye çevirip birleştir
  const all = candidates.flatMap((x) => normalizeToArray(x));

  // Geçici debug:
  // eslint-disable-next-line no-console
  console.log("[Auth] Derived roles:", all);

  if (all.length === 0) return null;

  // Tercih sırası: Admin > Manager > diğerleri
  if (all.includes("Admin")) return "Admin";
  if (all.includes("Manager")) return "Manager";
  return all[0]; // başka özel rol varsa ilkini döndür
}
