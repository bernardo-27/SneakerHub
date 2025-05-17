import React, { useState, useEffect } from 'react';
import { Badge, Table, Form, Row, Col, InputGroup, Pagination } from 'react-bootstrap';
import { formatOrderNumber } from '../../../utils/formatters';

const Orders = ({ orders }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredOrders, setFilteredOrders] = useState(orders);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(10);
  
  // Get unique statuses from orders
  const statuses = [...new Set(orders.map(order => order.status))];

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
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, statusFilter, orders]);

  // Logic for displaying current orders
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  // Calculate total pages
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Get pagination items
  const getPaginationItems = () => {
    const items = [];
    
    // Previous button
    items.push(
      <Pagination.Prev 
        key="prev" 
        onClick={() => currentPage > 1 && paginate(currentPage - 1)}
        disabled={currentPage === 1}
      />
    );
    
    // First page
    items.push(
      <Pagination.Item
        key={1}
        active={currentPage === 1}
        onClick={() => paginate(1)}
      >
        1
      </Pagination.Item>
    );
    
    // Ellipsis if needed
    if (currentPage > 3) {
      items.push(<Pagination.Ellipsis key="ellipsis1" disabled />);
    }
    
    // Pages around current page
    for (let number = Math.max(2, currentPage - 1); 
         number <= Math.min(totalPages - 1, currentPage + 1); 
         number++) {
      if (number === 1 || number === totalPages) continue; // Skip first and last pages as they're added separately
      
      items.push(
        <Pagination.Item
          key={number}
          active={currentPage === number}
          onClick={() => paginate(number)}
        >
          {number}
        </Pagination.Item>
      );
    }
    
    // Ellipsis if needed
    if (currentPage < totalPages - 2) {
      items.push(<Pagination.Ellipsis key="ellipsis2" disabled />);
    }
    
    // Last page if more than one page
    if (totalPages > 1) {
      items.push(
        <Pagination.Item
          key={totalPages}
          active={currentPage === totalPages}
          onClick={() => paginate(totalPages)}
        >
          {totalPages}
        </Pagination.Item>
      );
    }
    
    // Next button
    items.push(
      <Pagination.Next 
        key="next" 
        onClick={() => currentPage < totalPages && paginate(currentPage + 1)}
        disabled={currentPage === totalPages || totalPages === 0}
      />
    );
    
    return items;
  };

  return (
    <div className="orders-container p-4">
      <h2 className="mb-4">Orders</h2>

      {/* Filters and Search */}
      <Row className="mb-4 g-3">
        <Col md={4}>
          <InputGroup>
            <InputGroup.Text>
              <i className="bx bx-search"></i>
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search order number, customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={3}>
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
            onChange={(e) => {
              setOrdersPerPage(Number(e.target.value));
              setCurrentPage(1); // Reset to first page when changing items per page
            }}
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </Form.Select>
        </Col>
      </Row>
      
      <Table responsive striped bordered hover>
        <thead>
          <tr>
            <th>Order Number</th>
            <th>Customer</th>
            <th>Email</th>
            <th>Date</th>
            <th>Total Amount</th>
            <th>Status</th>
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
              <td className="peso-amount">₱{Number(order.total_amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td>
                <Badge bg={
                  order.status === 'delivered' ? 'success' :
                  order.status === 'processing' ? 'warning' :
                  order.status === 'shipped' ? 'info' :
                  order.status === 'cancelled' ? 'danger' : 'secondary'
                }>
                  {order.status}
                </Badge>
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
            Showing {indexOfFirstOrder + 1}-{Math.min(indexOfLastOrder, filteredOrders.length)} of {filteredOrders.length} orders
          </div>
          <Pagination className="mb-0">
            {getPaginationItems()}
          </Pagination>
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
      `}</style>
    </div>
  );
};

export default Orders;