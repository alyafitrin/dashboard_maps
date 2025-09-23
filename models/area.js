// models/Area.js - UPDATE METHOD getAll
const pool = require('../database/database');

const Area = {
  // AMBIL SEMUA DATA AREA DARI TABEL areas (BUKAN dari cabang)
  getAll: async () => {
    try {
      const [rows] = await pool.query(`
        SELECT kode_area, nama_area, latitude, longitude 
        FROM area 
        ORDER BY nama_area
      `);
      return rows;
    } catch (error) {
      throw error;
    }
  },

  // AMBIL DATA AREA TERTENTU BESERTA RELASINYA
  getByKodeArea: async (kodeArea) => {
    try {
      const query = `
        SELECT 
          area.kode_area,
          area.nama_area,
          area.latitude as area_lat,
          area.longitude as area_lon,
          cabang.kode_cabang,
          cabang.unit_kerja as cabang_nama,
          cabang.nama as cabang_nama_manager,
          cabang.latitude as cabang_lat,
          cabang.longitude as cabang_lon,
          developer.dev as developer_nama,
          developer.latitude as developer_lat,
          developer.longitude as developer_lon,
          developer.project as developer_project,
          developer.tipe as developer_tipe,
          perusahaan_k1.nama_perusahaan as k1_nama,
          perusahaan_k1.latitude as k1_lat,
          perusahaan_k1.longitude as k1_lon,
          perusahaan_k1.jumlah_payroll as k1_payroll
        FROM area
        LEFT JOIN cabang ON area.kode_area = cabang.kode_area
        LEFT JOIN developer ON cabang.kode_cabang = developer.kode_cabang
        LEFT JOIN perusahaan_k1 ON cabang.kode_cabang = perusahaan_k1.kode_cabang
        WHERE area.kode_area = ?
        ORDER BY cabang.nama
      `;

      const [rows] = await pool.query(query, [kodeArea]);

      if (rows.length === 0) return null;

      // Process the data
      const result = {
        kode_area: rows[0].kode_area,
        nama_area: rows[0].nama_area,
        latitude: parseFloat(rows[0].area_lat),
        longitude: parseFloat(rows[0].area_lon),
        branches: []
      };

      const branchMap = new Map();

      rows.forEach(row => {
        if (row.kode_cabang && !branchMap.has(row.kode_cabang)) {
          const branch = {
            kode_cabang: row.kode_cabang,
            nama: row.cabang_nama,
            nama_manager: row.cabang_nama_manager,
            latitude: parseFloat(row.cabang_lat),
            longitude: parseFloat(row.cabang_lon),
            developers: [],
            k1Companies: []
          };
          branchMap.set(row.kode_cabang, branch);
          result.branches.push(branch);
        }

        const currentBranch = branchMap.get(row.kode_cabang);

        // Add developer
        if (row.developer_nama && currentBranch) {
          const developerExists = currentBranch.developers.some(dev => 
            dev.nama === row.developer_nama && dev.project === row.developer_project
          );
          
          if (!developerExists) {
            currentBranch.developers.push({
              nama: row.developer_nama,
              project: row.developer_project,
              latitude: parseFloat(row.developer_lat),
              longitude: parseFloat(row.developer_lon),
              tipe: row.developer_tipe
            });
          }
        }

        // Add K1 company
        if (row.k1_nama && currentBranch) {
          const k1Exists = currentBranch.k1Companies.some(k1 => 
            k1.nama === row.k1_nama
          );
          
          if (!k1Exists) {
            currentBranch.k1Companies.push({
              nama: row.k1_nama,
              payroll: parseInt(row.k1_payroll, 10),
              latitude: parseFloat(row.k1_lat),
              longitude: parseFloat(row.k1_lon)
            });
          }
        }
      });

      return result;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = Area;