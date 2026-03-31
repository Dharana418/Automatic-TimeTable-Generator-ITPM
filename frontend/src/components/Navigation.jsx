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
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white px-[5%] py-3 dark:border-gray-800 dark:bg-black">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
                <Link to="/" className="flex items-center gap-3 no-underline">
                    <h2 className="m-0 select-none text-lg font-semibold text-gray-900 md:text-xl dark:text-white">SLIIT Timetable</h2>
                    <img src={autoschedule} alt="SLIIT Logo" className="h-9 w-auto md:h-10" />
                </Link>

            <div className="flex items-center gap-1.5 md:gap-2">
                <button
                    onClick={onToggleTheme}
                    type="button"
                    className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                    aria-label="Toggle theme"
                >
                    {theme === 'dark' ? '☀' : '🌙'}
                </button>

                {isAuthenticated ? (
                    <>
                        <span className="hidden text-xs font-semibold text-gray-600 dark:text-gray-400 md:inline">{user?.username || user?.name}</span>

                        {location.pathname !== '/dashboard' && (
                            <Link to="/dashboard" className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 md:w-24">Dashboard</Link>
                        )}

                        {user?.role === 'Faculty Coordinator' && location.pathname !== '/scheduler' && (
                            <Link to="/scheduler" className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 md:w-24">Scheduler</Link>
                        )}

                        <button onClick={handleLogout} className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 md:w-20">Logout</button>
                    </>
                ) : (
                    <>
                        {location.pathname !== '/' && (
                            <Link to="/" className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 md:w-20">Home</Link>
                        )}

                        {location.pathname !== '/login' && (
                            <Link to="/login" className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 md:w-20">Login</Link>
                        )}
                    </>
                )}
            </div>
            </div>
        </nav >
    );
};

export default Navigation;