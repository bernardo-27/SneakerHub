import "../styles/signup.css";

import React, { useState } from "react";

const Signup = () => {
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState([]);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  // Handle form field changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Toggle password visibility
  const togglePassword = (field) => {
    if (field === "password") {
      setPasswordVisible(!passwordVisible);
    } else {
      setConfirmPasswordVisible(!confirmPasswordVisible);
    }
  };

  // Password validation
  const validatePassword = (password) => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(password)
    );
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);

    if (formData.password !== formData.confirmPassword) {
      setErrors(["Passwords do not match."]);
      return;
    }

    if (!validatePassword(formData.password)) {
      setErrors([
        "Password must be at least 8 characters long, contain an uppercase letter, a number, and a special character.",
      ]);
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrors([result.message || "Registration failed."]);
      } else {
        alert("Registration successful!");
        // Redirect to login or another page
      }
    } catch (error) {
      setErrors(["Network error, please try again later."]);
    }
  };

  return (
    <div className="parent-container">
      <div className="form-container">
        <h2>Create Your Account</h2>

        {errors.length > 0 && (
          <div className="error-messages">
            {errors.map((error, index) => (
              <p key={index} className="error">
                {error}
              </p>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label>First Name</label>
          <input type="text" name="fname" required onChange={handleChange} />

          <label>Last Name</label>
          <input type="text" name="lname" required onChange={handleChange} />

          <label>Email</label>
          <input type="email" name="email" required onChange={handleChange} />

          <label>Phone Number</label>
          <input type="tel" name="phone" required onChange={handleChange} />

          <label>Password</label>
          <div className="password-wrapper">
            <input
              type={passwordVisible ? "text" : "password"}
              name="password"
              required
              onChange={handleChange}
            />
            <span
              className="toggle-password"
              onClick={() => togglePassword("password")}
            >
              {passwordVisible ? "🙈" : "👁️"}
            </span>
          </div>

          <p className="guide">
            Password must be at least 8 characters, contain an uppercase letter,
            a number, and a special character.
          </p>

          <label>Confirm Password</label>
          <div className="password-wrapper">
            <input
              type={confirmPasswordVisible ? "text" : "password"}
              name="confirmPassword"
              required
              onChange={handleChange}
            />
            <span
              className="toggle-password"
              onClick={() => togglePassword("confirmPassword")}
            >
              {confirmPasswordVisible ? "" : ""}
            </span>
          </div>

          <button type="submit" className="signup-button">
            Register
          </button>

          <p>
            Already have an account? <a href="/login">Login here</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
