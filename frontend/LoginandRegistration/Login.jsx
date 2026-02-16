import { useState } from "react";
import { Link } from "react-router-dom";
import sliitLogo from "../src/assets/SLIIT_LOGO.png";

const Login = ({ apiBase, onAuthSuccess }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        try {
            const response = await fetch(`${apiBase}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email, password }),
            });
            if (response.ok) {
                const data = await response.json();
                setError("");
                onAuthSuccess?.(data.user ?? null);
            } else {
                const errorData = await response.json();
                setError(errorData.error || "Login failed");
            }
        } catch (err) {
            console.error(err);
            setError("An error occurred during login");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-card">
            <div className="auth-card__header">
                <img className="auth-logo" src={sliitLogo} alt="SLIIT logo" />
                <h2>Sign back in</h2>
                <p>Pick up where your last timetable left off.</p>
            </div>
            {error ? <div className="form-error">{error}</div> : null}
            <form className="auth-form" onSubmit={handleSubmit}>
                <label className="form-field">
                    <span>Email address</span>
                    <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        placeholder="teacher@academy.edu"
                    />
                </label>
                <label className="form-field">
                    <span>Password</span>
                    <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        placeholder="Enter your password"
                    />
                </label>
                <button className="form-submit" type="submit" disabled={loading}>
                    {loading ? "Signing in..." : "Login"}
                </button>
            </form>
            <div className="form-footer">
                <span>New here?</span>
                <Link to="/register">Create an account</Link>
            </div>
        </div>
    );
};

export default Login;