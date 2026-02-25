import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./register.css";
import sliitLogo from "../src/assets/SLIIT_LOGO.png";

const Register = ({ apiBase }) => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    address: "",
    birthday: "",
    phonenumber: "",
    role: "",
  });

  const [loading, setLoading] = useState(false);

  // Age validation helper - check if user is at least 18 years old
  const validateAge = (birthday) => {
    if (!birthday) return true; // If no birthday is provided, validation passes (handle in required field)
    
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Adjust age if birthday hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age >= 18;
  };

  // Password validation helper
  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) {
      errors.push('at least 8 characters');
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('one lowercase letter');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('one uppercase letter');
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push('one number');
    }
    if (!/(?=.*[@$!%*?&#])/.test(password)) {
      errors.push('one special character (@$!%*?&#)');
    }
    return errors;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    // Validate age - must be at least 18 years old
    if (!validateAge(form.birthday)) {
      setLoading(false);
      return Swal.fire(
        "Age Requirement",
        "You must be at least 18 years old to register",
        "error"
      );
    }

    // Validate passwords match
    if (form.password !== form.confirmPassword) {
      setLoading(false);
      return Swal.fire("Error", "Passwords do not match", "error");
    }

    // Validate password strength
    const passwordErrors = validatePassword(form.password);
    if (passwordErrors.length > 0) {
      setLoading(false);
      return Swal.fire({
        icon: "error",
        title: "Weak Password",
        html: `Password must contain:<br/>• ${passwordErrors.join('<br/>• ')}`,
      });
    }

    try {
      const response = await fetch(`${apiBase}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Registration Successful 🎉",
          text: "You can now log in with your account",
          confirmButtonText: "Go to Login",
        }).then(() => navigate("/login"));
      } else {
        Swal.fire(
          "Registration Failed",
          data.error || "Something went wrong",
          "error"
        );
      }
    } catch (error) {
      console.error(error);
      Swal.fire(
        "Error",
        "Server error. Please try again later.",
        "error"
      );
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

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>Full name</span>
          <input
            type="text"
            name="username"
            value={form.username}
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
          <span>Confirm Password</span>
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            placeholder="Confirm your password"
          />
        </label>

        <label className="form-field">
          <span>Role</span>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            required
          >
            <option value="">Select a role</option>
            <option value="Faculty Coordinator">Faculty Coordinator</option>
            <option value="LIC">LIC</option>
            <option value="Academic Coordinator">Academic Coordinator</option>
            <option value="Instructor">Instructor</option>
            <option value="Lecturer/Senior Lecturer">Lecturer/Senior Lecturer</option>
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
            required
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
