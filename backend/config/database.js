const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool for better performance
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'attendance_system',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection (don't exit on failure, allow server to run for non-DB features)
pool.getConnection()
  .then(connection => {
    console.log('✅ MySQL Connected Successfully');
    connection.release();
  })
  .catch(error => {
    console.error('❌ MySQL Connection Error:', error.message);
    console.warn('⚠️  Server will continue running but database features will not work');
    // Don't exit - allow simulation and other non-DB features to work
  });

module.exports = pool;
