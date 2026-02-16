import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "../LoginandRegistration/Login.jsx";
import Register from "../LoginandRegistration/Register.jsx";
import "../LoginandRegistration/auth.css";
import sliitPng from "./assets/Sliit.png";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
    const [user, setUser] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const handleAuthSuccess = (nextUser) => {
        setUser(nextUser ?? null);
        setError("");
    };

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/auth/me`, {
                    method: "GET",
                    credentials: "include",
                });
                if (response.ok) {
                    const data = await response.json();
                    setUser(data.user ?? null);
                    setError("");
                } else {
                    setUser(null);
                }
            } catch (err) {
                console.error(err);
                setError("Failed to fetch user");
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }


    return (
        <Router>
            <div className="auth-shell">
                <aside className="auth-hero">
                    <img className="hero-image" src={sliitPng} alt="SLIIT" />
                    <div className="hero-eyebrow">Timetable Generator</div>
                    <h1>Structure the week before it starts.</h1>
                    <p>
                        Design balanced schedules in minutes, keep classrooms aligned, and
                        stay flexible when plans change.
                    </p>
                    <div className="hero-status">
                        <span>Status</span>
                        <strong>
                            {loading
                                ? "Checking session..."
                                : user
                                    ? `Signed in as ${user.name}`
                                    : "Not signed in"}
                        </strong>
                    </div>
                    {error ? <div className="form-error">{error}</div> : null}
                </aside>
                <section className="auth-panel">
                    <Routes>
                        <Route path="/" element={<Navigate to="/login" replace />} />
                        <Route
                            path="/login"
                            element={<Login apiBase={API_BASE} onAuthSuccess={handleAuthSuccess} />}
                        />
                        <Route
                            path="/register"
                            element={<Register apiBase={API_BASE} onAuthSuccess={handleAuthSuccess} />}
                        />
                    </Routes>
                </section>
            </div>
        </Router>
    );
}


export default App;