import { Link, useLocation } from 'react-router-dom';
import autoschedule from '../assets/SLIIT_LOGO.png';

const Navigation = ({ isAuthenticated, user, apiBase = "http://localhost:5000" }) => {
    const location = useLocation();

    const handleLogout = async () => {
        try {
            const response = await fetch(`${apiBase}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            });
            if (response.ok) {
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    };
    
    return (
        <nav className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 px-[5%] py-4 backdrop-blur-md">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
                <Link to="/" className="flex items-center gap-3 no-underline">
                    <h2 className="m-0 text-lg font-bold text-slate-900 md:text-2xl">SLIIT Timetable Generator</h2>
                    <img src={autoschedule} alt="SLIIT Logo" className="h-10 w-auto md:h-12" />
                </Link>

            <div className="flex items-center gap-2 md:gap-3">
                {isAuthenticated ? (
                    <>
                        <span className="hidden text-sm font-semibold text-slate-700 md:inline">{user?.username || user?.name}</span>

                        {location.pathname !== '/dashboard' && (
                            <Link to="/dashboard" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-900 transition hover:bg-slate-100 md:w-28">Dashboard</Link>
                        )}

                        {user?.role === 'Faculty Coordinator' && location.pathname !== '/scheduler' && (
                            <Link to="/scheduler" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-900 transition hover:bg-slate-100 md:w-28">Scheduler</Link>
                        )}

                        <button onClick={handleLogout} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 md:w-28">
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        {location.pathname !== '/' && (
                            <Link to="/" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-900 transition hover:bg-slate-100 md:w-24">Home</Link>
                        )}

                        {location.pathname !== '/login' && (
                            <Link to="/login" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-900 transition hover:bg-slate-100 md:w-24">Login</Link>
                        )}

                        {location.pathname !== '/register' && (
                            <Link to="/register" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-900 transition hover:bg-slate-100 md:w-24">Register</Link>
                        )}
                    </>
                )}
            </div>
            </div>
        </nav >
    );
};

export default Navigation;