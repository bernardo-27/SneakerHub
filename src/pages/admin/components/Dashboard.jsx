import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { Card, Row, Col, Button } from 'react-bootstrap';

const Dashboard = ({ stats, orders, statsLoading, graphLoading, graphData, monthlySalesData, monthlyOrdersData, handlePageChange }) => {
  if (statsLoading || graphLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard p-4">
      <h2 className="mb-4">Dashboard Overview</h2>
      
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <h6 className="text-muted">Total Sales</h6>
              <h3 className="mb-0">₱{Number(stats?.totalSales || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <h6 className="text-muted">Total Orders</h6>
              <h3 className="mb-0">{stats?.totalOrders || 0}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <h6 className="text-muted">Total Products</h6>
              <h3 className="mb-0">{stats?.totalProducts || 0}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <h6 className="text-muted">Total Customers</h6>
              <h3 className="mb-0">{stats?.totalCustomers || 0}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Body>
              <h5 className="card-title mb-4">Sales & Orders Overview</h5>
              {graphData && <Line data={graphData} options={graphData.options} />}
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <h5 className="card-title mb-4">Recent Orders</h5>
              <div className="recent-orders">
                {orders.slice(0, 5).map(order => (
                  <div key={order.id} className="order-item mb-3 p-2 border-bottom">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-bold">{order.order_number || `SH${String(order.id).padStart(8, '0')}`}</div>
                        <small className="text-muted">{new Date(order.created_at).toLocaleDateString()}</small>
                      </div>
                      <div className="text-end">
                        <div className="fw-bold">₱{Number(order.total_amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <span className={`badge bg-${order.status.toLowerCase() === 'delivered' ? 'success' : 
                          order.status.toLowerCase() === 'processing' ? 'warning' : 
                          order.status.toLowerCase() === 'shipped' ? 'info' : 
                          'secondary'}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="outline-primary" 
                  className="w-100"
                  onClick={() => handlePageChange('orders')}
                >
                  View All Orders
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        <Col md={6}>
          <Card className="shadow-sm">
            <Card.Body>
              <h5 className="card-title mb-4">Monthly Sales Trend</h5>
              {monthlySalesData && <Line data={monthlySalesData} options={monthlySalesData.options} />}
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="shadow-sm">
            <Card.Body>
              <h5 className="card-title mb-4">Order Status Distribution</h5>
              {monthlyOrdersData && <Bar data={monthlyOrdersData} options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                  title: {
                    display: false
                  }
                },
                scales: {
                  x: {
                    stacked: true,
                  },
                  y: {
                    stacked: true,
                    beginAtZero: true
                  }
                }
              }} />}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 