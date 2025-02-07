import "bootstrap/dist/css/bootstrap.min.css";
import "./App.scss";

import { Carousel } from "react-bootstrap";
import React from "react";
import logo from "./assets/images/Sneaker.jpg";
import logoanta from "./assets/images/Anta.png";
import logonike from "./assets/images/logo_nike.png";
// images
import sneaker from "./assets/images/Nike.png";

export default function App() {

  return (
    <div>
      {/* Header */}
      <header className="header d-flex justify-content-between align-items-center p-2 ">
        <h1>
          <a href="#home">
            <img className="logo" src={logo} alt="Sneaker Logo" />
          </a>
        </h1>
        <nav>
          <a href="#home" className="nav-link mx-2">
            Home
          </a>
          <a href="#about" className="nav-link mx-2">
            About
          </a>
          <a href="#products" className="nav-link mx-2">
            Products
          </a>
        </nav>
        <div>
          <button className="btn btn-primary mx-1">Log In</button>
          <button className="btn btn-secondary mx-1">Register</button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="home d-flex align-items-center justify-content-center" id="home">
  <Carousel className="w-100">
    {/* Carousel Item 1 */}
    <Carousel.Item>
      <div className="d-flex align-items-center justify-content-center">
        {/* Image on the Left with Flexing Effect */}
        <img
          className="d-block flexing-image"
          src={logoanta}
          alt="Sneaker 1"
          style={{ width: "40%", height: "auto", marginRight: "2rem" }}
        />
        {/* Description on the Right */}
        <div className="text-center" style={{ width: "40%" }}>
          <h3>Premium Sneakers</h3>
          <p>Step into style with our latest collection.</p>
          <a href="#products" className="btn btn-primary btn-lg">
            Shop Now
          </a>
        </div>
      </div>
    </Carousel.Item>

    {/* Carousel Item 2 */}
    <Carousel.Item>
      <div className="d-flex align-items-center justify-content-center">
        {/* Image on the Left with Flexing Effect */}
        <img
          className="d-block flexing-image"
          src={logonike}
          alt="Nike Sneakers"
          style={{ width: "40%", height: "auto", marginRight: "2rem" }}
        />
        {/* Description on the Right */}
        <div className="text-center" style={{ width: "40%" }}>
          <h3>Nike Collection</h3>
          <p>Experience unmatched comfort and performance.</p>
          <a href="#products" className="btn btn-primary btn-lg">
            Explore
          </a>
        </div>
      </div>
    </Carousel.Item>

    {/* Carousel Item 3 */}
    <Carousel.Item>
      <div className="d-flex align-items-center justify-content-center">
        {/* Image on the Left with Flexing Effect */}
        <img
          className="d-block flexing-image"
          src={logoanta}
          alt="Anta Sneakers"
          style={{ width: "40%", height: "auto", marginRight: "2rem" }}
        />
        {/* Description on the Right */}
        <div className="text-center" style={{ width: "40%" }}>
          <h3>Anta Sports</h3>
          <p>Designed for athletes, built for everyone.</p>
          <a href="#products" className="btn btn-primary btn-lg">
            Discover
          </a>
        </div>
      </div>
    </Carousel.Item>
  </Carousel>
</section>




      {/* Products Section */}
      <section className="products container my-4" id="products">
  <h2>Products</h2>

  {/* Anta Products */}
  <div className="row">
    {[
      { image: logoanta, description: "Lightweight sneakers for unmatched comfort during workouts.", price: "89.99" },
      { image: logoanta, description: "Breathable mesh upper with a modern design for an athletic look.", price: "9.99" },
      { image: logoanta, description: "Durable and stylish, perfect for both sports and casual outings.", price: "09.99" },
      { image: logoanta, description: "Advanced traction and cushioning for top-tier performance.", price: "119.99" },
      { image: logoanta, description: "Versatile shoes designed to fit any active lifestyle.", price: "129.99" }
    ].map((item, index) => (
      <div className="col-md-2 mb-4" key={index}>
        <div className="card">
          {/* Anta logo background */}
          <img alt="Anta Logo" className="nike-logo" />
          {/* Product image */}
          <img
            src={item.image}
            className="card-img-top"
            alt={`Anta ${index + 1}`}
          />
          <div className="card-body">
            <h5 className="card-title">Anta {index + 1}</h5>
            <p className="card-text">{item.description}</p>
            <p className="card-text text-muted">Price: {item.price}</p>
            <button className="btn btn-primary">Buy</button>
          </div>
        </div>
      </div>
    ))}
  </div>

  {/* Jordan Products */}
  <div className="row">
    {[
      { image: sneaker, description: "Classic design with premium leather for lasting appeal.", price: "150.00" },
      { image: sneaker, description: "Sleek silhouette with responsive cushioning for active wear.", price: "160.00" },
      { image: sneaker, description: "Iconic colors and superior arch support for comfort.", price: "170.00" },
      { image: sneaker, description: "Engineered for athletes, offering maximum energy return.", price: "180.00" },
      { image: sneaker, description: "Retro-inspired style with modern comfort and durability.", price: "190.00" }
    ].map((item, index) => (
      <div className="col-md-2 mb-4" key={index}>
        <div className="card">
          {/* Nike logo background */}
          <img src={logonike} alt="Nike Logo" className="nike-logo" />
          {/* Product image */}
          <img
            src={item.image}
            className="card-img-top"
            alt={`Jordan ${index + 1}`}
          />
          <div className="card-body">
            <h5 className="card-title">Jordan {index + 1}</h5>
            <p className="card-text">{item.description}</p>
            <p className="card-text text-muted">Price: {item.price}</p>
            <button className="btn btn-primary">Buy</button>
          </div>
        </div>
      </div>
    ))}
  </div>
</section>



{/* Footer */}
<section class="cta-section text-center py-4">
  <div class="container">
      <div class="mt-4">
          <h3 class="dev-title mb-3 fw-bold fst-italic">Developers </h3>
          <div class="row justify-content-center">
              <div class="col-12 col-md-6">
                  <div class=" rounded">
                      <p class="fw-bold fs-4 mb-0">Bernardo F. Catriz Jr.</p>
                      <p class="mail text-primary fs-6 small mb-0">cartribernardo27@gmail.com</p>
                  </div>
              </div>
          </div>
          <div class="row">
              <div class="col-12 col-md-6">
                  <div class=" rounded">
                      <p class="fw-bold fs-4 mb-0">Carlos O. Lopez</p>
                      <p class="mail text-primary fs-6 small mb-0">carlos.ordines.lopez14.gmail.com.com</p>
                  </div>
              </div>
              <div class="col-12 col-md-6">
                  <div class=" rounded">
                      <p class="fw-bold fs-4 mb-0">Fritz M. Pastoral</p>
                      <p class="mail text-primary fs-6 small mb-0">pastoralfritz@gmail.com</p>
                  </div>
              </div>
              <div class="col-12 col-md-6">
                  <div class=" rounded">
                      <p class="fw-bold fs-4 mb-0">Rogeliza Y. Raras</p>
                      <p class="mail text-primary fs-6 small mb-0">jazdalizza@gmail.com</p>
                  </div>
              </div>
              <div class="col-12 col-md-6">
                  <div class=" rounded">
                      <p class="fw-bold fs-4 mb-0">Jannah Mae L. Umayat</p>
                      <p class="mail text-primary fs-6 small mb-0">jannahmaeumayat03@gmail.com</p>
                  </div>
              </div>
              <div class="row justify-content-center">
                  <div class="col-12 col-md-6">
                      <div class="rounded">
                          <p class="fw-bold fs-4 mb-0">Christine Lorence H. Bonifacio</p>
                          <p class="mail text-primary fs-6 small mb-0">lorenceccy@gmail.com</p>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  </div>
</section>






    
    <footer class="footer-section">
    <div class="container">
        <div class="row">
            <div class="col-md-4">
                <h5>AGENCY</h5>
                <p> Ilocos Sur Polytechnic State College,  <br />Quirino, Tagudin, <br /> Ilocos Sur.</p>
                
                <p><strong>(612) 772-9555</strong></p>
            </div>

            <div class="col-md-4">
                <h5>SITEMAP</h5>
                <ul class="list-unstyled">
                    <li><a href="#home">Home</a></li>
                    <li><a href="#">About Us</a></li>
                    <li><a href="#">Contact Us</a></li>
                </ul>
            </div>

            <div class="col-md-4">
                <h5>Want's more about out Shop</h5>
                <input type="email" class="newsletter-input" placeholder="Your Message"></input>
                <input type="submit" className="submit"/>
            </div>
        </div>
    </div>
</footer>

      {/* Copyright Section */}
      <div className=" copyright text-center">
        <p className="mb-0">&copy; 2025 SneakerHub. All rights reserved.</p>
        <p>
          <a href="#" className=" mx-2 text-decoration-none">Privacy Policy</a> | 
          <a href="#" className=" mx-2 text-decoration-none">Terms of Service</a>
        </p>
      </div>
    </div>
  );
};


