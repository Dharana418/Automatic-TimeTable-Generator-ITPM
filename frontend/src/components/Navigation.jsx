import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import autoschedule from '../assets/SLIIT_LOGO.png';
import { LogOut, LayoutDashboard, User, Calendar, LogIn, Home, Clock3, GraduationCap } from 'lucide-react';

const Navigation = ({ isAuthenticated, user, apiBase = "http://localhost:5000", hasFixedSidebarOffset = false }) => {
    const location = useLocation();
    const [logoHighlighted, setLogoHighlighted] = useState(false);
    const [showTagline, setShowTagline] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setLogoHighlighted(true);
        }, 10);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowTagline(true);
        }, 10000);

        return () => clearTimeout(timer);
    }, []);

    const displayName = user?.name || user?.username || '';
    const displayRole = user?.role || '';
    const shouldShowName = Boolean(displayName);
    const profilePhoto = user?.profilePhoto || null;

    const navBtnBase = 'inline-flex items-center justify-center rounded-lg border px-3 py-2 text-xs font-semibold tracking-wide transition duration-200';
    const navBtnNeutral = `${navBtnBase} border-slate-300/90 bg-white/90 text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700`;
    const navBtnPrimary = `${navBtnBase} border-blue-300/80 bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 text-white shadow-[0_10px_20px_rgba(30,64,175,0.28)] hover:-translate-y-0.5 hover:brightness-110`;
    const navBtnDanger = `${navBtnBase} border-rose-300/80 bg-gradient-to-r from-rose-600 to-red-700 text-white shadow-[0_10px_20px_rgba(190,24,93,0.28)] hover:-translate-y-0.5 hover:brightness-110`;

    const handleLogout = async () => {
        if (isLoggingOut) {
            return;
        }

        setIsLoggingOut(true);

        try {
            const response = await fetch(`${apiBase}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            if (response.ok) {
                // Clear any local storage data
                localStorage.clear();
                sessionStorage.clear();

                await Swal.fire({
                    icon: 'success',
                    title: 'Logged out',
                    text: 'You have been logged out successfully.',
                    timer: 1200,
                    showConfirmButton: false,
                    confirmButtonColor: '#2563eb',
                });
                
                // Redirect to home page
                window.location.href = '/';
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('Logout failed:', errorData);
                await Swal.fire({
                    icon: 'error',
                    title: 'Logout failed',
                    text: 'Please try again.',
                    confirmButtonColor: '#2563eb',
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
            await Swal.fire({
                icon: 'error',
                title: 'Logout failed',
                text: 'An error occurred during logout. Please try again.',
                confirmButtonColor: '#2563eb',
            });
        } finally {
            setIsLoggingOut(false);
        }
    };

    const requestLogoutConfirmation = async () => {
        if (isLoggingOut) {
            return;
        }

        const result = await Swal.fire({
            icon: 'warning',
            title: 'Are you sure?',
            text: 'Do you want to logout now?',
            showCancelButton: true,
            confirmButtonText: 'Yes, logout',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#64748b',
        });

        if (!result.isConfirmed) {
            return;
        }

        handleLogout();
    };
    
    const shouldOffsetForSidebar = hasFixedSidebarOffset && (
        location.pathname === '/dashboard'
        || location.pathname.startsWith('/faculty')
        || location.pathname.startsWith('/scheduler')
        || location.pathname.startsWith('/academic')
        || location.pathname.startsWith('/admin')
    );

    return (
        <nav className={`sticky top-0 z-50 border-b border-slate-700/70 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white shadow-[0_10px_30px_rgba(2,6,23,0.45)] ${shouldOffsetForSidebar ? 'lg:pl-[260px]' : ''}`}>
            <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
                {/* Brand / Logo Area */}
                <Link to="/" className="group flex items-center gap-3 no-underline transition-transform hover:scale-105 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg">
                    <img 
                        src={autoschedule} 
                        alt="SLIIT Logo" 
                        className="h-10 w-auto object-contain drop-shadow-sm transition-all duration-300 group-hover:brightness-110" 
                    />
                    <div className="hidden sm:flex sm:flex-col">
                        <h2 className="m-0 text-xl font-extrabold tracking-tight text-white">
                            SLIIT Scheduler
                        </h2>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide text-cyan-200/95">
                            <GraduationCap className="h-3.5 w-3.5" />
                            Academic Timetable Intelligence
                        </span>
                    </div>
                </Link>

                {/* Navigation and Settings Area */}
                <div className="flex items-center space-x-1 sm:space-x-3">
                    {/* Divider line before auth controls */}
                    <div className="h-6 w-px bg-slate-500/60 mx-1 hidden sm:block"></div>

                    <span className="hidden md:inline-flex items-center gap-1 rounded-full border border-cyan-300/50 bg-cyan-300/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-cyan-100">
                        <Clock3 className="h-3.5 w-3.5" />
                        Live Planner
                    </span>

                    {isAuthenticated ? (
                        <>
                            {/* Navigation Links Group */}
                            <div className="flex space-x-1 md:space-x-2">
                                {location.pathname !== '/dashboard' && (
                                    <Link to="/dashboard" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-blue-50 transition-all duration-200 hover:bg-blue-100/20 hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-blue-200">
                                        <LayoutDashboard className="h-4 w-4" />
                                        <span className="hidden md:inline">Dashboard</span>
                                    </Link>
                                )}

                                {location.pathname !== '/profile' && (
                                    <Link to="/profile" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-blue-50 transition-all duration-200 hover:bg-blue-100/20 hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-blue-200">
                                        <User className="h-4 w-4" />
                                        <span className="hidden md:inline">Profile</span>
                                    </Link>
                                )}

                                {user?.role === 'Faculty Coordinator' && location.pathname !== '/scheduler' && (
                                    <Link to="/scheduler" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-blue-50 transition-all duration-200 hover:bg-blue-100/20 hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-blue-200">
                                        <Calendar className="h-4 w-4" />
                                        <span className="hidden md:inline">Scheduler</span>
                                    </Link>
                                )}
                            </div>

                            {/* Divider line before avatar */}
                            <div className="h-6 w-px bg-slate-500/60 mx-1 hidden sm:block"></div>

                            {/* User Profile Info */}
                            <div className="hidden lg:flex flex-col items-end justify-center mr-2">
                                {shouldShowName && (
                                    <span className="text-sm font-bold text-white leading-tight">
                                        {displayName}
                                    </span>
                                )}
                                <span className="text-xs font-semibold tracking-wide text-blue-100 uppercase">
                                    {displayRole}
                                </span>
                            </div>

                            {/* User Avatar */}
                            <Link to="/profile" className="relative group cursor-pointer transition-transform hover:scale-105 outline-none rounded-full focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2">
                                {profilePhoto ? (
                                    <img
                                        src={profilePhoto}
                                        alt="Profile"
                                        className="h-10 w-10 rounded-full border-2 border-blue-200 object-cover shadow-sm group-hover:border-blue-100 transition-colors"
                                    />
                                ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-blue-200 bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-bold text-white shadow-sm group-hover:from-blue-400 group-hover:to-blue-600 transition-all">
                                        {(displayName || displayRole || 'U').trim().charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </Link>

                            {/* Logout Action */}
                            <button
                                onClick={handleLogout} 
                                className="group ml-1 flex items-center justify-center rounded-xl bg-white/10 p-2 text-white transition-all duration-200 hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-2"
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
                                <Link to="/" className="flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-blue-50 transition-all duration-200 hover:bg-blue-100/20 hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-blue-200">
                                    <Home className="h-4 w-4" />
                                    <span className="hidden sm:inline">Home</span>
                                </Link>
                            )}

                            {location.pathname !== '/login' && (
                                <Link
                                    to="/login"
                                    className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl border border-blue-100/80 bg-white px-4 py-2 text-sm font-bold text-blue-700 shadow-[0_8px_18px_rgba(15,23,42,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,23,42,0.24)] hover:border-white outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2"
                                >
                                    <span className="absolute inset-0 bg-gradient-to-r from-blue-50 via-white to-blue-100 opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden />
                                    <span className="absolute -left-12 top-0 h-full w-10 -skew-x-12 bg-white/70 blur-[1px] transition-transform duration-700 group-hover:translate-x-44" aria-hidden />
                                    <span className="relative inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-sm">
                                        <LogIn className="h-3.5 w-3.5" />
                                    </span>
                                    <span className="relative tracking-wide">Sign in</span>
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