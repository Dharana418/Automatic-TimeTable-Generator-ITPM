import { useState } from "react";
import { Link } from "react-router-dom";
import sliitLogo from "../src/assets/SLIIT_LOGO.png";

const Register = ({ apiBase, onAuthSuccess }) => {
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        address: "",
        birthday: "",
        phonenumber: "",
        role: "",
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");
        try {
            const response = await fetch(`${apiBase}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(form),
            });
            if (response.ok) {
                const data = await response.json();
                setSuccess("Account created. You are signed in.");
                onAuthSuccess?.(data.user ?? null);
            } else {
                const errorData = await response.json();
                setError(errorData.error || "Registration failed");
            }
        } catch (err) {
            console.error(err);
            setError("An error occurred during registration");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-card">
            <div className="auth-card__header">
                <img className="auth-logo" src={sliitLogo} alt="SLIIT logo" />
                <h2>Create your account</h2>
                <p>Bring your department, rooms, and subjects into one view.</p>
            </div>
            {error ? <div className="form-error">{error}</div> : null}
            {success ? <div className="form-success">{success}</div> : null}
            <form className="auth-form" onSubmit={handleSubmit}>
                <label className="form-field">
                    <span>Full name</span>
                    <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        placeholder="Amina Patel"
                    />
                </label>
                <label className="form-field">
                    <span>Email address</span>
                    <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        placeholder="amina@academy.edu"
                    />
                </label>
                <label className="form-field">
                    <span>Password</span>
                    <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                        placeholder="Create a password"
                    />
                </label>
                <label className="form-field">
                    <span>Role</span>
                    <select name="role" value={form.role} onChange={handleChange}>
                        <option value="">Select a role</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                        <option value="student">Student</option>
                    </select>
                </label>
                <label className="form-field">
                    <span>Phone number</span>
                    <input
                        type="tel"
                        name="phonenumber"
                        value={form.phonenumber}
                        onChange={handleChange}
                        placeholder="+1 555 0199"
                    />
                </label>
                <label className="form-field">
                    <span>Date of birth</span>
                    <input
                        type="date"
                        name="birthday"
                        value={form.birthday}
                        onChange={handleChange}
                    />
                </label>
                <label className="form-field form-field--wide">
                    <span>Address</span>
                    <input
                        type="text"
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        placeholder="School Street, Campus District"
                    />
                </label>
                <button className="form-submit" type="submit" disabled={loading}>
                    {loading ? "Creating account..." : "Register"}
                </button>
            </form>
            <div className="form-footer">
                <span>Already registered?</span>
                <Link to="/login">Go to login</Link>
            </div>
        </div>
    );
};

export default Register;
