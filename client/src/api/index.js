// src/api/index.js
import axios from "axios";

export const api = axios.create({
  // .env dosyanda: VITE_API_BASE_URL=http://localhost:5062  (sonunda /api YOK)
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Tüm isteklerde JWT ekle
api.interceptors.request.use((config) => {
  const t = localStorage.getItem("token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});
