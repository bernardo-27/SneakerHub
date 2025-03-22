import "../styles/signup.css";

// import Sneaker from "../assets/images/Sneaker.jpg";
import { useState } from "react";

const Login = () => {
  const [email, setEmail] = useState(localStorage.getItem("user_email") || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulated login logic
    console.log("Logging in with", email, password);
    localStorage.setItem("user_email", email); // Remember email
  };

  return (
    <div className="parent-container">
    <div className="form-container">
      {/* <img src={Sneaker} alt="SneakerHub Logo" className="logo" /> */}
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input 
            type="email" 
            id="email" 
            placeholder="Email" 
            required 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <div className="password-wrapper">
            <input 
              type={showPassword ? "text" : "password"} 
              id="password" 
              placeholder="Enter your password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
            <span 
              className="toggle-password" 
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>
        </div>

        <div className="options">
          <a href="#" className="forgot-password">Forgot Password?</a>
        </div>

        <button type="submit" className="login-button">Login</button>
      </form>
      <p>Don't have an account? <a onClick={() => window.location.href = "/signup"} className="link-a">Sign Up here</a></p>
    </div>
    </div>
  );
};

export default Login;
