import { Link, useLocation } from 'react-router-dom';
import autoschedule from '../assets/SLIIT_LOGO.png';
import { Sun, Moon, LogOut, LayoutDashboard, User, Calendar, LogIn, Home } from 'lucide-react';

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
        <nav className="sticky top-0 z-50 transition-colors duration-300 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Brand / Logo Area */}
                <Link to="/" className="group flex items-center gap-3 no-underline transition-transform hover:scale-105 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg">
                    <img 
                        src={autoschedule} 
                        alt="SLIIT Logo" 
                        className="h-10 w-auto object-contain drop-shadow-sm transition-all duration-300 group-hover:brightness-110" 
                    />
                    <h2 className="hidden m-0 text-xl font-extrabold tracking-tight sm:block bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                        SLIIT Scheduler
                    </h2>
                </Link>

                {/* Navigation and Settings Area */}
                <div className="flex items-center space-x-1 sm:space-x-3">
                    {/* Theme Toggle Button */}
                    <button
                        onClick={onToggleTheme}
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-all duration-200 hover:bg-slate-200 hover:text-blue-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-amber-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                        aria-label="Toggle theme"
                        title="Toggle dark mode"
                    >
                        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </button>

                    {/* Divider line before auth controls */}
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>

                    {isAuthenticated ? (
                        <>
                            {/* Navigation Links Group */}
                            <div className="flex space-x-1 md:space-x-2">
                                {location.pathname !== '/dashboard' && (
                                    <Link to="/dashboard" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                                        <LayoutDashboard className="h-4 w-4" />
                                        <span className="hidden md:inline">Dashboard</span>
                                    </Link>
                                )}

                                {location.pathname !== '/profile' && (
                                    <Link to="/profile" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                                        <User className="h-4 w-4" />
                                        <span className="hidden md:inline">Profile</span>
                                    </Link>
                                )}

                                {user?.role === 'Faculty Coordinator' && location.pathname !== '/scheduler' && (
                                    <Link to="/scheduler" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                                        <Calendar className="h-4 w-4" />
                                        <span className="hidden md:inline">Scheduler</span>
                                    </Link>
                                )}
                            </div>

                            {/* Divider line before avatar */}
                            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>

                            {/* User Profile Info */}
                            <div className="hidden lg:flex flex-col items-end justify-center mr-2">
                                {shouldShowName && (
                                    <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                                        {displayName}
                                    </span>
                                )}
                                <span className="text-xs font-semibold tracking-wide text-indigo-600 dark:text-indigo-400 uppercase">
                                    {displayRole}
                                </span>
                            </div>

                            {/* User Avatar */}
                            <Link to="/profile" className="relative group cursor-pointer transition-transform hover:scale-105 outline-none rounded-full focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900">
                                {profilePhoto ? (
                                    <img
                                        src={profilePhoto}
                                        alt="Profile"
                                        className="h-10 w-10 rounded-full border-2 border-indigo-100 dark:border-indigo-900 object-cover shadow-sm group-hover:border-indigo-400 dark:group-hover:border-indigo-500 transition-colors"
                                    />
                                ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-indigo-100 dark:border-indigo-900 bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-sm group-hover:from-indigo-400 group-hover:to-purple-500 transition-all">
                                        {(displayName || displayRole || 'U').trim().charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </Link>

                            {/* Logout Action */}
                            <button 
                                onClick={handleLogout} 
                                className="group ml-1 flex items-center justify-center rounded-xl bg-rose-50 p-2 text-rose-600 transition-all duration-200 hover:bg-rose-100 hover:text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 dark:hover:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                                aria-label="Logout"
                                title="Logout"
                            >
                                <LogOut className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
                                <span className="hidden sm:inline pl-1 text-sm font-medium">Logout</span>
                            </button>
                        </>
                    ) : (
                        <>
                            {location.pathname !== '/' && (
                                <Link to="/" className="flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                                    <Home className="h-4 w-4" />
                                    <span className="hidden sm:inline">Home</span>
                                </Link>
                            )}

                            {location.pathname !== '/login' && (
                                <Link to="/login" className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-md hover:shadow-indigo-300 dark:shadow-none dark:hover:bg-indigo-500 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900">
                                    <LogIn className="h-4 w-4" />
                                    <span>Sign in</span>
                                </Link>
                            )}
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navigation;