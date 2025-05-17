// import mysql from 'mysql2/promise';
// import bcrypt from 'bcryptjs';

// async function initializeDatabase() {
//   try {
//     // First create a connection without database selected
//     const connection = await mysql.createConnection({
//       host: 'localhost',
//       user: 'root',
//       password: ''
//     });

//     // Create database if it doesn't exist
//     await connection.query('CREATE DATABASE IF NOT EXISTS sneakerhub');
//     console.log('Database created or already exists');

//     // Close the initial connection
//     await connection.end();

//     // Create a new connection with the database selected
//     const pool = await mysql.createPool({
//       host: 'localhost',
//       user: 'root',
//       password: '',
//       database: 'sneakerhub',
//       waitForConnections: true,
//       connectionLimit: 10,
//       queueLimit: 0
//     });

//     // Create admin user if it doesn't exist
//     const [users] = await pool.query('SELECT * FROM users WHERE email = ?', ['admin@sneakerhub.com']);
    
//     if (users.length === 0) {
//       const hashedPassword = await bcrypt.hash('admin123', 10);
//       await pool.query(
//         'INSERT INTO users (fname, lname, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?)',
//         ['Admin', 'User', 'admin@sneakerhub.com', '1234567890', hashedPassword, 'admin']
//       );
//       console.log('Admin user created');
//     }

//     // Create some sample products
//     const [products] = await pool.query('SELECT * FROM products');
    
//     if (products.length === 0) {
//       await pool.query(`
//         INSERT INTO products (name, description, price, stock, image_url) VALUES
//         ('Nike Air Max', 'Classic Nike Air Max sneakers', 129.99, 50, 'https://example.com/airmax.jpg'),
//         ('Adidas Ultraboost', 'Comfortable running shoes', 159.99, 30, 'https://example.com/ultraboost.jpg'),
//         ('Puma RS-X', 'Retro-style sneakers', 89.99, 25, 'https://example.com/rsx.jpg')
//       `);
//       console.log('Sample products created');
//     }

//     console.log('Database initialization completed');
//     process.exit(0);
//   } catch (error) {
//     console.error('Database initialization failed:', error);
//     process.exit(1);
//   }
// }

// initializeDatabase(); 