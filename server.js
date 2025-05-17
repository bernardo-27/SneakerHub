import bcrypt from 'bcryptjs';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import { fileURLToPath } from 'url';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import mysql from 'mysql2/promise';
import path from 'path';

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your-secret-key';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// CORS configuration
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(bodyParser.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: err.message
  });
});

// MySQL connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'sneakerhub',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
async function testDbConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
    return true;
  } catch (err) {
    console.error('Database connection failed:', err);
    return false;
  }
}

// Initialize database tables
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    
    // Create tables if they don't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        fname VARCHAR(50) NOT NULL,
        lname VARCHAR(50) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('user', 'admin') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create settings table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        store_name VARCHAR(100) NOT NULL DEFAULT 'Sneakerhub',
        store_email VARCHAR(100),
        contact_number VARCHAR(20),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Insert default settings if not exists
    const [existingSettings] = await connection.query('SELECT * FROM settings LIMIT 1');
    if (existingSettings.length === 0) {
      await connection.query(`
        INSERT INTO settings (store_name, store_email, contact_number, address) 
        VALUES (?, ?, ?, ?)
      `, ['Sneakerhub', 'contact@sneakerhub.com', '+1234567890', '123 Sneaker Street']);
      console.log('Default settings created');
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        stock INT NOT NULL,
        image_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add brand column if it doesn't exist
    try {
      await connection.query(`
        ALTER TABLE products 
        ADD COLUMN brand VARCHAR(50) NOT NULL DEFAULT 'Unknown'
      `);
      console.log('Added brand column to products table');
    } catch (err) {
      // Column might already exist, which is fine
      if (!err.message.includes('Duplicate column name')) {
        throw err;
      }
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        order_number VARCHAR(12) UNIQUE,
        total_amount DECIMAL(10,2) NOT NULL,
        status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
        payment_method ENUM('CARD', 'GCASH', 'COD') NOT NULL,
        payment_status ENUM('Pending', 'Paid') DEFAULT 'Pending',
        payment_details JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    try {
      await connection.query(`
ALTER TABLE orders 
ADD COLUMN delivery_address TEXT AFTER payment_details;
      `);
      console.log('Added Delivery Address column to products table');
    } catch (err) {
      // Column might already exist, which is fine
      if (!err.message.includes('Duplicate column name')) {
        throw err;
      }
    }

    // Add order_number column and trigger if they don't exist
    try {
      // Add order_number column if it doesn't exist
      await connection.query(`
        ALTER TABLE orders 
        ADD COLUMN IF NOT EXISTS order_number VARCHAR(12) UNIQUE
      `);

      // Update existing orders with generated order numbers
      await connection.query(`
        UPDATE orders 
        SET order_number = CONCAT(
          'SH',
          LPAD(UNIX_TIMESTAMP(created_at) % 1000000, 6, '0'),
          LPAD(FLOOR(RAND() * 1000), 3, '0')
        )
        WHERE order_number IS NULL
      `);

      // Make order_number NOT NULL after updating existing records
      await connection.query(`
        ALTER TABLE orders
        MODIFY order_number VARCHAR(12) NOT NULL
      `);

      // Create function to generate order number
      await connection.query(`
        CREATE OR REPLACE FUNCTION generate_order_number()
        RETURNS VARCHAR(12)
        BEGIN
          DECLARE new_order_number VARCHAR(12);
          DECLARE attempts INT DEFAULT 0;
          DECLARE max_attempts INT DEFAULT 10;
          
          generate_loop: LOOP
            -- Generate the order number
            SET new_order_number = CONCAT(
              'SH',
              LPAD(UNIX_TIMESTAMP() % 1000000, 6, '0'),
              LPAD(FLOOR(RAND() * 1000), 3, '0')
            );
            
            -- Check if it exists
            IF NOT EXISTS (SELECT 1 FROM orders WHERE order_number = new_order_number) THEN
              RETURN new_order_number;
            END IF;
            
            SET attempts = attempts + 1;
            IF attempts >= max_attempts THEN
              SIGNAL SQLSTATE '45000'
              SET MESSAGE_TEXT = 'Could not generate unique order number';
            END IF;
          END LOOP;
        END
      `);

      // Create trigger to automatically generate order number before insert
      await connection.query(`
        CREATE OR REPLACE TRIGGER before_order_insert
        BEFORE INSERT ON orders
        FOR EACH ROW
        BEGIN
          IF NEW.order_number IS NULL THEN
            SET NEW.order_number = generate_order_number();
          END IF;
        END
      `);

      console.log('Added order number column and trigger to orders table');
    } catch (err) {
      // Log the error but don't throw it (table might already have these)
      console.error('Error adding order number column or trigger:', err.message);
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS cart (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    // Create default admin user if not exists
    const [users] = await connection.query('SELECT * FROM users WHERE email = ?', ['admin@sneakerhub.com']);
    
    if (users.length === 0) {
      const hashedPassword = await bcrypt.hash('Adminsneakerhub123!', 10);
      await connection.query(
        'INSERT INTO users (fname, lname, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?)',
        ['Admin', 'User', 'admin@sneakerhub.com', '1234567890', hashedPassword, 'admin']
      );
      console.log('Default admin user created');
    }

    connection.release();
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Database initialization failed:', err);
    process.exit(1);
  }
}

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  try {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
      console.log('No token provided');
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
        console.log('Token verification failed:', err.message);
      return res.status(403).json({ message: 'Invalid token.' });
    }
    req.user = user;
    next();
  });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
};

// Middleware to check admin role
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

// Add privacy middleware
const ensureUserAccess = (req, res, next) => {
  try {
    // Check if the requested user ID matches the authenticated user's ID
    const requestedUserId = parseInt(req.params.userId) || parseInt(req.body.userId);
    if (requestedUserId && requestedUserId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You can only access your own data.' });
    }
    next();
  } catch (error) {
    console.error('Access control error:', error);
    res.status(500).json({ message: 'Error checking access permissions' });
  }
};

// Signup endpoint
app.post('/signup', async (req, res) => {
  const { fname, lname, email, phone, password } = req.body;

  if (!fname || !lname || !email || !phone || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      'INSERT INTO users (fname, lname, email, phone, password) VALUES (?, ?, ?, ?, ?)',
      [fname, lname, email, phone, hashedPassword]
    );

    const token = jwt.sign({ id: result.insertId, email, role: 'user' }, JWT_SECRET);
    res.status(201).json({ message: 'User registered successfully.', token });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Something went wrong during registration.' });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      }, 
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: pwd, ...userInfo } = user;
    
    res.status(200).json({ 
      message: 'Login successful.', 
      user: userInfo,
      token,
      role: user.role // Explicitly send role in response
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Secure user profile endpoint
app.get('/profile/:userId', authenticateToken, ensureUserAccess, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, fname, lname, email, phone, role, created_at FROM users WHERE id = ?', 
      [req.user.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Get user's order statistics
    const [orderStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_spent,
        MAX(created_at) as last_order_date
      FROM orders 
      WHERE user_id = ?
    `, [req.user.id]);

    // Get user's privacy settings
    const [privacySettings] = await pool.query(
      'SELECT show_email, show_phone, show_orders FROM user_privacy WHERE user_id = ?',
      [req.user.id]
    );

    const userProfile = {
      ...users[0],
      orderStats: orderStats[0],
      privacySettings: privacySettings[0] || {
        show_email: false,
        show_phone: false,
        show_orders: false
      }
    };

    // Remove sensitive information based on privacy settings
    if (!userProfile.privacySettings.show_email) delete userProfile.email;
    if (!userProfile.privacySettings.show_phone) delete userProfile.phone;

    res.json(userProfile);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Secure orders endpoint
app.get('/orders/:userId', authenticateToken, ensureUserAccess, async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT o.*, 
        GROUP_CONCAT(p.name) as product_names,
        GROUP_CONCAT(oi.quantity) as quantities,
        GROUP_CONCAT(oi.price) as prices
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [req.user.id]);

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Secure cart endpoint
app.get('/cart/:userId', authenticateToken, ensureUserAccess, async (req, res) => {
  try {
    const [cartItems] = await pool.query(`
      SELECT c.*, p.name, p.price, p.image_url
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
    `, [req.user.id]);

    res.json({
      items: cartItems,
      total: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Failed to fetch cart' });
  }
});

// Update user password
app.put('/profile/:userId/password', authenticateToken, ensureUserAccess, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, users[0].password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    // Hash and update new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ message: 'Failed to update password' });
  }
});

// Admin: Get all users with detailed information
app.get('/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    console.log('Fetching users with detailed information...');
    // Get user basic info and overall totals
    const [users] = await pool.query(`
      SELECT 
        u.id,
        u.fname,
        u.lname,
        u.email,
        u.phone,
        u.role,
        u.created_at,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        MAX(o.created_at) as last_order_date
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.role = 'user'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    // Get detailed order status information for each user
    for (let user of users) {
      // Get order counts and totals by status
      const [statusDetails] = await pool.query(`
        SELECT 
          status,
          COUNT(*) as order_count,
          COALESCE(SUM(total_amount), 0) as status_total
        FROM orders 
        WHERE user_id = ?
        GROUP BY status
      `, [user.id]);

      // Get order items details
      const [orderItems] = await pool.query(`
        SELECT 
          o.status,
          COUNT(DISTINCT o.id) as unique_orders,
          COUNT(oi.id) as total_items,
          COALESCE(SUM(oi.quantity), 0) as total_quantity,
          COALESCE(SUM(oi.quantity * oi.price), 0) as items_total
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.user_id = ?
        GROUP BY o.status
      `, [user.id]);

      // Initialize status distribution with all possible statuses
      user.orderStatusDistribution = {
        pending: { count: 0, total: 0, items: 0 },
        processing: { count: 0, total: 0, items: 0 },
        shipped: { count: 0, total: 0, items: 0 },
        delivered: { count: 0, total: 0, items: 0 },
        cancelled: { count: 0, total: 0, items: 0 }
      };

      // Combine status details and order items information
      statusDetails.forEach(detail => {
        if (user.orderStatusDistribution[detail.status]) {
          user.orderStatusDistribution[detail.status] = {
            count: detail.order_count,
            total: Number(detail.status_total),
            items: orderItems.find(item => item.status === detail.status)?.total_quantity || 0
          };
        }
      });

      // Add summary statistics
      user.orderSummary = {
        total_orders: user.total_orders,
        total_spent: Number(user.total_spent),
        total_items: orderItems.reduce((sum, item) => sum + Number(item.total_quantity), 0),
        average_order_value: user.total_orders ? Number(user.total_spent) / user.total_orders : 0
      };
    }

    console.log(`Found ${users.length} users with detailed information`);
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Admin: Get all orders
app.get('/admin/orders', authenticateToken, isAdmin, async (req, res) => {
  try {
    console.log('Fetching orders...');
    const [orders] = await pool.query(`
      SELECT 
        o.*,
        u.email,
        u.fname,
        u.lname,
        GROUP_CONCAT(p.name) as product_names
      FROM orders o 
      JOIN users u ON o.user_id = u.id 
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);
    console.log(`Found ${orders.length} orders`);
    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// User: Get my orders
app.get('/my-orders', authenticateToken, async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT o.*, oi.quantity, oi.price, p.name as product_name, p.image_url as product_image
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `, [req.user.id]);
    res.json(orders);
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get dashboard statistics
app.get('/admin/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    console.log('Fetching admin stats...');
    // Get total sales
    const [salesResult] = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) as totalSales 
      FROM orders
    `);

    // Get total orders
    const [ordersResult] = await pool.query(`
      SELECT COUNT(*) as totalOrders 
      FROM orders
    `);

    // Get total customers
    const [customersResult] = await pool.query(`
      SELECT COUNT(*) as totalCustomers 
      FROM users 
      WHERE role = 'user'
    `);

    // Get total products
    const [productsResult] = await pool.query(`
      SELECT COUNT(*) as totalProducts 
      FROM products
    `);

    const stats = {
      totalSales: salesResult[0].totalSales,
      totalOrders: ordersResult[0].totalOrders,
      totalCustomers: customersResult[0].totalCustomers,
      totalProducts: productsResult[0].totalProducts
    };

    console.log('Admin stats:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

// Admin: Get all products
app.get('/admin/products', authenticateToken, isAdmin, async (req, res) => {
  try {
    console.log('Fetching admin products...');
    const [products] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    console.log(`Found ${products.length} products`);
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// Admin: Add new product
app.post('/admin/products', authenticateToken, isAdmin, upload.single('image'), async (req, res) => {
  const { name, description, price, stock, brand } = req.body;

  if (!name || !price || !stock || !brand) {
    return res.status(400).json({ message: 'Name, price, stock, and brand are required.' });
  }

  try {
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    const [result] = await pool.query(
      'INSERT INTO products (name, description, price, stock, brand, image_url) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description, price, stock, brand, image_url]
    );
    
    res.status(201).json({ 
      message: 'Product added successfully',
      productId: result.insertId,
      image_url: image_url
    });
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Update product
app.put('/admin/products/:id', authenticateToken, isAdmin, upload.single('image'), async (req, res) => {
  const { name, description, price, stock, brand } = req.body;
  const productId = req.params.id;

  try {
    // Get current product data
    const [currentProduct] = await pool.query('SELECT image_url FROM products WHERE id = ?', [productId]);
    
    let image_url = currentProduct[0]?.image_url;
    
    // If new image is uploaded
    if (req.file) {
      // Delete old image if exists
      if (currentProduct[0]?.image_url) {
        const oldImagePath = path.join(__dirname, currentProduct[0].image_url);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      image_url = `/uploads/${req.file.filename}`;
    }

    await pool.query(
      'UPDATE products SET name = ?, description = ?, price = ?, stock = ?, brand = ?, image_url = ? WHERE id = ?',
      [name, description, price, stock, brand, image_url, productId]
    );
    
    res.json({ 
      message: 'Product updated successfully',
      image_url: image_url
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Delete product
app.delete('/admin/products/:id', authenticateToken, isAdmin, async (req, res) => {
  const productId = req.params.id;

  try {
    // Get product image URL before deleting
    const [product] = await pool.query('SELECT image_url FROM products WHERE id = ?', [productId]);
    
    // Delete the product from database
    await pool.query('DELETE FROM products WHERE id = ?', [productId]);
    
    // Delete the image file if it exists
    if (product[0]?.image_url) {
      const imagePath = path.join(__dirname, product[0].image_url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// User: Get products for shop
app.get('/products', async (req, res) => {
  try {
    console.log('Fetching products for shop...');
    const [products] = await pool.query('SELECT * FROM products WHERE stock > 0 ORDER BY created_at DESC');
    console.log(`Found ${products.length} products`);
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// User: Add to cart
app.post('/cart', authenticateToken, async (req, res) => {
  const { product_id, quantity } = req.body;
  const user_id = req.user.id;

  try {
    // Check if product exists and has enough stock
    const [product] = await pool.query('SELECT stock FROM products WHERE id = ?', [product_id]);
    
    if (product.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product[0].stock < quantity) {
      return res.status(400).json({ message: 'Not enough stock available' });
    }

    // Check if product already in cart
    const [existingItem] = await pool.query(
      'SELECT * FROM cart WHERE user_id = ? AND product_id = ?',
      [user_id, product_id]
    );

    if (existingItem.length > 0) {
      // Update quantity if already in cart
      await pool.query(
        'UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?',
        [quantity, user_id, product_id]
      );
    } else {
      // Add new item to cart
      await pool.query(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [user_id, product_id, quantity]
      );
    }

    res.status(201).json({ message: 'Product added to cart successfully' });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// User: Get cart items
app.get('/cart', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching cart items for user:', req.user.id);
    const [cartItems] = await pool.query(`
      SELECT c.*, p.name, p.price, p.image_url 
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
    `, [req.user.id]);
    
    console.log(`Found ${cartItems.length} cart items`);
    res.json(cartItems);
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Failed to fetch cart items' });
  }
});

// User: Update cart item quantity
app.put('/cart/:product_id', authenticateToken, async (req, res) => {
  const { quantity } = req.body;
  const { product_id } = req.params;
  const user_id = req.user.id;

  try {
    if (quantity > 0) {
      await pool.query(
        'UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?',
        [quantity, user_id, product_id]
      );
    } else {
      await pool.query(
        'DELETE FROM cart WHERE user_id = ? AND product_id = ?',
        [user_id, product_id]
      );
    }
    
    res.json({ message: 'Cart updated successfully' });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// User: Create order from cart
app.post('/orders', authenticateToken, async (req, res) => {
  const user_id = req.user.id;
  const { paymentMethod, paymentDetails, deliveryAddress } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Get cart items
    const [cartItems] = await connection.query(`
      SELECT c.*, p.price, p.stock 
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
    `, [user_id]);

    if (cartItems.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Calculate total amount
    const total_amount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Generate a unique order number manually
    const timestamp = Date.now() % 1000000;
    const random = Math.floor(Math.random() * 1000);
    const order_number = `SH${timestamp.toString().padStart(6, '0')}${random.toString().padStart(3, '0')}`;

    // Create order with payment information, order_number, and delivery address
    const [orderResult] = await connection.query(
      'INSERT INTO orders (user_id, total_amount, payment_method, payment_status, payment_details, order_number, delivery_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        user_id, 
        total_amount, 
        paymentMethod,
        paymentMethod === 'COD' ? 'Pending' : 'Paid',
        JSON.stringify(paymentDetails),
        order_number,
        deliveryAddress  // Add delivery address to the order
      ]
    );

    const order_id = orderResult.insertId;

    // Create order items and update product stock
    for (const item of cartItems) {
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [order_id, item.product_id, item.quantity, item.price]
      );

      await connection.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // Clear cart
    await connection.query('DELETE FROM cart WHERE user_id = ?', [user_id]);

    await connection.commit();
    res.status(201).json({ 
      message: 'Order created successfully',
      order_id,
      order_number
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Failed to create order' });
  } finally {
    connection.release();
  }
});

// Admin: Get order details
app.get('/admin/orders/:orderId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT 
        o.*,
        u.email,
        u.fname,
        u.lname,
        GROUP_CONCAT(p.name) as product_names,
        GROUP_CONCAT(oi.quantity) as quantities,
        GROUP_CONCAT(oi.price) as prices,
        GROUP_CONCAT(p.image_url) as product_images
      FROM orders o 
      JOIN users u ON o.user_id = u.id 
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.id = ?
      GROUP BY o.id
    `, [req.params.orderId]);

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(orders[0]);
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({ message: 'Failed to fetch order details' });
  }
});

// Admin: Update order status
app.put('/admin/orders/:id', authenticateToken, isAdmin, async (req, res) => {
  const { status } = req.body;
  const orderId = req.params.id;

  try {
    console.log('Update order status request:', { orderId, status });
    console.log('User:', req.user);

    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      console.log('Invalid status:', status);
      return res.status(400).json({ message: `Invalid status value. Must be one of: ${validStatuses.join(', ')}` });
    }

    // Check if order exists and get current status
    const [currentOrder] = await pool.query(
      'SELECT status FROM orders WHERE id = ?',
      [orderId]
    );

    if (currentOrder.length === 0) {
      console.log('Order not found:', orderId);
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log('Current order status:', currentOrder[0].status);
    console.log('New status:', status);

    // Update the status
    const [result] = await pool.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, orderId]
    );

    if (result.affectedRows === 0) {
      console.log('Update failed - no rows affected');
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log('Update successful:', result);
    
    res.json({ 
      message: 'Order status updated successfully',
      status: status,
      previousStatus: currentOrder[0].status
    });
  } catch (error) {
    console.error('Update order status error:', error);
    console.error('Error details:', {
      code: error.code,
      sqlMessage: error.sqlMessage,
      sql: error.sql
    });
    res.status(500).json({ 
      message: 'Failed to update order status',
      error: error.sqlMessage || error.message
    });
  }
});

// Get current user information
app.get('/profile/current', authenticateToken, async (req, res) => {
  try {
    const [user] = await pool.query(
      'SELECT id, fname, lname, email, phone, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (user.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({
      message: 'Current user information retrieved successfully',
      user: user[0]
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Failed to get user information' });
  }
});

// Update user profile information
app.put('/profile/:userId', authenticateToken, ensureUserAccess, async (req, res) => {
  try {
    const { fname, lname, email, phone } = req.body;
    const userId = req.user.id;

    // Get current user data first
    const [currentUser] = await pool.query(
      'SELECT fname, lname, email, phone FROM users WHERE id = ?',
      [userId]
    );

    if (currentUser.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Display current information
    console.log('Current user information:', currentUser[0]);

    // Validate required fields (excluding email)
    if (!fname || !lname || !phone) {
      return res.status(400).json({ 
        message: 'First name, last name, and phone are required.',
        currentInfo: currentUser[0]
      });
    }

    // Use current email if not provided in request
    const updatedEmail = email || currentUser[0].email;

    // Check if new email is already taken by another user (only if email is being changed)
    if (email && email !== currentUser[0].email) {
      const [existingUsers] = await pool.query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({ 
          message: 'Email is already in use.',
          currentInfo: currentUser[0]
        });
      }
    }

    // Update user information
    await pool.query(
      'UPDATE users SET fname = ?, lname = ?, email = ?, phone = ? WHERE id = ?',
      [fname, lname, updatedEmail, phone, userId]
    );

    // Get updated user information
    const [updatedUser] = await pool.query(
      'SELECT id, fname, lname, email, phone, role, created_at FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      message: 'Profile updated successfully',
      previousInfo: currentUser[0],
      updatedInfo: updatedUser[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Public: Get store settings
app.get('/settings', async (req, res) => {
  try {
    const [settings] = await pool.query('SELECT * FROM settings ORDER BY id DESC LIMIT 1');
    
    if (settings.length === 0) {
      // Create default settings if none exist
      const defaultSettings = {
        store_name: 'Sneakerhub',
        store_email: 'contact@sneakerhub.com',
        contact_number: '+1234567890',
        address: '123 Sneaker Street'
      };

      const [result] = await pool.query(
        'INSERT INTO settings (store_name, store_email, contact_number, address) VALUES (?, ?, ?, ?)',
        [defaultSettings.store_name, defaultSettings.store_email, defaultSettings.contact_number, defaultSettings.address]
      );

      defaultSettings.id = result.insertId;
      res.json(defaultSettings);
    } else {
      res.json(settings[0]);
    }
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
});

// Admin: Get settings
app.get('/admin/settings', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [settings] = await pool.query('SELECT * FROM settings ORDER BY id DESC LIMIT 1');
    
    if (settings.length === 0) {
      // Create default settings if none exist
      const defaultSettings = {
        store_name: 'Sneakerhub',
        store_email: 'contact@sneakerhub.com',
        contact_number: '+1234567890',
        address: '123 Sneaker Street'
      };

      const [result] = await pool.query(
        'INSERT INTO settings (store_name, store_email, contact_number, address) VALUES (?, ?, ?, ?)',
        [defaultSettings.store_name, defaultSettings.store_email, defaultSettings.contact_number, defaultSettings.address]
      );

      defaultSettings.id = result.insertId;
      res.json(defaultSettings);
    } else {
      res.json(settings[0]);
    }
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
});

// Admin: Update settings
app.put('/admin/settings', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { store_name, store_email, contact_number, address } = req.body;

    // Get current settings
    const [currentSettings] = await pool.query('SELECT * FROM settings ORDER BY id DESC LIMIT 1');

    if (currentSettings.length === 0) {
      // If no settings exist, create new
      const [result] = await pool.query(
        'INSERT INTO settings (store_name, store_email, contact_number, address) VALUES (?, ?, ?, ?)',
        [store_name, store_email, contact_number, address]
      );

      res.json({
        message: 'Settings created successfully',
        settings: {
          id: result.insertId,
          store_name,
          store_email,
          contact_number,
          address
        }
      });
    } else {
      // Update existing settings
      await pool.query(
        'UPDATE settings SET store_name = ?, store_email = ?, contact_number = ?, address = ? WHERE id = ?',
        [store_name, store_email, contact_number, address, currentSettings[0].id]
      );

      res.json({
        message: 'Settings updated successfully',
        settings: {
          id: currentSettings[0].id,
          store_name,
          store_email,
          contact_number,
          address
        }
      });
    }
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Failed to update settings' });
  }
});

// Initialize database and start server
async function startServer() {
  try {
    // Test database connection first
    const dbConnected = await testDbConnection();
    
    if (!dbConnected) {
      console.error('Cannot start server: Database connection failed');
      process.exit(1);
    }
    
    // Initialize database
    await initializeDatabase();
    
    // Start server with port handling
    const server = app.listen(PORT)
      .on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${PORT} is busy, trying ${PORT + 1}...`);
          server.close();
          // Try alternative port
          app.listen(PORT + 1, () => {
            console.log(`Server running on http://localhost:${PORT + 1}`);
          }).on('error', (err) => {
            console.error('Failed to start server:', err);
            process.exit(1);
          });
        } else {
          console.error('Failed to start server:', err);
          process.exit(1);
        }
      })
      .on('listening', () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });

  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();