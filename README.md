# 🗺️ Dashboard Maps – Consumer Loan Visualization

**Dashboard Maps** adalah proyek **Web-GIS** berbasis **Node.js**, **Express**, dan **Leaflet.js** yang dikembangkan untuk mendukung digitalisasi proses bisnis di **Divisi Consumer Loan Bank Mandiri (Region VI – West Java)**.  
Dashboard ini memetakan hubungan antara **Cabang**, **Developer**, dan **Perusahaan Payroll (K1)** secara interaktif dalam satu platform terpadu.

---

## 🚀 Fitur Utama

### 🌍 1. Pemetaan Spasial (Web-GIS)
- Menampilkan titik koordinat **Area**, **Cabang**, **Developer**, dan **Perusahaan K1** dalam satu peta interaktif.  
- Menggunakan **Leaflet.js** dan tile layer **OpenStreetMap**.  
- Warna dan ikon berbeda untuk setiap entitas:
  - 🏢 Cabang  
  - 🏘️ Developer  
  - 🧭 Area  
  - 🏭 Perusahaan K1  

---

### 🔎 2. Filter & Layer Control
- Filter berdasarkan **Unit (Region/Area)**, **Area**, dan **cabang**.  
- Checkbox untuk mengatur visibilitas setiap layer (Area, Cabang, Developer, K1).  
- Tombol “**Pilih Semua / Hapus Semua**” untuk kontrol cepat.

---

### 🧩 3. Developer Detail & Visit Management
- Klik marker **developer** → menampilkan **modal detail**:  
  - Data proyek (cluster, tipe, harga rata-rata)  
  - Data stok ready, potensi, dan terjual  
- Form tambah / update data **visit cabang** ke developer:
  - Input tanggal visit, stok, potensi, terjual, serta upload foto visit  
- Warna marker developer berubah otomatis berdasarkan status visit:
  - 🟥 Merah – Belum ada visit  
  - 🟨 Kuning – Sudah visit melewati sebulan  
  - 🟩 Hijau – Sudah visit  

---

### 🧮 4. Statistik Real-Time
- Menampilkan total:
  - Jumlah Area  
  - Jumlah Cabang  
  - Jumlah Developer  
  - Jumlah K1  
- Data diperbarui otomatis sesuai filter aktif.

---

### 🧰 5. Admin Panel
- Role **Region** dapat mengakses **Admin Panel** untuk CRUD data:
  - Area  
  - Cabang  
  - Developer  
  - Perusahaan K1  
- Tersedia tombol **“Kembali ke Dashboard”** dari panel admin.

---

### 🔐 6. Autentikasi & Role Management
- Sistem login berbasis **LocalStorage**:  
  - **Region:** akses penuh termasuk Admin Panel  
  - **Cabang:** akses terbatas pada data wilayah masing-masing  

---

## 🏗️ Arsitektur Proyek
```
dashboard_maps/
├── public/
│   ├── css/          # File styling (Bootstrap + custom)
│   ├── js/           # Script utama (dashboard.js, admin.js)
│   ├── index.html    # Halaman utama (dashboard)
│   ├── login.html
│   ├── admin.html
│   ├── img/          # Ikon marker (area.png, branch.png, k1.png)
│   └── uploads/      # Foto hasil visit
│
├── routes/
│   ├── adminRoutes.js
│   └── apiRoutes.js
│
├── models/
│   ├── area.js
│   ├── cabang.js
│   ├── developer.js  # Data developer dan visit (tabel developer2)
│   └── perusahaan_k1.js
│
├── database/
│   └── database.js   # Konfigurasi koneksi MySQL
│
├── script/
│   └── import_excel.js   # Mengimpor data Excel ke dalam database MySQL
│
├── data/    # data excel ini tidak ada digithub karena bersifat rahasia
│   ├── cabang.xlsx
│   ├── developer.xlsx
│   ├── potensi.xlsx  
│   └── perusahaan_k1.xlsx
│
├── server.js         # Entry point Express.js
└── README.md
```

---

## ⚙️ Teknologi yang Digunakan

| Layer | Teknologi |
|-------|------------|
| **Frontend** | HTML, CSS, Bootstrap 5, Leaflet.js |
| **Backend** | Node.js, Express.js |
| **Database** | MySQL (via laragon) |
| **Auth & Role** | LocalStorage Session |
| **Visualization** | Leaflet Maps + Custom Markers |
| **Deployment (opsional)** | Render / Railway / Localhost |

---

## 🧪 Cara Menjalankan Proyek

### 1️⃣ Clone Repository
```bash
git clone https://github.com/alyafitrin/dashboard_maps.git
cd dashboard_maps
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Setup Database
- Import file SQL (misalnya `database.sql`) ke MySQL.  
- Pastikan `database.js` sesuai dengan konfigurasi lokal:

```js
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'dashboard_maps'
});
```

### 4️⃣ Jalankan Server
```bash
npm start
```
Atau:
```bash
node server.js
```

### 5️⃣ Akses di Browser
👉 [http://localhost:3000](http://localhost:3000)

---

## 📈 Rencana Pengembangan Selanjutnya
- 📤 Upload & download data developer via file Excel   
- 📊 Dashboard analitik (statistik penjualan, potensi, visit frequency)   
- 📄 Export laporan ke **PDF/Excel** dari dashboard  

---

## 👩‍💻 Kontributor
**Alya Fitri Nurhaliza**  
📍 *Consumer Loan Intern — Bank Mandiri Region VI (West Java)*  
📧 [alyafitrinurhaliza@gmail.com](mailto:alyafitrinurhaliza@gmail.com)  
🌐 [LinkedIn](https://www.linkedin.com/in/alyafitrin)

---

© 2025 Alya Fitri Nurhaliza — All Rights Reserved
