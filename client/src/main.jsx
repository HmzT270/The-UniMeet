import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Login from "./pages/Login.jsx";
import Verify from "./pages/Verify.jsx";
import Home from "./pages/Home.jsx";
import Events from "./pages/Events.jsx";
import ManageEvents from "./pages/ManageEvents.jsx";
import Clubs from "./pages/Clubs.jsx";
import AppLayout from "./components/AppLayout.jsx";
import ResetPasswordRequest from "./pages/ResetPasswordRequest.jsx";
import ResetPasswordConfirm from "./pages/ResetPasswordConfirm.jsx";
import FirstTimeVerification from "./pages/FirstTimeVerification.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";

const router = createBrowserRouter([
  { path: "/", element: <Login /> },
  { path: "/verify", element: <Verify /> },
  { path: "/reset-password-request", element: <ResetPasswordRequest /> },
  { path: "/reset-password-confirm", element: <ResetPasswordConfirm /> },
  { path: "/first-time-verification", element: <FirstTimeVerification /> },
  {
    element: <AppLayout />,
    children: [
      { path: "/home", element: <Home /> },
      { path: "/events", element: <Events /> },
      { path: "/manageevents", element: <ManageEvents /> },
      { path: "/clubs", element: <Clubs /> },
      { path: "/admin", element: <AdminPanel /> },
    ],
  },
]);

// Temiz ve modern mor tema
const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#6a4cff",
      light: "#8c6fff",
      dark: "#563bff",
    },
    secondary: {
      main: "#f5f5f7",
    },
    background: {
      default: "#fafafa",
      paper: "#ffffff",
    },
    text: {
      primary: "#1a1a1a",
      secondary: "#666666",
    },
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    "none",
    "0px 2px 8px rgba(106, 76, 255, 0.08)",
    "0px 4px 12px rgba(106, 76, 255, 0.1)",
    "0px 6px 16px rgba(106, 76, 255, 0.12)",
    "0px 8px 24px rgba(106, 76, 255, 0.14)",
    "0px 12px 32px rgba(106, 76, 255, 0.16)",
    ...Array(19).fill("0px 12px 32px rgba(106, 76, 255, 0.16)"),
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: "10px 24px",
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0px 4px 12px rgba(106, 76, 255, 0.2)",
          },
        },
        contained: {
          background: "linear-gradient(135deg, #6a4cff 0%, #8c6fff 100%)",
          "&:hover": {
            background: "linear-gradient(135deg, #563bff 0%, #6a4cff 100%)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.06)",
          border: "1px solid rgba(106, 76, 255, 0.08)",
          transition: "all 0.3s ease",
          "&:hover": {
            boxShadow: "0px 8px 30px rgba(106, 76, 255, 0.12)",
            transform: "translateY(-2px)",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <RouterProvider router={router} />
  </ThemeProvider>
);
