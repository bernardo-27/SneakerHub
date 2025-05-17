import "../styles/Cart.scss";

import { Button, Card, Container, Table } from 'react-bootstrap';
import React, { useEffect, useState } from 'react';

import Swal from 'sweetalert2';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:3000';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Setup authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }, [navigate]);

  // Fetch cart items
  const fetchCart = async () => {
    try {
      const response = await axios.get('/cart');
      if (response.data) {
        setCartItems(response.data);
        setError(null);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Failed to load cart items');
        console.error('Error fetching cart:', err);
      }
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // Cart operations
  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      await axios.put(`/cart/${productId}`, { quantity: newQuantity });
      fetchCart();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update quantity'
      });
    }
  };

  const removeItem = async (productId) => {
    try {
      const result = await Swal.fire({
        title: 'Remove Item?',
        text: "Are you sure you want to remove this item from your cart?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, remove it!',
        cancelButtonText: 'No, keep it'
      });

      if (result.isConfirmed) {
        await axios.put(`/cart/${productId}`, { quantity: 0 });
        await fetchCart();
        
        Swal.fire({
          icon: 'success',
          title: 'Removed!',
          text: 'Item has been removed from your cart',
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (err) {
      console.error('Error removing item:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to remove item'
      });
    }
  };

  const checkout = async () => {
    try {
      const result = await Swal.fire({
        title: 'Proceed to Checkout?',
        text: "You're about to place an order",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, checkout!'
      });

      if (result.isConfirmed) {
        // First, collect delivery address
        const { value: deliveryAddress } = await Swal.fire({
          title: 'Delivery Address',
          html: `
            <form id="delivery-form" class="delivery-address-form">
              <div class="form-group">
                <label for="street">Street Address</label>
                <input type="text" id="street" class="form-control" placeholder="House/Unit No., Street Name" required>
              </div>
              <div class="form-group">
                <label for="barangay">Barangay</label>
                <input type="text" id="barangay" class="form-control" placeholder="Barangay" required>
              </div>
              <div class="form-group">
                <label for="city">City</label>
                <input type="text" id="city" class="form-control" placeholder="City" required>
              </div>
              <div class="form-group">
                <label for="province">Province</label>
                <input type="text" id="province" class="form-control" placeholder="Province" required>
              </div>
              <div class="form-group">
                <label for="postal">Postal Code</label>
                <input type="text" id="postal" class="form-control" placeholder="Postal Code" required>
              </div>
              <div class="form-group">
                <label for="contact">Contact Number</label>
                <input type="tel" id="contact" class="form-control" placeholder="Contact Number" required>
              </div>
            </form>
            <style>
              .delivery-address-form {
                text-align: left;
                padding: 1rem;
              }
              .form-group {
                margin-bottom: 1rem;
              }
              .form-group label {
                display: block;
                margin-bottom: 0.5rem;
                font-weight: 500;
              }
              .form-control {
                width: 100%;
                padding: 0.5rem;
                border: 1px solid #ddd;
                border-radius: 4px;
                margin-bottom: 0.5rem;
              }
            </style>
          `,
          showCancelButton: true,
          confirmButtonText: 'Continue to Payment',
          cancelButtonText: 'Cancel',
          preConfirm: () => {
            const street = document.getElementById('street').value;
            const barangay = document.getElementById('barangay').value;
            const city = document.getElementById('city').value;
            const province = document.getElementById('province').value;
            const postal = document.getElementById('postal').value;
            const contact = document.getElementById('contact').value;

            if (!street || !barangay || !city || !province || !postal || !contact) {
              Swal.showValidationMessage('Please fill in all delivery information');
              return false;
            }

            return {
              street,
              barangay,
              city,
              province,
              postal,
              contact
            };
          }
        });

        if (!deliveryAddress) {
          return;
        }

        // Format the delivery address
        const formattedAddress = `${deliveryAddress.street}\n${deliveryAddress.barangay}\n${deliveryAddress.city}\n${deliveryAddress.province}\n${deliveryAddress.postal}\nContact: ${deliveryAddress.contact}`;

        // Show order confirmation with delivery details
        const confirmOrder = await Swal.fire({
          title: 'Confirm Order Details',
          html: `
            <div class="order-confirmation">
              <div class="confirmation-section">
                <h4>Delivery Address</h4>
                <div class="address-details">
                  <div class="address-line"><strong>Street:</strong> ${deliveryAddress.street}</div>
                  <div class="address-line"><strong>Barangay:</strong> ${deliveryAddress.barangay}</div>
                  <div class="address-line"><strong>City:</strong> ${deliveryAddress.city}</div>
                  <div class="address-line"><strong>Province:</strong> ${deliveryAddress.province}</div>
                  <div class="address-line"><strong>Postal Code:</strong> ${deliveryAddress.postal}</div>
                  <div class="address-line contact-info">
                    <i class="fas fa-phone"></i>
                    <strong>Contact:</strong> ${deliveryAddress.contact}
                  </div>
                </div>
              </div>

              <div class="confirmation-section">
                <h4>Order Summary</h4>
                <div class="order-items">
                  ${cartItems.map(item => `
                    <div class="order-item">
                      <img src="${item.image_url || "/placeholder-product.png"}" 
                           alt="${item.name}"
                           onerror="this.src='/placeholder-product.png'"
                      />
                      <div class="item-details">
                        <div class="item-name">${item.name}</div>
                        <div class="item-price">₱${parseFloat(item.price).toFixed(2)} × ${item.quantity}</div>
                        <div class="item-total">₱${(parseFloat(item.price) * item.quantity).toFixed(2)}</div>
                      </div>
                    </div>
                  `).join('')}
                </div>
                <div class="order-total">
                  <strong>Total Amount:</strong> ₱${totalAmount.toFixed(2)}
                </div>
              </div>
            </div>
            <style>
              .order-confirmation {
                text-align: left;
                padding: 1rem;
              }
              .confirmation-section {
                margin-bottom: 1.5rem;
                background: #f8f9fa;
                border-radius: 8px;
                padding: 1rem;
              }
              .confirmation-section h4 {
                color: #333;
                margin-bottom: 1rem;
                padding-bottom: 0.5rem;
                border-bottom: 1px solid #dee2e6;
              }
              .address-details {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
              }
              .address-line {
                display: flex;
                gap: 0.5rem;
                align-items: center;
              }
              .contact-info {
                color: #28a745;
                margin-top: 0.5rem;
              }
              .contact-info i {
                margin-right: 0.5rem;
              }
              .order-items {
                display: flex;
                flex-direction: column;
                gap: 1rem;
                margin-bottom: 1rem;
              }
              .order-item {
                display: flex;
                gap: 1rem;
                padding: 0.5rem;
                background: white;
                border-radius: 4px;
                border: 1px solid #dee2e6;
              }
              .order-item img {
                width: 50px;
                height: 50px;
                object-fit: cover;
                border-radius: 4px;
              }
              .item-details {
                flex: 1;
              }
              .item-name {
                font-weight: 500;
                margin-bottom: 0.25rem;
              }
              .item-price {
                color: #666;
                font-size: 0.9em;
              }
              .item-total {
                color: #28a745;
                font-weight: 500;
                margin-top: 0.25rem;
              }
              .order-total {
                text-align: right;
                font-size: 1.1em;
                padding-top: 1rem;
                border-top: 1px solid #dee2e6;
              }
            </style>
          `,
          showCancelButton: true,
          confirmButtonText: 'Confirm & Continue to Payment',
          cancelButtonText: 'Edit Details',
          width: 600
        });

        if (!confirmOrder.isConfirmed) {
          return;
        }

        // Continue with payment method selection
        const { value: paymentMethod } = await Swal.fire({
          title: 'Select Payment Method',
          html: `
            <div class="payment-methods">
              <div class="payment-method-option">
                <input type="radio" id="card" name="payment" value="card" class="payment-radio">
                <label for="card" class="payment-label">
                  <div class="payment-icon">
                    <i class="fas fa-credit-card"></i>
                  </div>
                  <div class="payment-info">
                    <h4>Credit/Debit Card</h4>
                    <p>Pay securely with your card</p>
                  </div>
                </label>
              </div>
              
              <div class="payment-method-option">
                <input type="radio" id="gcash" name="payment" value="gcash" class="payment-radio">
                <label for="gcash" class="payment-label">
                  <div class="payment-icon" style="background-color: #0070E0;">
                    <i class="fas fa-mobile-alt"></i>
                  </div>
                  <div class="payment-info">
                    <h4>GCash</h4>
                    <p>Pay with your GCash wallet</p>
                  </div>
                </label>
              </div>
              
              <div class="payment-method-option">
                <input type="radio" id="cod" name="payment" value="cod" class="payment-radio">
                <label for="cod" class="payment-label">
                  <div class="payment-icon" style="background-color: #28a745;">
                    <i class="fas fa-money-bill-wave"></i>
                  </div>
                  <div class="payment-info">
                    <h4>Cash on Delivery</h4>
                    <p>Pay when you receive</p>
                  </div>
                </label>
              </div>
            </div>
            <style>
              .payment-methods {
                display: flex;
                flex-direction: column;
                gap: 1rem;
                padding: 1rem;
              }
              
              .payment-method-option {
                position: relative;
              }
              
              .payment-radio {
                position: absolute;
                opacity: 0;
                width: 100%;
                height: 100%;
                cursor: pointer;
                z-index: 1;
              }
              
              .payment-label {
                display: flex;
                align-items: center;
                padding: 1rem;
                border: 2px solid #e1e1e1;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
              }
              
              .payment-radio:checked + .payment-label {
                border-color: #3085d6;
                background-color: #f8f9ff;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              }
              
              .payment-icon {
                width: 48px;
                height: 48px;
                background-color: #3085d6;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 1rem;
              }
              
              .payment-icon i {
                color: white;
                font-size: 1.5rem;
              }
              
              .payment-info {
                flex: 1;
              }
              
              .payment-info h4 {
                margin: 0;
                font-size: 1.1rem;
                color: #333;
              }
              
              .payment-info p {
                margin: 0.25rem 0 0;
                font-size: 0.9rem;
                color: #666;
              }
            </style>
          `,
          showCancelButton: true,
          confirmButtonText: 'Continue',
          cancelButtonText: 'Cancel',
          customClass: {
            confirmButton: 'btn btn-primary',
            cancelButton: 'btn btn-outline-secondary'
          },
          preConfirm: () => {
            const selected = document.querySelector('input[name="payment"]:checked');
            return selected ? selected.value : null;
          }
        });

        if (!paymentMethod) {
          return;
        }

        let paymentResult;
        
        switch(paymentMethod) {
          case 'card':
            paymentResult = await Swal.fire({
              title: 'Credit/Debit Card Payment',
              html: `
                <div class="card-payment-form">
                  <div class="card-preview">
                    <div class="card-front">
                      <div class="card-type">
                        <i class="fab fa-cc-visa"></i>
                      </div>
                      <div class="card-number">4242 4242 4242 4242</div>
                      <div class="card-info">
                        <div class="card-holder">DEMO CARD</div>
                        <div class="card-expires">12/25</div>
                      </div>
                    </div>
                  </div>
                  <form id="payment-form" class="payment-details">
                    <div class="form-group">
                      <label>Card Number</label>
                      <input type="text" class="form-control" value="4242 4242 4242 4242" readonly />
                    </div>
                    <div class="form-row">
                      <div class="form-group col">
                        <label>Expiry Date</label>
                        <input type="text" class="form-control" value="12/25" readonly />
                      </div>
                      <div class="form-group col">
                        <label>CVV</label>
                        <input type="text" class="form-control" value="123" readonly />
                      </div>
                    </div>
                    <div class="alert alert-info mt-3">
                      <i class="fas fa-info-circle me-2"></i>
                      This is a mock card payment - no real payment will be processed
                    </div>
                  </form>
                </div>
                <style>
                  .card-payment-form {
                    padding: 1rem;
                  }
                  
                  .card-preview {
                    margin-bottom: 2rem;
                  }
                  
                  .card-front {
                    background: linear-gradient(135deg, #3085d6, #1a4b84);
                    border-radius: 16px;
                    padding: 1.5rem;
                    color: white;
                    box-shadow: 0 8px 16px rgba(0,0,0,0.2);
                  }
                  
                  .card-type {
                    font-size: 2rem;
                    margin-bottom: 1rem;
                  }
                  
                  .card-number {
                    font-size: 1.4rem;
                    letter-spacing: 2px;
                    margin-bottom: 2rem;
                  }
                  
                  .card-info {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.9rem;
                    text-transform: uppercase;
                  }
                  
                  .payment-details {
                    background: #f8f9fa;
                    padding: 1.5rem;
                    border-radius: 12px;
                  }
                  
                  .form-group {
                    margin-bottom: 1rem;
                  }
                  
                  .form-row {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1rem;
                  }
                  
                  .form-control {
                    background-color: #fff !important;
                  }
                </style>
              `,
              showCancelButton: true,
              confirmButtonText: 'Pay ₱' + totalAmount.toFixed(2),
              cancelButtonText: 'Cancel',
              customClass: {
                confirmButton: 'btn btn-success',
                cancelButton: 'btn btn-danger'
              }
            });
            break;

          case 'gcash':
            paymentResult = await Swal.fire({
              title: 'GCash Payment',
              html: `
                <div class="gcash-payment-form">
                  <div class="gcash-logo">
                    <i class="fas fa-mobile-alt"></i>
                    <span>GCash</span>
                  </div>
                  <div class="qr-code">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=mock-gcash-payment" alt="Mock QR Code">
                  </div>
                  <form id="payment-form" class="payment-details">
                    <div class="form-group">
                      <label>GCash Number</label>
                      <div class="input-group">
                        <span class="input-group-text">
                          <i class="fas fa-phone"></i>
                        </span>
                        <input type="text" class="form-control" value="09123456789" readonly />
                      </div>
                    </div>
                    <div class="alert alert-info">
                      <i class="fas fa-info-circle me-2"></i>
                      This is a mock GCash payment - no real payment will be processed
                    </div>
                  </form>
                </div>
                <style>
                  .gcash-payment-form {
                    padding: 1rem;
                    text-align: center;
                  }
                  
                  .gcash-logo {
                    color: #0070E0;
                    font-size: 2rem;
                    margin-bottom: 1.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                  }
                  
                  .qr-code {
                    background: white;
                    padding: 1rem;
                    border-radius: 12px;
                    display: inline-block;
                    margin-bottom: 1.5rem;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                  }
                  
                  .qr-code img {
                    max-width: 150px;
                  }
                  
                  .payment-details {
                    background: #f8f9fa;
                    padding: 1.5rem;
                    border-radius: 12px;
                    text-align: left;
                  }
                  
                  .input-group-text {
                    background: #0070E0;
                    color: white;
                    border: none;
                  }
                </style>
              `,
              showCancelButton: true,
              confirmButtonText: 'Pay ₱' + totalAmount.toFixed(2),
              cancelButtonText: 'Cancel',
              customClass: {
                confirmButton: 'btn btn-success',
                cancelButton: 'btn btn-danger'
              }
            });
            break;

          case 'cod':
            paymentResult = await Swal.fire({
              title: 'Cash on Delivery',
              html: `
                <div class="cod-payment-form">
                  <div class="cod-icon">
                    <i class="fas fa-truck"></i>
                  </div>
                  <div class="amount-display">
                    <span>Amount Due</span>
                    <h3>₱${totalAmount.toFixed(2)}</h3>
                  </div>
                  <div class="delivery-details">
                    <div class="form-group">
                      <label>
                        <i class="fas fa-map-marker-alt"></i>
                        Delivery Address
                      </label>
                      <div class="address-display">
                        ${formattedAddress.split('\n').map(line => 
                          `<div class="address-line">${line}</div>`
                        ).join('')}
                      </div>
                    </div>
                    <div class="delivery-note">
                      <i class="fas fa-info-circle"></i>
                      <p>Payment will be collected by our delivery partner upon arrival.</p>
                    </div>
                  </div>
                </div>
                <style>
                  .cod-payment-form {
                    padding: 1rem;
                  }
                  
                  .cod-icon {
                    text-align: center;
                    font-size: 3rem;
                    color: #28a745;
                    margin-bottom: 1.5rem;
                  }
                  
                  .amount-display {
                    background: #f8f9fa;
                    padding: 1.5rem;
                    border-radius: 12px;
                    text-align: center;
                    margin-bottom: 1.5rem;
                  }
                  
                  .amount-display span {
                    display: block;
                    color: #666;
                    margin-bottom: 0.5rem;
                  }
                  
                  .amount-display h3 {
                    color: #28a745;
                    font-size: 2rem;
                    margin: 0;
                  }
                  
                  .delivery-details {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 12px;
                    border: 2px solid #e1e1e1;
                  }
                  
                  .form-group label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #333;
                    margin-bottom: 1rem;
                  }

                  .address-display {
                    background: #f8f9fa;
                    padding: 1rem;
                    border-radius: 8px;
                    border: 1px solid #e1e1e1;
                  }

                  .address-line {
                    margin-bottom: 0.5rem;
                    color: #333;
                  }

                  .address-line:last-child {
                    margin-bottom: 0;
                    color: #28a745;
                  }
                  
                  .delivery-note {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.5rem;
                    margin-top: 1rem;
                    color: #666;
                  }
                  
                  .delivery-note i {
                    color: #28a745;
                  }
                  
                  .delivery-note p {
                    margin: 0;
                    font-size: 0.9rem;
                  }
                </style>
              `,
              showCancelButton: true,
              confirmButtonText: 'Confirm Order',
              cancelButtonText: 'Cancel',
              customClass: {
                confirmButton: 'btn btn-success',
                cancelButton: 'btn btn-danger'
              }
            });
            break;
        }

        if (!paymentResult.isConfirmed) {
          return;
        }

        // Show processing message
        await Swal.fire({
          title: paymentMethod === 'cod' ? 'Processing Order' : 'Processing Payment',
          html: `
            <div class="processing-animation">
              <div class="spinner"></div>
              <p>${paymentMethod === 'cod' ? 'Preparing your order...' : 'Processing your payment...'}</p>
            </div>
            <style>
              .processing-animation {
                text-align: center;
                padding: 1rem;
              }
              
              .spinner {
                width: 50px;
                height: 50px;
                border: 5px solid #f3f3f3;
                border-top: 5px solid #3085d6;
                border-radius: 50%;
                margin: 0 auto 1rem;
                animation: spin 1s linear infinite;
              }
              
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
          `,
          timer: 1500,
          timerProgressBar: true,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // Create purchase records
        const purchaseDate = new Date().toISOString();
        const orderId = 'ORD-' + Date.now();
        
        const orderRecord = {
          orderId,
          date: purchaseDate,
          status: 'Pending',
          paymentMethod: paymentMethod.toUpperCase(),
          paymentDetails: {
            method: paymentMethod,
            status: paymentMethod === 'cod' ? 'Pending' : 'Paid',
            maskedNumber: paymentMethod === 'card' ? '**** **** **** 4242' : 
                         paymentMethod === 'gcash' ? '**** **** 6789' : null,
            expiryDate: paymentMethod === 'card' ? '12/25' : null
          },
          items: cartItems.map(item => ({
            id: item.product_id || item.id,
            name: item.name,
            price: parseFloat(item.price),
            quantity: item.quantity,
            image: item.image_url || item.image
          })),
          total: cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0),
          deliveryAddress: formattedAddress
        };

        // Save to order history
        const existingOrders = JSON.parse(localStorage.getItem('order_history') || '[]');
        localStorage.setItem('order_history', JSON.stringify([...existingOrders, orderRecord]));

        // Save to purchases (for My Purchases view)
        const purchaseRecords = cartItems.map(item => ({
          id: item.product_id || item.id,
          name: item.name,
          price: parseFloat(item.price),
          quantity: item.quantity,
          image: item.image_url || item.image,
          date: new Date().toLocaleDateString(),
          total: parseFloat(item.price) * item.quantity,
          orderId,
          paymentMethod: paymentMethod.toUpperCase(),
          paymentStatus: paymentMethod === 'cod' ? 'Pending' : 'Paid',
          deliveryAddress: formattedAddress
        }));

        const existingPurchases = JSON.parse(localStorage.getItem('purchases') || '[]');
        localStorage.setItem('purchases', JSON.stringify([...existingPurchases, ...purchaseRecords]));

        // Clear cart after successful purchase
        localStorage.removeItem('cart_items');

        // Send order to backend with payment information
        await axios.post('/orders', { 
          items: cartItems, 
          orderId,
          paymentMethod: paymentMethod.toUpperCase(),
          paymentDetails: {
            method: paymentMethod,
            status: paymentMethod === 'cod' ? 'Pending' : 'Paid',
            maskedNumber: paymentMethod === 'card' ? '**** **** **** 4242' : 
                         paymentMethod === 'gcash' ? '**** **** 6789' : null,
            expiryDate: paymentMethod === 'card' ? '12/25' : null
          },
          deliveryAddress: formattedAddress
        });
        
        Swal.fire({
          icon: 'success',
          title: 'Order Placed!',
          text: 'Your order has been placed successfully',
          timer: 2000,
          showConfirmButton: false
        });

        navigate('/my-purchases');
      }
    } catch (err) {
      console.error('Error during checkout:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to place order'
      });
    }
  };

  // Calculate total
  const totalAmount = cartItems.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity) || 0;
    return sum + (price * quantity);
  }, 0);

  // Error state
  if (error) {
    return (
      <Container className="py-4">
        <div className="alert alert-danger" role="alert">
          {error}
          <Button 
            variant="link"
            onClick={fetchCart}
            className="ml-2"
          >
            Try Again
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h2 className="mb-4">Shopping Cart</h2>

      {!cartItems.length ? (
        <div className="text-center py-5">
          <h4>Your cart is empty</h4>
          <Button 
            variant="primary" 
            className="mt-3"
            onClick={() => navigate('/dashboard')}
          >
            Continue Shopping
          </Button>
        </div>
      ) : (
        <div className="cart-content">
          <Table responsive className="cart-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map(item => (
                <tr key={item.product_id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <img
                        src={item.image_url || "/placeholder-product.png"}
                        alt={item.name}
                        style={{ 
                          width: '50px', 
                          height: '50px', 
                          objectFit: 'cover', 
                          marginRight: '15px',
                          borderRadius: '4px'
                        }}
                        onError={(e) => {
                          e.target.src = "/placeholder-product.png";
                        }}
                      />
                      <span className="product-name">{item.name}</span>
                    </div>
                  </td>
                  <td>₱{parseFloat(item.price).toFixed(2)}</td>
                  <td>
                    <div className="quantity-controls d-flex align-items-center">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        -
                      </Button>
                      <span className="mx-3">{item.quantity}</span>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </td>
                  <td>₱{(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
                  <td>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => removeItem(item.product_id)}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <div className="d-flex justify-content-end mt-4">
            <Card className="order-summary" style={{ width: '300px' }}>
              <Card.Body>
                <Card.Title>Order Summary</Card.Title>
                <div className="d-flex justify-content-between mb-3">
                  <span>Subtotal:</span>
                  <span>₱{totalAmount.toFixed(2)}</span>
                </div>
                <Button
                  variant="primary"
                  className="w-100"
                  onClick={checkout}
                  disabled={!cartItems.length}
                >
                  Checkout (₱{totalAmount.toFixed(2)})
                </Button>
              </Card.Body>
            </Card>
          </div>
        </div>
      )}
    </Container>
  );
};

export default Cart; 