import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import autoschedule from '../assets/SLIIT_LOGO.png';

const Navigation = ({ isAuthenticated, user, apiBase = "http://localhost:5000", theme = 'light', onToggleTheme }) => {
    const location = useLocation();
    const [logoHighlighted, setLogoHighlighted] = useState(false);
    const [showTagline, setShowTagline] = useState(false);

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

    const navBtnBase = 'inline-flex items-center justify-center rounded-lg border px-3 py-2 text-xs font-semibold tracking-wide transition duration-200';
    const navBtnNeutral = `${navBtnBase} border-slate-300/90 bg-white/90 text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700`;
    const navBtnPrimary = `${navBtnBase} border-blue-300/80 bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 text-white shadow-[0_10px_20px_rgba(30,64,175,0.28)] hover:-translate-y-0.5 hover:brightness-110`;
    const navBtnDanger = `${navBtnBase} border-rose-300/80 bg-gradient-to-r from-rose-600 to-red-700 text-white shadow-[0_10px_20px_rgba(190,24,93,0.28)] hover:-translate-y-0.5 hover:brightness-110`;

    const handleLogout = async () => {
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
                
                // Redirect to home page
                setTimeout(() => {
                    window.location.href = '/';
                }, 100);
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('Logout failed:', errorData);
                alert('Logout failed. Please try again.');
            }
        } catch (error) {
            console.error('Logout error:', error);
            alert('An error occurred during logout. Please try again.');
        }
    };
    
    return (
            <nav className="sticky top-0 z-50 border-b border-indigo-300/35 bg-gradient-to-r from-slate-950 via-indigo-900 to-blue-900 px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.34)] sm:px-6 lg:px-12 xl:px-16">
                <div className="mx-auto flex w-full max-w-none items-center justify-between gap-4">
                <Link to="/" className="group flex items-center gap-3 no-underline">
                    <span className={`relative inline-flex rounded-xl border p-1.5 backdrop-blur-sm transition-all duration-500 group-hover:-translate-y-0.5 ${logoHighlighted
                        ? 'border-cyan-200/70 bg-gradient-to-br from-blue-200/25 via-sky-200/15 to-indigo-200/25 shadow-[0_0_0_1px_rgba(191,219,254,0.45),0_0_30px_rgba(56,189,248,0.3),0_12px_24px_rgba(15,23,42,0.42)] ring-1 ring-cyan-200/65'
                        : 'border-white/35 bg-white/10 shadow-[0_8px_18px_rgba(15,23,42,0.35)] ring-1 ring-white/15'
                        }`}>
                        <span className={`absolute inset-0 rounded-xl transition-opacity duration-500 ${logoHighlighted
                            ? 'bg-gradient-to-br from-cyan-200/35 via-blue-100/10 to-indigo-100/30 opacity-100'
                            : 'bg-gradient-to-br from-blue-300/20 via-transparent to-indigo-200/20 opacity-90'
                            }`} aria-hidden />
                        <img src={autoschedule} alt="SLIIT Logo" className="relative h-9 w-auto rounded-lg object-contain md:h-10" />
                    </span>
                    <div className="flex flex-col">
                        <h2 className="m-0 select-none bg-gradient-to-r from-indigo-100 via-blue-100 to-slate-100 bg-clip-text text-lg font-bold tracking-wide text-transparent md:text-xl">SLIIT Timetable</h2>
                        <span
                            className={`origin-left text-[10px] font-semibold tracking-[0.2em] text-cyan-100 transition-all duration-700 ${showTagline ? 'max-h-5 translate-y-0 scale-100 opacity-100' : 'max-h-0 -translate-y-1 scale-95 opacity-0'
                                }`}
                        >
                            DISCOVER YOUR FUTURE
                        </span>
                    </div>
                </Link>

            <div className="flex items-center gap-1.5 md:gap-2">

                {isAuthenticated ? (
                    <>
                        {location.pathname !== '/dashboard' && (
                            <Link to="/dashboard" className={`${navBtnNeutral} md:w-24`}>Dashboard</Link>
                        )}

                        {user?.role === 'Faculty Coordinator' && location.pathname !== '/scheduler/by-year' && (
                            <Link to="/scheduler/by-year" className={`${navBtnPrimary} md:w-28`}>Schedule</Link>
                        )}

                        <button onClick={handleLogout} className={`${navBtnDanger} md:w-20`}>Logout</button>
                    </>
                ) : (
                    <>
                        {location.pathname !== '/' && (
                            <Link to="/" className={`${navBtnPrimary} md:w-20`}>Home</Link>
                        )}

                        {location.pathname !== '/login' && (
                            <Link to="/login" className={`${navBtnPrimary} md:w-20`}>Login</Link>
                        )}
                    </>
                )}
            </div>
            </div>
        </nav >
    );
};

export default Navigation;