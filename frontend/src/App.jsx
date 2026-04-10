import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Slide, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Home from "../Home/home.jsx";
import Login from "../LoginandRegistration/Login.jsx";
import Navigation from "./components/Navigation.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import FacultyCoordinatorDashboard from "./pages/FacultyCoordinatorDashboard.jsx";
import FacultyBatchesPage from "./pages/FacultyBatchesPage.jsx";
import FacultyModulesPage from "./pages/FacultyModulesPage.jsx";
import FacultyAddedModulesPage from "./pages/FacultyAddedModulesPage.jsx";
import FacultyHallAllocationPage from "./pages/FacultyHallAllocationPage.jsx";
import FacultyCoordinatorTimetableSidebarPage from "./pages/FacultyCoordinatorTimetableSidebarPage.jsx";
import LICDashboard from "./pages/LICDashboard.jsx";
import AcademicCoordinatorDashboard from "./pages/AcademicCoordinatorDashboard.jsx";
import AcademicModulesPage from "./pages/AcademicModulesPage.jsx";
import AcademicPersonnelPage from "./pages/AcademicPersonnelPage.jsx";
import AcademicAssignmentsPage from "./pages/AcademicAssignmentsPage.jsx";
import AcademicCalendarPage from "./pages/AcademicCalendarPage.jsx";
import AcademicConflictsPage from "./pages/AcademicConflictsPage.jsx";
import InstructorDashboard from "./pages/InstructorDashboard.jsx";
import LecturerDashboard from "./pages/LecturerDashboard.jsx";
import CommonDashboard from "./pages/CommonDashboard.jsx";
import FacultyCoordinatorSchedulerPage from "./pages/FacultyCoordinatorSchedulerPage.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminRoleHistoryPage from "./pages/AdminRoleHistoryPage.jsx";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const normalizeRoleKey = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, hash]);

  return null;
}

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
  const hasFixedSidebarOffset = true;

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
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
    document.documentElement.style.colorScheme = 'light';
  }, []);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-white text-lg font-semibold text-gray-700">Loading...</div>;

  return (
    <Router>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
        <Navigation
          isAuthenticated={isAuthenticated}
          user={user}
          apiBase={API_BASE}
          hasFixedSidebarOffset={hasFixedSidebarOffset}
        />

        <main className="flex-1 relative flex flex-col">
          <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login apiBase={API_BASE} onAuthSuccess={handleAuthSuccess} />
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

        <Route path="/scheduler/by-year" element={
          <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
            {roleKey === "facultycoordinator" || roleKey === "academiccoordinator" ? <FacultyCoordinatorSchedulerPage user={user} /> : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        } />

        <Route path="/faculty/batches" element={
          <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
            {roleKey === "facultycoordinator" ? <FacultyBatchesPage user={user} /> : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        } />

        {/* Academic Coordinator Exclusive Routes */}
        <Route path="/academic/modules" element={
          <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
            {roleKey === "academiccoordinator" ? <AcademicModulesPage user={user} /> : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        } />

        <Route path="/academic/personnel" element={
          <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
            {roleKey === "academiccoordinator" ? <AcademicPersonnelPage user={user} /> : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        } />

        <Route path="/academic/assignments" element={
          <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
            {roleKey === "academiccoordinator" ? <AcademicAssignmentsPage user={user} /> : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        } />

        <Route path="/academic/calendar" element={
          <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
            {roleKey === "academiccoordinator" ? <AcademicCalendarPage user={user} /> : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        } />

        <Route path="/academic/conflicts" element={
          <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
            {roleKey === "academiccoordinator" ? <AcademicConflictsPage user={user} /> : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        } />

        <Route path="/faculty/modules" element={
          <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
            {roleKey === "facultycoordinator" ? <FacultyModulesPage user={user} /> : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        } />

        <Route path="/faculty/modules/added" element={
          <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
            {roleKey === "facultycoordinator" || roleKey === "academiccoordinator" ? <FacultyAddedModulesPage user={user} /> : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        } />

        <Route path="/faculty/hall-allocations" element={
          <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
            {roleKey === "facultycoordinator" || roleKey === "academiccoordinator" ? <FacultyHallAllocationPage user={user} /> : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        } />

        <Route path="/faculty/timetable-report" element={
          <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
            {roleKey === "facultycoordinator" ? <FacultyCoordinatorTimetableSidebarPage user={user} /> : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        } />

        <Route path="/admin/role-history" element={
          <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
            {user?.role === "Admin" ? <AdminRoleHistoryPage apiBase={API_BASE} user={user} /> : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </main>

        <Footer isAuthenticated={isAuthenticated} user={user} hasFixedSidebarOffset={hasFixedSidebarOffset} />
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />
    </Router>
  );
}

export default App;







