import "../styles/Pages.scss"

import React, { useEffect, useState } from 'react';
import { Container, Card } from 'react-bootstrap';
import Swal from 'sweetalert2';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { formatOrderNumber, formatCurrency } from '../../utils/formatters';


const MyPurchases = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const navigate = useNavigate();

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = orders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(orders.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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

        // Group orders by order number
        const groupedOrders = response.data.reduce((acc, item) => {
          const orderId = item.order_number;
          
          if (!acc[orderId]) {
            acc[orderId] = {
              id: item.id,
              order_number: item.order_number,
              created_at: item.created_at,
              status: item.status,
              total_amount: item.total_amount,
              payment_method: item.payment_method,
              payment_status: item.payment_status,
              payment_details: item.payment_details,
              items: []
            };
          }
          
          acc[orderId].items.push({
            id: item.product_id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            price: item.price,
            image_url: item.image_url || item.product_image,
            subtotal: item.quantity * item.price
          });
          
          return acc;
        }, {});

        // Convert to array and sort by date
        const sortedOrders = Object.values(groupedOrders)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        console.log('Grouped Orders:', sortedOrders); // Debug log
        setOrders(sortedOrders);
        setError(null);
      } catch (err) {
        console.error('Error loading orders:', err);
        setError('Failed to load your purchase history');
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

  
  return (
    <Container className="py-4">
      <div className="page-header">
        <h1>My Purchases</h1>
        <p>View your order history</p>
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
      ) : orders.length > 0 ? (
        <>
          <div className="orders-list">
            {currentItems.map((order) => (
              <Card key={order.id} className="mb-3">
                <Card.Header>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-1">Order #{order.order_number}</h5>
                      <p className="mb-1 text-muted">Date: {new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-end">
                      <div className={`status-badge ${order.status?.toLowerCase()}`}>
                        {order.status}
                      </div>
                      <p className="mb-0 mt-2">Total: ₱{parseFloat(order.total_amount || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </Card.Header>
                <Card.Body>
                  {order.items.map((item, index) => (
                    <div key={index} className="d-flex align-items-start mb-3 pb-3 border-bottom">
                      <img 
                        src={item.image_url || "/placeholder-product.png"}
                        alt={item.product_name}
                        style={{ 
                          width: '100px', 
                          height: '100px', 
                          objectFit: 'cover',
                          borderRadius: '8px'
                        }}
                        onError={(e) => {
                          e.target.src = "/placeholder-product.png";
                        }}
                      />
                      <div className="ms-3 flex-grow-1">
                        <h6 className="mb-1">{item.product_name}</h6>
                        <p className="mb-1">Quantity: {item.quantity}</p>
                        <p className="mb-1">Price: ₱{parseFloat(item.price).toFixed(2)}</p>
                        <p className="mb-2">Subtotal: ₱{parseFloat(item.subtotal).toFixed(2)}</p>
                        <div className="d-flex gap-2">
                          <button 
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => buyAgain(item)}
                          >
                            Buy Again
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </Card.Body>
              </Card>
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
          <i className="bx bx-shopping-bag"></i>
          <h3>No purchases yet</h3>
          <p>Products you purchase will appear here</p>
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

        .payment-info {
          display: flex;
          gap: 1rem;
          margin-top: 0.5rem;
          align-items: center;
        }
        .payment-method {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          font-size: 0.9em;
          background: #f8f9fa;
          color: #495057;
        }
        .payment-method.card {
          background: #cce5ff;
          color: #004085;
        }
        .payment-method.gcash {
          background: #d1ecf1;
          color: #0c5460;
        }
        .payment-method.cod {
          background: #fff3cd;
          color: #856404;
        }
        .payment-status {
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          font-size: 0.9em;
        }
        .payment-status.pending {
          background: #fff3cd;
          color: #856404;
        }
        .payment-status.paid {
          background: #d4edda;
          color: #155724;
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

export default MyPurchases;
