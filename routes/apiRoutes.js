const express = require('express');
const router = express.Router();
const Area = require('../models/area');
const Developer = require('../models/developer');
const multer = require('multer');
const path = require('path');
const pool = require('../database/database');

// GET /api/areas - Get all areas from areas table
router.get('/areas', async (req, res) => {
  try {
    const areas = await Area.getAll();
    res.json({
      success: true,
      data: areas
    });
  } catch (error) {
    console.error('Error fetching areas:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// GET /api/area/:kodeArea - Get specific area by kode_area
router.get('/area/:kodeArea', async (req, res) => {
  try {
    const kodeArea = req.params.kodeArea;
    const areaData = await Area.getByKodeArea(kodeArea);

    if (!areaData) {
      return res.status(404).json({
        success: false,
        message: 'Area not found'
      });
    }

    res.json({
      success: true,
      data: areaData
    });
  } catch (error) {
    console.error('Error fetching area data:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// GET /api/branch/:kodeCabang - Get specific branch data
router.get('/branch/:kodeCabang', async (req, res) => {
  try {
    const kodeCabang = req.params.kodeCabang;
    const branchData = await Area.getBranchByCode(kodeCabang);

    if (!branchData) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    res.json({
      success: true,
      data: branchData
    });
  } catch (error) {
    console.error('Error fetching branch data:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// GET /api/developers/:kodeCabang - Ambil semua developer di cabang
router.get('/developers/:kodeCabang', async (req, res) => {
  try {
    const data = await Developer.getByCabang(req.params.kodeCabang);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching developers:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/developer-visits - Ambil riwayat visit developer
// contoh: /api/developer-visits?kode_cabang=00101&nama_developer=PT%20Sejahtera
router.get('/developer-visits', async (req, res) => {
  try {
    const { kode_cabang, nama_developer } = req.query;
    const data = await Developer.getVisits(kode_cabang, nama_developer);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching developer visits:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/developer-visits - Tambah data visit developer
// Setup multer untuk upload file
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.post('/developer-visits', upload.single('foto_visit'), async (req, res) => {
  try {
    const visitData = {
      kode_cabang: req.body.kode_cabang,
      nama_developer: req.body.nama_developer,
      visit_date: req.body.visit_date,
      jumlah_kavling: req.body.jumlah_kavling,
      ready_stock: req.body.ready_stock,
      sisa_potensi: req.body.sisa_potensi,
      terjual: req.body.terjual,
      foto_visit: req.file ? `/uploads/${req.file.filename}` : null
    };

    const data = await Developer.createVisit(visitData);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating developer visit:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/developer-visits/:id_visit - Update visit
router.put('/developer-visits/:id_visit', async (req, res) => {
  try {
    const updated = await Developer.updateVisit(req.params.id_visit, req.body);

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    res.json({ success: true, message: 'Visit updated successfully' });
  } catch (error) {
    console.error('Error updating developer visit:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/developer-visits/:id_visit - Hapus visit
router.delete('/developer-visits/:id_visit', async (req, res) => {
  try {
    const deleted = await Developer.deleteVisit(req.params.id_visit);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    res.json({ success: true, message: 'Visit deleted successfully' });
  } catch (error) {
    console.error('Error deleting developer visit:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/developer-status?kode_cabang=00101
router.get('/developer-status', async (req, res) => {
  try {
    const { kode_cabang } = req.query;

    let sql = `SELECT * FROM v_marker_developer_status`;
    const params = [];

    if (kode_cabang) {
      sql += ` WHERE kode_cabang = ?`;
      params.push(kode_cabang);
    }

    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching developer status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/developer-detail?kode_cabang=00101&nama_developer=PT%20Sejahtera
router.get('/developer-detail', async (req, res) => {
  try {
    const { kode_cabang, nama_developer } = req.query;

    const developer = await Developer.getDetail(kode_cabang, nama_developer);
    if (!developer) {
      return res.status(404).json({ success: false, message: 'Developer not found' });
    }

    const latestVisit = await Developer.getLatestVisit(kode_cabang, nama_developer);

    res.json({
      success: true,
      data: {
        developer,
        visit: latestVisit
      }
    });
  } catch (error) {
    console.error('Error fetching developer detail:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});




// GET /api/test - Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;