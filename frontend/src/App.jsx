import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import ProtectedRoute from "./component/ProtectedRoute";

// Lazy load components
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Register = lazy(() => import("./pages/auth/Register"));
const Login = lazy(() => import("./pages/auth/Login"));
const AgentPage = lazy(() => import("./pages/AgentPage"));
const LeadsPage = lazy(() => import("./pages/LeadsPage"));
const PropertiesPage = lazy(() => import("./pages/PropertiesPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const PropertyDetailsPage = lazy(() => import("./pages/PropertyDetailsPage"));
const LeadDetailsPage = lazy(() => import("./pages/LeadDetailsPage"));

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Private Routes */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agents"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <AgentPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/properties"
                element={
                  <ProtectedRoute>
                    <PropertiesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/properties/:id"
                element={
                  <ProtectedRoute>
                    <PropertyDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leads"
                element={
                  <ProtectedRoute>
                    <LeadsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leads/:id"
                element={
                  <ProtectedRoute>
                    <LeadDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <NotificationsPage />
                  </ProtectedRoute>
                }
              />

              {/* Catch All */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
