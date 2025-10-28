import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import Events from "./pages/Events.jsx";
import ManageEvents from "./pages/ManageEvents.jsx";
import Clubs from "./pages/Clubs.jsx";
import AppLayout from "./components/AppLayout.jsx"; // ✅ Yeni layout eklendi

const router = createBrowserRouter([
  { path: "/", element: <Login /> },
  {
    element: <AppLayout />, // ✅ Ortak layout (bildirim + menü burada)
    children: [
      { path: "/home", element: <Home /> },
      { path: "/events", element: <Events /> },
      { path: "/manageevents", element: <ManageEvents /> },
      { path: "/clubs", element: <Clubs /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);
