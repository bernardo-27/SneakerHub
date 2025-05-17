import "../styles/Pages.scss"

import React, { useEffect, useState } from 'react';
import { Container, Card } from 'react-bootstrap';
import Swal from 'sweetalert2';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { formatOrderNumber, formatCurrency } from '../../utils/formatters';


const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const navigate = useNavigate();

  // Get unique statuses and payment methods from orders
  const uniqueStatuses = ['all', ...new Set(orders.map(order => order.status))];
  const uniquePaymentMethods = ['all', ...new Set(orders.map(order => order.paymentMethod))];

  // Filter orders based on selected filters
  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPaymentMethod = paymentMethodFilter === 'all' || order.paymentMethod === paymentMethodFilter;
    return matchesStatus && matchesPaymentMethod;
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, paymentMethodFilter]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get('/my-orders', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // Group items by order ID
        const groupedOrders = {};
        response.data.forEach(item => {
          const orderId = item.order_id || item.id;
          if (!groupedOrders[orderId]) {
            groupedOrders[orderId] = {
              id: orderId,
              order_number: item.order_number,
              created_at: item.created_at,
              status: item.status,
              total_amount: item.total_amount,
              paymentMethod: item.payment_method,
              paymentDetails: item.payment_details,
              items: []
            };
          }
          groupedOrders[orderId].items.push({
            id: item.id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            price: item.price,
            image_url: item.product_image
          });
        });

        const sortedOrders = Object.values(groupedOrders)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        console.log('Grouped Orders:', sortedOrders); // Debug log
        setOrders(sortedOrders);
        setError(null);
      } catch (err) {
        console.error('Error loading orders:', err);
        setError('Failed to load your order history');
        if (err.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [navigate]);

  const buyAgain = async (item) => {
    try {
      const cartItem = {
        id: item.product_id,
        product_id: item.product_id,
        name: item.product_name,
        price: item.price,
        quantity: 1,
        image_url: item.image_url
      };

      const savedCart = localStorage.getItem('cart_items');
      let cartItems = savedCart ? JSON.parse(savedCart) : [];
    
      const existingItem = cartItems.find(item => item.id === cartItem.product_id);
      if (existingItem) {
        cartItems = cartItems.map(item =>
          item.id === cartItem.product_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        cartItems = [...cartItems, cartItem];
      }

      localStorage.setItem('cart_items', JSON.stringify(cartItems));

      Swal.fire({
        title: 'Added to Cart!',
        text: 'Product added to your cart',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        navigate('/cart');
      });
    } catch (error) {
      console.error('Error in buyAgain:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to add item to cart'
      });
    }
  };

  const writeReview = async (item) => {
    try {
      const result = await Swal.fire({
        title: 'Write a Review',
        html: `
          <div class="rating-container">
            <div class="stars">
              <input type="radio" id="star5" name="rating" value="5" />
              <label for="star5">★</label>
              <input type="radio" id="star4" name="rating" value="4" />
              <label for="star4">★</label>
              <input type="radio" id="star3" name="rating" value="3" />
              <label for="star3">★</label>
              <input type="radio" id="star2" name="rating" value="2" />
              <label for="star2">★</label>
              <input type="radio" id="star1" name="rating" value="1" />
              <label for="star1">★</label>
            </div>
          </div>
          <textarea id="review" class="swal2-textarea" placeholder="Write your review here..."></textarea>
        `,
        showCancelButton: true,
        confirmButtonText: 'Submit Review',
        preConfirm: () => {
          const rating = document.querySelector('input[name="rating"]:checked')?.value;
          const review = document.getElementById('review').value;
          if (!rating || !review) {
            Swal.showValidationMessage('Please provide both rating and review');
            return false;
          }
          return { rating, review };
        }
      });

      if (result.isConfirmed) {
        await axios.post('/reviews', {
          order_id: item.order_id,
          product_id: item.product_id,
          rating: result.value.rating,
          review: result.value.review
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        Swal.fire(
          'Thank you!',
          'Your review has been submitted successfully',
          'success'
        );
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to submit review'
      });
    }
  };

  const formatPaymentMethod = (method) => {
    switch (method?.toUpperCase()) {
      case 'CARD':
        return { name: 'Credit/Debit Card', icon: 'fa-credit-card', class: 'card' };
      case 'GCASH':
        return { name: 'GCash', icon: 'fa-mobile-alt', class: 'gcash' };
      case 'COD':
        return { name: 'Cash on Delivery', icon: 'fa-money-bill-wave', class: 'cod' };
      default:
        return { name: method || 'Unknown', icon: 'fa-circle', class: 'default' };
    }
  };

  return (
    <Container className="py-4">
      <div className="page-header">
        <h1>Order History</h1>
        <p>Track and manage your past orders</p>
      </div>

      <div className="filters mb-4">
        <div className="d-flex gap-3 align-items-center">
          <div className="filter-group">
            <label className="me-2">Status:</label>
            <select 
              className="form-select form-select-sm" 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All Statuses' : status}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="me-2">Payment Method:</label>
            <select 
              className="form-select form-select-sm" 
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
            >
              {uniquePaymentMethods.map(method => (
                <option key={method} value={method}>
                  {method === 'all' ? 'All Payment Methods' : formatPaymentMethod(method).name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : filteredOrders.length > 0 ? (
        <>
          <div className="orders-list">
            {currentItems.map((order) => (
              <div key={order.id} className="order-card mb-4">
                <div className="order-header">
                  <div className="order-info">
                    <div className="order-title">
                      <div className="order-number">
                        <h3>Order #{formatOrderNumber(order.order_number)}</h3>
                      </div>
                      <span className={`status-badge ${order.status?.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="order-meta">
                      <span className="order-date">
                        <i className="fas fa-calendar"></i>
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                      <div className="payment-method-display">
                        {order.paymentMethod && (
                          <div className={`payment-method ${formatPaymentMethod(order.paymentMethod).class}`}>
                            <i className={`fas ${formatPaymentMethod(order.paymentMethod).icon}`}></i>
                            <span>{formatPaymentMethod(order.paymentMethod).name}</span>
                            {order.paymentDetails?.maskedNumber && (
                              <span className="masked-number">
                                {order.paymentDetails.maskedNumber}
                              </span>
                            )}
                          </div>
                        )}
                        {order.paymentDetails?.status && (
                          <span className={`payment-status ${order.paymentDetails.status.toLowerCase()}`}>
                            {order.paymentDetails.status}
                          </span>
                        )}
                      </div>
                      <span className="order-total">
                        Total: ₱{parseFloat(order.total_amount || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="order-items">
                  {order.items && order.items.map((item, index) => (
                    <div key={`${order.id}-${index}`} className="order-item">
                      <div className="item-image">
                        <img 
                          src={item.image_url || "/placeholder.png"} 
                          alt={item.product_name}
                          onError={(e) => {
                            e.target.src = "/placeholder.png";
                            e.target.onerror = null;
                          }}
                        />
                      </div>
                      <div className="item-details">
                        <h4>{item.product_name}</h4>
                        <div className="item-info">
                          <span className="item-price">
                            ₱{parseFloat(item.price).toFixed(2)} × {item.quantity}
                          </span>
                          <span className="item-total">
                            ₱{(parseFloat(item.price) * item.quantity).toFixed(2)}
                          </span>
                        </div>
                        <div className="item-actions">
                          {order.status !== 'Cancelled' && (
                            <button 
                              className="action-btn"
                              onClick={() => buyAgain(item)}
                            >
                              Buy Again
                            </button>
                          )}
                          {order.status === 'Delivered' && (
                            <button 
                              className="action-btn secondary"
                              onClick={() => writeReview(item)}
                            >
                              Write Review
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <div className="pagination">
                <button
                  className="page-btn"
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index + 1}
                    className={`page-btn ${currentPage === index + 1 ? 'active' : ''}`}
                    onClick={() => paginate(index + 1)}
                  >
                    {index + 1}
                  </button>
                ))}
                
                <button
                  className="page-btn"
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
              <div className="page-info">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <i className="fas fa-shopping-bag"></i>
          <h3>No orders yet</h3>
          <p>When you place orders, they will appear here</p>
          <button 
            className="browse-products-btn"
            onClick={() => navigate('/dashboard')}
          >
            Start Shopping
          </button>
        </div>
      )}

      <style jsx>{`
        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .order-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          margin-bottom: 1rem;
        }

        .order-header {
          background: #f8f9fa;
          padding: 1.5rem;
          border-bottom: 1px solid #edf2f7;
        }

        .order-title {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }

        .order-title h3 {
          margin: 0;
          font-size: 1.25rem;
          color: #2d3748;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .status-badge.pending {
          background-color: #fef3c7;
          color: #92400e;
        }

        .status-badge.delivered {
          background-color: #def7ec;
          color: #046c4e;
        }

        .status-badge.cancelled {
          background-color: #fde8e8;
          color: #9b1c1c;
        }

        .order-meta {
          display: flex;
          gap: 2rem;
          color: #718096;
          font-size: 0.875rem;
        }

        .order-date {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .order-total {
          font-weight: 600;
          color: #2d3748;
        }

        .order-items {
          padding: 1.5rem;
        }

        .order-item {
          display: flex;
          gap: 1.5rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .order-item:last-child {
          margin-bottom: 0;
        }

        .item-image {
          width: 100px;
          height: 100px;
          flex-shrink: 0;
          border-radius: 8px;
          overflow: hidden;
        }

        .item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .item-details {
          flex: 1;
          min-width: 0;
        }

        .item-details h4 {
          margin: 0 0 0.5rem;
          font-size: 1.1rem;
          color: #2d3748;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .item-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .item-price {
          color: #4a5568;
        }

        .item-total {
          font-weight: 600;
          color: #2c5282;
        }

        .item-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .action-btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          background: #1a73e8;
          color: white;
          white-space: nowrap;
        }

        .action-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .action-btn.secondary {
          background: #edf2f7;
          color: #2d3748;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .empty-state i {
          font-size: 3rem;
          color: #a0aec0;
          margin-bottom: 1rem;
        }

        .empty-state h3 {
          color: #2d3748;
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          color: #718096;
          margin-bottom: 1.5rem;
        }

        .browse-products-btn {
          padding: 0.75rem 1.5rem;
          background: #1a73e8;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .browse-products-btn:hover {
          background: #1557b0;
          transform: translateY(-1px);
        }

        @media (max-width: 768px) {
          .order-item {
            flex-direction: column;
          }

          .item-image {
            width: 100%;
            height: 200px;
          }

          .item-info {
            flex-direction: column;
            gap: 0.5rem;
          }

          .item-actions {
            justify-content: flex-start;
          }
        }

        .payment-method-display {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 0.5rem 0;
        }

        .payment-method {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.35rem 0.75rem;
          border-radius: 6px;
          font-size: 0.875rem;
          background: #f8f9fa;
          color: #4a5568;

          i {
            font-size: 1rem;
          }

          &.card {
            background: #e3efff;
            color: #1a56db;
            i { color: #1a56db; }
          }

          &.gcash {
            background: #e0f2fe;
            color: #0369a1;
            i { color: #0369a1; }
          }

          &.cod {
            background: #fef3c7;
            color: #92400e;
            i { color: #92400e; }
          }

          .masked-number {
            font-family: monospace;
            margin-left: 0.5rem;
            padding-left: 0.5rem;
            border-left: 1px solid currentColor;
            opacity: 0.8;
          }
        }

        .payment-status {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 500;

          &.pending {
            background: #fff3c7;
            color: #92400e;
          }

          &.paid {
            background: #dcfce7;
            color: #166534;
          }

          &.failed {
            background: #fee2e2;
            color: #991b1b;
          }
        }

        .order-number {
          margin: 0;
          font-size: 1.25rem;
          color: #2d3748;
          
          h3 {
            margin: 0;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            
            &::before {
              content: '';
              display: inline-block;
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background-color: #4299e1;
            }
          }
        }

        .pagination-container {
          margin-top: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .pagination {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .page-btn {
          padding: 0.5rem 1rem;
          border: 1px solid #e2e8f0;
          background: white;
          color: #4a5568;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;

          &:hover:not(:disabled) {
            background: #f7fafc;
            border-color: #cbd5e0;
          }

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          &.active {
            background: #1a73e8;
            color: white;
            border-color: #1a73e8;
          }
        }

        .page-info {
          color: #718096;
          font-size: 0.875rem;
        }
      `}</style>
    </Container>
  );
};

export default OrderHistory;