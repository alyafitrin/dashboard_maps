// app.js
const express = require('express');
const path = require('path');
require('dotenv').config();
const pool = require('./database/database');

// Import Routes
const apiRoutes = require('./routes/apiRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.APP_PORT || 3000;

// Middleware
app.use(express.json()); // parsing JSON
app.use(express.urlencoded({ extended: true })); // parsing form data
app.use(express.static(path.join(__dirname, 'public'))); // Serve file statis dari /public
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // serve folder upload

// ===== API Routes =====
app.use('/api', apiRoutes);
app.use('/api/admin', adminRoutes);

// ===== Page Routes =====
// Halaman utama (dashboard maps)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Halaman admin (CRUD area/cabang/developer/K1)
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ===== Start server =====
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
  console.log(`✅ Database: ${process.env.DB_NAME}`);
});
