import "../styles/navbar.css";

import React, { useState } from "react";

import logo from "../assets/images/shoes/Sneaker.jpg"; // Replace with your logo path

const Navbar = () => {
  const [activeLink, setActiveLink] = useState("#home");

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container">
        {/* Logo */}
        <a
          className="navbar-brand d-flex align-items-center"
          href="#home"
          onClick={() => setActiveLink("#home")}>
          <img src={logo} alt="SneakerHub Logo" className="nav-logo h-25 rounded" />
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
                className={`nav-link ${activeLink === "#developers" ? "active" : ""}`}
                href="#developers"
                onClick={() => setActiveLink("#developers")}
              >
                Contact
              </a>
            </li>
          </ul>

          {/* Login & Signup Buttons */}
          <div className="d-flex">
            <button className="btn btn-outline-primary me-2" onClick={() => window.location.href = "/login"}>
              Login
            </button>
            <button className="btn btn-primary me-2" onClick={() => window.location.href = "/signup"}>
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
