import { Link, useLocation } from 'react-router-dom';
import autoschedule from '../../Home/autoschedule-logo.png';
import './Navigation.css';

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
        <nav className="navigation">
            <div className="nav-brand">
                <Link to="/" className="nav-brand-link">
                    <h2>SLIIT Timetable Generator</h2>
                    <img src={autoschedule} alt="AutoScheduler Logo" className="nav-logo" />
                </Link>
            </div>
            <div className="nav-links">
                {isAuthenticated && (
                    <>
                        <span className="nav-user">{user?.username}</span>
                        {location.pathname !== '/dashboard' && (
                            <Link to="/dashboard" className="nav-btn dashboard-btn">Dashboard</Link>
                        )}
                        <button onClick={handleLogout} className="nav-btn logout-btn">Logout</button>
                    </>
                )}
                {!isAuthenticated && (
                    <>
                        {location.pathname !== '/' && (
                            <Link to="/" className="nav-btn home-btn">Home</Link>
                        )}
                        {location.pathname !== '/login' && (
                            <Link to="/login" className="nav-btn login-btn">Login</Link>
                        )}
                        {location.pathname !== '/register' && (
                            <Link to="/register" className="nav-btn register-btn">Register</Link>
                        )}
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navigation;
