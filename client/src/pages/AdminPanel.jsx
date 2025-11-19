import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/index";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  CircularProgress,
} from "@mui/material";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();

  // Sayfa yükleme: role kontrolü ve kullanıcıları getir
  useEffect(() => {
    const checkAdminAndLoadUsers = async () => {
      try {
        // Lokal storage'dan kullanıcı bilgisini al
        const userJSON = localStorage.getItem("user");
        if (!userJSON) {
          navigate("/");
          return;
        }

        const user = JSON.parse(userJSON);
        if (user.role !== "Admin") {
          navigate("/home");
          return;
        }

        // Kullanıcıları getir
        const res = await api.get("/api/Admin/users");
        setUsers(res.data || []);
        setLoading(false);
      } catch (err) {
        console.error("Admin Panel Hata:", err.response?.data || err.message);
        console.error("Token:", localStorage.getItem("token"));
        console.error("User:", localStorage.getItem("user"));
        setError(`Hata: ${err.response?.data?.message || err.message || "Kullanıcılar yüklenemedi"}`);
        setLoading(false);
      }
    };

    checkAdminAndLoadUsers();
  }, [navigate]);

  const handleOpenDialog = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
    setNewRole("");
  };

  const handleUpdateRole = async () => {
    if (!selectedUser || !newRole) return;

    try {
      const res = await api.post(`/api/Admin/users/${selectedUser.userId}/update-role`, {
        newRole: newRole,
      });

      setSuccess(res.data.message || "Rol başarıyla güncellendi.");
      setDialogOpen(false);

      // Listeyi güncelle
      setUsers(
        users.map((u) =>
          u.userId === selectedUser.userId ? { ...u, role: newRole } : u
        )
      );

      // 3 saniye sonra success mesajını temizle
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const errMsg = err?.response?.data?.message || "Rol güncellenirken hata oluştu.";
      setError(errMsg);
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      const res = await api.post(`/api/Admin/users/${user.userId}/toggle-active`);

      setSuccess(res.data.message || "Kullanıcı durumu güncellendi.");

      // Listeyi güncelle
      setUsers(
        users.map((u) =>
          u.userId === user.userId ? { ...u, isActive: !u.isActive } : u
        )
      );

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const errMsg = err?.response?.data?.message || "İşlem başarısız oldu.";
      setError(errMsg);
      setTimeout(() => setError(""), 3000);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "Admin":
        return "error";
      case "Manager":
        return "warning";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <h1>📋 Admin Paneli</h1>
        <p>Kullanıcıları yönet ve rollerini değiştir</p>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
        <Table>
          <TableHead sx={{ backgroundColor: "#6a4cff" }}>
            <TableRow>
              <TableCell sx={{ color: "white", fontWeight: 700 }}>E-posta</TableCell>
              <TableCell sx={{ color: "white", fontWeight: 700 }}>Ad Soyad</TableCell>
              <TableCell sx={{ color: "white", fontWeight: 700 }}>Rol</TableCell>
              <TableCell sx={{ color: "white", fontWeight: 700 }}>Durum</TableCell>
              <TableCell sx={{ color: "white", fontWeight: 700 }} align="center">
                İşlemler
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  Kullanıcı bulunamadı.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.userId} sx={{ "&:hover": { backgroundColor: "#f5f5f5" } }}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.fullName}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      color={getRoleColor(user.role)}
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.isActive ? "Aktif" : "Pasif"}
                      color={user.isActive ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{ mr: 1 }}
                      onClick={() => handleOpenDialog(user)}
                    >
                      Rol Değiştir
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      color={user.isActive ? "error" : "success"}
                      onClick={() => handleToggleActive(user)}
                    >
                      {user.isActive ? "Pasifleştir" : "Aktifleştir"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Rol Değiştirme Dialog'u */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Rol Değiştir</DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 3 }}>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Yeni Rol</InputLabel>
            <Select
              value={newRole}
              label="Yeni Rol"
              onChange={(e) => setNewRole(e.target.value)}
            >
              <MenuItem value="Member">Member</MenuItem>
              <MenuItem value="Manager">Manager</MenuItem>
              <MenuItem value="Admin">Admin</MenuItem>
            </Select>
          </FormControl>
          {selectedUser && (
            <Box sx={{ mt: 3, p: 1.5, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
              <p>
                <strong>Kullanıcı:</strong> {selectedUser.fullName} ({selectedUser.email})
              </p>
              <p>
                <strong>Mevcut Rol:</strong> {selectedUser.role}
              </p>
              <p>
                <strong>Yeni Rol:</strong> {newRole}
              </p>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button
            onClick={handleUpdateRole}
            variant="contained"
            disabled={newRole === selectedUser?.role}
          >
            Onayla
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
