// Inisialisasi peta dengan view default ke Jawa Barat
const map = L.map('map').setView([-6.9175, 107.6191], 8);

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
    area: createCircleIcon('#3388ff'),     // biru
    branch: createCircleIcon('#8A2BE2'),   // merah
    developer: createCircleIcon('#00ff00ff'),// hijau
    k1: createCircleIcon('#FFC0CB')        // pink
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
    let totalBranches = 0;
    let totalDevelopers = 0;
    let totalK1 = 0;

    if (data && data.branches) {
        totalBranches = data.branches.length;
        data.branches.forEach(branch => {
            totalDevelopers += branch.developers.length;
            totalK1 += branch.k1Companies.length;
        });
    }

    currentState.statistics = {
        totalAreas: currentState.areas.length,
        totalBranches: totalBranches,
        totalDevelopers: totalDevelopers,
        totalK1: totalK1
    };

    // Update UI
    document.getElementById('total-areas').textContent = currentState.statistics.totalAreas;
    document.getElementById('total-branches').textContent = currentState.statistics.totalBranches;
    document.getElementById('total-developers').textContent = currentState.statistics.totalDevelopers;
    document.getElementById('total-k1').textContent = currentState.statistics.totalK1;
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
      updateStatistics(); // Update statistics dengan data areas
      
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
    
    // Tampilkan semua marker area
    plotAreaMarkers(currentState.areas);
    
    const allData = {
      name: 'Semua Area',
      branches: []
    };
    
    // Ambil data untuk setiap area dan gabungkan
    for (const area of currentState.areas) {
      const areaData = await fetchAreaData(area.kode_area);  // Gunakan kode_area
      if (areaData && areaData.branches) {
        allData.branches = allData.branches.concat(areaData.branches);
      }
    }
    
    // Plot semua data cabang, developer, K1 ke peta
    plotBranchDataOnMap(allData);
    updateStatistics(allData); // Update statistics
    
  } catch (error) {
    console.error('Error showing all data:', error);
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
                        <button onclick="selectBranch('${branch.kode_cabang}')" class="btn btn-primary btn-sm w-100">
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
}

// ===========================
// Fungsi tampilkan modal developer
// ===========================
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

  // Tambahkan listener hanya sekali (biar tidak dobel)
  modalEl.addEventListener("hidden.bs.modal", async () => {
    console.log("🔄 Modal ditutup, refresh dashboard...");

    // Hapus backdrop kalau masih nyangkut
    const backdrop = document.querySelector(".modal-backdrop");
    if (backdrop) backdrop.remove();
    document.body.classList.remove("modal-open");
    document.body.style.overflow = "auto";

    // Refresh sesuai filter terakhir
    if (currentState.selectedUnit === "region") {
      await showAllData();
    } else if (currentState.selectedUnit === "area" && currentState.selectedArea) {
      const areaData = await fetchAreaData(currentState.selectedArea.kode_area);
      if (areaData) {
        plotAreaMarkers([currentState.selectedArea]);
        plotBranchDataOnMap(areaData);
        updateStatistics(areaData);
      }
    }

    updateLayerVisibility();
  }, { once: true }); // ✅ hanya sekali per modal open
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


function toggleAreaFilterAccess() {
    const areaFilter = document.getElementById('filter-area');
    const areaLabel = document.querySelector('label[for="filter-area"]');
    
    if (currentState.selectedUnit === 'region' || currentState.selectedUnit === '') {
        // Mode Region atau belum pilih: disable filter area
        areaFilter.disabled = true;
        areaFilter.value = ''; // Reset value
        areaLabel.classList.add('text-muted');
    } else if (currentState.selectedUnit === 'area') {
        // Mode Area: enable filter area
        areaFilter.disabled = false;
        areaLabel.classList.remove('text-muted');
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
            await showAllData();    // ✅ langsung muat semua titik
            } else if (currentState.selectedUnit === 'area') {
            await showAllData();    // ✅ langsung muat semua titik (sebelum dipersempit per area)
            }
        } catch (err) {
            console.error('Error handling unit change:', err);
            showError('Gagal memuat data');
        } finally {
            showLoading(false);
            updateLayerVisibility();  // ✅ pastikan semua layer sesuai checkbox (yang default-nya ON)
        }
    });

    // Filter area change - PERBAIKI
    document.getElementById('filter-area').addEventListener('change', async function(e) {
        if (currentState.selectedUnit !== 'area' || this.disabled) return;
        
        const kodeArea = e.target.value;
        const branchFilter = document.getElementById('filter-branch');
        
        showLoading(true);
        
        try {
            // Clear semua markers
            areaMarkersLayer.clearLayers();
            branchMarkersLayer.clearLayers();
            developerMarkersLayer.clearLayers();
            k1MarkersLayer.clearLayers();
            
            if (!kodeArea) {
                // Jika memilih "Semua Area" dalam mode Area: tampilkan semua data
                branchFilter.disabled = true;
                branchFilter.innerHTML = '<option value="">-- Pilih Area Terlebih Dahulu --</option>';
                await showAllData();
                return;
            }
            
            // Tampilkan hanya area yang dipilih beserta padanannya
            const selectedArea = currentState.areas.find(area => area.kode_area === kodeArea);
            if (selectedArea) {
                plotAreaMarkers([selectedArea]);
            }
            
            // Enable branch filter
            branchFilter.disabled = false;
            branchFilter.innerHTML = '<option value="">-- Semua Cabang --</option>';
            
            // Load dan tampilkan data area yang dipilih
            const areaData = await fetchAreaData(kodeArea);
            if (areaData) {
                currentState.selectedArea = areaData;
                plotBranchDataOnMap(areaData);
                updateStatistics(areaData);
                
                // Isi dropdown cabang
                if (areaData.branches) {
                    areaData.branches.forEach(branch => {
                        const option = document.createElement('option');
                        option.value = branch.kode_cabang;
                        option.textContent = `${branch.kode_cabang} - ${branch.nama}`;
                        branchFilter.appendChild(option);
                    });
                }
            }
        } catch (error) {
            console.error('Error handling area change:', error);
            showError('Gagal memuat data area');
        } finally {
            showLoading(false);
            updateLayerVisibility(); // Update visibility setelah data dimuat
        }
    });

    // Filter branch change - PERBAIKI
    document.getElementById('filter-branch').addEventListener('change', function(e) {
        const branchCode = e.target.value;
        
        if (!branchCode || !currentState.selectedArea) return;
        
        // Cari cabang yang dipilih
        const selectedBranch = currentState.selectedArea.branches.find(
            branch => branch.kode_cabang === branchCode
        );
        
        if (selectedBranch) {
            // Clear semua markers
            areaMarkersLayer.clearLayers();
            branchMarkersLayer.clearLayers();
            developerMarkersLayer.clearLayers();
            k1MarkersLayer.clearLayers();
            
            // Tampilkan marker area yang dipilih
            const selectedArea = currentState.areas.find(area => 
                area.kode_area === document.getElementById('filter-area').value
            );
            if (selectedArea) {
                plotAreaMarkers([selectedArea]);
            }
            
            // Tampilkan hanya cabang yang dipilih beserta developer dan K1-nya
            const filteredData = {
                name: currentState.selectedArea.nama_area,
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
            
            updateLayerVisibility(); // Update visibility
        }
    });

    document.getElementById('reset-btn').addEventListener('click', function() {
        document.getElementById('filter-unit').value = '';
        currentState.selectedUnit = '';
        document.getElementById('filter-area').value = '';
        document.getElementById('filter-branch').disabled = true;
        document.getElementById('filter-branch').innerHTML = '<option value="">-- Pilih Area Terlebih Dahulu --</option>';

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

        toggleAreaFilterAccess();

        // bersihkan marker & kembali ke view default
        areaMarkersLayer.clearLayers();
        branchMarkersLayer.clearLayers();
        developerMarkersLayer.clearLayers();
        k1MarkersLayer.clearLayers();

        map.setView([-6.9175, 107.6191], 8);
        updateStatistics({ branches: [] });

        updateLayerVisibility(); // ✅ langsung tampilkan semua layer (siap dipakai)
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
});