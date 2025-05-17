import "../../styles/signup.css";

import Swal from 'sweetalert2';
import { useState } from "react";

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
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePassword = (field) => {
    if (field === "password") {
      setPasswordVisible(!passwordVisible);
    } else {
      setConfirmPasswordVisible(!confirmPasswordVisible);
    }
  };

  const validatePassword = (password) => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(password)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);

    // Form validation
    const validationErrors = [];
    
    if (formData.password !== formData.confirmPassword) {
      validationErrors.push("Passwords do not match.");
    }

    if (!validatePassword(formData.password)) {
      validationErrors.push(
        "Password must be at least 8 characters long, contain an uppercase letter, a number, and a special character."
      );
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    // Remove confirmPassword before sending to API
    const { confirmPassword, ...dataToSend } = formData;

    try {
      const response = await fetch("http://localhost:3000/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });
    
      if (response.ok) {
        const result = await response.json();
        
        localStorage.setItem("user_email", formData.email);
        
        Swal.fire({
          icon: 'success',
          title: 'Registration Successful',
          text: 'Redirecting to login page...',
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          window.location.href = "/login";
        });
      } else {
        const result = await response.json();
        const errorMessage = result.message || "Registration failed.";
        setErrors([errorMessage]);
    
        Swal.fire({
          icon: 'error',
          title: 'Registration Failed',
          text: errorMessage,
        });
      }
    } catch (error) {
      const errMessage = "Network error, please try again later.";
      setErrors([errMessage]);
    
      Swal.fire({
        icon: 'error',
        title: 'Network Error',
        text: errMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100">
      <div className="container custom-container">
        <div className="row justify-content-center">
          <div className="col-md-9">
            <div className="card shadow">
              <div className="row g-0">
                {/* Left side image */}
                <div className="col-md-6 bg-warning d-flex align-items-center justify-content-center">
                  <img src="/src/assets/images/sneak.png" alt="Nike shoe" className="img-fluid p-4" />
                </div>
                
                {/* Right side form */}
                <div className="col-md-6 bg-white p-4">
                  <div className="text-center mb-4">
                    <h2 className="text-warning fw-bold">Create Your Account</h2>
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label className="form-label">First Name</label>
                      <input 
                        type="text" 
                        name="fname" 
                        maxLength={50}
                        className="form-control" 
                        value={formData.fname}
                        onChange={handleChange}
                        placeholder="Pedro"
                        required 
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Last Name</label>
                      <input 
                        type="text" 
                        name="lname" 
                        maxLength={50}
                        className="form-control" 
                        value={formData.lname}
                        onChange={handleChange}
                        placeholder="Penduko"
                        required 
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <input 
                        type="email" 
                        name="email" 
                        maxLength={50}
                        className="form-control" 
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="pedro@gmail.com"
                        required 
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Phone Number</label>
                      <input 
                        type="tel" 
                        name="phone" 
                        maxLength={11}
                        className="form-control" 
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="09123456789"
                        required 
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">
                        Password
                        <span 
                          title="Password must be at least 8 characters, contain an uppercase letter, a number, and a special character."
                          className="ms-1 text-info"
                        >
                          ℹ️
                        </span>
                      </label>
                      <div className="input-group">
                        <input 
                          type={passwordVisible ? "text" : "password"} 
                          name="password" 
                          className="form-control" 
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="********"
                          required 
                        />
                        <button 
                          className="btn btn-outline-secondary" 
                          type="button"
                          onClick={() => togglePassword("password")}
                        >
                          {passwordVisible ? "🙈" : "👁️"}
                        </button>
                      </div>
                    </div>
                
                    <div className="mb-3">
                      <label className="form-label">Confirm Password:</label>
                      <div className="input-group">
                        <input 
                          type={confirmPasswordVisible ? "text" : "password"} 
                          name="confirmPassword" 
                          className="form-control" 
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="********"
                          required 
                        />
                        <button 
                          className="btn btn-outline-secondary" 
                          type="button"
                          onClick={() => togglePassword("confirmPassword")}
                        >
                          {confirmPasswordVisible ? "🙈" : "👁️"}
                        </button>
                      </div>
                    </div>

                    {errors.length > 0 && (
                      <div className="alert alert-danger">
                        {errors.map((error, index) => (
                          <p key={index} className="mb-0">
                            {error}
                          </p>
                        ))}
                      </div>
                    )}

                    <div className="d-grid gap-2 mb-3">
                      <button 
                        type="submit" 
                        className="btn btn-warning text-white fw-bold rounded-pill"
                        disabled={loading}
                      >
                        {loading ? 'Processing...' : 'Register'}
                      </button>
                    </div>

                    <div className="text-center">
                      <p className="mb-0">
                        Already have an account? <a href="/login" className="text-warning fw-bold">Login here</a>
                      </p>
                    </div>

                    {/* Social Login with divider */}
                    <div className="position-relative my-4">
                      <hr />
                      <span className="position-absolute top-50 start-50 translate-middle px-3 bg-white text-muted">or</span>
                    </div>

                    <div className="d-grid gap-2">
                      <a href="#" className="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2 rounded-pill">
                        <i className="fab fa-google text-danger"></i>
                        <span>Continue with Google</span>
                      </a>
                      <a href="#" className="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2 rounded-pill">
                        <i className="fab fa-facebook text-primary"></i>
                        <span>Continue with Facebook</span>
                      </a>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;