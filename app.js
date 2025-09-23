// app.js
const express = require('express');
require('dotenv').config();
const pool = require('./database/database');

// Import Routes
const apiRoutes = require('./routes/apiRoutes');

const app = express();
const PORT = process.env.APP_PORT || 3000;

// Middleware
app.use(express.json()); // Untuk parsing JSON request body
app.use(express.static('public')); // Serve static files dari folder 'public'
app.use('/uploads', express.static('uploads'));

// Use API Routes
app.use('/api', apiRoutes);

// Basic route untuk test server
app.get('/', (req, res) => {
  res.send('🚀 Server Mandiri Loan Dashboard Jabar is running!');
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
  console.log(`✅ Database: ${process.env.DB_NAME}`);
});