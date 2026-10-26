import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./styles.css";
import { ContentProvider, Offline } from "./ui";
import Home from "./pages/Home";
import ProjectPage from "./pages/Project";
import Login from "./pages/Login";
import MePage from "./pages/Me";
import Admin from "./pages/Admin";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ContentProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/p/:id" element={<ProjectPage />} />
          <Route path="/p/:id/login" element={<Login />} />
          <Route path="/p/:id/me" element={<MePage />} />
          <Route path="/admin" element={<Admin />} />
          {/* QR 단축 주소: /q/2027W → 로그인 상태면 내 정보, 아니면 로그인 */}
          <Route path="/q/:id" element={<Login />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Offline />
      </ContentProvider>
    </BrowserRouter>
  </StrictMode>,
);
