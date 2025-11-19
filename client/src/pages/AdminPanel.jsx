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
  Tabs,
  Tab,
  Typography,
  Container,
  TextField,
  Card,
  CardContent,
  Grid,
} from "@mui/material";

export default function AdminPanel() {
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newClubName, setNewClubName] = useState("");
  const [newClubDescription, setNewClubDescription] = useState("");
  const [addClubDialogOpen, setAddClubDialogOpen] = useState(false);
  const navigate = useNavigate();

  // Sayfa yükleme: role kontrolü ve verileri getir
  useEffect(() => {
    const checkAdminAndLoadData = async () => {
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

        // Kullanıcıları ve kulüpleri getir
        const [usersRes, clubsRes] = await Promise.all([
          api.get("/api/Admin/users"),
          api.get("/api/Clubs"),
        ]);
        setUsers(usersRes.data || []);
        setClubs(clubsRes.data || []);
        setLoading(false);
      } catch (err) {
        console.error("Admin Panel Hata:", err.response?.data || err.message);
        setError(`Hata: ${err.response?.data?.message || err.message || "Veri yüklenemedi"}`);
        setLoading(false);
      }
    };

    checkAdminAndLoadData();
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

  const handleAddClub = async () => {
    if (!newClubName.trim()) {
      setError("Kulüp adı boş olamaz.");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      const res = await api.post("/api/Clubs", {
        name: newClubName,
        description: newClubDescription,
      });

      setSuccess("Kulüp başarıyla eklendi.");
      setClubs([...clubs, res.data]);
      setAddClubDialogOpen(false);
      setNewClubName("");
      setNewClubDescription("");

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const errMsg = err?.response?.data?.message || "Kulüp eklenirken hata oluştu.";
      setError(errMsg);
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleDeleteClub = async (clubId) => {
    if (!window.confirm("Bu kulübü silmek istediğinizden emin misiniz?")) return;

    try {
      await api.delete(`/api/Clubs/${clubId}`);

      setSuccess("Kulüp başarıyla silindi.");
      setClubs(clubs.filter((c) => c.clubId !== clubId));

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const errMsg = err?.response?.data?.message || "Kulüp silinirken hata oluştu.";
      setError(errMsg);
      setTimeout(() => setError(""), 3000);
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          📋 Admin Paneli
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Kullanıcıları ve kulüpleri yönet
        </Typography>
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

      {/* Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{
            borderBottom: "1px solid #e0e0e0",
            "& .MuiTab-root": {
              fontWeight: 600,
              fontSize: "1rem",
              textTransform: "none",
              py: 2,
            },
            "& .Mui-selected": {
              color: "#6a4cff",
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "#6a4cff",
            },
          }}
        >
          <Tab label="👥 Kullanıcıları Yönet" />
          <Tab label="🏢 Kulüpleri Yönet" />
        </Tabs>
      </Paper>

      {/* Sekme 1: Kullanıcı Yönetimi */}
      {tabValue === 0 && (
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
      )}

      {/* Sekme 2: Kulüp Yönetimi */}
      {tabValue === 1 && (
        <Box>
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              sx={{ backgroundColor: "#6a4cff", "&:hover": { backgroundColor: "#5a3cef" } }}
              onClick={() => setAddClubDialogOpen(true)}
            >
              ➕ Yeni Kulüp Ekle
            </Button>
          </Box>

          {clubs.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: "center", py: 4 }}>
                <Typography color="text.secondary">Henüz kulüp oluşturulmamış.</Typography>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {clubs.map((club) => (
                <Grid item xs={12} sm={6} md={4} key={club.clubId}>
                  <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                        {club.name}
                      </Typography>
                      {club.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {club.description}
                        </Typography>
                      )}
                    </CardContent>
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={() => handleDeleteClub(club.clubId)}
                      >
                        🗑️ Sil
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

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

      {/* Kulüp Ekleme Dialog'u */}
      <Dialog open={addClubDialogOpen} onClose={() => setAddClubDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Yeni Kulüp Ekle</DialogTitle>
        <DialogContent sx={{ pt: 4, pb: 3 }}>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Kulüp Adı"
              value={newClubName}
              onChange={(e) => setNewClubName(e.target.value)}
              sx={{ mb: 3 }}
              autoFocus
            />
            <TextField
              fullWidth
              label="Açıklama (İsteğe Bağlı)"
              value={newClubDescription}
              onChange={(e) => setNewClubDescription(e.target.value)}
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddClubDialogOpen(false)}>İptal</Button>
          <Button
            onClick={handleAddClub}
            variant="contained"
            sx={{ backgroundColor: "#6a4cff", "&:hover": { backgroundColor: "#5a3cef" } }}
          >
            Ekle
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
