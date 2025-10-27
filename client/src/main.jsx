import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";       // ✅ Yeni Home
import Events from "./pages/Events.jsx";   // ✅ Etkinlikler
import ManageEvents from "./pages/ManageEvents.jsx";
import Clubs from "./pages/Clubs.jsx";

const router = createBrowserRouter([
  { path: "/", element: <Login /> },
  { path: "/home", element: <Home /> },        // ✅ Login sonrası buraya düşecek
  { path: "/events", element: <Events /> },
  { path: "/manageevents", element: <ManageEvents /> },
  { path: "/clubs", element: <Clubs /> },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);
