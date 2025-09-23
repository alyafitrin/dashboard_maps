const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'dashboard_maps',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true,
});

// Test connection
pool.getConnection()
    .then(connection => {
        console.log('✅ Connected to MySQL database successfully!');
        connection.release();
    })
    .catch(error => {
        console.error('❌ Database connection failed:', error.message);
    });

module.exports = pool;