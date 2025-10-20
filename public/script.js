// Inisialisasi peta dengan view default ke Jawa Barat
const map = L.map('map').setView([-6.9175, 107.6191], 8);
const searchHighlightLayer = L.layerGroup().addTo(map);

// Tambahkan tile layer (peta dasar)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
}).addTo(map);

// Layer groups untuk setiap jenis marker
const areaMarkersLayer = L.layerGroup();
const branchMarkersLayer = L.layerGroup();
const developerMarkersLayer = L.layerGroup();
const k1MarkersLayer = L.layerGroup();

// Tambahkan layer groups ke map
areaMarkersLayer.addTo(map);
branchMarkersLayer.addTo(map);
developerMarkersLayer.addTo(map);
k1MarkersLayer.addTo(map);

// Custom icons dengan Bootstrap styling
// Fungsi buat custom circle marker
const createCircleIcon = (color) => {
    return L.divIcon({
        className: 'custom-circle-marker',
        html: `
            <div style="
                background-color: ${color}; 
                width: 18px; 
                height: 18px; 
                border-radius: 50%; 
                border: 3px solid white; 
                box-shadow: 0 2px 6px rgba(0,0,0,0.25);
                cursor: pointer;
            "></div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
    });
};

// Definisi icon untuk tiap kategori
const icons = {
    area: L.icon({
        iconUrl: '/img/area2.png',
        iconSize: [36, 36],       // ukuran icon (ubah sesuai kebutuhan)
        iconAnchor: [16, 32],     // titik anchor (biasanya di bagian bawah)
        popupAnchor: [0, -28]     // posisi popup relatif terhadap icon
    }),
    branch: L.icon({
        iconUrl: '/img/branch.png',
        iconSize: [28, 28],       // ukuran icon (ubah sesuai kebutuhan)
        iconAnchor: [16, 32],     // titik anchor (biasanya di bagian bawah)
        popupAnchor: [0, -28]     // posisi popup relatif terhadap icon
    }),
    developer: createCircleIcon('#00ff00ff'),// hijau
    k1: L.icon({
        iconUrl: '/img/k1.png',
        iconSize: [16, 16],       // ukuran icon (ubah sesuai kebutuhan)
        iconAnchor: [16, 32],     // titik anchor (biasanya di bagian bawah)
        popupAnchor: [0, -28]     // posisi popup relatif terhadap icon
    })        // pink
};


// State management
let currentState = {
    areas: [],
    selectedUnit: '',
    selectedArea: null,
    selectedBranch: null,
    layerVisibility: {
        areas: true,
        branches: true,
        developers: true,
        k1: true
    },
    statistics: {
        totalAreas: 0,
        totalBranches: 0,
        totalDevelopers: 0,
        totalK1: 0
    }
};

// Fungsi untuk update layer visibility berdasarkan checkbox
function updateLayerVisibility() {
    const showAreas = document.getElementById('show-areas').checked;
    const showBranches = document.getElementById('show-branches').checked;
    const showDevelopers = document.getElementById('show-developers').checked;
    const showK1 = document.getElementById('show-k1').checked;

    currentState.layerVisibility = {
        areas: showAreas,
        branches: showBranches,
        developers: showDevelopers,
        k1: showK1
    };

    // Toggle visibility layer groups
    if (showAreas) {
        map.addLayer(areaMarkersLayer);
    } else {
        map.removeLayer(areaMarkersLayer);
    }

    if (showBranches) {
        map.addLayer(branchMarkersLayer);
    } else {
        map.removeLayer(branchMarkersLayer);
    }

    if (showDevelopers) {
        map.addLayer(developerMarkersLayer);
    } else {
        map.removeLayer(developerMarkersLayer);
    }

    if (showK1) {
        map.addLayer(k1MarkersLayer);
    } else {
        map.removeLayer(k1MarkersLayer);
    }
}

// Fungsi untuk menampilkan loading state
function showLoading(show = true) {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = show ? 'block' : 'none';
    }
}

// Fungsi untuk update statistics
function updateStatistics(data) {
    let totalAreas = 0;
    let totalBranches = 0;
    let totalDevelopers = 0;
    let totalK1 = 0;

    const unitFilter = document.getElementById('filter-unit').value;
    const areaFilter = document.getElementById('filter-area').value;
    const branchFilter = document.getElementById('filter-branch').value;

    console.log("📊 Update statistics - Data received:", data);
    console.log("📊 Update statistics - Filter:", { unitFilter, areaFilter, branchFilter });

    if (data && data.branches && data.branches.length > 0) {
        // Hitung berdasarkan data yang sedang ditampilkan
        totalBranches = data.branches.length;
        
        // ⬇️ PERBAIKI: Hitung developers dan K1 dengan benar
        data.branches.forEach(branch => {
            if (branch.developers && Array.isArray(branch.developers)) {
                totalDevelopers += branch.developers.length;
            }
            if (branch.k1Companies && Array.isArray(branch.k1Companies)) {
                totalK1 += branch.k1Companies.length;
            }
        });

        // Hitung total areas berdasarkan filter
        if (unitFilter === 'region') {
            // Mode Region: hitung semua area yang ada data
            totalAreas = currentState.areas.length;
        } else if (unitFilter === 'area') {
            if (!areaFilter) {
                // Area: Semua Area - hitung semua area
                totalAreas = currentState.areas.length;
            } else {
                // Area: Area tertentu - hanya 1 area
                totalAreas = 1;
            }
        }
    } else {
        // Jika tidak ada data, hitung dari markers yang aktif
        if (currentState.layerVisibility.areas) {
            totalAreas = areaMarkersLayer.getLayers().length;
        }
        if (currentState.layerVisibility.branches) {
            totalBranches = branchMarkersLayer.getLayers().length;
        }
        if (currentState.layerVisibility.developers) {
            totalDevelopers = developerMarkersLayer.getLayers().length;
        }
        if (currentState.layerVisibility.k1) {
            totalK1 = k1MarkersLayer.getLayers().length;
        }
    }

    currentState.statistics = {
        totalAreas: totalAreas,
        totalBranches: totalBranches,
        totalDevelopers: totalDevelopers,
        totalK1: totalK1
    };

    // Update UI
    document.getElementById('total-areas').textContent = currentState.statistics.totalAreas;
    document.getElementById('total-branches').textContent = currentState.statistics.totalBranches;
    document.getElementById('total-developers').textContent = currentState.statistics.totalDevelopers;
    document.getElementById('total-k1').textContent = currentState.statistics.totalK1;

    console.log("📈 Statistics updated:", currentState.statistics);
}

// Fungsi utama yang dijalankan saat halaman dimuat
async function initDashboard() {
    console.log('🚀 Initializing dashboard...');
    showLoading(true);
    
    try {
        // 1. Load data areas untuk dropdown
        await loadAreas();
        
        // 2. HANYA set view ke Jawa Barat, TIDAK tampilkan data
        map.setView([-6.9175, 107.6191], 8);
        
        // 3. Setup event listeners
        setupEventListeners();
        
        console.log('✅ Dashboard initialized successfully');
        
    } catch (error) {
        console.error('❌ Failed to initialize dashboard:', error);
        showError('Gagal memuat data. Silakan refresh halaman.');
    } finally {
        showLoading(false);
    }
}

// Tampilkan error message dengan Bootstrap alert
function showError(message) {
    // Remove existing alerts
    const existingAlert = document.querySelector('.alert-danger');
    if (existingAlert) {
        existingAlert.remove();
    }

    const alert = document.createElement('div');
    alert.className = 'alert alert-danger alert-dismissible fade show';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.querySelector('.container-fluid').insertBefore(alert, document.querySelector('header'));
}

// Load data areas untuk dropdown filter
async function loadAreas() {
  try {
    const response = await fetch('/api/areas');
    const result = await response.json();
    
    if (result.success) {
      currentState.areas = result.data;
      populateAreaFilter(result.data);
      
      // Tampilkan titik koordinat area di peta
      //plotAreaMarkers(result.data);
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error loading areas:', error);
    throw error;
  }
}

function plotAreaMarkers(areas) {
    areaMarkersLayer.clearLayers();
    
    areas.forEach(area => {
        if (area.latitude && area.longitude) {
            const areaMarker = L.marker([parseFloat(area.latitude), parseFloat(area.longitude)], {
                icon: icons.area
            }).bindPopup(`
                <div class="popup-content">
                    <h5 class="fw-bold">📍 ${area.nama_area}</h5>
                    <p class="mb-1"><strong>Kode:</strong> ${area.kode_area}</p>
                    <p class="mb-1"><strong>Lokasi:</strong> ${parseFloat(area.latitude).toFixed(6)}, ${parseFloat(area.longitude).toFixed(6)}</p>
                </div>
            `);
            
            areaMarkersLayer.addLayer(areaMarker);
        }
    });
}


// Isi dropdown filter area
function populateAreaFilter(areas) {
  const areaFilter = document.getElementById('filter-area');
  
  // Kosongkan dropdown kecuali option default
  areaFilter.innerHTML = '<option value="">-- Semua Area --</option>';
  
  // Tambahkan setiap area sebagai option
  areas.forEach(area => {
    const option = document.createElement('option');
    option.value = area.kode_area;  // Gunakan kode_area sebagai value
    option.textContent = `${area.kode_area} - ${area.nama_area}`;
    areaFilter.appendChild(option);
  });
}

// Tampilkan semua data di peta
async function showAllData() {
  try {
    showLoading(true);
    
    console.log("🔄 Loading ALL data (areas, branches, developers, K1)...");
    
    // Clear semua markers terlebih dahulu
    areaMarkersLayer.clearLayers();
    branchMarkersLayer.clearLayers();
    developerMarkersLayer.clearLayers();
    k1MarkersLayer.clearLayers();
    
    // 1. Tampilkan semua marker area
    plotAreaMarkers(currentState.areas);
    
    // 2. Kumpulkan semua data dari semua area
    const allBranches = [];
    
    // Ambil data untuk setiap area dan gabungkan
    for (const area of currentState.areas) {
      console.log(`📥 Fetching data for area: ${area.kode_area}`);
      const areaData = await fetchAreaData(area.kode_area);
      
      if (areaData && areaData.branches) {
        console.log(`✅ Area ${area.kode_area}: ${areaData.branches.length} branches found`);
        allBranches.push(...areaData.branches);
      } else {
        console.log(`⚠️ Area ${area.kode_area}: No data or no branches`);
      }
    }
    
    console.log(`📊 Total branches collected: ${allBranches.length}`);
    
    // 3. Plot semua data cabang, developer, K1 ke peta
    const combinedData = {
      name: 'Semua Area',
      branches: allBranches
    };
    
    plotBranchDataOnMap(combinedData);
    updateStatistics(combinedData);
    
    // 4. Zoom untuk menampilkan semua markers
    if (allBranches.length > 0) {
      console.log("🎯 Zooming to show all data...");
    } else {
      console.log("⚠️ No branch data found to display");
      map.setView([-6.9175, 107.6191], 8);
    }
    
  } catch (error) {
    console.error('❌ Error showing all data:', error);
    throw error;
  } finally {
    showLoading(false);
  }
}

// Fetch data untuk area tertentu
async function fetchAreaData(kodeArea) {
  try {
    const response = await fetch(`/api/area/${encodeURIComponent(kodeArea)}`);
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      console.warn(`Area ${kodeArea} not found or has no data`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching data for area ${kodeArea}:`, error);
    return null;
  }
}

// Plot data ke peta
function plotBranchDataOnMap(data) {
    branchMarkersLayer.clearLayers();
    developerMarkersLayer.clearLayers();
    k1MarkersLayer.clearLayers();
    
    const bounds = [];
    let hasData = false;
    
    // Plot setiap cabang dan relasinya
    if (data && data.branches) {
        data.branches.forEach(branch => {
            // Plot cabang
            if (branch.latitude && branch.longitude) {
                hasData = true;
                const branchMarker = L.marker([branch.latitude, branch.longitude], {
                    icon: icons.branch
                }).bindPopup(`
                    <div class="popup-content">
                        <h5 class="fw-bold">🏦 ${branch.nama}</h5>
                        <p class="mb-1"><strong>Kode:</strong> ${branch.kode_cabang}</p>
                        <p class="mb-1"><strong>Branch Manager:</strong> ${branch.nama_manager}</p>
                        <p class="mb-2"><strong>Developers:</strong> ${branch.developers.length}</p>
                        <p class="mb-3"><strong>Perusahaan K1:</strong> ${branch.k1Companies.length}</p>
                        <button onclick="openPotensiModal('${branch.kode_cabang}')" class="btn btn-primary btn-sm w-100">
                            Lihat Detail
                        </button>
                    </div>
                `);
                
                branchMarkersLayer.addLayer(branchMarker);
                bounds.push([branch.latitude, branch.longitude]);
            }
            
            // Plot developers
            if (branch.developers) {
            // ambil status marker dari API
            loadDeveloperStatus(branch.kode_cabang).then(statusList => {
                branch.developers.forEach(dev => {
                if (dev.latitude && dev.longitude) {
                    const statusData = statusList.find(s => s.nama_developer === dev.nama);
                    let color = "#33ff66"; // default hijau
                    let status = "BELUM ADA VISIT";

                    if (statusData) {
                    status = statusData.status_marker;
                    if (status === "MERAH") color = "red";
                    else if (status === "KUNING") color = "yellow";
                    else if (status === "HIJAU") color = "green";
                    }

                    const devMarker = L.marker([dev.latitude, dev.longitude], {
                    icon: createCircleIcon(color)
                    }).bindPopup(`
                    <div class="popup-content">
                        <h5 class="fw-bold">🏢 ${dev.nama}</h5>
                        <p class="mb-1"><strong>Project:</strong> ${dev.project || 'N/A'}</p>
                        <p class="mb-1"><strong>Tipe:</strong> ${dev.tipe}</p>
                        <p class="mb-1"><strong>Status:</strong> ${status}</p>
                        <button class="btn btn-primary btn-sm w-100" 
                        onclick="openDeveloperDetail('${branch.kode_cabang}', '${dev.nama}')">
                        Lihat Detail
                        </button>
                    </div>
                    `);

                    developerMarkersLayer.addLayer(devMarker);
                    bounds.push([dev.latitude, dev.longitude]);
                }
                });
            });
            }
            
            // Plot K1 companies
            if (branch.k1Companies) {
                branch.k1Companies.forEach(k1 => {
                    if (k1.latitude && k1.longitude) {
                        hasData = true;
                        const k1Marker = L.marker([k1.latitude, k1.longitude], {
                            icon: icons.k1
                        }).bindPopup(`
                            <div class="popup-content">
                                <h5 class="fw-bold">🏭 ${k1.nama}</h5>
                                <p class="mb-1"><strong>Payroll:</strong> ${parseInt(k1.payroll) || 0}</p>
                                <p class="mb-1"><strong>Lokasi:</strong> ${parseFloat(k1.latitude).toFixed(6)}, ${parseFloat(k1.longitude).toFixed(6)}</p>
                            </div>
                        `);
                        
                        k1MarkersLayer.addLayer(k1Marker);
                        bounds.push([k1.latitude, k1.longitude]);
                    }
                });
            }
        });
    }
    
    // Zoom peta untuk menampilkan semua markers
    if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
    } else if (!hasData) {
        // Jika tidak ada data, kembalikan ke view default
        map.setView([-6.9175, 107.6191], 8);
    }

    updateStatistics(data);
}

// ===========================
// Fungsi tampilkan modal developer
// ===========================
function showDeveloperModal(devData, visitData, kodeCabang) {
  // Simpan kode cabang & nama developer ke hidden input form
  document.getElementById("visit-kode-cabang").value = kodeCabang;
  document.getElementById("visit-nama-developer").value = devData.nama_developer;

  // Hidden input id_visit
  let idVisitInput = document.getElementById("visit-id");
  if (!idVisitInput) {
    idVisitInput = document.createElement("input");
    idVisitInput.type = "hidden";
    idVisitInput.id = "visit-id";
    idVisitInput.name = "id_visit";
    document.getElementById("visitForm").appendChild(idVisitInput);
  }
  idVisitInput.value = visitData ? visitData.id_visit : "";

  // Judul developer
  document.getElementById("dev-title").textContent = devData.nama_developer;
  document.getElementById("dev-title").dataset.kodeCabang = kodeCabang;

  // Foto visit
  const photoEl = document.getElementById("developer-photo");
  photoEl.innerHTML = visitData && visitData.foto_visit
    ? `<img src="${visitData.foto_visit}" class="img-fluid rounded shadow" style="max-height:250px; object-fit:cover;">`
    : `<img src="/uploads/placeholder.jpg" class="img-fluid rounded shadow" style="max-height:250px; object-fit:cover;">`;

    // ⬇️ LOAD DATA TIPE DEVELOPER
  loadDeveloperTipeData(kodeCabang, devData.project, devData.nama_developer);
  
    // Data Sikumbang
  document.getElementById("dev-project").textContent = devData.project || "-";
  document.getElementById("dev-tipe").textContent = devData.tipe || "-";
  document.getElementById("dev-kavling").textContent = devData.jumlah_kavling || 0;
  document.getElementById("dev-ready").textContent = devData.ready_stock || 0;
  document.getElementById("dev-potensi").textContent = devData.sisa_potensi || 0;
  document.getElementById("dev-terjual").textContent = devData.terjual || 0;

  // Data Visit
  if (visitData) {
    document.getElementById("visit-tanggal").textContent = visitData.visit_date;
    document.getElementById("visit-kavling").textContent = visitData.jumlah_kavling;
    document.getElementById("visit-ready").textContent = visitData.ready_stock;
    document.getElementById("visit-potensi").textContent = visitData.sisa_potensi;
    document.getElementById("visit-terjual").textContent = visitData.terjual;

    document.getElementById("visit-data").style.display = "block";
    document.getElementById("visit-empty").style.display = "none";

    document.getElementById("btn-add-visit").style.display = "none";
    document.getElementById("btn-update-visit").style.display = "inline-block";
  } else {
    document.getElementById("visit-data").style.display = "none";
    document.getElementById("visit-empty").style.display = "block";

    document.getElementById("btn-add-visit").style.display = "inline-block";
    document.getElementById("btn-update-visit").style.display = "none";
  }

  // Reset form state
  document.getElementById("visitForm").reset();
  document.getElementById("visitForm").style.display = "none";
  document.getElementById("btn-save-visit").style.display = "none";

  // Tampilkan modal pakai API Bootstrap
  const modalEl = document.getElementById("developerModal");
  const modal = new bootstrap.Modal(modalEl);
  modal.show();

// ⬇️ OPSI MINIMAL: Hanya handle backdrop cleanup
  modalEl.addEventListener("hidden.bs.modal", () => {
    console.log("✅ Modal ditutup - tidak ada perubahan pada peta");
    
    // Bersihkan backdrop jika masih ada
    const backdrop = document.querySelector(".modal-backdrop");
    if (backdrop) backdrop.remove();
    document.body.classList.remove("modal-open");
    document.body.style.overflow = "auto";
  }, { once: true });
}

// ⬇️ FUNGSI BARU: Load data tipe developer dari tabel developer_tipe
async function loadDeveloperTipeData(kodeCabang, project, developer) {
  try {
    console.log(`🔍 Loading tipe data for: ${kodeCabang} - ${project} - ${developer}`);
    
    // Show loading state
    document.getElementById('dev-tipe-loading').style.display = 'block';
    document.getElementById('dev-tipe-content').style.display = 'none';
    document.getElementById('dev-tipe-empty').style.display = 'none';

    const response = await fetch(`/api/developer-tipe?kode_cabang=${kodeCabang}&project=${encodeURIComponent(project)}&developer=${encodeURIComponent(developer)}`);
    const result = await response.json();

    // Hide loading
    document.getElementById('dev-tipe-loading').style.display = 'none';

    if (result.success && result.data && result.data.length > 0) {
      // Tampilkan data tipe
      const tipeTable = document.getElementById('dev-tipe-table');
      tipeTable.innerHTML = '';

      result.data.forEach(tipe => {
        const row = document.createElement('tr');
        
        // Format harga dengan separator ribuan
        const hargaFormatted = new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0
        }).format(tipe.harga_avg || 0);

        row.innerHTML = `
          <td>${tipe.cluster || '-'}</td>
          <td>${tipe.tipe || '-'}</td>
          <td class="fw-bold text-success">${hargaFormatted}</td>
        `;
        tipeTable.appendChild(row);
      });

      document.getElementById('dev-tipe-content').style.display = 'block';
      console.log(`✅ Loaded ${result.data.length} tipe data`);
    } else {
      // Tampilkan pesan kosong
      document.getElementById('dev-tipe-empty').style.display = 'block';
      console.log('ℹ️ No tipe data available');
    }

  } catch (error) {
    console.error('❌ Error loading developer tipe data:', error);
    
    // Hide loading dan show error state
    document.getElementById('dev-tipe-loading').style.display = 'none';
    document.getElementById('dev-tipe-empty').style.display = 'block';
    document.getElementById('dev-tipe-empty').innerHTML = `
      <div class="text-danger">
        <small>Gagal memuat data tipe</small>
      </div>
    `;
  }
}


// ===========================
// Open Developer Detail
// ===========================
window.openDeveloperDetail = async function(kodeCabang, namaDeveloper) {
  try {
    const devRes = await fetch(`/api/developers/${kodeCabang}`);
    const devResult = await devRes.json();

    if (!devResult.success) throw new Error("Gagal ambil data developer");

    const devData = devResult.data.find(d => d.nama_developer === namaDeveloper);
    if (!devData) throw new Error("Developer tidak ditemukan");

    const visitRes = await fetch(`/api/developer-visits?kode_cabang=${kodeCabang}&nama_developer=${encodeURIComponent(namaDeveloper)}`);
    const visitResult = await visitRes.json();

    let visitData = null;
    if (visitResult.success && visitResult.data.length > 0) {
      visitData = visitResult.data[0];
    }

    showDeveloperModal(devData, visitData, kodeCabang);
  } catch (err) {
    console.error(err);
    alert("❌ Gagal memuat detail developer");
  }
};

// ===========================
// Event Tambah & Update Visit
// ===========================
document.getElementById("btn-add-visit").addEventListener("click", () => {
  document.getElementById("visitForm").style.display = "block";
  document.getElementById("btn-save-visit").style.display = "inline-block";
  document.getElementById("btn-add-visit").style.display = "none";
  document.getElementById("btn-update-visit").style.display = "none";
});

document.getElementById("btn-update-visit").addEventListener("click", () => {
  document.getElementById("visitForm").style.display = "block";
  document.getElementById("btn-save-visit").style.display = "inline-block";
  document.getElementById("btn-add-visit").style.display = "none";
  document.getElementById("btn-update-visit").style.display = "none";
});

// ===========================
// Submit Visit Form (Tambah/Update)
// ===========================
document.getElementById("visitForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

  const idVisit = document.getElementById("visit-id").value;
  let url = "/api/developer-visits";
  let method = "POST";

  if (idVisit) {
    url = `/api/developer-visits/${idVisit}`;
    method = "PUT";
  }

  try {
    const res = await fetch(url, { method, body: formData });
    const result = await res.json();

    if (result.success) {
      alert(idVisit ? "✅ Data visit berhasil diupdate" : "✅ Data visit berhasil ditambahkan");

      // Refresh modal detail dengan data terbaru
      const kodeCabang = document.getElementById("visit-kode-cabang").value;
      const namaDev = document.getElementById("visit-nama-developer").value;
      await openDeveloperDetail(kodeCabang, namaDev);
    } else {
      alert("❌ Gagal menyimpan: " + result.message);
    }
  } catch (err) {
    console.error("Error saving visit:", err);
    alert("❌ Terjadi kesalahan saat menyimpan data");
  }
});

window.openPotensiModal = async function(kodeCabang) {
  try {
    const res = await fetch(`/api/potensi/${kodeCabang}`);
    const result = await res.json();

    if (!result.success) throw new Error(result.message || "Data tidak ditemukan");

    const p = result.data;
    const tbody = document.getElementById("potensi-body");
    tbody.innerHTML = `
      <tr><td>PKS</td><td>${p.pks}</td><td>${p.hasil_pks}</td></tr>
      <tr><td>FLPP</td><td>${p.flpp}</td><td>${p.hasil_flpp}</td></tr>
      <tr><td>Take Over</td><td>${p.take_over}</td><td>${p.hasil_to}</td></tr>
      <tr><td>Top Up</td><td>${p.top_up}</td><td>${p.hasil_tu}</td></tr>
      <tr><td>Multiguna</td><td>${p.multiguna}</td><td>${p.hasil_mu}</td></tr>
      <tr><td>MIX</td><td>${p.mix}</td><td>${p.hasil_mix}</td></tr>
    `;

    // Tampilkan modal
    const modal = new bootstrap.Modal(document.getElementById("potensiModal"));
    modal.show();
  } catch (err) {
    console.error("Error loading potensi:", err);
    alert("❌ Gagal memuat potensi cabang");
  }
};

function toggleAreaFilterAccess() {
    const areaFilter = document.getElementById('filter-area');
    const areaLabel = document.querySelector('label[for="filter-area"]');
    const branchFilter = document.getElementById('filter-branch');
    const branchLabel = document.querySelector('label[for="filter-branch"]');
    
    if (currentState.selectedUnit === 'region' || currentState.selectedUnit === '') {
        // Mode Region atau belum pilih: disable filter area DAN cabang
        areaFilter.disabled = true;
        areaFilter.value = ''; // Reset value
        areaLabel.classList.add('text-muted');
        
        branchFilter.disabled = true;
        branchFilter.innerHTML = '<option value="">-- Pilih Area Terlebih Dahulu --</option>';
        branchLabel.classList.add('text-muted');
        
    } else if (currentState.selectedUnit === 'area') {
        // Mode Area: enable filter area, disable cabang sampai area dipilih
        areaFilter.disabled = false;
        areaLabel.classList.remove('text-muted');
        
        branchFilter.disabled = true;
        branchFilter.innerHTML = '<option value="">-- Pilih Area Terlebih Dahulu --</option>';
        branchLabel.classList.add('text-muted');
    }
}


// Setup event listeners
function setupEventListeners() {
    // Checkbox change listeners
    document.querySelectorAll('.layer-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateLayerVisibility();
        });
    });
    document.getElementById('toggle-all-btn').addEventListener('click', function() {
        const checkboxes = document.querySelectorAll('.layer-checkbox');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);

        if (allChecked) {
            // kalau semua ON → matikan semua
            checkboxes.forEach(cb => cb.checked = false);
            this.textContent = "Pilih Semua";
        } else {
            // kalau ada yg OFF → nyalakan semua
            checkboxes.forEach(cb => cb.checked = true);
            this.textContent = "Hapus Semua";
        }

        // update layer visibility sesuai kondisi baru
        updateLayerVisibility();
    });

    // Filter unit change - PERBAIKI
    document.getElementById('filter-unit').addEventListener('change', async function(e) {
        currentState.selectedUnit = e.target.value;
        
        // ⬇️ PASTIKAN TOGGLE FILTER ACCESS DIPANGGIL DI SINI
        toggleAreaFilterAccess();
        
        showLoading(true);
        
        try {
            // Clear semua markers
            areaMarkersLayer.clearLayers();
            branchMarkersLayer.clearLayers();
            developerMarkersLayer.clearLayers();
            k1MarkersLayer.clearLayers();
            
            if (currentState.selectedUnit === '') {
                // mode kosong: hanya area default / kosongkan data
                map.setView([-6.9175, 107.6191], 8);
                updateStatistics({ branches: [] });
            } else if (currentState.selectedUnit === 'region') {
                await showAllData();    // langsung muat semua titik
            } else if (currentState.selectedUnit === 'area') {
                await showAllData();    // langsung muat semua titik (sebelum dipersempit per area)
            }
        } catch (err) {
            console.error('Error handling unit change:', err);
            showError('Gagal memuat data');
        } finally {
            showLoading(false);
            updateLayerVisibility();
        }
    });

    // Filter area change - PERBAIKI
    document.getElementById('filter-area').addEventListener('change', async function(e) {
        if (currentState.selectedUnit !== 'area' || this.disabled) return;
        
        const kodeArea = e.target.value;
        const branchFilter = document.getElementById('filter-branch');
        const branchLabel = document.querySelector('label[for="filter-branch"]');
        
        showLoading(true);
        
        try {
            // Clear semua markers
            areaMarkersLayer.clearLayers();
            branchMarkersLayer.clearLayers();
            developerMarkersLayer.clearLayers();
            k1MarkersLayer.clearLayers();
            
            if (!kodeArea) {
                // Jika memilih "Semua Area" - tampilkan semua data
                console.log("🌐 Loading ALL areas data...");
                
                // ⬇️ DISABLE BRANCH FILTER KETIKA "SEMUA AREA" DIPILIH
                branchFilter.disabled = true;
                branchFilter.innerHTML = '<option value="">-- Semua Cabang --</option>';
                branchLabel.classList.add('text-muted');
                
                // Tampilkan semua area
                plotAreaMarkers(currentState.areas);
                
                // Tampilkan semua data cabang, developer, K1
                await showAllData();
                return;
            }
            
            // Tampilkan hanya area yang dipilih
            const selectedArea = currentState.areas.find(area => area.kode_area === kodeArea);
            if (selectedArea) {
                plotAreaMarkers([selectedArea]);
            }
            
            // ⬇️ ENABLE BRANCH FILTER KETIKA AREA TERTENTU DIPILIH
            branchFilter.disabled = false;
            branchFilter.innerHTML = '<option value="">-- Semua Cabang --</option>';
            branchLabel.classList.remove('text-muted');
            
            // Load dan tampilkan data area yang dipilih
            const areaData = await fetchAreaData(kodeArea);
            if (areaData) {
                currentState.selectedArea = areaData;
                plotBranchDataOnMap(areaData);
                updateStatistics(areaData);
                
                // Isi dropdown cabang
                if (areaData.branches && areaData.branches.length > 0) {
                    areaData.branches.forEach(branch => {
                        const option = document.createElement('option');
                        option.value = branch.kode_cabang;
                        option.textContent = `${branch.kode_cabang} - ${branch.nama}`;
                        branchFilter.appendChild(option);
                    });
                    
                    console.log(`✅ Loaded ${areaData.branches.length} branches for area ${kodeArea}`);
                } else {
                    console.log(`⚠️ No branches found for area ${kodeArea}`);
                }
            }
        } catch (error) {
            console.error('❌ Error handling area change:', error);
            showError('Gagal memuat data area');
        } finally {
            showLoading(false);
            updateLayerVisibility();
        }
    });

    // Filter branch change - PERBAIKI
    document.getElementById('filter-branch').addEventListener('change', async function(e) {
        const branchCode = e.target.value;
        
        if (!currentState.selectedArea) return;
        
        showLoading(true);
        
        try {
            // Clear semua markers
            areaMarkersLayer.clearLayers();
            branchMarkersLayer.clearLayers();
            developerMarkersLayer.clearLayers();
            k1MarkersLayer.clearLayers();
            
            // Tampilkan marker area yang dipilih
            const selectedAreaKode = document.getElementById('filter-area').value;
            const selectedArea = currentState.areas.find(area => area.kode_area === selectedAreaKode);
            if (selectedArea) {
                plotAreaMarkers([selectedArea]);
            }
            
            if (!branchCode) {
                // ✅ PERBAIKAN: Jika memilih "Semua Cabang" - tampilkan semua cabang di area tersebut
                console.log(`🏢 Showing ALL branches for area ${selectedAreaKode}`);
                plotBranchDataOnMap(currentState.selectedArea);
                updateStatistics(currentState.selectedArea);
                
            } else {
                // Tampilkan hanya cabang tertentu
                const selectedBranch = currentState.selectedArea.branches.find(
                    branch => branch.kode_cabang === branchCode
                );
                
                if (selectedBranch) {
                    currentState.selectedBranch = branchCode;
                    
                    const filteredData = {
                        name: currentState.selectedArea.name || currentState.selectedArea.nama_area,
                        branches: [selectedBranch]
                    };
                    
                    plotBranchDataOnMap(filteredData);
                    updateStatistics(filteredData);
                    
                    // Zoom ke cabang yang dipilih
                    if (selectedBranch.latitude && selectedBranch.longitude) {
                        map.flyTo([selectedBranch.latitude, selectedBranch.longitude], 13, {
                            duration: 1,
                            easeLinearity: 0.25
                        });
                    }
                }
            }
            
        } catch (error) {
            console.error('❌ Error handling branch change:', error);
            showError('Gagal memuat data cabang');
        } finally {
            showLoading(false);
            updateLayerVisibility();
        }
    });

    document.getElementById('reset-btn').addEventListener('click', function() {
        document.getElementById('filter-unit').value = '';
        currentState.selectedUnit = '';
        document.getElementById('filter-area').value = '';
        
        // ⬇️ PASTIKAN TOGGLE FILTER ACCESS DIPANGGIL SAAT RESET
        toggleAreaFilterAccess();

        // ✅ RESET STATE BRANCH
        currentState.selectedBranch = null;
        currentState.selectedArea = null;

        // ✅ SET semua checkbox ON saat reset
        ['show-areas','show-branches','show-developers','show-k1'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.checked = true;
        });

        currentState.layerVisibility = {
            areas: true,
            branches: true,
            developers: true,
            k1: true
        };

        // bersihkan marker & kembali ke view default
        areaMarkersLayer.clearLayers();
        branchMarkersLayer.clearLayers();
        developerMarkersLayer.clearLayers();
        k1MarkersLayer.clearLayers();

        map.setView([-6.9175, 107.6191], 8);
        updateStatistics({ branches: [] });

        updateLayerVisibility();
    });
}

// Fungsi untuk select branch dari popup
window.selectBranch = function(kodeCabang) {
    const branchFilter = document.getElementById('filter-branch');
    branchFilter.value = kodeCabang;
    
    // Trigger change event manually
    const event = new Event('change');
    branchFilter.dispatchEvent(event);
    
    // Close popup
    map.closePopup();
};

// ===========================
// 🔍 SEARCH BAR LOGIC
// ===========================
// ⬇️ INISIALISASI SEARCH DROPDOWN
function initSearchDropdown() {
    const dropdownToggle = document.getElementById('searchDropdownToggle');
    const dropdownMenu = document.getElementById('searchDropdownMenu');
    const searchInput = document.getElementById('searchDropdownInput');
    const searchResults = document.getElementById('searchResults');
    const searchLoading = document.getElementById('searchLoading');
    const placeholderText = dropdownToggle.querySelector('.placeholder-text');
    const selectedItem = dropdownToggle.querySelector('.selected-item');
    
    let searchTimeout = null;
    let currentResults = [];
    let selectedIndex = -1;

    // ⬇️ EVENT: TOGGLE DROPDOWN
    dropdownToggle.addEventListener('click', function() {
        // Focus ke search input ketika dropdown dibuka
        setTimeout(() => {
            if (dropdownMenu.classList.contains('show')) {
                searchInput.focus();
            }
        }, 100);
    });

    // ⬇️ EVENT: INPUT SEARCH
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        clearTimeout(searchTimeout);
        
        // Reset selected index
        selectedIndex = -1;
        
        if (!query) {
            showInitialState();
            return;
        }

        // Show loading
        searchLoading.style.display = 'block';
        searchResults.innerHTML = '';

        // Debounce search
        searchTimeout = setTimeout(async () => {
            try {
                const results = await fetchSearchResults(query);
                currentResults = results;
                renderSearchResults(results);
            } catch (error) {
                console.error('Search error:', error);
                showErrorState();
            } finally {
                searchLoading.style.display = 'none';
            }
        }, 300);
    });

    // ⬇️ EVENT: KEYBOARD NAVIGATION
    searchInput.addEventListener('keydown', function(e) {
        if (!currentResults.length) return;

        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, currentResults.length - 1);
                updateSelection();
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, -1);
                updateSelection();
                break;
                
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && currentResults[selectedIndex]) {
                    selectSearchResult(currentResults[selectedIndex]);
                }
                break;
                
            case 'Escape':
                // Close dropdown on escape
                const bootstrapDropdown = bootstrap.Dropdown.getInstance(dropdownToggle);
                if (bootstrapDropdown) {
                    bootstrapDropdown.hide();
                }
                break;
        }
    });

    // ⬇️ FUNGSI RENDER HASIL PENCARIAN
    function renderSearchResults(results) {
        searchResults.innerHTML = '';

        if (results.length === 0) {
            searchResults.innerHTML = `
                <div class="text-center text-muted p-3">
                    <small>Tidak ada hasil ditemukan</small>
                </div>
            `;
            return;
        }

        results.forEach((item, index) => {
            const resultItem = document.createElement('button');
            resultItem.type = 'button';
            resultItem.className = 'search-result-item';
            resultItem.innerHTML = `
                <div class="item-label">${item.label}</div>
                <div class="item-meta">
                    <span class="badge bg-secondary item-badge">${item.type}</span>
                    ${item.additional_info ? ` • ${item.additional_info}` : ''}
                </div>
            `;
            
            resultItem.addEventListener('click', () => {
                selectSearchResult(item);
            });
            
            resultItem.addEventListener('mouseenter', () => {
                selectedIndex = index;
                updateSelection();
            });
            
            searchResults.appendChild(resultItem);
        });
    }

    // ⬇️ FUNGSI UPDATE SELECTION VISUAL
    function updateSelection() {
        const allItems = searchResults.querySelectorAll('.search-result-item');
        
        allItems.forEach((item, index) => {
            if (index === selectedIndex) {
                item.classList.add('active');
                // Scroll into view if needed
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('active');
            }
        });
    }

    // ⬇️ FUNGSI TAMPILKAN STATE AWAL
    function showInitialState() {
        searchResults.innerHTML = `
            <div class="text-center text-muted p-3">
                <small>Ketik untuk mencari developer atau perusahaan K1</small>
            </div>
        `;
        currentResults = [];
    }

    // ⬇️ FUNGSI TAMPILKAN ERROR STATE
    function showErrorState() {
        searchResults.innerHTML = `
            <div class="text-center text-danger p-3">
                <small>Gagal memuat hasil pencarian</small>
            </div>
        `;
    }

    // ⬇️ FUNGSI PILIH HASIL
    function selectSearchResult(item) {
        // Update dropdown toggle text
        placeholderText.style.display = 'none';
        selectedItem.textContent = item.label;
        selectedItem.style.display = 'inline';
        
        // Close dropdown
        const bootstrapDropdown = bootstrap.Dropdown.getInstance(dropdownToggle);
        if (bootstrapDropdown) {
            bootstrapDropdown.hide();
        }
        
        // Clear search input
        searchInput.value = '';
        showInitialState();
        
        // Process selection
        processSearchSelection(item);
    }

    // ⬇️ RESET DROPDOWN
    function resetDropdown() {
        placeholderText.style.display = 'inline';
        selectedItem.style.display = 'none';
        selectedItem.textContent = '';
        searchInput.value = '';
        showInitialState();
        currentResults = [];
        selectedIndex = -1;
    }

    // ⬇️ ATTACH RESET FUNCTION TO GLOBAL SCOPE
    window.resetSearchDropdown = resetDropdown;

    // Initialize
    showInitialState();
}

// ⬇️ FUNGSI PROSES PILIHAN SEARCH (SAMA SEPERTI SEBELUMNYA)
function processSearchSelection(item) {
    console.log("📍 Selected:", item);
    
    // Bersihkan highlight lama
    searchHighlightLayer.clearLayers();

    if (item.lat && item.lon) {
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);

        // Marker highlight persisten
        const highlightMarker = L.marker([lat, lon], {
            icon: L.divIcon({
                className: 'highlight-marker',
                html: `<div style="
                    background-color: gold; 
                    width: 32px; 
                    height: 32px; 
                    border-radius: 50%; 
                    border: 4px solid red;
                    box-shadow: 0 0 15px rgba(255,0,0,0.8);
                    animation: pulse 1.5s infinite;
                "></div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            }),
            zIndexOffset: 1000
        }).bindPopup(`
            <div class="text-center">
                <h6 class="fw-bold">${item.label}</h6>
                <small class="text-muted">${item.type}</small>
                ${item.additional_info ? `<p class="mt-1 mb-0"><small>${item.additional_info}</small></p>` : ''}
            </div>
        `);

        highlightMarker.addTo(searchHighlightLayer);
        highlightMarker.openPopup();
        
        map.flyTo([lat, lon], 15, {
            duration: 1.5,
            easeLinearity: 0.25
        });
    }
}

// ⬇️ RESET SEARCH - UPDATE VERSION
document.getElementById("reset-search").addEventListener("click", () => {
    searchHighlightLayer.clearLayers();
    
    // Reset dropdown jika function tersedia
    if (window.resetSearchDropdown) {
        window.resetSearchDropdown();
    }
});

// ⬇️ INITIALIZE SAAT DOM READY
document.addEventListener('DOMContentLoaded', function() {
    // Pastikan Bootstrap sudah loaded
    if (typeof bootstrap !== 'undefined') {
        initSearchDropdown();
    } else {
        // Fallback jika Bootstrap belum ready
        setTimeout(initSearchDropdown, 100);
    }
});

// ⬇️ FETCH SEARCH RESULTS (SAMA)
async function fetchSearchResults(query) {
    try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const result = await res.json();
        return result.success ? result.data : [];
    } catch (err) {
        console.error("Error fetching search:", err);
        return [];
    }
}


async function loadDeveloperStatus(kodeCabang) {
  try {
    const res = await fetch(`/api/developer-status?kode_cabang=${kodeCabang}`);
    const result = await res.json();
    return result.success ? result.data : [];
  } catch (err) {
    console.error("Error fetching developer status:", err);
    return [];
  }
}

// =================== AUTH CHECK ===================
const userData = JSON.parse(localStorage.getItem('userData'));
if (!userData) {
    window.location.href = 'login.html';
    throw new Error('User not authenticated');
}

// =================== USER ROLE MANAGEMENT ===================
let currentUser = userData;

// Initialize user role
function initializeUserRole() {
    updateHeaderForUserRole();
    setupLogout();
    console.log('👤 User logged in:', currentUser);
}

// Update header berdasarkan role user
function updateHeaderForUserRole() {
    const adminButtonContainer = document.getElementById('admin-button-container');
    const userDisplayName = document.getElementById('user-display-name');
    const userRoleBadge = document.getElementById('user-role-badge');
    
    if (!currentUser) return;
    
    // Update user info
    userDisplayName.textContent = `Welcome, ${currentUser.displayName}`;
    
    // Update role badge dan admin button
    if (currentUser.role === 'region') {
        userRoleBadge.innerHTML = '<span class="badge bg-warning text-dark"><i class="fas fa-users me-1"></i>Region</span>';
        
        // Show admin button untuk region
        adminButtonContainer.innerHTML = `
            <a href="/admin" class="btn btn-warning text-dark btn-sm fw-bold px-3 shadow d-flex align-items-center gap-2">
                <i class="fas fa-cog"></i> ADMIN PANEL
            </a>
        `;
    } else {
        userRoleBadge.innerHTML = '<span class="badge bg-info"><i class="fas fa-building me-1"></i>Cabang</span>';
        
        // Hide atau disable admin button untuk cabang
        adminButtonContainer.innerHTML = `
            <button class="btn btn-outline-light btn-sm d-flex align-items-center gap-2" disabled 
                    title="Akses terbatas untuk user cabang">
                <i class="fas fa-cog"></i> ADMIN
            </button>
        `;
    }
    
    // Update current time
    updateCurrentTime();
}

function updateCurrentTime() {
    const now = new Date();
    const options = { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        timeElement.textContent = now.toLocaleDateString('id-ID', options);
    }
}

// Logout functionality
function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Apakah Anda yakin ingin logout?')) {
                localStorage.removeItem('userData');
                window.location.href = 'login.html';
            }
        });
    }
}

// Update time every minute
setInterval(updateCurrentTime, 60000);

// Tambahkan CSS untuk header
function addHeaderStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .header-gradient {
            background: linear-gradient(135deg, #0033a0 0%, #002366 100%) !important;
        }
        .btn-warning {
            background: linear-gradient(135deg, #ffd100 0%, #ffc107 100%) !important;
            border: none !important;
        }
        .btn-warning:hover {
            background: linear-gradient(135deg, #e6b800 0%, #ffc107 100%) !important;
            transform: translateY(-1px);
        }
    `;
    document.head.appendChild(style);
}

// Jalankan dashboard ketika halaman siap
document.addEventListener('DOMContentLoaded', function() {
    // set default mode
    currentState.selectedUnit = '';
    document.getElementById('filter-unit').value = '';

    // ✅ CENTANG semua layer di awal
    ['show-areas','show-branches','show-developers','show-k1'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.checked = true;
    });

    // sinkronkan state
    currentState.layerVisibility = {
        areas: true,
        branches: true,
        developers: true,
        k1: true
    };

    // akses filter area sesuai mode
    toggleAreaFilterAccess();

    // tampilkan layer sesuai checkbox (semua on)
    updateLayerVisibility();

    // jalankan dashboard
    initDashboard();

    // Initialize user role system
    initializeUserRole();
    
    // Tambahkan CSS untuk styling
    addHeaderStyles();
});