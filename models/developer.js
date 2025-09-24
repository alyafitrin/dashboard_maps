// models/developer.js
const pool = require('../database/database');

const Developer = {
  // Ambil semua developer berdasarkan kode cabang
  getByCabang: async (kodeCabang) => {
    const [rows] = await pool.query(
      `SELECT id_developer, dev AS nama_developer, project, tipe, latitude, longitude,
              jumlah_kavling, ready_stock, sisa_potensi, terjual
       FROM developer
       WHERE kode_cabang = ?`,
      [kodeCabang]
    );
    return rows;
  },

  // Ambil riwayat visit developer (optional filter)
  getVisits: async (kodeCabang, namaDeveloper) => {
    let sql = `SELECT id_visit, kode_cabang, nama_developer, visit_date,
                      jumlah_kavling, ready_stock, sisa_potensi, terjual,
                      foto_visit, created_at
               FROM developer_visit
               WHERE 1=1`;
    const params = [];

    if (kodeCabang) {
      sql += ` AND kode_cabang = ?`;
      params.push(kodeCabang);
    }
    if (namaDeveloper) {
      sql += ` AND nama_developer = ?`;
      params.push(namaDeveloper);
    }

    sql += ` ORDER BY visit_date DESC`;

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  // Tambah visit baru
  createVisit: async (visitData) => {
    const {
      kode_cabang,
      nama_developer,
      visit_date,
      jumlah_kavling,
      ready_stock,
      sisa_potensi,
      terjual,
      foto_visit
    } = visitData;

    const [result] = await pool.query(
      `INSERT INTO developer_visit
       (kode_cabang, nama_developer, visit_date, jumlah_kavling, ready_stock, sisa_potensi, terjual, foto_visit)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [kode_cabang, nama_developer, visit_date, jumlah_kavling, ready_stock, sisa_potensi, terjual, foto_visit]
    );

    return { id_visit: result.insertId, ...visitData };
  },

    // Update visit
    updateVisit: async (id_visit, visitData) => {
      const {
        visit_date,
        jumlah_kavling,
        ready_stock,
        sisa_potensi,
        terjual,
        foto_visit
      } = visitData;

      const [result] = await pool.query(
        `UPDATE developer_visit
        SET visit_date = ?, jumlah_kavling = ?, ready_stock = ?, 
            sisa_potensi = ?, terjual = ?, foto_visit = ?
        WHERE id_visit = ?`,
        [visit_date, jumlah_kavling, ready_stock, sisa_potensi, terjual, foto_visit, id_visit]
      );

      return result.affectedRows > 0;
    },

  // Ambil detail developer + data jumlah dari tabel developer
  getDetail: async (kodeCabang, namaDeveloper) => {
    const [rows] = await pool.query(
      `SELECT id_developer, dev AS nama_developer, project, tipe, latitude, longitude,
              jumlah_kavling, ready_stock, sisa_potensi, terjual
      FROM developer
      WHERE kode_cabang = ? AND dev = ?
      LIMIT 1`,
      [kodeCabang, namaDeveloper]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  // Ambil visit terbaru untuk developer tertentu
  getLatestVisit: async (kodeCabang, namaDeveloper) => {
    const [rows] = await pool.query(
      `SELECT id_visit, kode_cabang, nama_developer, visit_date,
              jumlah_kavling, ready_stock, sisa_potensi, terjual,
              foto_visit, created_at
      FROM developer_visit
      WHERE kode_cabang = ? AND nama_developer = ?
      ORDER BY visit_date DESC
      LIMIT 1`,
      [kodeCabang, namaDeveloper]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  // Delete visit
  deleteVisit: async (id_visit) => {
    const [result] = await pool.query(
      `DELETE FROM developer_visit WHERE id_visit = ?`,
      [id_visit]
    );
    return result.affectedRows > 0;
  }

};

module.exports = Developer;
