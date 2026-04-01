import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import Home from "../Home/home.jsx";
import Login from "../LoginandRegistration/Login.jsx";
import Navigation from "./components/Navigation.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import FacultyCoordinatorDashboard from "./pages/FacultyCoordinatorDashboard.jsx";
import FacultyBatchesPage from "./pages/FacultyBatchesPage.jsx";
import FacultyModulesPage from "./pages/FacultyModulesPage.jsx";
import LICDashboard from "./pages/LICDashboard.jsx";
import AcademicCoordinatorDashboard from "./pages/AC_before_merge.jsx";
import InstructorDashboard from "./pages/InstructorDashboard.jsx";
import LecturerDashboard from "./pages/LecturerDashboard.jsx";
import CommonDashboard from "./pages/CommonDashboard.jsx";
import Scheduler from "./pages/Scheduler.jsx";
import FacultyCoordinatorSchedulerPage from "./pages/FacultyCoordinatorSchedulerPage.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminRoleHistoryPage from "./pages/AdminRoleHistoryPage.jsx";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const normalizeRoleKey = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

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

  const renderDashboardByRole = () => {
    const roleKey = normalizeRoleKey(user?.role);

    if (roleKey === "facultycoordinator") {
      return <FacultyCoordinatorDashboard apiBase={API_BASE} user={user} />;
    }
    if (roleKey === "admin") {
      return <AdminDashboard apiBase={API_BASE} user={user} />;
    }
    if (roleKey === "lic") {
      return <LICDashboard apiBase={API_BASE} user={user} />;
    }
    if (roleKey === "academiccoordinator") {
      return <AcademicCoordinatorDashboard apiBase={API_BASE} user={user} />;
    }
    if (roleKey === "instructor") {
      return <InstructorDashboard apiBase={API_BASE} user={user} />;
    }
    if (["lecturerseniorlecturer", "lecturer", "seniorlecturer", "assistantlecturer", "professor"].includes(roleKey)) {
      return <LecturerDashboard apiBase={API_BASE} user={user} />;
    }

    return <CommonDashboard user={user} role={user?.role || 'User'} />;
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
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-white text-lg font-semibold text-gray-700 dark:bg-black dark:text-gray-200">Loading...</div>;

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
              <Navigate to="/dashboard" replace />
            ) : (
              <section className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 p-5 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
                <Login apiBase={API_BASE} onAuthSuccess={handleAuthSuccess} />
              </section>
            )
          }
        />

        <Route path="/register" element={<Navigate to="/login" replace />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
              {renderDashboardByRole()}
            </ProtectedRoute>
          }
        />

        <Route path="/scheduler" element={
          <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
            {roleKey === "facultycoordinator" ? <Scheduler /> : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        } />

        <Route path="/scheduler/by-year" element={
          <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
            {roleKey === "facultycoordinator" ? <FacultyCoordinatorSchedulerPage /> : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        } />

        <Route path="/faculty/batches" element={
          <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
            {roleKey === "facultycoordinator" ? <FacultyBatchesPage user={user} /> : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        } />

        <Route path="/faculty/modules" element={
          <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
            {roleKey === "facultycoordinator" ? <FacultyModulesPage user={user} /> : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        } />

        <Route path="/admin/role-history" element={
          <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
            {user?.role === "Admin" ? <AdminRoleHistoryPage apiBase={API_BASE} user={user} /> : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={2600}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        limit={3}
      />
    </Router>
  );
}

export default App;







