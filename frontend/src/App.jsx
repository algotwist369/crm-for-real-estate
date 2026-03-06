import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Register from './pages/auth/Register';
import Login from './pages/auth/Login';
import AgentPage from "./pages/AgentPage";
import LeadsPage from "./pages/LeadsPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import PropertiesPage from "./pages/PropertiesPage";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Private Routes */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/agents" element={<AgentPage />} />

        {/* Missing Pages (Placeholders) */}
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/reports" element={<PlaceholderPage />} />
        <Route path="/settings" element={<PlaceholderPage />} />


        {/* Catch All */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;