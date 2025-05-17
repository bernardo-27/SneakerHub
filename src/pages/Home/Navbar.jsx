import "../../styles/navbar.css";

import React, { useState, useEffect } from "react";

import logo from "../../assets/images/shoes/Sneaker.jpg";
import Swal from 'sweetalert2';

const Navbar = () => {
  const [activeLink, setActiveLink] = useState("#home");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    setIsAuthenticated(!!token);
    setUserRole(role);
  }, []);

  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You will be logged out of your account",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, logout'
    }).then((result) => {
      if (result.isConfirmed) {
        // Clear all authentication data
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('user_email');
        localStorage.removeItem('user_info');
        
        // Update state
        setIsAuthenticated(false);
        setUserRole(null);

        // Show success message
        Swal.fire({
          icon: 'success',
          title: 'Logged Out',
          text: 'You have been successfully logged out',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          // Redirect to home page
          window.location.href = '/';
        });
      }
    });
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container">
        {/* Logo */}
        <a
          className="navbar-brand d-flex align-items-center"
          href="#home"
          onClick={() => setActiveLink("#home")}
        >
          <img
            src={logo}
            alt="SneakerHub Logo"
            className="nav-logo h-25 rounded"
          />
          SneakerHub
        </a>

        {/* Toggle Button for Mobile */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navigation Links */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <a
                className={`nav-link ${activeLink === "#home" ? "active" : ""}`}
                href="#home"
                onClick={() => setActiveLink("#home")}
              >
                Home
              </a>
            </li>
            <li className="nav-item">
              <a
                className={`nav-link ${activeLink === "#about" ? "active" : ""}`}
                href="#about"
                onClick={() => setActiveLink("#about")}
              >
                About
              </a>
            </li>
            <li className="nav-item">
              <a
                className={`nav-link ${activeLink === "#products" ? "active" : ""}`}
                href="#products"
                onClick={() => setActiveLink("#products")}
              >
                Products
              </a>
            </li>
            <li className="nav-item">
              <a
                className={`nav-link ${activeLink === "#contact" ? "active" : ""}`}
                href="#contact"
                onClick={() => setActiveLink("#contact")}
              >
                Contact
              </a>
            </li>
          </ul>

          {/* Authentication Buttons */}
          <div className="d-flex ms-auto">
            {isAuthenticated ? (
              <>
                <button
                  className="btn btn-outline-primary me-2"
                  onClick={() => window.location.href = userRole === 'admin' ? '/admin' : '/dashboard'}
                >
                  Dashboard
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn btn-outline-primary me-2"
                  onClick={() => (window.location.href = "/login")}
                >
                  Login
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => (window.location.href = "/signup")}
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
