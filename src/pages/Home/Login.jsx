import "../../styles/signup.css";

import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { useState } from "react";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: localStorage.getItem("user_email") || "",
    password: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.email || !formData.password) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    setError(""); // clear previous error
    
    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Login response:", data); // Debug log
        
        // Store authentication data
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("user_email", formData.email);
        localStorage.setItem("user_info", JSON.stringify(data.user));
        
        // Debug log to verify role storage
        console.log("Stored role:", localStorage.getItem("role"));
        
        Swal.fire({
          icon: 'success',
          title: 'Login Successful',
          text: 'Redirecting to your dashboard...',
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          // Debug log before navigation
          console.log("Navigating with role:", data.role);
          
          if (data.role === 'admin') {
            console.log("Redirecting to admin dashboard");
            window.location.href = '/admin/admindashboard';
          } else {
            console.log("Redirecting to user dashboard");
            window.location.href = '/dashboard';
          }
        });
      } else {
        const errorData = await response.json();
        console.error("Login failed:", errorData); // Debug log
        Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: errorData.message || 'Invalid email or password.'
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Connection error. Please check your internet and try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
<div className="d-flex align-items-center justify-content-center min-vh-100 login-container">
      <div className="card shadow-lg rounded-4 overflow-hidden w-100" style={{ maxWidth: "900px" }}>
        <div className="row g-0">
          {/* Left side image */}
          <div className="col-md-6 bg-warning d-flex align-items-center justify-content-center">
            <img
              src="/src/assets/images/sneak.png"
              alt="Nike shoe"
              className="img-fluid p-4"
              style={{ maxHeight: "100%", objectFit: "contain" }}
            />
          </div>

          {/* Right side form */}
          <div className="col-md-6 p-4 d-flex flex-column justify-content-between">
            <div>
              <h2 className="text-warning text-center fw-bold mb-4">Login</h2>

              {error && <div className="alert alert-danger text-center">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="input-group mb-3 border-bottom">
                  <span className="input-group-text bg-white border-0">
                    <i className="fas fa-user text-secondary"></i>
                  </span>
                  <input
                    type="email"
                    name="email"
                    className="form-control border-0"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group mb-3 border-bottom">
                  <span className="input-group-text bg-white border-0">
                    <i className="fas fa-lock text-secondary"></i>
                  </span>
                  <input
                    type="password"
                    name="password"
                    className="form-control border-0"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="d-flex justify-content-between mb-3">
                  <a href="#" className="text-primary fw-bold small text-decoration-none">
                    Forgot Password?
                  </a>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-warning text-white fw-bold w-100 rounded-pill"
                  disabled={loading}
                >
                  {loading ? 'LOGGING IN...' : 'LOGIN'}
                </button>
              </form>

              <div className="d-flex align-items-center my-4">
                <div className="flex-grow-1 border-top"></div>
                <span className="px-3 text-muted small">or</span>
                <div className="flex-grow-1 border-top"></div>
              </div>

              <div className="d-grid gap-2">
<a 
  href="#" 
  className="btn btn-outline-secondary btn-social-warning d-flex align-items-center justify-content-center gap-2 rounded-pill"
>
  <i className="fab fa-google text-danger"></i>
  <span>Continue with Google</span>
</a>

<a 
  href="#" 
  className="btn btn-outline-secondary btn-social-warning d-flex align-items-center justify-content-center gap-2 rounded-pill"
>
  <i className="fab fa-facebook text-primary"></i>
  <span>Continue with Facebook</span>
</a>
              </div>
            </div>

            <div className="mt-4 text-center small text-black">
              Don't have an account?{" "}
              <a href="/signup" className="text-warning fw-semibold text-decoration-none">
                Sign up here
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;