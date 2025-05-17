import "../../styles/products.css";

import React from "react";
import adidas from "../../assets/images/shoes/ADIDAS.png";
import adidas1 from "../../assets/images/shoes/ADIDAS1.png";
import anta from "../../assets/images/shoes/ANTA.png";
import anta1 from "../../assets/images/shoes/ANTA1.png";
import jordan from "../../assets/images/shoes/JORDAN.png";
import jordan1 from "../../assets/images/shoes/JORDAN1.png";
import jordan2 from "../../assets/images/shoes/JORDAN2.png";
import jordan4 from "../../assets/images/shoes/JORDAN4.png";
import nike from "../../assets/images/shoes/NIKE.png";
import nike1 from "../../assets/images/shoes/NIKE1.png";
import vans from "../../assets/images/shoes/VANS.png";
import vans2 from "../../assets/images/shoes/VANS2.png";

export default function Products() {
const products = [
    { image: anta, description: "Anta Sneakers", price: "₱89.99" },
    { image: anta1, description: "Nike Sneakers", price: "₱109.99" },
    { image: nike, description: "Jordan Sneakers", price: "₱129.99" },
    { image: nike1, description: "Adidas Sneakers", price: "₱99.99" },
    
    { image: jordan, description: "Puma Sneakers", price: "₱79.99" },
    { image: jordan1, description: "Anta Sneakers", price: "₱89.99" },
    { image: vans, description: "Nike Sneakers", price: "₱109.99" },
    { image: vans2, description: "Jordan Sneakers", price: "₱129.99" },
    
    { image: adidas, description: "Adidas Sneakers", price: "₱99.99" },
    { image: adidas1, description: "Puma Sneakers", price: "₱79.99" },
    { image: jordan2, description: "Adidas Sneakers", price: "₱99.99" },
    { image: jordan4, description: "Puma Sneakers", price: "₱79.99" }
];

return (
    <section className="products container" id="products">
      <div className="row">
        <h2>Our Products</h2>
        {products.map((item, index) => (
          <div className="col-md-3 mt-4" key={index}>
            <div className="card">
              <div className="shoe-image-container">
                <img src={item.image} alt={`${item.description} ${index + 1}`} />
              </div>
              <div className="card-body">
                <h5 className="card-title">{item.description}</h5>
                <p className="card-text">Price: {item.price}</p>
                <button className="btn btn-primary" onClick={() => window.location.href = "/login"}>Buy Now </button>
                <button className="btn btn-warning mt-2" onClick={() => window.location.href = "/login"}>Add to Cart</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
