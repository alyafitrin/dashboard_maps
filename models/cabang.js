// models/cabang.js
const pool = require('../database/database');

const Cabang = {
  // GET semua cabang
  getAll: async () => {
    const [rows] = await pool.query(`
      SELECT kode_cabang, nama, posisi, unit_kerja, kode_area, latitude, longitude, kota
      FROM cabang ORDER BY nama
    `);
    return rows;
  },

  // GET cabang by kode
  getByKode: async (kodeCabang) => {
    const [rows] = await pool.query(
      `SELECT * FROM cabang WHERE kode_cabang = ? LIMIT 1`,
      [kodeCabang]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  // CREATE cabang baru
  create: async (data) => {
    const {
      nip, nama, gender, posisi, kode_cabang, kelas,
      unit_kerja, kode_area, latitude, longitude,
      alamat, kel, kec, kota
    } = data;

    const [result] = await pool.query(
      `INSERT INTO cabang 
        (nip, nama, gender, posisi, kode_cabang, kelas, unit_kerja, kode_area,
         latitude, longitude, alamat, kel, kec, kota)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nip, nama, gender, posisi, kode_cabang, kelas, unit_kerja, kode_area,
       latitude, longitude, alamat, kel, kec, kota]
    );

    return { id: result.insertId, ...data };
  },

  // UPDATE cabang
  update: async (kode_cabang, data) => {
    const {
      nama, gender, posisi, kelas,
      unit_kerja, kode_area, latitude, longitude,
      alamat, kel, kec, kota
    } = data;

    const [result] = await pool.query(
      `UPDATE cabang
       SET nama=?, gender=?, posisi=?, kelas=?, unit_kerja=?, kode_area=?,
           latitude=?, longitude=?, alamat=?, kel=?, kec=?, kota=?
       WHERE kode_cabang=?`,
      [nama, gender, posisi, kelas, unit_kerja, kode_area,
       latitude, longitude, alamat, kel, kec, kota, kode_cabang]
    );

    return result.affectedRows > 0;
  },

  // DELETE cabang
  delete: async (kode_cabang) => {
    const [result] = await pool.query(
      `DELETE FROM cabang WHERE kode_cabang = ?`,
      [kode_cabang]
    );
    return result.affectedRows > 0;
  }
};

module.exports = Cabang;
