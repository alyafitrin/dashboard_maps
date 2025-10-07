// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../database/database');
const Area = require('../models/area');
const Cabang = require('../models/cabang');
const Developer = require('../models/developer');
const PerusahaanK1 = require('../models/perusahaank1');


// GET semua area untuk dropdown cabang
router.get('/areas', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT kode_area, nama_area FROM area ORDER BY nama_area`);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching areas:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================= CABANG =================
// GET semua cabang
router.get('/cabang', async (req, res) => {
  try {
    const data = await Cabang.getAll();
    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching cabang:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/cabang/paginate?page=1&limit=10&search=Bandung
router.get('/cabang/paginate', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search ? `%${req.query.search}%` : null;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT kode_cabang, nama, posisi, unit_kerja, kode_area, latitude, longitude, kota
      FROM cabang
    `;
    let countSql = `SELECT COUNT(*) as total FROM cabang`;
    const params = [];

    if (search) {
      sql += ` WHERE kode_cabang LIKE ? OR nama LIKE ? OR unit_kerja LIKE ?`;
      countSql += ` WHERE kode_cabang LIKE ? OR nama LIKE ? OR unit_kerja LIKE ?`;
      params.push(search, search, search);
    }

    sql += ` ORDER BY kode_cabang ASC LIMIT ?, ?`;
    params.push(offset, limit);

    const [rows] = await pool.query(sql, params);
    const [countRows] = await pool.query(countSql, search ? [search, search, search] : []);
    const total = countRows[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: rows,
      page,
      totalPages,
      total,
    });
  } catch (error) {
    console.error("Error fetching cabang:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});


// GET satu cabang by kode
router.get('/cabang/:kode_cabang', async (req, res) => {
  try {
    const data = await Cabang.getByKode(req.params.kode_cabang);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Cabang not found' });
    }
    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching cabang by kode:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// CREATE cabang
router.post('/cabang', async (req, res) => {
  try {
    const newCabang = await Cabang.create(req.body);
    res.json({ success: true, data: newCabang });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// UPDATE cabang
router.put('/cabang/:kode', async (req, res) => {
  try {
    const updated = await Cabang.update(req.params.kode, req.body);
    if (!updated) return res.status(404).json({ success: false, message: "Cabang not found" });
    res.json({ success: true, message: "Cabang updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE cabang
router.delete('/cabang/:kode', async (req, res) => {
  try {
    const deleted = await Cabang.delete(req.params.kode);
    if (!deleted) return res.status(404).json({ success: false, message: "Cabang not found" });
    res.json({ success: true, message: "Cabang deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================= DEVELOPER =================

// GET semua developer
router.get('/developers', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT kode_cabang, project, dev AS nama_developer, tipe, latitude, longitude,
             jumlah_kavling, ready_stock, sisa_potensi, terjual
      FROM developer
      ORDER BY kode_cabang ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching developers:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================= DEVELOPER =================
// GET /api/admin/developers/paginate?page=1&limit=10&search=...
router.get('/developers/paginate', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search ? `%${req.query.search}%` : null;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT id_developer, kode_area, area, kode_cabang, dev AS nama_developer, project, tipe, latitude, longitude,
             jumlah_kavling, ready_stock, sisa_potensi, terjual
      FROM developer
    `;
    let countSql = `SELECT COUNT(*) as total FROM developer`;
    const params = [];

    // filter pencarian
    if (search) {
      sql += ` WHERE kode_cabang LIKE ? OR dev LIKE ? OR project LIKE ?`;
      countSql += ` WHERE kode_cabang LIKE ? OR dev LIKE ? OR project LIKE ?`;
      params.push(search, search, search);
    }

    sql += ` ORDER BY kode_cabang ASC LIMIT ?, ?`;
    params.push(offset, limit);

    const [rows] = await pool.query(sql, params);
    const [countRows] = await pool.query(countSql, search ? [search, search, search] : []);
    const total = countRows[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: rows,
      page,
      totalPages,
      total,
    });
  } catch (error) {
    console.error("Error fetching developers:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/developer/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id_developer, kode_area, area, kode_cabang, cabang_padanan, project,
             dev AS nama_developer, tipe, latitude, longitude,
             jumlah_kavling, ready_stock, sisa_potensi, terjual
      FROM developer WHERE id_developer = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Developer not found" });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


router.post('/developer', async (req, res) => {
  try {
    const dev = await Developer.create(req.body);
    res.json({ success: true, data: dev });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/developer/:id_developer', async (req, res) => {
  try {
    const updated = await Developer.update(req.params.id_developer, req.body);
    res.json({ success: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/developer/:id_developer', async (req, res) => {
  try {
    const deleted = await Developer.delete(req.params.id_developer);
    res.json({ success: deleted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ================= PERUSAHAAN K1 =================
// GET /api/admin/k1/paginate?page=1&limit=10&search=...
router.get('/k1/paginate', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const result = await PerusahaanK1.getPaginated(page, limit, search);

    res.json({
      success: true,
      data: result.rows,
      page,
      totalPages: result.totalPages,
      total: result.total,
    });
  } catch (err) {
    console.error("Error fetching perusahaan K1:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET by id
router.get('/k1/:id', async (req, res) => {
  try {
    const k1 = await PerusahaanK1.getById(req.params.id);
    if (!k1) return res.status(404).json({ success: false, message: "Perusahaan K1 not found" });
    res.json({ success: true, data: k1 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
router.post('/k1', async (req, res) => {
  try {
    const k1 = await PerusahaanK1.create(req.body);
    res.json({ success: true, data: k1 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/k1/:id_k1', async (req, res) => {
  try {
    const updated = await PerusahaanK1.update(req.params.id_k1, req.body);
    res.json({ success: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/k1/:id_k1', async (req, res) => {
  try {
    const deleted = await PerusahaanK1.delete(req.params.id_k1);
    res.json({ success: deleted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
