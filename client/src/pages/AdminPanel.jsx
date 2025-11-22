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
  Autocomplete,
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
  const [newClubLogoUrl, setNewClubLogoUrl] = useState("");
  const [newClubFoundedDate, setNewClubFoundedDate] = useState("");
  const [newClubPurpose, setNewClubPurpose] = useState("");
  const [newClubManagerId, setNewClubManagerId] = useState("");
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
          api.get("/api/Clubs/detailed"),
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

  const getRoleName = (role) => {
    switch (role) {
      case "Admin":
        return "Yönetici";
      case "Manager":
        return "Kulüp Yöneticisi";
      case "Member":
        return "Üye";
      default:
        return role;
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
        profileImageUrl: newClubLogoUrl,
        foundedDate: newClubFoundedDate ? new Date(newClubFoundedDate).toISOString() : null,
        purpose: newClubPurpose,
        managerId: newClubManagerId ? parseInt(newClubManagerId) : null,
      });

      setSuccess("Kulüp başarıyla eklendi.");
      setClubs([...clubs, res.data]);
      setAddClubDialogOpen(false);
      setNewClubName("");
      setNewClubDescription("");
      setNewClubLogoUrl("");
      setNewClubFoundedDate("");
      setNewClubPurpose("");
      setNewClubManagerId("");

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
                <TableCell sx={{ color: "white", fontWeight: 700 }}>Yetki</TableCell>
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
                        label={getRoleName(user.role)}
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
                        Yetki Değiştir
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

          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
            <Table>
              <TableHead sx={{ backgroundColor: "#6a4cff" }}>
                <TableRow>
                  <TableCell sx={{ color: "white", fontWeight: 700 }}>Kulüp Adı</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 700 }}>Açıklama</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 700 }}>Kuruluş Tarihi</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 700 }}>Yönetici</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 700 }} align="center">
                    İşlemler
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clubs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      Henüz kulüp oluşturulmamış.
                    </TableCell>
                  </TableRow>
                ) : (
                  clubs.map((club) => (
                    <TableRow key={club.clubId} sx={{ "&:hover": { backgroundColor: "#f5f5f5" } }}>
                      <TableCell sx={{ fontWeight: 600 }}>{club.name}</TableCell>
                      <TableCell>
                        {club.description || "-"}
                      </TableCell>
                      <TableCell>
                        {club.foundedDate 
                          ? new Date(club.foundedDate).toLocaleDateString("tr-TR")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {club.managerId 
                          ? users.find(u => u.userId === club.managerId)?.fullName || "Bilinmiyor"
                          : "-"}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClub(club.clubId)}
                        >
                          Kulüp Sil
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Yetki Değiştirme Dialog'u */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Yetki Değiştir</DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 3 }}>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Yeni Rol</InputLabel>
            <Select
              value={newRole}
              label="Yeni Rol"
              onChange={(e) => setNewRole(e.target.value)}
            >
              <MenuItem value="Member">Üye</MenuItem>
              <MenuItem value="Manager">Kulüp Yöneticisi</MenuItem>
              <MenuItem value="Admin">Yönetici</MenuItem>
            </Select>
          </FormControl>
          {selectedUser && (
            <Box sx={{ mt: 3, p: 1.5, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
              <p>
                <strong>Kullanıcı:</strong> {selectedUser.fullName} ({selectedUser.email})
              </p>
              <p>
                <strong>Mevcut Rol:</strong> {getRoleName(selectedUser.role)}
              </p>
              <p>
                <strong>Yeni Rol:</strong> {getRoleName(newRole)}
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
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              label="Logo URL (İsteğe Bağlı)"
              value={newClubLogoUrl}
              onChange={(e) => setNewClubLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.jpg"
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              label="Kurulış Tarihi (İsteğe Bağlı)"
              type="date"
              value={newClubFoundedDate}
              onChange={(e) => setNewClubFoundedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              label="Amaç (İsteğe Bağlı)"
              value={newClubPurpose}
              onChange={(e) => setNewClubPurpose(e.target.value)}
              multiline
              rows={3}
              sx={{ mb: 3 }}
              placeholder="Kulübün amacını kısaca açıklayın"
            />
            <Autocomplete
              options={users.filter((u) => u.role === "Manager" || u.role === "Admin")}
              getOptionLabel={(option) => `${option.fullName} (${option.email})`}
              value={
                newClubManagerId
                  ? users.find((u) => u.userId === parseInt(newClubManagerId)) || null
                  : null
              }
              onChange={(event, value) => {
                setNewClubManagerId(value ? value.userId : "");
              }}
              filterOptions={(options, state) => {
                const inputValue = state.inputValue.toLowerCase();
                return options.filter(
                  (option) =>
                    option.fullName.toLowerCase().includes(inputValue) ||
                    option.email.toLowerCase().includes(inputValue)
                );
              }}
              renderInput={(params) => (
                <TextField {...params} label="Yönetici (İsteğe Bağlı)" />
              )}
              sx={{ mb: 3 }}
              noOptionsText="Yönetici bulunamadı"
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
