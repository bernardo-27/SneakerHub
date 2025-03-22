const mysql = require('mysql');

// Create a connection to the database
const db = mysql.createConnection({
    host: 'localhost',     // Change this if using a remote server
    user: 'root',          // Your MySQL username
    password: '',          // Your MySQL password
    database: 'sneakerhub' // Your database name
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('MySQL connection failed:', err);
        return;
    }
    console.log('Connected to MySQL database!');
});

// Example query to test the connection
db.query('SELECT 1 + 1 AS result', (err, results) => {
    if (err) throw err;
    console.log('Test Query Result:', results[0].result);
});

// Export the connection for use in other files
module.exports = db;
