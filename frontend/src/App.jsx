import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "../Home/home.jsx";
import Login from "../LoginandRegistration/Login.jsx";
import Register from "../LoginandRegistration/Register.jsx";
import Navigation from "./components/Navigation.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import FacultyCoordinatorDashboard from "./pages/FacultyCoordinatorDashboard.jsx";
import LICDashboard from "./pages/LICDashboard.jsx";
import AcademicCoordinatorDashboard from "./pages/AcademicCoordinatorDashboard.jsx";
import InstructorDashboard from "./pages/InstructorDashboard.jsx";
import LecturerDashboard from "./pages/LecturerDashboard.jsx";
import Scheduler from "./pages/Scheduler.jsx";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAuthSuccess = (nextUser) => {
    setUser(nextUser);
    setIsAuthenticated(true);
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/auth/me`, {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
          console.error(error);
          setIsAuthenticated(false);
        } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-medium tracking-wide backdrop-blur">
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Navigation isAuthenticated={isAuthenticated} user={user} apiBase={API_BASE} />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <section className="auth-wrapper">
                <Login apiBase={API_BASE} onAuthSuccess={handleAuthSuccess} />
              </section>
            )
          }
        />

        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <section className="auth-wrapper">
                <Register apiBase={API_BASE} onAuthSuccess={handleAuthSuccess} />
              </section>
            )
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
              {user?.role === "Faculty Coordinator" && (
                <FacultyCoordinatorDashboard apiBase={API_BASE} user={user} />
              )}
              {user?.role === "LIC" && (
                <LICDashboard apiBase={API_BASE} user={user} />
              )}
              {user?.role === "Academic Coordinator" && (
                <AcademicCoordinatorDashboard apiBase={API_BASE} user={user} />
              )}
              {user?.role === "Instructor" && (
                <InstructorDashboard apiBase={API_BASE} user={user} />
              )}
              {user?.role === "Lecturer/Senior Lecturer" && (
                <LecturerDashboard apiBase={API_BASE} user={user} />
              )}
            </ProtectedRoute>
          }
        />

        <Route path="/scheduler" element={
          <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
            {user?.role === "Faculty Coordinator" ? <Scheduler /> : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;