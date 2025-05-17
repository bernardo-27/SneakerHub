import React, { useState, useEffect } from 'react';
import { Form, Row, Col, InputGroup, Pagination } from 'react-bootstrap';
import Swal from 'sweetalert2';

const Products = ({ products, handleAddProduct, handleUpdateProduct, handleDeleteProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [filteredProducts, setFilteredProducts] = useState(products);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(10);
  const [paginatedProducts, setPaginatedProducts] = useState([]);

  // Get unique brands from products
  const brands = [...new Set(products.map(product => product.brand))];

  // Filter products based on search, brand, and price range
  useEffect(() => {
    let result = [...products];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply brand filter
    if (brandFilter !== 'all') {
      result = result.filter(product => product.brand.toLowerCase() === brandFilter.toLowerCase());
    }

    // Apply price range filter
    if (minPrice !== '') {
      result = result.filter(product => parseFloat(product.price) >= parseFloat(minPrice));
    }
    if (maxPrice !== '') {
      result = result.filter(product => parseFloat(product.price) <= parseFloat(maxPrice));
    }

    setFilteredProducts(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, brandFilter, minPrice, maxPrice, products]);

  // Calculate pagination
  useEffect(() => {
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    setPaginatedProducts(filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct));
  }, [currentPage, productsPerPage, filteredProducts]);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Generate pagination items
  const renderPaginationItems = () => {
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    let items = [];

    // Previous button
    items.push(
      <Pagination.Prev 
        key="prev" 
        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      />
    );

    // First page
    items.push(
      <Pagination.Item 
        key={1} 
        active={1 === currentPage}
        onClick={() => handlePageChange(1)}
      >
        1
      </Pagination.Item>
    );

    // Ellipsis if needed
    if (currentPage > 3) {
      items.push(<Pagination.Ellipsis key="ellipsis-1" disabled />);
    }

    // Pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      items.push(
        <Pagination.Item
          key={i}
          active={i === currentPage}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Pagination.Item>
      );
    }

    // Ellipsis if needed
    if (currentPage < totalPages - 2) {
      items.push(<Pagination.Ellipsis key="ellipsis-2" disabled />);
    }

    // Last page if more than 1 page
    if (totalPages > 1) {
      items.push(
        <Pagination.Item
          key={totalPages}
          active={totalPages === currentPage}
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </Pagination.Item>
      );
    }

    // Next button
    items.push(
      <Pagination.Next
        key="next"
        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages || totalPages === 0}
      />
    );

    return items;
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="card-title">Products Management</h5>
          <button 
            className="btn btn-primary"
            onClick={() => {
              Swal.fire({
                title: 'Add New Product',
                html: `
                  <input id="name" class="swal2-input" placeholder="Product Name">
                  <input id="description" class="swal2-input" placeholder="Description">
                  <input id="price" class="swal2-input" type="number" step="0.01" placeholder="Price">
                  <input id="stock" class="swal2-input" type="number" placeholder="Stock">
                  <select id="brand" class="swal2-input">
                    <option value="">Select Brand</option>
                    <option value="Nike">Nike</option>
                    <option value="Adidas">Adidas</option>
                    <option value="Puma">Puma</option>
                    <option value="Anta">Anta</option>
                    <option value="Jordan">Jordan</option>
                    <option value="Vans">Vans</option>
                  </select>
                  <input id="image" class="swal2-input" type="file" accept="image/*">
                `,
                focusConfirm: false,
                showCancelButton: true,
                confirmButtonText: 'Add Product',
                preConfirm: () => {
                  const name = document.getElementById('name').value;
                  const price = document.getElementById('price').value;
                  const stock = document.getElementById('stock').value;
                  const brand = document.getElementById('brand').value;
                  const imageFile = document.getElementById('image').files[0];
                  
                  if (!name || !price || !stock || !brand) {
                    Swal.showValidationMessage('Name, price, stock, and brand are required');
                    return false;
                  }
                  
                  const formData = new FormData();
                  formData.append('name', name);
                  formData.append('description', document.getElementById('description').value);
                  formData.append('price', parseFloat(price));
                  formData.append('stock', parseInt(stock));
                  formData.append('brand', brand);
                  if (imageFile) {
                    formData.append('image', imageFile);
                  }
                  
                  return formData;
                }
              }).then((result) => {
                if (result.isConfirmed) {
                  handleAddProduct(result.value);
                }
              });
            }}
          >
            Add New Product
          </button>
        </div>

        {/* Search and Filters */}
        <Row className="mb-4 g-3">
          <Col md={4}>
            <InputGroup>
              <InputGroup.Text>
                <i className="bx bx-search"></i>
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </Col>
          <Col md={3}>
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
          <Col md={2}>
            <Form.Control
              type="number"
              placeholder="Min Price"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              min="0"
              step="0.01"
            />
          </Col>
          <Col md={2}>
            <Form.Control
              type="number"
              placeholder="Max Price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              min="0"
              step="0.01"
            />
          </Col>
          <Col md={1}>
            <Form.Select
              value={productsPerPage}
              onChange={(e) => {
                setProductsPerPage(Number(e.target.value));
                setCurrentPage(1); // Reset to first page when changing items per page
              }}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </Form.Select>
          </Col>
        </Row>

        {filteredProducts && filteredProducts.length > 0 ? (
          <>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Brand</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map(product => (
                    <tr key={product.id}>
                      <td>{product.id}</td>
                      <td>
                        <img 
                          src={product.image_url || 'placeholder-image-url'} 
                          alt={product.name} 
                          style={{width: '50px', height: '50px', objectFit: 'cover'}}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/50';
                          }}
                        />
                      </td>
                      <td>{product.name}</td>
                      <td>{product.brand}</td>
                      <td>₱{parseFloat(product.price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td>{product.stock}</td>
                      <td>
                        <div className="btn-group">
                          <button
                            className="btn btn-sm btn-primary me-2"
                            onClick={() => {
                              Swal.fire({
                                title: 'Edit Product',
                                html: `
                                  <input id="name" class="swal2-input" placeholder="Product Name" value="${product.name}">
                                  <input id="description" class="swal2-input" placeholder="Description" value="${product.description || ''}">
                                  <input id="price" class="swal2-input" type="number" step="0.01" placeholder="Price" value="${product.price}">
                                  <input id="stock" class="swal2-input" type="number" placeholder="Stock" value="${product.stock}">
                                  <select id="brand" class="swal2-input">
                                    <option value="">Select Brand</option>
                                    <option value="Nike" ${product.brand === 'Nike' ? 'selected' : ''}>Nike</option>
                                    <option value="Adidas" ${product.brand === 'Adidas' ? 'selected' : ''}>Adidas</option>
                                    <option value="Puma" ${product.brand === 'Puma' ? 'selected' : ''}>Puma</option>
                                    <option value="Anta" ${product.brand === 'Anta' ? 'selected' : ''}>Anta</option>
                                    <option value="Jordan" ${product.brand === 'Jordan' ? 'selected' : ''}>Jordan</option>
                                    <option value="Vans" ${product.brand === 'Vans' ? 'selected' : ''}>Vans</option>
                                  </select>
                                  <div class="mt-3">
                                    <p>Current Image:</p>
                                    <img src="${product.image_url || 'https://via.placeholder.com/100'}" 
                                         style="width: 100px; height: 100px; object-fit: cover; margin-bottom: 10px;">
                                    <input id="image" class="swal2-input" type="file" accept="image/*">
                                  </div>
                                `,
                                focusConfirm: false,
                                showCancelButton: true,
                                confirmButtonText: 'Update',
                                preConfirm: () => {
                                  const name = document.getElementById('name').value;
                                  const price = document.getElementById('price').value;
                                  const stock = document.getElementById('stock').value;
                                  const brand = document.getElementById('brand').value;
                                  const imageFile = document.getElementById('image').files[0];
                                  
                                  if (!name || !price || !stock || !brand) {
                                    Swal.showValidationMessage('Name, price, stock, and brand are required');
                                    return false;
                                  }
                                  
                                  const formData = new FormData();
                                  formData.append('name', name);
                                  formData.append('description', document.getElementById('description').value);
                                  formData.append('price', parseFloat(price));
                                  formData.append('stock', parseInt(stock));
                                  formData.append('brand', brand);
                                  if (imageFile) {
                                    formData.append('image', imageFile);
                                  }
                                  
                                  return formData;
                                }
                              }).then((result) => {
                                if (result.isConfirmed) {
                                  handleUpdateProduct(product.id, result.value);
                                }
                              });
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="d-flex justify-content-between align-items-center mt-4">
              <div>
                Showing {paginatedProducts.length > 0 ? (currentPage - 1) * productsPerPage + 1 : 0} to {Math.min(currentPage * productsPerPage, filteredProducts.length)} of {filteredProducts.length} products
              </div>
              <Pagination>{renderPaginationItems()}</Pagination>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <h5>No Products Found</h5>
            <p>No products match your current filters or try adding your first product using the button above.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;