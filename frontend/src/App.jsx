import { useState, lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";

import ProtectedRoute from "./components/ProtectedRoute";
import Shell from "./components/Shell";
import Loading from "./components/Loading";

import Startup from "./pages/Startup/Startup";
import Landing from "./pages/Landing/Landing";
import AuthPage from "./pages/Auth/AuthPage";

// Lazy-load protected pages to optimize bundle splitting and defer Three.js/page logic
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));
const Send = lazy(() => import("./pages/Send/Send"));
const Receive = lazy(() => import("./pages/Receive/Receive"));
const Transactions = lazy(() => import("./pages/Transactions/Transactions"));
const Statement = lazy(() => import("./pages/Statement/Statement"));
const Security = lazy(() => import("./pages/Security/Security"));
const Notifications = lazy(() => import("./pages/Notifications/Notifications"));
const Profile = lazy(() => import("./pages/Profile/Profile"));

import "./App.css";

function Routed() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Suspense
          fallback={
            <div className="d-flex align-items-center justify-content-center min-vh-100">
              <Loading message="Loading WalletX..." />
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage register />} />

            {[
              ["/dashboard", <Dashboard />],
              ["/send", <Send />],
              ["/receive", <Receive />],
              ["/transactions", <Transactions />],
              ["/statement", <Statement />],
              ["/security", <Security />],
              ["/wallet-security", <Security />],
              ["/notifications", <Notifications />],
              ["/profile", <Profile />],
            ].map(([path, element]) => (
              <Route
                key={path}
                path={path}
                element={
                  <ProtectedRoute>
                    <Shell>{element}</Shell>
                  </ProtectedRoute>
                }
              />
            ))}

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);

  return (
    <BrowserRouter>
      {ready ? <Routed /> : <Startup ready={() => setReady(true)} />}
    </BrowserRouter>
  );
}
