import './admindashboard.scss';

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  RadialLinearScale,
  Title,
  Tooltip
} from 'chart.js';
import { Bar, Doughnut, Line, PolarArea } from 'react-chartjs-2';
import React, { useCallback, useEffect, useState } from 'react';

import Customers from './components/Customers';
import Dashboard from './components/Dashboard';
import OrderManagement from './components/OrderManagement';
import Orders from './components/Orders';
import Products from './components/Products';
import Settings from './components/Settings';
import Swal from 'sweetalert2';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler
);

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showStoreInfo, setShowStoreInfo] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  const [statsLoading, setStatsLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [storeSettings, setStoreSettings] = useState({
    store_name: 'SneakerHub Admin',
    store_email: '',
    contact_number: '',
    address: ''
  });
  const itemsPerPage = 10;
  const paginatedOrders = filteredOrders.length > 0 ? filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) : orders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const [graphData, setGraphData] = useState(null);
  const [graphLoading, setGraphLoading] = useState(true);
  const [monthlySalesData, setMonthlySalesData] = useState(null);
  const [monthlyOrdersData, setMonthlyOrdersData] = useState(null);
  const navigate = useNavigate();

  // Set up axios defaults
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    axios.defaults.baseURL = 'http://localhost:3000';
    
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('token');
          navigate('/login');
        }
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, [navigate]);

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const response = await axios.get('/admin/stats');
      setStats(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch data based on active page
  const fetchPageData = useCallback(async () => {
    try {
      setPageLoading(true);
      setError(null); // Clear any previous errors
      
      let response;
      switch (activePage) {
        case 'products':
          response = await axios.get('/admin/products');
          if (response.data) {
          setProducts(response.data);
          }
          break;
        case 'orders':
          response = await axios.get('/admin/orders');
          if (response.data) {
          setOrders(response.data);
          }
          break;
        case 'customers':
          response = await axios.get('/admin/users');
          if (response.data) {
          setCustomers(response.data);
          }
          break;
        case 'dashboard':
          // Fetch both stats and orders for dashboard
          const [statsResponse, ordersResponse] = await Promise.all([
            axios.get('/admin/stats'),
            axios.get('/admin/orders')
          ]);
          
          if (statsResponse.data) {
            setStats(statsResponse.data);
          }
          if (ordersResponse.data) {
            setOrders(ordersResponse.data);
          }
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(`Failed to load ${activePage} data. ${err.response?.data?.message || err.message}`);
    } finally {
      setPageLoading(false);
    }
  }, [activePage]);

  // Function to fetch graph data
  const fetchGraphData = useCallback(async () => {
    try {
      setGraphLoading(true);
      const response = await axios.get('/admin/orders');
      
      // Process orders data for daily graph
      const ordersByDate = response.data.reduce((acc, order) => {
        const date = new Date(order.created_at).toLocaleDateString();
        acc[date] = acc[date] || { sales: 0, orders: 0 };
        acc[date].sales += Number(order.total_amount);
        acc[date].orders += 1;
        return acc;
      }, {});

      // Process orders data for monthly graphs
      const monthlyData = response.data.reduce((acc, order) => {
        const date = new Date(order.created_at);
        const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        
        if (!acc[monthYear]) {
          acc[monthYear] = {
            sales: 0,
            orders: 0
          };
        }
        
        acc[monthYear].sales += Number(order.total_amount);
        acc[monthYear].orders += 1;
        return acc;
      }, {});

      // Get last 6 months
      const last6Months = [...Array(6)].map((_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return date.toLocaleString('default', { month: 'long', year: 'numeric' });
      }).reverse();

      // Get the last 7 days
      const last7Days = [...Array(7)].map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toLocaleDateString();
      }).reverse();

      // Prepare data for daily graph
      const salesData = last7Days.map(date => ordersByDate[date]?.sales || 0);
      const ordersData = last7Days.map(date => ordersByDate[date]?.orders || 0);

      // Set daily graph data with gradient background
      setGraphData({
        labels: last7Days,
        datasets: [
          {
            label: 'Sales (₱)',
            data: salesData,
            borderColor: 'rgb(94, 211, 243)',
            backgroundColor: (context) => {
              const chart = context.chart;
              const { ctx, chartArea } = chart;
              if (!chartArea) return null;
              const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
              gradient.addColorStop(0, 'rgba(94, 211, 243, 0.0)');
              gradient.addColorStop(1, 'rgba(94, 211, 243, 0.3)');
              return gradient;
            },
            fill: true,
            tension: 0.4,
            yAxisID: 'y',
            pointBackgroundColor: 'rgb(94, 211, 243)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Orders',
            data: ordersData,
            borderColor: 'rgb(255, 159, 64)',
            backgroundColor: 'rgba(255, 159, 64, 0.7)',
            yAxisID: 'y1',
            type: 'bar',
            borderRadius: 6
          }
        ],
        options: {
          responsive: true,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.parsed.y !== null) {
                    if (context.dataset.label === 'Sales (₱)') {
                      label += '₱' + Number(context.parsed.y).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    } else {
                      label += context.parsed.y;
                    }
                  }
                  return label;
                }
              }
            }
          },
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              ticks: {
                callback: function(value) {
                  return '₱' + Number(value).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              grid: {
                drawOnChartArea: false,
              },
            }
          }
        }
      });

      // Set monthly sales data with area chart
      setMonthlySalesData({
        labels: last6Months,
        datasets: [{
          label: 'Monthly Sales (₱)',
          data: last6Months.map(month => monthlyData[month]?.sales || 0),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return null;
            const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
            gradient.addColorStop(0, 'rgba(75, 192, 192, 0.0)');
            gradient.addColorStop(1, 'rgba(75, 192, 192, 0.3)');
            return gradient;
          },
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(75, 192, 192)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }],
        options: {
          responsive: true,
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.parsed.y !== null) {
                    label += '₱' + Number(context.parsed.y).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  }
                  return label;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return '₱' + Number(value).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
              }
            }
          }
        }
      });

      // Set monthly orders data with status breakdown
      const orderStatusColors = {
        delivered: {
          border: 'rgb(40, 167, 69)',
          background: 'rgba(40, 167, 69, 0.7)'
        },
        processing: {
          border: 'rgb(255, 193, 7)',
          background: 'rgba(255, 193, 7, 0.7)'
        },
        shipped: {
          border: 'rgb(23, 162, 184)',
          background: 'rgba(23, 162, 184, 0.7)'
        },
        cancelled: {
          border: 'rgb(220, 53, 69)',
          background: 'rgba(220, 53, 69, 0.7)'
        }
      };

      // Process orders by status
      const monthlyOrdersByStatus = last6Months.reduce((acc, month) => {
        acc[month] = {
          delivered: 0,
          processing: 0,
          shipped: 0,
          cancelled: 0
        };
        return acc;
      }, {});

      response.data.forEach(order => {
        const date = new Date(order.created_at);
        const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (monthlyOrdersByStatus[monthYear] && order.status) {
          monthlyOrdersByStatus[monthYear][order.status]++;
        }
      });

      setMonthlyOrdersData({
        labels: last6Months,
        datasets: [
          {
            label: 'Delivered',
            data: last6Months.map(month => monthlyOrdersByStatus[month].delivered),
            backgroundColor: (context) => {
              const chart = context.chart;
              const { ctx, chartArea } = chart;
              if (!chartArea) return orderStatusColors.delivered.background;
              const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
              gradient.addColorStop(0, 'rgba(40, 167, 69, 0.4)');
              gradient.addColorStop(1, 'rgba(40, 167, 69, 0.8)');
              return gradient;
            },
            borderColor: orderStatusColors.delivered.border,
            borderWidth: 1,
            borderRadius: 4,
          },
          {
            label: 'Processing',
            data: last6Months.map(month => monthlyOrdersByStatus[month].processing),
            backgroundColor: (context) => {
              const chart = context.chart;
              const { ctx, chartArea } = chart;
              if (!chartArea) return orderStatusColors.processing.background;
              const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
              gradient.addColorStop(0, 'rgba(255, 193, 7, 0.4)');
              gradient.addColorStop(1, 'rgba(255, 193, 7, 0.8)');
              return gradient;
            },
            borderColor: orderStatusColors.processing.border,
            borderWidth: 1,
            borderRadius: 4,
          },
          {
            label: 'Shipped',
            data: last6Months.map(month => monthlyOrdersByStatus[month].shipped),
            backgroundColor: (context) => {
              const chart = context.chart;
              const { ctx, chartArea } = chart;
              if (!chartArea) return orderStatusColors.shipped.background;
              const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
              gradient.addColorStop(0, 'rgba(23, 162, 184, 0.4)');
              gradient.addColorStop(1, 'rgba(23, 162, 184, 0.8)');
              return gradient;
            },
            borderColor: orderStatusColors.shipped.border,
            borderWidth: 1,
            borderRadius: 4,
          },
          {
            label: 'Cancelled',
            data: last6Months.map(month => monthlyOrdersByStatus[month].cancelled),
            backgroundColor: (context) => {
              const chart = context.chart;
              const { ctx, chartArea } = chart;
              if (!chartArea) return orderStatusColors.cancelled.background;
              const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
              gradient.addColorStop(0, 'rgba(220, 53, 69, 0.4)');
              gradient.addColorStop(1, 'rgba(220, 53, 69, 0.8)');
              return gradient;
            },
            borderColor: orderStatusColors.cancelled.border,
            borderWidth: 1,
            borderRadius: 4,
          }
        ]
      });

    } catch (err) {
      console.error('Error fetching graph data:', err);
      setError('Failed to load graph data');
    } finally {
      setGraphLoading(false);
    }
  }, []);

  // Add this new function after fetchGraphData
  const groupOrdersByCustomer = (orders) => {
    return orders.reduce((acc, order) => {
      const customerId = order.customer_id;
      if (!acc[customerId]) {
        acc[customerId] = {
          customerInfo: {
            id: order.customer_id,
            name: `${order.fname} ${order.lname}`,
            email: order.email,
            totalOrders: 0,
            totalSpent: 0
          },
          orders: []
        };
      }
      acc[customerId].customerInfo.totalOrders++;
      acc[customerId].customerInfo.totalSpent += Number(order.total_amount);
      acc[customerId].orders.push(order);
      return acc;
    }, {});
  };

  // Add fetchStoreSettings after other fetch functions
  const fetchStoreSettings = useCallback(async () => {
    try {
      const response = await axios.get('/admin/settings');
      setStoreSettings(response.data);
    } catch (error) {
      console.error('Error fetching store settings:', error);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData, activePage]);

  useEffect(() => {
    if (activePage === 'dashboard') {
      fetchGraphData();
    }
  }, [fetchGraphData, activePage]);

  useEffect(() => {
    fetchStoreSettings();
  }, [fetchStoreSettings]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setStatsLoading(false);
      setPageLoading(false);
      setError('Request timed out. Please try again.');
    });

    return () => clearTimeout(timeout);
  }, []);

  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You will be logged out of the admin dashboard",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, logout'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        navigate('/login');
      }
    });
  };

  const handlePageChange = (page) => {
    setActivePage(page);
    setCurrentPage(1);
    setPageLoading(true);
  };

  const handleAddProduct = async (formData) => {
    try {
      // Use axios with FormData to handle file upload
      await axios.post('/admin/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Product added successfully'
      });
      
      // Refresh products list
      const response = await axios.get('/admin/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error adding product:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to add product'
      });
    }
  };
  
  const handleUpdateProduct = async (productId, formData) => {
    try {
      // Use axios with FormData to handle file upload
      await axios.put(`/admin/products/${productId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Product updated successfully'
      });
      
      // Refresh products list
      const response = await axios.get('/admin/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error updating product:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update product'
      });
    }
  };
  
  const handleDeleteProduct = async (productId) => {
    try {
      await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
      }).then(async (result) => {
        if (result.isConfirmed) {
          await axios.delete(`/admin/products/${productId}`);
          Swal.fire('Deleted!', 'Product has been deleted.', 'success');
          
          // Refresh products list
          const response = await axios.get('/admin/products');
          setProducts(response.data);
        }
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to delete product'
      });
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`/admin/orders/${orderId}/status`, { status: newStatus });
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Order status updated successfully'
      });
      // Refresh orders list
      fetchPageData();
    } catch (error) {
      console.error('Error updating order status:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update order status'
    });
    }
  };

  const toggleStoreInfo = (e) => {
    e.preventDefault();
    setShowStoreInfo(!showStoreInfo);
  };

  const renderPageContent = () => {
    if (pageLoading) {
      return (
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="alert alert-danger" role="alert">
          {error}
          <button 
            className="btn btn-link"
            onClick={() => {
              setError(null);
              fetchPageData();
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    try {
    switch (activePage) {
      case 'dashboard':
        return (
          <Dashboard
            stats={stats}
            orders={orders}
            statsLoading={statsLoading}
            graphLoading={graphLoading}
            graphData={graphData}
            monthlySalesData={monthlySalesData}
            monthlyOrdersData={monthlyOrdersData}
            handlePageChange={setActivePage}
          />
        );
        case 'products':
          return (
          <Products
            products={products}
            handleAddProduct={handleAddProduct}
            handleUpdateProduct={handleUpdateProduct}
            handleDeleteProduct={handleDeleteProduct}
          />
        );
        case 'orders':
        return <Orders orders={orders} />;
      case 'customers':
        return <Customers customers={customers} orders={orders} />;
        case 'order-management':
          return <OrderManagement />;
        case 'settings':
          return <Settings />;
      default:
        return null;
    }
    } catch (err) {
      console.error('Error rendering content:', err);
      return (
        <div className="alert alert-danger">
          <p>An error occurred while displaying this content.</p>
          <button 
            className="btn btn-link"
            onClick={() => {
              setError(null);
              fetchPageData();
            }}
          >
            Try Again
          </button>
        </div>
      );
    }
  };

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className={`sidebar ${sidebarOpen ? '' : 'closed'}`}>
          {/* Sidebar content */}
        </div>
        <div className={`main-content ${sidebarOpen ? '' : 'sidebar-closed'}`}>
          <div className="alert alert-danger" role="alert">
            {error}
            <button 
              className="btn btn-link"
              onClick={() => {
                setError(null);
                fetchPageData();
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className={`sidebar ${sidebarOpen ? '' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="store-info-container">
            <button 
              className="store-name-btn"
              onClick={toggleStoreInfo}
            >
              <h3>{storeSettings.store_name || 'SneakerHub Admin'}</h3>
              <i className={`bx ${showStoreInfo ? 'bx-chevron-up' : 'bx-chevron-down'}`}></i>
            </button>
            {showStoreInfo && (
              <div className="store-info-dropdown">
                {storeSettings.store_email && (
                  <div className="info-item">
                    <i className='bx bx-envelope'></i>
                    <span>{storeSettings.store_email}</span>
                  </div>
                )}
                {storeSettings.contact_number && (
                  <div className="info-item">
                    <i className='bx bx-phone'></i>
                    <span>{storeSettings.contact_number}</span>
                  </div>
                )}
                {storeSettings.address && (
                  <div className="info-item">
                    <i className='bx bx-map'></i>
                    <span>{storeSettings.address}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <button 
            className="toggle-btn" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <i className={`bx ${sidebarOpen ? 'bx-menu-alt-left' : 'bx-menu-alt-right'}`}></i>
          </button>
        </div>
        <div className="sidebar-nav">
          <button 
            className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
            onClick={() => handlePageChange('dashboard')}
          >
            <i className="bx bxs-dashboard"></i>
            <span>Dashboard</span>
          </button>
          <button 
            className={`nav-item ${activePage === 'products' ? 'active' : ''}`}
            onClick={() => handlePageChange('products')}
          >
            <i className="bx bxs-shopping-bag"></i>
            <span>Products</span>
          </button>
          <button 
            className={`nav-item ${activePage === 'orders' ? 'active' : ''}`}
            onClick={() => handlePageChange('orders')}
          >
            <i className="bx bxs-cart"></i>
            <span>Orders</span>
          </button>
          <button 
            className={`nav-item ${activePage === 'customers' ? 'active' : ''}`}
            onClick={() => handlePageChange('customers')}
          >
            <i className="bx bxs-user"></i>
            <span>Customers</span>
          </button>
          <button 
            className={`nav-item ${activePage === 'order-management' ? 'active' : ''}`}
            onClick={() => handlePageChange('order-management')}
          >
            <i className="bx bxs-package"></i>
            <span>Order Management</span>
          </button>
          <button 
            className={`nav-item ${activePage === 'settings' ? 'active' : ''}`}
            onClick={() => handlePageChange('settings')}
          >
            <i className="bx bxs-cog"></i>
            <span>Settings</span>
          </button>
          <button 
            className="nav-item logout"
            onClick={handleLogout}
          >
            <i className="bx bxs-log-out"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>
      <div className={`main-content ${sidebarOpen ? '' : 'sidebar-closed'}`}>
        {renderPageContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;
