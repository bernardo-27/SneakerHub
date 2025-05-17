// Footer.jsx

import "../../styles/footer.css"

import React from "react";

export default function Footer() {
  return (
    <footer className="footer-section">
      <div className="container">
        <div className="row">
          <div className="col-md-4">
            <h5>AGENCY</h5>
            <p>Ilocos Sur Polytechnic State College,<br />Quirino, Tagudin,<br />Ilocos Sur.</p>
            <p><strong>(612) 772-9555</strong></p>
          </div>
          <div className="col-md-4">
            <h5>SITEMAP</h5>
            <ul className="list-unstyled">
              <li><a href="#home">Home</a></li>
              <li><a href="#about">About Us</a></li>
              <li><a href="#contact">Contact Us</a></li>
            </ul>
          </div>
          <div className="col-md-4">
            <h5>Want more about our Shop?</h5>
            <input type="email" className="newsletter-input" placeholder="Your Message" />
            <input type="submit" className="submit" />
          </div>
        </div>
      </div>
      <div className="copyright text-center">
        <p className="mb-0">&copy; 2025 SneakerHub. All rights reserved.</p>
        <p>
          <a href="#" className="mx-2 text-decoration-none">Privacy Policy</a> |
          <a href="#" className="mx-2 text-decoration-none">Terms of Service</a>
        </p>
      </div>
    </footer>
  );
}
