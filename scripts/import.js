// /scripts/import_excel.js
require('dotenv').config();
const path = require('path');
const xlsx = require('xlsx');
const pool = require('../database/database');

/** Helpers */
function toNumber(v) {
    if (v === null || v === undefined) return null;
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
    const s = v.trim().replace(',', '.');
    const n = parseFloat(s);
    return isNaN(n) ? null : n;
}
return null;
}

// Normalisasi koordinat: kalau nilai > batas wajar, dibagi 10^k sampai masuk range
function normalizeCoord(lat, lng) {
    let la = toNumber(lat);
    let lo = toNumber(lng);
    const fix = (val, maxAbs) => {
        if (val === null) return null;
        let v = val, i = 0;
        while (Math.abs(v) > maxAbs && i < 16) { v = v / 10; i++; }
        return v;
    };
    la = fix(la, 90);
    lo = fix(lo, 180);
    return { lat: la, lng: lo };
}

// Utility: normalisasi key (trim spasi, hapus spasi ganda)
const normKey = k => k.replace(/\s+/g, ' ').trim();

// Convert row agar akses key lebih stabil (misal " Ready Stock " → "Ready Stock")
function normalizeRowKeys(row) {
    const out = {};
    Object.keys(row).forEach(k => out[normKey(k)] = row[k]);
    return out;
}

async function importCabang(file) {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        console.log('📖 Reading cabang file:', file);
        const wb = xlsx.readFile(file);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = xlsx.utils.sheet_to_json(ws, { defval: '' });
        const rows = raw.map(normalizeRowKeys);
        
        console.log('📊 Total rows in Excel:', rows.length);

        let inserted = 0;
        let updated = 0;
        let skipped = 0;
        let errors = 0;

        for (const [index, r] of rows.entries()) {
            const kode_cabang = (r['KODE CABANG'] || '').toString().trim();
            
            // Skip jika kode_cabang kosong
            if (!kode_cabang) {
                console.log(`⏩ Skip row ${index + 1}: kode_cabang kosong`);
                skipped++;
                continue;
            }

            const { lat, lng } = normalizeCoord(r['LATITUDE'], r['LONGITUDE']);

            try {
                const [result] = await connection.query(
                    `INSERT INTO cabang (
                        kode_cabang, nip, nama, gender, posisi, kelas, unit_kerja, area_region,
                        latitude, longitude, alamat, kel, kec, kota_kab
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        nip = VALUES(nip),
                        nama = VALUES(nama),
                        gender = VALUES(gender),
                        posisi = VALUES(posisi),
                        kelas = VALUES(kelas),
                        unit_kerja = VALUES(unit_kerja),
                        area_region = VALUES(area_region),
                        latitude = VALUES(latitude),
                        longitude = VALUES(longitude),
                        alamat = VALUES(alamat),
                        kel = VALUES(kel),
                        kec = VALUES(kec),
                        kota_kab = VALUES(kota_kab)`,
                    [
                        kode_cabang,
                        r['NIP'] || null,
                        r['NAMA'] || null,
                        r['GENDER'] || null,
                        r['POSISI'] || null,
                        r['KELAS'] || null,
                        r['UNIT KERJA'] || null,
                        r['AREA'] || null,
                        lat, 
                        lng,
                        r['ALAMAT'] || null,
                        r['KEL'] || null,
                        r['KEC'] || null,
                        r['KOTA'] || null,
                    ]
                );

                // Perhatikan: affectedRows = 1 untuk INSERT, 2 untuk UPDATE
                if (result.affectedRows === 1) {
                    console.log(`✅ INSERTED: ${kode_cabang}`);
                    inserted++;
                } else if (result.affectedRows === 2) {
                    console.log(`🔄 UPDATED: ${kode_cabang}`);
                    updated++;
                }

                // Progress indicator
                if ((index + 1) % 10 === 0) {
                    console.log(`📈 Processed ${index + 1}/${rows.length} rows...`);
                }

            } catch (error) {
                console.error(`❌ ERROR pada row ${index + 1} (${kode_cabang}):`, error.message);
                console.error('Data:', {
                    kode_cabang,
                    nama: r['NAMA'],
                    lat,
                    lng
                });
                errors++;
            }
        }

        // COMMIT transaction
        await connection.commit();
        console.log('\n🎯 CABANG IMPORT SUMMARY:');
        console.log(`✅ Inserted: ${inserted}`);
        console.log(`🔄 Updated: ${updated}`);
        console.log(`⏩ Skipped: ${skipped}`);
        console.log(`❌ Errors: ${errors}`);
        console.log(`📊 Total rows processed: ${rows.length}`);

        // VERIFIKASI LANGSUNG dari database
        console.log('\n🔍 VERIFYING DATABASE...');
        const [dbCount] = await connection.query('SELECT COUNT(*) as total FROM cabang');
        console.log(`📦 Total records in cabang table: ${dbCount[0].total}`);

        // Ambil sample data untuk konfirmasi
        const [sample] = await connection.query('SELECT kode_cabang, nama FROM cabang ORDER BY id_cabang DESC LIMIT 5');
        console.log('🔍 Latest 5 records:');
        sample.forEach((row, i) => {
            console.log(`   ${i + 1}. ${row.kode_cabang} - ${row.nama}`);
        });

        return { inserted, updated, skipped, errors };

    } catch (error) {
        console.error('❌ TRANSACTION ERROR:', error);
        if (connection) {
            await connection.rollback();
            console.log('🔁 Transaction rolled back');
        }
        throw error;
    } finally {
        if (connection) {
            connection.release();
            console.log('🔗 Connection released');
        }
    }
}

// TEST ONLY CABANG
(async () => {
    try {
        console.log('🧪 TESTING CABANG IMPORT ONLY...');
        
        // Pertama, kosongkan tabel untuk test (HATI-HATI! Hanya untuk development)
        // await pool.query('DELETE FROM cabang');
        // console.log('🧹 Table cleared for testing');

        // Import cabang
        const result = await importCabang(path.join(__dirname, '..', 'data', 'cabang.xlsx'));
        
        console.log('\n🎉 TEST COMPLETED!');
        console.log('Result:', result);

    } catch (error) {
        console.error('❌ TEST FAILED:', error);
    } finally {
        // Jangan end pool jika mau lanjut ke import lain
        await pool.end();
        console.log('🏁 Pool ended');
    }
})();