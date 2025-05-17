import React, { useState } from 'react';

const Customers = ({ customers, orders }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Calculate customer statistics
  const customerStats = React.useMemo(() => {
    if (!customers?.length || !orders?.length) {
      return {
        totalCustomers: customers?.length || 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalItems: 0,
        averageOrderValue: 0,
        ordersPerCustomer: 0
      };
    }

    const stats = customers.reduce((stats, customer) => {
      const customerOrders = orders.filter(order => order.user_id === customer.id);
      const totalSpent = customerOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
      const totalItems = customerOrders.reduce((sum, order) => sum + Number(order.quantity || 0), 0);
      
      return {
        totalCustomers: stats.totalCustomers + 1,
        totalOrders: stats.totalOrders + customerOrders.length,
        totalRevenue: stats.totalRevenue + totalSpent,
        totalItems: stats.totalItems + totalItems,
      };
    }, {
      totalCustomers: 0,
      totalOrders: 0,
      totalRevenue: 0,
      totalItems: 0
    });

    return {
      ...stats,
      ordersPerCustomer: stats.totalCustomers > 0 ? (stats.totalOrders / stats.totalCustomers) : 0,
      averageOrderValue: stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders) : 0,
      revenuePerCustomer: stats.totalCustomers > 0 ? (stats.totalRevenue / stats.totalCustomers) : 0
    };
  }, [customers, orders]);

  const sortedCustomers = React.useMemo(() => {
    let sortableCustomers = [...customers];
    if (sortConfig.key !== null) {
      sortableCustomers.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableCustomers;
  }, [customers, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredCustomers = sortedCustomers.filter(customer => {
    const searchString = searchTerm.toLowerCase();
    return (
      customer.fname.toLowerCase().includes(searchString) ||
      customer.lname.toLowerCase().includes(searchString) ||
      customer.email.toLowerCase().includes(searchString)
    );
  });

  return (
    <div className="container-fluid">
      {/* Overall Statistics */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card bg-dark text-white">
            <div className="card-body">
              <h5 className="card-title mb-4 text-white">Customer Overview</h5>
              <div className="row g-4">
                <div className="col-md-3">
                  <div className="stat-item">
                    <div className="stat-icon">
                      <i className="bx bx-user-circle"></i>
                    </div>
                    <div className="stat-info">
                      <h6>Total Customers</h6>
                      <h3>{customerStats.totalCustomers}</h3>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-item">
                    <div className="stat-icon">
                      <i className="bx bx-package"></i>
                    </div>
                    <div className="stat-info">
                      <h6>Total Orders</h6>
                      <h3>{customerStats.totalOrders}</h3>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-item">
                    <div className="stat-icon">
                      <i className="bx bx-dollar-circle"></i>
                    </div>
                    <div className="stat-info">
                      <h6>Total Revenue</h6>
                      <h3>₱{customerStats.totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-item">
                    <div className="stat-icon">
                      <i className="bx bx-line-chart"></i>
                    </div>
                    <div className="stat-info">
                      <h6>Avg. Order Value</h6>
                      <h3>₱{customerStats.averageOrderValue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5 className="card-title">Customer Management</h5>
            <div className="search-box">
              <input
                type="text"
                className="form-control"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th onClick={() => requestSort('id')} style={{ cursor: 'pointer' }}>
                    ID {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => requestSort('fname')} style={{ cursor: 'pointer' }}>
                    Name {sortConfig.key === 'fname' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => requestSort('email')} style={{ cursor: 'pointer' }}>
                    Email {sortConfig.key === 'email' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => requestSort('created_at')} style={{ cursor: 'pointer' }}>
                    Joined {sortConfig.key === 'created_at' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => requestSort('total_orders')} style={{ cursor: 'pointer' }}>
                    Orders {sortConfig.key === 'total_orders' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => requestSort('total_spent')} style={{ cursor: 'pointer' }}>
                    Total Spent {sortConfig.key === 'total_spent' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(customer => {
                  const customerOrders = orders.filter(order => order.user_id === customer.id);
                  const totalSpent = customerOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
                  return (
                    <tr key={customer.id}>
                      <td>{customer.id}</td>
                      <td>{`${customer.fname} ${customer.lname}`}</td>
                      <td>{customer.email}</td>
                      <td>{new Date(customer.created_at).toLocaleDateString()}</td>
                      <td>{customerOrders.length}</td>
                      <td>₱{totalSpent.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-4">
              <p className="mb-0">No customers found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Customers; 