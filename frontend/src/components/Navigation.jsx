import { Link, useLocation } from 'react-router-dom';
import autoschedule from '../assets/SLIIT_LOGO.png';

const Navigation = ({ isAuthenticated, user, apiBase = "http://localhost:5000", theme = 'light', onToggleTheme }) => {
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
        <nav className="sticky top-0 z-50 border-b border-blue-100/80 bg-white/90 px-[5%] py-4 shadow-sm shadow-blue-100/70 backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-slate-950/40">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
                <Link to="/" className="flex items-center gap-3 no-underline">
                    <h2 className="m-0 bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-lg font-bold text-transparent md:text-2xl">SLIIT Timetable Generator</h2>
                    <img src={autoschedule} alt="SLIIT Logo" className="h-10 w-auto md:h-12" />
                </Link>

            <div className="flex items-center gap-2 md:gap-3">
                <button
                    onClick={onToggleTheme}
                    type="button"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 transition duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-sky-400 dark:hover:bg-slate-700"
                    aria-label="Toggle theme"
                >
                    {theme === 'dark' ? '☀ Light' : '🌙 Dark'}
                </button>

                {isAuthenticated ? (
                    <>
                        <span className="hidden text-sm font-semibold text-slate-700 dark:text-slate-100 md:inline">{user?.username || user?.name}</span>

                        {location.pathname !== '/dashboard' && (
                            <Link to="/dashboard" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-900 transition duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-sky-400 dark:hover:bg-slate-700 md:w-28">Dashboard</Link>
                        )}

                        {user?.role === 'Faculty Coordinator' && location.pathname !== '/scheduler' && (
                            <Link to="/scheduler" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-900 transition duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-sky-400 dark:hover:bg-slate-700 md:w-28">Scheduler</Link>
                        )}

                        <button onClick={handleLogout} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 transition duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-sky-400 dark:hover:bg-slate-700 md:w-28">
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        {location.pathname !== '/' && (
                            <Link to="/" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-900 transition duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-sky-400 dark:hover:bg-slate-700 md:w-24">Home</Link>
                        )}

                        {location.pathname !== '/login' && (
                            <Link to="/login" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-900 transition duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-sky-400 dark:hover:bg-slate-700 md:w-24">Login</Link>
                        )}
                    </>
                )}
            </div>
            </div>
        </nav >
    );
};

export default Navigation;