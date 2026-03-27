import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "../Home/home.jsx";
import Login from "../LoginandRegistration/Login.jsx";
import ResetPassword from "../LoginandRegistration/ResetPassword.jsx";
import Navigation from "./components/Navigation.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import FacultyCoordinatorDashboard from "./pages/FacultyCoordinatorDashboard.jsx";
import FacultyBatchesPage from "./pages/FacultyBatchesPage.jsx";
import FacultyStaffDirectoryPage from "./pages/FacultyStaffDirectoryPage.jsx";
import LICDashboard from "./pages/LICDashboard.jsx";
import AcademicCoordinatorDashboard from "./pages/AcademicCoordinatorDashboard.jsx";
import InstructorDashboard from "./pages/InstructorDashboard.jsx";
import LecturerDashboard from "./pages/LecturerDashboard.jsx";
import CommonDashboard from "./pages/CommonDashboard.jsx";
import Scheduler from "./pages/Scheduler.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminRoleHistoryPage from "./pages/AdminRoleHistoryPage.jsx";
import Profile from "./pages/Profile.jsx";
import { getDashboardPathByRole, normalizeRoleKey } from "./utils/roleToDashboard.js";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleAuthSuccess = (nextUser) => {
    setUser(nextUser);
    setIsAuthenticated(true);
  };

  const handleUserUpdated = (nextUser) => {
    setUser(nextUser);
  };

  const roleKey = normalizeRoleKey(user?.role);

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

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 text-lg font-semibold text-slate-700 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 dark:text-slate-100">Loading...</div>;

  return (
    <Router>
      <Navigation
        isAuthenticated={isAuthenticated}
        user={user}
        apiBase={API_BASE}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to={getDashboardPathByRole(user?.role)} replace />
            ) : (
              <Login apiBase={API_BASE} onAuthSuccess={handleAuthSuccess} />
            )
          }
        />

        <Route path="/register" element={<Navigate to="/login" replace />} />

        <Route
          path="/profile"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
              <Profile apiBase={API_BASE} user={user} onUserUpdated={handleUserUpdated} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reset-password"
          element={
            <section className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 p-5 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
              <ResetPassword />
            </section>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
              <Navigate to={getDashboardPathByRole(user?.role)} replace />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
              {normalizeRoleKey(user?.role) === 'admin' ? <AdminDashboard apiBase={API_BASE} user={user} /> : <Navigate to={getDashboardPathByRole(user?.role)} replace />}
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/faculty-coordinator"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
              {normalizeRoleKey(user?.role) === 'facultycoordinator' ? <FacultyCoordinatorDashboard apiBase={API_BASE} user={user} /> : <Navigate to={getDashboardPathByRole(user?.role)} replace />}
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/academic-coordinator"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
              {normalizeRoleKey(user?.role) === 'academiccoordinator' ? <AcademicCoordinatorDashboard apiBase={API_BASE} user={user} /> : <Navigate to={getDashboardPathByRole(user?.role)} replace />}
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/lic"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
              {normalizeRoleKey(user?.role) === 'lic' ? <LICDashboard apiBase={API_BASE} user={user} /> : <Navigate to={getDashboardPathByRole(user?.role)} replace />}
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/instructor"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
              {normalizeRoleKey(user?.role) === 'instructor' ? <InstructorDashboard apiBase={API_BASE} user={user} /> : <Navigate to={getDashboardPathByRole(user?.role)} replace />}
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/lecturer"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
              {["lecturerseniorlecturer", "lecturer", "seniorlecturer", "assistantlecturer", "professor"].includes(normalizeRoleKey(user?.role)) ? <LecturerDashboard apiBase={API_BASE} user={user} /> : <Navigate to={getDashboardPathByRole(user?.role)} replace />}
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/common"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
              <CommonDashboard user={user} role={user?.role || 'User'} />
            </ProtectedRoute>
          }
        />

        <Route path="/scheduler" element={
          <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
            {roleKey === "facultycoordinator" ? <Scheduler /> : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        } />

        <Route path="/faculty/batches" element={
          <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
            {roleKey === "facultycoordinator" ? <FacultyBatchesPage user={user} /> : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        } />

        <Route path="/faculty/staff" element={
          <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
            {roleKey === "facultycoordinator" ? <FacultyStaffDirectoryPage /> : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        } />

        <Route path="/admin/role-history" element={
          <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
            {normalizeRoleKey(user?.role) === "admin" ? <AdminRoleHistoryPage apiBase={API_BASE} user={user} /> : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;