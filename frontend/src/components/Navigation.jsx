import { Link, useLocation } from 'react-router-dom';
import autoschedule from '../assets/SLIIT_LOGO.png';

const Navigation = ({ isAuthenticated, user, apiBase = "http://localhost:5000", theme = 'light', onToggleTheme }) => {
    const location = useLocation();

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
                <Link to="/" className="flex items-center gap-3 no-underline">
                    <img src={autoschedule} alt="SLIIT Logo" className="h-9 w-auto rounded-md ring-1 ring-slate-300/60 md:h-10" />
                            <h2 className="m-0 select-none bg-gradient-to-r from-indigo-100 via-blue-100 to-slate-100 bg-clip-text text-lg font-bold text-transparent md:text-xl">SLIIT Timetable</h2>
                </Link>

            <div className="flex items-center gap-1.5 md:gap-2">

                {isAuthenticated ? (
                    <>
                        {location.pathname !== '/dashboard' && (
                            <Link to="/dashboard" className={`${navBtnNeutral} md:w-24`}>Dashboard</Link>
                        )}

                        {user?.role === 'Faculty Coordinator' && location.pathname !== '/scheduler' && (
                            <Link to="/scheduler" className={`${navBtnNeutral} md:w-24`}>Scheduler</Link>
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