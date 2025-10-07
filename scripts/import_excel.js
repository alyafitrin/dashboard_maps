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
    const wb = xlsx.readFile(file);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const raw = xlsx.utils.sheet_to_json(ws, { defval: '' });
    const rows = raw.map(normalizeRowKeys);
    
    for (const r of rows) {
        const kode_cabang = (r['KODE CABANG'] || '').toString().trim();
        if (!kode_cabang) continue;

        const { lat, lng } = normalizeCoord(r['LATITUDE'], r['LONGITUDE']);

        await pool.query(
            `INSERT INTO cabang
            (kode_cabang, nip, nama, gender, posisi, kelas, unit_kerja, area_region,
            latitude, longitude, alamat, kel, kec, kota)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            nip=VALUES(nip), nama=VALUES(nama), gender=VALUES(gender), posisi=VALUES(posisi),
            kelas=VALUES(kelas), unit_kerja=VALUES(unit_kerja), area_region=VALUES(area_region),
            latitude=VALUES(latitude), longitude=VALUES(longitude), alamat=VALUES(alamat),
            kel=VALUES(kel), kec=VALUES(kec), kota=VALUES(kota)`,
            [
                kode_cabang,
                r['NIP'] || null,
                r['NAMA'] || null,
                r['GENDER'] || null,
                r['POSISI'] || null,
                r['KELAS'] || null,
                r['UNIT KERJA'] || null,
                r['AREA'] || null,
                lat, lng,
                r['ALAMAT'] || null,
                r['KEL'] || null,
                r['KEC'] || null,
                r['KOTA'] || null,
            ]
        );
    }
    console.log('Import CABANG: SELESAI');
}

async function importDeveloper(file) {
    const wb = xlsx.readFile(file);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const raw = xlsx.utils.sheet_to_json(ws, { defval: '' });
    const rows = raw.map(normalizeRowKeys);

    // Ambil semua kode_cabang yang valid (untuk validasi)
    const [cbs] = await pool.query('SELECT kode_cabang FROM cabang');
    const validCab = new Set(cbs.map(x => x.kode_cabang));

    for (const r of rows) {
        const kode_cabang = (r['Kode Cabang'] || '').toString().trim();
        if (!kode_cabang || !validCab.has(kode_cabang)) {
            console.log('SKIP developer: kode_cabang tidak ditemukan', kode_cabang);
            continue;
        }

        const { lat, lng } = normalizeCoord(r['LATITUDE'], r['LONGITUDE']);

        // Perhatikan kolom dengan spasi di Excel: "Kavling", "Ready Stock", "Sisa Potensi", "Terjual"
        const kavling = parseInt(r['Kavling'] || 0, 10);
        const ready_stock = parseInt(r['Ready Stock'] || 0, 10);
        const sisa_potensi = parseInt(r['Sisa Potensi'] || 0, 10);
        const terjual = parseInt(r['Terjual'] || 0, 10);

        await pool.query(
            `INSERT INTO developer
            (kode_area, area, kode_cabang, cabang_padanan, kelas_cabang, project, dev, tipe, latitude, longitude,
            jumlah_kavling, ready_stock, sisa_potensi, terjual)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                r['Kode Area'] || null,
                r['Area'] || null,
                kode_cabang,
                r['Cabang Padanan'] || null,
                r['Kelas Cabang'] || null,
                r['PROJECT'] || null,
                r['DEV'] || null,
                r['TIPE'] || null,
                lat, lng,
                isNaN(kavling) ? 0 : kavling,
                isNaN(ready_stock) ? 0 : ready_stock,
                isNaN(sisa_potensi) ? 0 : sisa_potensi,
                isNaN(terjual) ? 0 : terjual
                ]
            );
        }
        console.log('Import DEVELOPER: SELESAI');
    }

async function importPerusahaanK1(file) {
    const wb = xlsx.readFile(file);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const raw = xlsx.utils.sheet_to_json(ws, { defval: '' });
    const rows = raw.map(normalizeRowKeys);

    // Ambil mapping kode_cabang → id
    const [cbs] = await pool.query('SELECT id_cabang, kode_cabang FROM cabang');
    const cabMap = new Map(cbs.map(x => [x.kode_cabang, x.id_cabang]));

    for (const r of rows) {
        const kode_cabang = (r['Kode Cabang'] || '').toString().trim();
        if (!kode_cabang || !cabMap.has(kode_cabang)) {
            console.log('SKIP K1: kode_cabang tidak ditemukan', kode_cabang);
            continue;
        }

        const cabang_id = cabMap.get(kode_cabang);
        const { lat, lng } = normalizeCoord(r['Latitude'], r['Longitude']);

        await pool.query(
            `INSERT INTO perusahaan_k1
            (nama_perusahaan, latitude, longitude, kode_cabang,nama_cabang, jumlah_payroll)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            nama_perusahaan=VALUES(nama_perusahaan),
            latitude=VALUES(latitude),
            longitude=VALUES(longitude),
            kode_cabang=VALUES(kode_cabang),
            nama_cabang=VALUES(nama_cabang),
            jumlah_payroll=VALUES(jumlah_payroll)`,
            [
                r['Badan Usaha'] || null,
                lat,
                lng,
                kode_cabang,
                r['Cabang'] || null,
                r['Payroll'] || null
            ]
        );
    }
    console.log('Import PERUSAHAAN K1: SELESAI');
}

async function importPotensi(file) {
    try {
        const wb = xlsx.readFile(file);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = xlsx.utils.sheet_to_json(ws, { defval: '' });
        const rows = raw.map(normalizeRowKeys);

        console.log('📊 Processing Potensi - Total rows:', rows.length);

        // DEBUG: Lihat sample data
        console.log('🔍 Sample data:', JSON.stringify(rows[0], null, 2));

        let inserted = 0;
        let updated = 0;
        let skipped = 0;
        let errors = 0;

        for (const [index, r] of rows.entries()) {
            const kode_cabang = (r['Kode Cabang'] || '').toString().trim();
            
            // Skip jika kode_cabang kosong
            if (!kode_cabang) {
                console.log(`⏩ Skip row ${index + 1}: kode_cabang kosong`);
                skipped++;
                continue;
            }

            // DEBUG: Lihat kode_cabang yang diproses
            if (index < 5) {
                console.log(`🔍 Processing kode_cabang: "${kode_cabang}" (length: ${kode_cabang.length})`);
            }

            // Parse nilai numerik
            const pks = toNumber(r['PKS']) || 0;
            const hasil_pks = toNumber(r['Hasil PKS']) || 0;
            const flpp = toNumber(r['FLPP']) || 0;
            const hasil_flpp = toNumber(r['Hasil FLPP']) || 0;
            const take_over = toNumber(r['Take Over']) || 0;
            const hasil_to = toNumber(r['Hasil TO']) || 0;
            const top_up = toNumber(r['Top Up']) || 0;
            const hasil_tu = toNumber(r['Hasil TU']) || 0;
            const multiguna = toNumber(r['Multiguna']) || 0;
            const hasil_mu = toNumber(r['Hasil MU']) || 0;
            const mix = toNumber(r['MIX']) || 0;
            const hasil_mix = toNumber(r['Hasil Mix']) || 0;

            try {
                const [result] = await pool.query(
                    `INSERT INTO potensi 
                    (kode_cabang, cabang, pks, hasil_pks, flpp, hasil_flpp, take_over, hasil_to, 
                     top_up, hasil_tu, multiguna, hasil_mu, mix, hasil_mix)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                    cabang=VALUES(cabang), pks=VALUES(pks), hasil_pks=VALUES(hasil_pks),
                    flpp=VALUES(flpp), hasil_flpp=VALUES(hasil_flpp), take_over=VALUES(take_over),
                    hasil_to=VALUES(hasil_to), top_up=VALUES(top_up), hasil_tu=VALUES(hasil_tu),
                    multiguna=VALUES(multiguna), hasil_mu=VALUES(hasil_mu), mix=VALUES(mix),
                    hasil_mix=VALUES(hasil_mix)`,
                    [
                        kode_cabang,
                        r['Cabang'] || null,
                        pks,
                        hasil_pks,
                        flpp,
                        hasil_flpp,
                        take_over,
                        hasil_to,
                        top_up,
                        hasil_tu,
                        multiguna,
                        hasil_mu,
                        mix,
                        hasil_mix
                    ]
                );

                if (result.affectedRows === 1) {
                    inserted++;
                    console.log(`✅ INSERTED: ${kode_cabang}`);
                } else if (result.affectedRows === 2) {
                    updated++;
                    console.log(`🔄 UPDATED: ${kode_cabang}`);
                }

                if ((index + 1) % 50 === 0) {
                    console.log(`Processed ${index + 1}/${rows.length} potensi rows...`);
                }

            } catch (error) {
                console.error(`❌ Error insert potensi untuk cabang ${kode_cabang}:`, error.message);
                errors++;
                
                // Jika error karena foreign key, coba insert tanpa validasi
                if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                    console.log(`🔄 Trying to insert without foreign key validation for ${kode_cabang}`);
                    try {
                        const [result] = await pool.query(
                            `INSERT IGNORE INTO potensi 
                            (kode_cabang, cabang, pks, hasil_pks, flpp, hasil_flpp, take_over, hasil_to, 
                             top_up, hasil_tu, multiguna, hasil_mu, mix, hasil_mix)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [kode_cabang, r['Cabang'] || null, pks, hasil_pks, flpp, hasil_flpp, 
                             take_over, hasil_to, top_up, hasil_tu, multiguna, hasil_mu, mix, hasil_mix]
                        );
                        if (result.affectedRows > 0) {
                            inserted++;
                            console.log(`✅ INSERTED (ignore): ${kode_cabang}`);
                        }
                    } catch (ignoreError) {
                        console.error(`❌ Still error for ${kode_cabang}:`, ignoreError.message);
                    }
                }
            }
        }

        console.log('✅ Import POTENSI: SELESAI');
        console.log(`📊 Inserted: ${inserted}, Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`);

    } catch (error) {
        console.error('❌ Error import potensi:', error);
        throw error;
    }
}

async function importDeveloperTipe(file) {
    try {
        const wb = xlsx.readFile(file);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = xlsx.utils.sheet_to_json(ws, { defval: '' });
        const rows = raw.map(normalizeRowKeys);

        console.log('📊 Processing Developer Tipe - Total rows:', rows.length);

        // DEBUG: Lihat sample data
        console.log('🔍 Sample data:', JSON.stringify(rows[0], null, 2));

        let inserted = 0;
        let updated = 0;
        let skipped = 0;
        let errors = 0;

        for (const [index, r] of rows.entries()) {
            const kode_cabang = (r['Kode Cabang'] || r['kode_cabang'] || '').toString().trim();
            const project = (r['Project'] || r['project'] || '').toString().trim();
            const developer = (r['Developer'] || r['developer'] || '').toString().trim();
            const cluster = (r['Cluster'] || r['cluster'] || '').toString().trim();
            const tipe = (r['Tipe'] || r['tipe'] || '').toString().trim();
            
            // Skip jika data required kosong
            if (!kode_cabang || !project || !developer || !tipe) {
                console.log(`⏩ Skip row ${index + 1}: data required kosong - kode_cabang: "${kode_cabang}", project: "${project}", developer: "${developer}", tipe: "${tipe}"`);
                skipped++;
                continue;
            }

            // Parse harga_avg (handle berbagai format)
            let harga_avg = 0;
            const hargaRaw = r['Harga avg'] || r['harga_avg'] || r['Harga Rata-rata'] || r['Harga'] || 0;
            
            if (typeof hargaRaw === 'number') {
                harga_avg = hargaRaw;
            } else if (typeof hargaRaw === 'string') {
                // Bersihkan string dari karakter non-numeric (kecuali titik dan koma)
                const cleaned = hargaRaw.toString().replace(/[^\d.,]/g, '');
                // Handle format Indonesia (1.000.000,00) dan internasional (1,000,000.00)
                if (cleaned.includes(',') && cleaned.includes('.')) {
                    // Format: 1.000.000,00 -> 1000000.00
                    harga_avg = parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
                } else if (cleaned.includes(',')) {
                    // Format: 1,000,000 -> 1000000
                    harga_avg = parseFloat(cleaned.replace(/,/g, ''));
                } else {
                    harga_avg = parseFloat(cleaned);
                }
            }

            // Validasi harga_avg
            if (isNaN(harga_avg) || harga_avg < 0) {
                harga_avg = 0;
                console.log(`⚠️ Harga Avg invalid untuk row ${index + 1}, set to 0`);
            }

            // DEBUG: Lihat data yang diproses
            if (index < 5) {
                console.log(`🔍 Processing: "${kode_cabang}", "${project}", "${developer}", "${cluster}", "${tipe}", ${harga_avg}`);
            }

            try {
                const [result] = await pool.query(
                    `INSERT INTO developer_tipe 
                    (kode_cabang, project, developer, cluster, tipe, harga_avg)
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                    cluster=VALUES(cluster), 
                    harga_avg=VALUES(harga_avg),
                    created_at=CURRENT_TIMESTAMP`,
                    [
                        kode_cabang,
                        project,
                        developer,
                        cluster || null, // cluster bisa null
                        tipe,
                        harga_avg
                    ]
                );

                if (result.affectedRows === 1) {
                    inserted++;
                    console.log(`✅ INSERTED: ${kode_cabang} - ${project} - ${developer} - ${tipe}`);
                } else if (result.affectedRows === 2) {
                    updated++;
                    console.log(`🔄 UPDATED: ${kode_cabang} - ${project} - ${developer} - ${tipe}`);
                }

                // Progress update setiap 50 baris
                if ((index + 1) % 50 === 0) {
                    console.log(`Processed ${index + 1}/${rows.length} developer_tipe rows...`);
                }

            } catch (error) {
                console.error(`❌ Error insert developer_tipe untuk ${kode_cabang} - ${project} - ${developer}:`, error.message);
                errors++;
                
                // Jika error karena foreign key constraint, coba insert tanpa validasi
                if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                    console.log(`🔄 Trying to insert without foreign key validation for ${kode_cabang}`);
                    try {
                        const [result] = await pool.query(
                            `INSERT IGNORE INTO developer_tipe 
                            (kode_cabang, project, developer, cluster, tipe, harga_avg)
                            VALUES (?, ?, ?, ?, ?, ?)`,
                            [kode_cabang, project, developer, cluster || null, tipe, harga_avg]
                        );
                        if (result.affectedRows > 0) {
                            inserted++;
                            console.log(`✅ INSERTED (ignore): ${kode_cabang} - ${project} - ${developer} - ${tipe}`);
                        }
                    } catch (ignoreError) {
                        console.error(`❌ Still error for ${kode_cabang} - ${project} - ${developer}:`, ignoreError.message);
                    }
                }
                
                // Jika error karena duplicate entry, coba update saja
                else if (error.code === 'ER_DUP_ENTRY') {
                    console.log(`🔄 Trying to update existing record for ${kode_cabang} - ${project} - ${developer} - ${tipe}`);
                    try {
                        const [result] = await pool.query(
                            `UPDATE developer_tipe 
                            SET cluster=?, harga_avg=?, created_at=CURRENT_TIMESTAMP
                            WHERE kode_cabang=? AND project=? AND developer=? AND tipe=?`,
                            [cluster || null, harga_avg, kode_cabang, project, developer, tipe]
                        );
                        if (result.affectedRows > 0) {
                            updated++;
                            console.log(`🔄 UPDATED (manual): ${kode_cabang} - ${project} - ${developer} - ${tipe}`);
                        }
                    } catch (updateError) {
                        console.error(`❌ Update also failed for ${kode_cabang} - ${project} - ${developer}:`, updateError.message);
                    }
                }
            }
        }

        console.log('✅ Import DEVELOPER_TIPE: SELESAI');
        console.log(`📊 Inserted: ${inserted}, Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`);

        // Summary report
        return {
            success: true,
            message: 'Import developer_tipe completed successfully',
            summary: {
                totalRows: rows.length,
                inserted,
                updated,
                skipped,
                errors
            }
        };

    } catch (error) {
        console.error('❌ Error import developer_tipe:', error);
        throw error;
    }
}


(async () => {
    try {
        //await importCabang(path.join(__dirname, '..', 'data', 'cabang.xlsx'));
        //await importDeveloper(path.join(__dirname, '..', 'data', 'developer.xlsx'));
        //await importPerusahaanK1(path.join(__dirname, '..', 'data', 'perusahaan_k1.xlsx'));
        //await importPotensi(path.join(__dirname, '..', 'data', 'potensi.xlsx'));
        await importDeveloperTipe(path.join(__dirname, '..', 'data', 'developer_tipe.xlsx'));
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
})();