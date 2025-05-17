import "../../styles/home.css";

import { Carousel } from "react-bootstrap";
import React from "react";
import logoAnta from "../../assets/images/shoes/ANTA2.png";
import logoNike from "../../assets/images/shoes/NIKE.png";

export default function Home() {
  return (
    <section className="home d-flex align-items-center justify-content-center" id="home">
      <Carousel className="w-100">
        {/* Carousel Item 1 */}
        <Carousel.Item>
          <div className="carousel-content d-flex align-items-center justify-content-center">
            <img className="flexing-image img-fluid" src={logoAnta} alt="Sneaker 1" />
            <div className="carousel-text text-center">
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
          <div className="carousel-content d-flex align-items-center justify-content-center">
            <img className="flexing-image img-fluid" src={logoNike} alt="Nike Sneakers" />
            <div className="carousel-text text-center">
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
          <div className="carousel-content d-flex align-items-center justify-content-center">
            <img className="flexing-image img-fluid" src={logoAnta} alt="Anta Sneakers" />
            <div className="carousel-text text-center">
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
  );
}
