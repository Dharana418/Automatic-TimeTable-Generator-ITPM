import { Link, useLocation } from 'react-router-dom';
import autoschedule from '../assets/SLIIT_LOGO.png';

const Navigation = ({ isAuthenticated, user, apiBase = "http://localhost:5000", theme = 'light', onToggleTheme }) => {
    const location = useLocation();
    const displayRole = user?.role === 'Admin' ? 'System Admin' : (user?.role || 'User');
    const displayName = user?.username || user?.name || '';
    const profilePhoto = user?.profile_photo_url || '';
    const shouldShowName =
        displayName && displayName.trim().toLowerCase() !== String(displayRole).trim().toLowerCase();

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
        <nav className="sticky top-0 z-50 border-b border-slate-800 bg-black px-[5%] py-4 shadow-sm shadow-black/50 backdrop-blur-md">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
                <Link to="/" className="flex items-center gap-3 no-underline">
                    <h2 className="m-0 text-lg font-bold text-white md:text-2xl">SLIIT Timetable Generator</h2>
                    <img src={autoschedule} alt="SLIIT Logo" className="h-10 w-auto md:h-12" />
                </Link>

            <div className="ml-auto flex items-center gap-2 md:gap-3">
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
                        {profilePhoto ? (
                            <img
                                src={profilePhoto}
                                alt="Profile"
                                className="h-9 w-9 rounded-full border-2 border-white object-cover"
                            />
                        ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-slate-800 text-xs font-black text-white">
                                {(displayName || displayRole || 'U').trim().charAt(0).toUpperCase()}
                            </div>
                        )}

                        <span className="hidden whitespace-nowrap rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-black text-white md:inline">{displayRole}</span>
                        {shouldShowName && (
                            <span className="hidden whitespace-nowrap text-sm font-semibold text-white md:inline">{displayName}</span>
                        )}

                        {location.pathname !== '/dashboard' && (
                            <Link to="/dashboard" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-900 transition duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-sky-400 dark:hover:bg-slate-700 md:w-28">Dashboard</Link>
                        )}

                        {location.pathname !== '/profile' && (
                            <Link to="/profile" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-900 transition duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-sky-400 dark:hover:bg-slate-700 md:w-24">Profile</Link>
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