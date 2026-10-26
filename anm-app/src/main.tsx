import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import "./styles.css";
import { ContentProvider, Offline, TabBar } from "./ui";
import Home from "./pages/Home";
import Login from "./pages/Login";
import MePage from "./pages/Me";
import Notices from "./pages/Notices";
import Schedule from "./pages/Schedule";
import Guide from "./pages/Guide";
import Places from "./pages/Places";
import Ministry from "./pages/Ministry";
import Admin from "./pages/Admin";

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ContentProvider>
        <ScrollTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/q" element={<Navigate to="/login" replace />} />
          <Route path="/me" element={<MePage />} />
          <Route path="/notices" element={<Notices />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/places" element={<Places />} />
          <Route path="/p/:id" element={<Ministry />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <TabBar />
        <Offline />
      </ContentProvider>
    </BrowserRouter>
  </StrictMode>,
);
