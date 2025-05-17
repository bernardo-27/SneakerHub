import "../../styles/about.css";

import React from "react";

export default function About() {
  return (
    <section className="about-section py-5" id="about">
      <div className="container">
        <h2 className="text-center mb-4">About Us</h2>
        <p className="text-center lead">
          Welcome to <strong>SneakerHub</strong>, your go-to destination for premium sneakers. 
          We curate high-quality footwear from top brands like <strong>Nike, Anta, and Jordan</strong>, 
          ensuring you step into style and comfort.
        </p>
        <div className="row justify-content-center">
          <div className="col-md-8">
            <p className="about-text">
              Founded with a deep passion for sneakers, we bring the latest collections and 
              exclusive designs to sneaker enthusiasts worldwide. Our commitment to quality and 
              customer satisfaction drives us to offer the best shopping experience. 
            </p>
            <p className="about-mission">
              <em classaName="text-mission">“More than just shoes – it’s a lifestyle.”</em>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
