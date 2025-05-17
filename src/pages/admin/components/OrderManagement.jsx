import "./Ordermanagement.scss"

import { Button, Col, Container, Form, InputGroup, Row, Table, Pagination } from 'react-bootstrap';
import React, { useEffect, useState } from 'react';

import Swal from 'sweetalert2';
import axios from 'axios';
import { formatOrderNumber } from '../../../utils/formatters';
import { useNavigate } from 'react-router-dom';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredOrders, setFilteredOrders] = useState([]);
  const navigate = useNavigate();
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  // Get unique statuses from orders
  const statuses = [...new Set(orders.map(order => order.status))];

  // Set up axios defaults and authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Configure axios defaults
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    axios.defaults.baseURL = 'http://localhost:3000';
    
    // Add request interceptor to ensure token is set for each request
    const requestInterceptor = axios.interceptors.request.use(
      config => {
        if (!config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle auth errors
    const responseInterceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('token');
          navigate('/login');
        }
        return Promise.reject(error);
      }
    );

    // Load orders when component mounts
    loadOrders();

    // Cleanup interceptors when component unmounts
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [navigate]);

  useEffect(() => {
    loadOrders();
  }, []);

  // Filter orders based on search term and status
  useEffect(() => {
    let result = [...orders];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(order => 
        order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.fname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.lname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status.toLowerCase() === statusFilter.toLowerCase());
    }

    setFilteredOrders(result);
    setTotalPages(Math.ceil(result.length / ordersPerPage));
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, statusFilter, orders, ordersPerPage]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/orders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      setOrders(response.data);
      setFilteredOrders(response.data);
      setTotalPages(Math.ceil(response.data.length / ordersPerPage));
      setError(null);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      // Show loading state
      Swal.showLoading();

      // Normalize the status
      const normalizedStatus = status.toLowerCase().trim();

      // Log the request details
      console.log('Update Status Request:', {
        orderId,
        status: normalizedStatus,
        url: `/admin/orders/${orderId}`,
        token: localStorage.getItem('token')
      });

      // Make the request with explicit headers
      const response = await axios({
        method: 'put',
        url: `/admin/orders/${orderId}`,
        data: { status: normalizedStatus },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        validateStatus: function (status) {
          return status >= 200 && status < 500; // Handle all responses
        }
      });

      // Check if the request was successful
      if (response.status !== 200) {
        throw new Error(response.data.message || 'Failed to update status');
      }

      // Log the successful response
      console.log('Status Update Response:', response.data);

      // Update local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? { ...order, status: normalizedStatus }
            : order
        )
      );

      // Show success message
      Swal.fire({
        icon: 'success',
        title: 'Status Updated',
        text: `Order ${formatOrderNumber(orders.find(o => o.id === orderId).order_number)} status has been updated to ${normalizedStatus}`,
        timer: 2000,
        showConfirmButton: false
      });

      // Refresh the orders list
      await loadOrders();
    } catch (error) {
      console.error('Status Update Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        data: error.response?.data
      });

      // Show error message
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to update order status',
        showConfirmButton: true
      });

      throw error;
    }
  };

  const viewOrderDetails = async (orderId) => {
    try {
      // Show loading state
      Swal.showLoading();

      // Get order details
      const response = await axios({
        method: 'get',
        url: `/admin/orders/${orderId}`,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      const order = response.data;
      
      // Parse the concatenated data
      const productNames = order.product_names ? order.product_names.split(',') : [];
      const quantities = order.quantities ? order.quantities.split(',').map(Number) : [];
      const prices = order.prices ? order.prices.split(',').map(Number) : [];
      const productImages = order.product_images ? order.product_images.split(',') : [];

      // Format delivery address for display
      const deliveryAddressLines = order.delivery_address ? order.delivery_address.split('\n') : [];
      const formattedDeliveryAddress = deliveryAddressLines.map((line) => {
        if (line.startsWith('Contact:')) {
          return `<div class="contact-info"><i class="fas fa-phone"></i> ${line}</div>`;
        }
        return `<div class="address-line">${line}</div>`;
      }).join('');

      // Create items HTML
      const itemsHtml = productNames.map((name, index) => `
        <div class="order-item" style="margin: 10px 0; padding: 10px; border-bottom: 1px solid #eee; display: flex; align-items: center;">
          <div style="width: 60px; height: 60px; margin-right: 15px; flex-shrink: 0;">
            <img src="${productImages[index] || '/placeholder.png'}" 
                 alt="${name}"
                 style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;"
                 onerror="this.src='/placeholder.png'">
          </div>
          <div style="flex-grow: 1;">
            <div style="font-weight: bold;">${name}</div>
            <div>Quantity: ${quantities[index]}</div>
            <div>Price: ₱${prices[index].toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div>Subtotal: ₱${(prices[index] * quantities[index]).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
        </div>
      `).join('');

      Swal.fire({
        title: `Order Details <br> #${formatOrderNumber(order.order_number)}`,
        html: `
          <div class="order-details-modal" style="text-align: left;">
            <div style="margin-bottom: 20px;">
              <h4 style="color: #333;">Customer Information</h4>
              <p><strong>Name:</strong> ${order.fname} ${order.lname}</p>
              <p><strong>Email:</strong> ${order.email}</p>
              <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
              <p><strong>Status:</strong> <span class="status-badge ${order.status.toLowerCase()}">${order.status}</span></p>
            </div>

            <div style="margin-bottom: 20px;">
              <h4 style="color: #333;">Delivery Address</h4>
              <div class="delivery-info-section" style="
                background: #f8f9fa;
                border-radius: 8px;
                padding: 15px;
                margin-top: 10px;
                border: 1px solid #e1e1e1;
              ">
                <div style="display: flex; align-items: start;">
                  <i class="fas fa-map-marker-alt" style="color: #dc3545; margin-right: 10px; margin-top: 3px;"></i>
                  <div style="white-space: pre-wrap; line-height: 1.5;">
                    ${formattedDeliveryAddress || '<div style="color: #6c757d;">No delivery address provided</div>'}
                  </div>
                </div>
                ${order.status === 'shipped' ? `
                  <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #dee2e6;">
                    <small style="color: #6c757d;">
                      <i class="fas fa-truck" style="margin-right: 5px;"></i>
                      Shipped on: ${new Date(order.updated_at || order.created_at).toLocaleDateString()}
                    </small>
                  </div>
                ` : ''}
              </div>
            </div>

            <style>
              .delivery-info-section {
                background: #f8f9fa;
                border-radius: 8px;
                padding: 15px;
                margin-top: 10px;
                border: 1px solid #e1e1e1;
              }
              .address-line {
                margin-bottom: 4px;
              }
              .contact-info {
                margin-top: 8px;
                color: #666;
                display: flex;
                align-items: center;
                gap: 8px;
              }
              .contact-info i {
                color: #28a745;
              }
            </style>

            <div style="margin-bottom: 20px;">
              <h4 style="color: #333;">Payment Information</h4>
              <div class="payment-info-section" style="
                background: #f8f9fa;
                border-radius: 8px;
                padding: 15px;
                margin-top: 10px;
              ">
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                  ${getPaymentMethodIcon(order.payment_method)}
                  <span style="margin-left: 10px; font-weight: 500;">${formatPaymentMethod(order.payment_method)}</span>
                </div>
                ${getPaymentDetails(order.payment_method, order.payment_status, order.payment_details)}
                <div style="margin-top: 10px;">
                  <strong>Payment Status:</strong> 
                  <span class="payment-status ${order.payment_status.toLowerCase()}" style="
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 0.875rem;
                    margin-left: 5px;
                    background-color: ${order.payment_status === 'Paid' ? '#d4edda' : '#fff3cd'};
                    color: ${order.payment_status === 'Paid' ? '#155724' : '#856404'};
                  ">
                    ${order.payment_status}
                  </span>
                </div>
              </div>
            </div>
            
            <div style="margin-bottom: 20px;">
              <h4 style="color: #333;">Order Items</h4>
              ${itemsHtml}
            </div>

            <div style="margin-top: 20px; padding-top: 10px; border-top: 2px solid #eee;">
              <h4 style="color: #333;">Order Summary</h4>
              <p><strong>Total Amount:</strong> ₱${parseFloat(order.total_amount).toFixed(2)}</p>
            </div>
          </div>
          <style>
            .payment-info-section {
              border: 1px solid #e1e1e1;
            }
            .payment-icon {
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 50%;
              color: white;
            }
            .payment-icon.CARD {
              background: #3085d6;
            }
            .payment-icon.GCASH {
              background: #0070E0;
            }
            .payment-icon.COD {
              background: #28a745;
            }
            .payment-details {
              background: white;
              border-radius: 6px;
              padding: 10px;
              margin: 10px 0;
              border: 1px solid #e1e1e1;
            }
            .payment-details-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            .payment-details-label {
              color: #666;
              font-size: 0.9rem;
            }
            .payment-details-value {
              font-weight: 500;
            }
            .status-badge {
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 0.875rem;
              font-weight: 500;
            }
            .status-badge.pending {
              background-color: #fff3cd;
              color: #856404;
            }
            .status-badge.processing {
              background-color: #cce5ff;
              color: #004085;
            }
            .status-badge.shipped {
              background-color: #d1ecf1;
              color: #0c5460;
            }
            .status-badge.delivered {
              background-color: #d4edda;
              color: #155724;
            }
            .status-badge.cancelled {
              background-color: #f8d7da;
              color: #721c24;
            }
          </style>
        `,
        width: 600,
        showCloseButton: true,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error fetching order details:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to load order details'
      });
    }
  };

  // Helper functions for payment method display
  const formatPaymentMethod = (method) => {
    if (!method) return 'Not specified';
    switch (method.toUpperCase()) {
      case 'CARD':
        return 'Credit/Debit Card';
      case 'GCASH':
        return 'GCash';
      case 'COD':
        return 'Cash on Delivery';
      default:
        return method;
    }
  };

  const getPaymentMethodIcon = (method) => {
    if (!method) return '';
    const iconClass = {
      CARD: 'fa-credit-card',
      GCASH: 'fa-mobile-alt',
      COD: 'fa-money-bill-wave'
    }[method.toUpperCase()];

    return `
      <div class="payment-icon ${method}" style="background: ${
        {
          CARD: '#3085d6',
          GCASH: '#0070E0',
          COD: '#28a745'
        }[method] || '#6c757d'
      }">
        <i class="fas ${iconClass || 'fa-money-bill'}"></i>
      </div>
    `;
  };

  const getPaymentDetails = (method, status, details) => {
    if (!method) return '';
    const paymentDetails = details || {};
    
    const createDetailRow = (label, value) => `
      <div class="payment-details-row">
        <span class="payment-details-label">${label}</span>
        <span class="payment-details-value">${value}</span>
      </div>
    `;
    
    switch (method.toUpperCase()) {
      case 'CARD':
        return `
          <div class="payment-details">
            ${createDetailRow('Card Number', paymentDetails.maskedNumber || '**** **** **** ****')}
            ${createDetailRow('Expiry Date', paymentDetails.expiryDate || 'N/A')}
            ${createDetailRow('Payment Status', status)}
          </div>
        `;
      case 'GCASH':
        return `
          <div class="payment-details">
            ${createDetailRow('GCash Number', paymentDetails.maskedNumber || '**** **** ****')}
            ${createDetailRow('Payment Status', status)}
          </div>
        `;
      case 'COD':
        return `
          <div class="payment-details">
            ${createDetailRow('Payment Method', 'Cash on Delivery')}
            ${createDetailRow('Payment Status', status)}
            ${createDetailRow('Amount Due', paymentDetails.totalAmount ? `₱${parseFloat(paymentDetails.totalAmount).toFixed(2)}` : 'N/A')}
          </div>
        `;
      default:
        return '';
    }
  };

  const handleStatusChange = (orderId, currentStatus) => {
    Swal.fire({
      title: 'Update Order Status',
      html: `
        <div style="margin-bottom: 15px;">
          <p>Current Status: <strong>${currentStatus}</strong></p>
        </div>
      `,
      input: 'select',
      inputOptions: {
        'pending': 'Pending',
        'processing': 'Processing',
        'shipped': 'Shipped',
        'delivered': 'Delivered',
        'cancelled': 'Cancelled'
      },
      inputValue: currentStatus.toLowerCase(),
      inputPlaceholder: 'Select a status',
      showCancelButton: true,
      confirmButtonText: 'Update',
      showLoaderOnConfirm: true,
      inputValidator: (value) => {
        if (!value) {
          return 'Please select a status';
        }
        if (value === currentStatus.toLowerCase()) {
          return 'Please select a different status';
        }
      },
      preConfirm: async (status) => {
        try {
          await updateOrderStatus(orderId, status);
          return true;
        } catch (error) {
          Swal.showValidationMessage(error.message || 'Failed to update status');
          return false;
        }
      }
    });
  };

  // Calculate the current orders to display based on pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Generate page numbers for pagination
  const renderPaginationItems = () => {
    const pageItems = [];
    
    // Previous button
    pageItems.push(
      <Pagination.Prev 
        key="prev" 
        onClick={() => currentPage > 1 && paginate(currentPage - 1)}
        disabled={currentPage === 1}
      />
    );

    // First page
    if (currentPage > 3) {
      pageItems.push(
        <Pagination.Item key={1} onClick={() => paginate(1)}>
          1
        </Pagination.Item>
      );
      
      if (currentPage > 4) {
        pageItems.push(<Pagination.Ellipsis key="ellipsis1" />);
      }
    }

    // Pages around current page
    for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) {
      pageItems.push(
        <Pagination.Item 
          key={i} 
          active={i === currentPage}
          onClick={() => paginate(i)}
        >
          {i}
        </Pagination.Item>
      );
    }

    // Last page
    if (currentPage < totalPages - 2) {
      if (currentPage < totalPages - 3) {
        pageItems.push(<Pagination.Ellipsis key="ellipsis2" />);
      }
      
      pageItems.push(
        <Pagination.Item key={totalPages} onClick={() => paginate(totalPages)}>
          {totalPages}
        </Pagination.Item>
      );
    }

    // Next button
    pageItems.push(
      <Pagination.Next 
        key="next" 
        onClick={() => currentPage < totalPages && paginate(currentPage + 1)}
        disabled={currentPage === totalPages || totalPages === 0}
      />
    );

    return pageItems;
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <div className="alert alert-danger" role="alert">
          {error}
          <button 
            className="btn btn-link"
            onClick={loadOrders}
          >
            Try Again
          </button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Order Management</h2>
        <Button 
          variant="primary"
          onClick={loadOrders}
        >
          Refresh Orders
        </Button>
      </div>

      {/* Search and Filters */}
      <Row className="mb-4 g-3">
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text>
              <i className="bx bx-search"></i>
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search by order number, customer name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={4}>
          <Form.Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            {statuses.map(status => (
              <option key={status} value={status.toLowerCase()}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={2}>
          <Form.Select
            value={ordersPerPage}
            onChange={(e) => setOrdersPerPage(Number(e.target.value))}
            aria-label="Orders per page"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </Form.Select>
        </Col>
      </Row>
      
      <Table responsive striped bordered hover>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Email</th>
            <th>Date</th>
            <th>Total Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentOrders.map(order => (
            <tr key={order.id}>
              <td>
                <span className="order-number">
                  {formatOrderNumber(order.order_number)}
                </span>
              </td>
              <td>{order.fname} {order.lname}</td>
              <td>{order.email}</td>
              <td>{new Date(order.created_at).toLocaleDateString()}</td>
              <td>₱{parseFloat(order.total_amount).toFixed(2)}</td>
              <td>
                <span className={`status-badge ${order.status.toLowerCase()}`}>
                  {order.status}
                </span>
              </td>
              <td>
                <div className="d-flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleStatusChange(order.id, order.status)}
                  >
                    Update Status
                  </Button>
                  <Button
                    variant="info"
                    size="sm"
                    onClick={() => viewOrderDetails(order.id)}
                  >
                    View Details
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={async () => {
                      try {
                        Swal.showLoading();
                        const response = await axios.get(`/admin/orders/${order.id}`);
                        const orderData = response.data;
                        
                        // Parse the concatenated data
                        const productNames = orderData.product_names ? orderData.product_names.split(',') : [];
                        const quantities = orderData.quantities ? orderData.quantities.split(',').map(Number) : [];
                        const prices = orderData.prices ? orderData.prices.split(',').map(Number) : [];

                        // Create product details table
                        const productsTable = productNames.map((name, index) => `
                          <tr>
                            <td>${name}</td>
                            <td>${quantities[index]}</td>
                            <td>₱${prices[index].toFixed(2)}</td>
                            <td>₱${(prices[index] * quantities[index]).toFixed(2)}</td>
                          </tr>
                        `).join('');

                        Swal.fire({
                          title: `Products in Order #${order.id}`,
                          html: `
                            <div class="table-responsive">
                              <table class="table table-bordered">
                                <thead>
                                  <tr>
                                    <th>Product</th>
                                    <th>Quantity</th>
                                    <th>Unit Price</th>
                                    <th>Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  ${productsTable}
                                </tbody>
                                <tfoot>
                                  <tr>
                                    <td colspan="3" class="text-end"><strong>Total:</strong></td>
                                    <td><strong>₱${parseFloat(orderData.total_amount).toFixed(2)}</strong></td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          `,
                          width: 800,
                          showCloseButton: true,
                          showConfirmButton: false
                        });
                      } catch (error) {
                        console.error('Error fetching product details:', error);
                        Swal.fire({
                          icon: 'error',
                          title: 'Error',
                          text: 'Failed to load product details'
                        });
                      }
                    }}
                  >
                    Products
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-5">
          <h4>No orders found</h4>
          <p>No orders match your current filters</p>
        </div>
      ) : (
        <div className="d-flex justify-content-between align-items-center mt-4">
          <div>
            Showing {indexOfFirstOrder + 1} to {Math.min(indexOfLastOrder, filteredOrders.length)} of {filteredOrders.length} entries
          </div>
          <Pagination>{renderPaginationItems()}</Pagination>
        </div>
      )}

      <style jsx>{`
        .order-number {
          font-family: 'Roboto Mono', monospace;
          font-weight: 500;
          color: #2d3748;
          padding: 0.25rem 0.5rem;
          background: #f7fafc;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
        }
        .pagination {
          margin-bottom: 0;
        }
      `}</style>
    </Container>
  );
};

export default OrderManagement;