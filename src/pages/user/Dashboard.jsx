import "../styles/Dashboard.scss"

import { Button, Card, Col, Container, Form, InputGroup, Row } from 'react-bootstrap';
import React, { useCallback, useEffect, useState } from 'react';

import Swal from 'sweetalert2';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingProductId, setProcessingProductId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

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

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/products');
      setProducts(response.data);
      setFilteredProducts(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Filter products based on search term and brand
  useEffect(() => {
    let result = [...products];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply brand filter
    if (brandFilter !== 'all') {
      result = result.filter(product =>
        product.brand.toLowerCase() === brandFilter.toLowerCase()
      );
    }

    setFilteredProducts(result);
  }, [searchTerm, brandFilter, products]);

  // Get unique brands from products
  const brands = [...new Set(products.map(product => product.brand))];

  const addToCart = async (product) => {
    try {
      const result = await Swal.fire({
        title: 'Add to Cart?',
        html: `
          <div class="product-confirm">
            <img src="${product.image_url || "https://via.placeholder.com/100"}" 
                 alt="${product.name}" 
                 style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;"
            />
            <div>
              <h6>${product.name}</h6>
              <p class="text-muted">Price: ₱${parseFloat(product.price).toFixed(2)}</p>
            </div>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, add it!',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        setProcessingProductId(product.id);
        
        const productId = product.id || product.product_id;
        
        await axios.post('/cart', {
          product_id: productId,
          quantity: 1
        });

        Swal.fire({
          title: 'Added to Cart!',
          text: 'Product has been added to your cart',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Failed to add product to cart'
      });
    } finally {
      setProcessingProductId(null);
    }
  };

  const buyNow = async (product) => {
    try {
      const result = await Swal.fire({
        title: 'Buy Now?',
        html: `
          <div class="product-confirm">
            <img src="${product.image_url || "https://via.placeholder.com/100"}" 
                 alt="${product.name}" 
                 style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;"
            />
            <div>
              <h6>${product.name}</h6>
              <p class="text-muted">Price: ₱${parseFloat(product.price).toFixed(2)}</p>
            </div>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, buy now!',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        setProcessingProductId(product.id);
        
        const productId = product.id || product.product_id;
        
        await axios.post('/cart', {
          product_id: productId,
          quantity: 1
        });
        
        // Show processing message before navigation
        Swal.fire({
          title: 'Processing...',
          text: 'Taking you to checkout',
          icon: 'info',
          timer: 1000,
          showConfirmButton: false
        }).then(() => {
          navigate('/cart');
        });
      }
    } catch (err) {
      console.error('Error in buy now:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Failed to process buy now'
      });
      setProcessingProductId(null);
    }
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, brandFilter]);

  if (error) {
    return (
      <Container fluid className="py-4 bg-light min-vh-100">
        <div className="alert alert-danger" role="alert">
          {error}
          <button 
            className="btn btn-link"
            onClick={() => {
              setError(null);
              fetchProducts();
            }}
          >
            Try Again
          </button>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4 bg-light min-vh-100">
      <h2 className="text-center fw-bold mb-4">All Products</h2>

      {/* Search and Filter Section */}
      <Row className="mb-4 g-3">
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text>
              <i className="bx bx-search"></i>
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search products by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={6}>
          <Form.Select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
          >
            <option value="all">All Brands</option>
            {brands.map(brand => (
              <option key={brand} value={brand.toLowerCase()}>
                {brand}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>

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
      ) : (
        <>
          {filteredProducts && filteredProducts.length > 0 ? (
            <Row xs={1} md={2} lg={3} xl={4} className="g-4">
              {currentItems.map(product => (
                <Col key={product.id}>
                  <Card className="h-100 shadow border-0 rounded-4">
                    <div className="overflow-hidden rounded-top-4" style={{ height: '250px' }}>
                      <Card.Img
                        variant="top"
                        src={product.image_url || "https://via.placeholder.com/300"}
                        alt={product.name}
                        style={{ objectFit: 'contain', width: '80%', height: '80%', }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/300";
                        }}
                      />
                    </div>
                    <Card.Body className="d-flex flex-column">
                      <Card.Title className="fs-5 fw-semibold mb-1">{product.name}</Card.Title>
                      <Card.Text className="text-muted small mb-2">{product.description}</Card.Text>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0 text-primary">₱{parseFloat(product.price).toFixed(2)}</h5>
                        <span className="text-muted small">Stock: {product.stock}</span>
                      </div>
                      <div className="mt-auto d-flex gap-2">
                        <Button 
                          variant="outline-primary" 
                          className="w-50 rounded-pill" 
                          size="sm"
                          onClick={() => addToCart(product)}
                          disabled={product.stock === 0 || processingProductId === product.id}
                        >
                          {processingProductId === product.id ? 'Adding...' : 'Add to Cart'}
                        </Button>
                        <Button 
                          variant="primary" 
                          className="w-50 rounded-pill" 
                          size="sm"
                          onClick={() => buyNow(product)}
                          disabled={product.stock === 0 || processingProductId === product.id}
                        >
                          {processingProductId === product.id ? 'Processing...' : 'Buy Now'}
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <div className="text-center py-5">
              <h4>No products available</h4>
              <p>Check back later for new products</p>
            </div>
          )}

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
      )}

      <style jsx>{`
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

export default Dashboard;