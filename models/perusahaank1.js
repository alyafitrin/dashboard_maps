// models/perusahaanK1.js
const pool = require('../database/database');

const PerusahaanK1 = {
  // GET dengan pagination + search
  getPaginated: async (page, limit, search) => {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT id_k1, nama_perusahaan, latitude, longitude, kode_cabang, nama_cabang, jumlah_payroll
      FROM perusahaan_k1
    `;
    let countSql = `SELECT COUNT(*) as total FROM perusahaan_k1`;
    const params = [];

    if (search) {
      sql += ` WHERE nama_perusahaan LIKE ? OR nama_cabang LIKE ? OR kode_cabang LIKE ?`;
      countSql += ` WHERE nama_perusahaan LIKE ? OR nama_cabang LIKE ? OR kode_cabang LIKE ?`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY id_k1 DESC LIMIT ?, ?`;
    params.push(offset, limit);

    const [rows] = await pool.query(sql, params);
    const [countRows] = await pool.query(countSql, search ? [`%${search}%`, `%${search}%`, `%${search}%`] : []);
    const total = countRows[0].total;
    const totalPages = Math.ceil(total / limit);

    return { rows, total, totalPages };
  },

  getById: async (id) => {
    const [rows] = await pool.query(`SELECT * FROM perusahaan_k1 WHERE id_k1=?`, [id]);
    return rows[0];
  },

  // CREATE
  create: async (data) => {
    const { nama_perusahaan, latitude, longitude, kode_cabang, nama_cabang, jumlah_payroll } = data;
    const [result] = await pool.query(
      `INSERT INTO perusahaan_k1 
      (nama_perusahaan, latitude, longitude, kode_cabang, nama_cabang, jumlah_payroll) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [nama_perusahaan, latitude, longitude, kode_cabang, nama_cabang, jumlah_payroll]
    );
    return { id: result.insertId, ...data };
  },

  // UPDATE
  update: async (id_k1, data) => {
    const { nama_perusahaan, latitude, longitude, kode_cabang, nama_cabang, jumlah_payroll } = data;
    const [result] = await pool.query(
      `UPDATE perusahaan_k1 
       SET nama_perusahaan=?, latitude=?, longitude=?, kode_cabang=?, nama_cabang=?, jumlah_payroll=? 
       WHERE id_k1=?`,
      [nama_perusahaan, latitude, longitude, kode_cabang, nama_cabang, jumlah_payroll, id_k1]
    );
    return result.affectedRows > 0;
  },

  // DELETE
  delete: async (id_k1) => {
    const [result] = await pool.query(`DELETE FROM perusahaan_k1 WHERE id_k1 = ?`, [id_k1]);
    return result.affectedRows > 0;
  }
};

module.exports = PerusahaanK1;
