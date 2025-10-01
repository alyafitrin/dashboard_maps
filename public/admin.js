// admin.js
async function loadAreas() {
  try {
    const res = await fetch('/api/areas');
    const result = await res.json();

    if (result.success) {
      const tbody = document.querySelector('#areaTable tbody');
      tbody.innerHTML = '';

      result.data.forEach(area => {
        tbody.innerHTML += `
          <tr>
            <td>${area.kode_area}</td>
            <td>${area.nama_area}</td>
            <td>${area.latitude || '-'}</td>
            <td>${area.longitude || '-'}</td>
            <td>
              <button class="btn btn-sm btn-warning" onclick="editArea('${area.kode_area}')">Edit</button>
              <button class="btn btn-sm btn-danger" onclick="deleteArea('${area.kode_area}')">Hapus</button>
            </td>
          </tr>
        `;
      });
    } else {
      alert('❌ Gagal mengambil data area');
    }
  } catch (err) {
    console.error('Error loading areas:', err);
    alert('❌ Terjadi kesalahan saat memuat data area');
  }
}

let currentPage = 1;
const rowsPerPage = 10;
let totalPages = 1;
let currentSearch = "";

// Load cabang dari API dengan pagination & search
async function loadCabang() {
  try {
    const res = await fetch(`/api/admin/cabang/paginate?page=${currentPage}&limit=${rowsPerPage}&search=${encodeURIComponent(currentSearch)}`);
    const result = await res.json();

    if (!result.success) throw new Error(result.message);

    renderCabangTable(result.data);
    totalPages = result.totalPages;
    renderPagination();
  } catch (err) {
    console.error("Error loading cabang:", err);
    alert("❌ Gagal memuat data cabang");
  }
}

function renderCabangTable(data) {
  const tbody = document.querySelector("#cabangTable tbody");
  tbody.innerHTML = "";

  data.forEach(cabang => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${cabang.kode_cabang}</td>
      <td>${cabang.nama}</td>
      <td>${cabang.posisi || "-"}</td>
      <td>${cabang.unit_kerja || "-"}</td>
      <td>${cabang.kode_area || "-"}</td>
      <td>${cabang.latitude || "-"}</td>
      <td>${cabang.longitude || "-"}</td>
      <td>${cabang.kota || "-"}</td>
      <td>
        <button class="btn btn-warning btn-sm" onclick="editCabang('${cabang.kode_cabang}')">✏️</button>
        <button class="btn btn-danger btn-sm" onclick="deleteCabang('${cabang.kode_cabang}')">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderPagination() {
  const paginationContainer = document.getElementById("pagination");
  paginationContainer.innerHTML = "";

  // Tombol Prev
  const prevBtn = document.createElement("button");
  prevBtn.className = "btn btn-sm btn-outline-primary me-1";
  prevBtn.textContent = "⏮ Prev";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      loadCabang();
    }
  };
  paginationContainer.appendChild(prevBtn);

  // Nomor Halaman
  const maxVisible = 5; // jumlah nomor halaman yang ditampilkan
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement("button");
    btn.className = `btn btn-sm ${i === currentPage ? "btn-primary" : "btn-outline-primary"} me-1`;
    btn.textContent = i;
    btn.onclick = () => {
      currentPage = i;
      loadCabang();
    };
    paginationContainer.appendChild(btn);
  }

  // Tombol Next
  const nextBtn = document.createElement("button");
  nextBtn.className = "btn btn-sm btn-outline-primary ms-1";
  nextBtn.textContent = "Next ⏭";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      loadCabang();
    }
  };
  paginationContainer.appendChild(nextBtn);
}

// Event search filter
document.getElementById("searchCabang").addEventListener("input", function(e) {
  currentSearch = e.target.value;
  currentPage = 1;
  loadCabang();
});

// Hapus cabang
async function deleteCabang(kode) {
  if (!confirm("Apakah Anda yakin ingin menghapus cabang ini?")) return;

  try {
    const res = await fetch(`/api/admin/cabang/${kode}`, { method: "DELETE" });
    const result = await res.json();

    if (!result.success) throw new Error(result.message);

    alert("✅ Cabang berhasil dihapus");
    loadCabang();
  } catch (err) {
    console.error("Error deleting cabang:", err);
    alert("❌ Gagal menghapus cabang");
  }
}

let isEditingCabang = false;
let editingKodeCabang = null;

// Tampilkan modal tambah cabang
function showAddCabangForm() {
  isEditingCabang = false;
  editingKodeCabang = null;
  document.getElementById("cabangModalTitle").textContent = "Tambah Cabang";
  document.getElementById("cabangForm").reset();
  loadAreaOptions(); // muat opsi area
  new bootstrap.Modal(document.getElementById("cabangModal")).show();
}

// Tampilkan modal edit cabang
async function editCabang(kode_cabang) {
  try {
    const res = await fetch(`/api/admin/cabang/${kode_cabang}`);
    const result = await res.json();
    if (!result.success) throw new Error(result.message);

    const data = result.data;

    const form = document.getElementById("cabangForm");
    Object.keys(data).forEach(key => {
      if (form.elements[key]) {
        form.elements[key].value = data[key] || "";
      }
    });

    isEditingCabang = true;
    editingKodeCabang = kode_cabang;
    document.getElementById("cabangModalTitle").textContent = "Edit Cabang";
    
    await loadAreaOptions(); // ✅ isi dropdown area dulu
    form.elements["kode_area"].value = data.kode_area || ""; // set value terpilih

    new bootstrap.Modal(document.getElementById("cabangModal")).show();
  } catch (err) {
    console.error("Error fetching cabang:", err);
    alert("❌ Gagal memuat data cabang untuk edit");
  }
}

// Ambil daftar area untuk dropdown
async function loadAreaOptions() {
  try {
    const res = await fetch('/api/admin/areas'); // endpoint ambil area
    const result = await res.json();
    if (!result.success) throw new Error(result.message);

    const select = document.getElementById("cabang-kode-area");
    select.innerHTML = '<option value="">-- Pilih Area --</option>';

    result.data.forEach(area => {
      const option = document.createElement("option");
      option.value = area.kode_area;
      option.textContent = `${area.kode_area} - ${area.nama_area}`;
      option.setAttribute('data-area-name', area.nama_area);
      select.appendChild(option);
    });
  } catch (err) {
    console.error("Error loading area options:", err);
    alert("❌ Gagal memuat daftar area");
  }
}


// Submit form (Tambah/Update)
document.getElementById("cabangForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = Object.fromEntries(new FormData(e.target).entries());

  try {
    let res, result;
    if (isEditingCabang) {
      res = await fetch(`/api/admin/cabang/${editingKodeCabang}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
    } else {
      res = await fetch("/api/admin/cabang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
    }

    result = await res.json();
    if (!result.success) throw new Error(result.message);

    alert("✅ Data cabang berhasil disimpan");
    bootstrap.Modal.getInstance(document.getElementById("cabangModal")).hide();
    loadCabang(); // refresh tabel
  } catch (err) {
    console.error("Error saving cabang:", err);
    alert("❌ Gagal menyimpan data cabang");
  }
});

// =================== DEVELOPER (Server-side pagination) ===================
// =================== DEVELOPER (Server-side pagination) ===================
let currentDevPage = 1;
const devRowsPerPage = 20;
let devSearchQuery = "";

// ✅ Fungsi khusus untuk Developer
async function loadAreaOptionsForDeveloper(defaultValue = "") {
  try {
    console.log("🔄 Loading area options for DEVELOPER");
    
    const res = await fetch('/api/admin/areas');
    const result = await res.json();
    
    console.log("📡 Area API response for Developer - Success:", result.success, "Data count:", result.data?.length);
    
    if (!result.success) {
      throw new Error(result.message);
    }

    const select = document.getElementById("dev-kode-area");
    if (!select) {
      console.error("❌ Element dev-kode-area tidak ditemukan");
      return;
    }

    // Clear existing options
    select.innerHTML = '<option value="">-- Pilih Area --</option>';

    // Check if data is available
    if (!result.data || result.data.length === 0) {
      console.warn("⚠️ No area data available for developer");
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Tidak ada data area";
      select.appendChild(option);
      return;
    }

    // Populate options
    result.data.forEach(area => {
      const option = document.createElement("option");
      option.value = area.kode_area;
      option.textContent = `${area.kode_area} - ${area.nama_area}`;
      option.setAttribute('data-area-name', area.nama_area);
      
      // Set selected jika defaultValue sesuai
      if (defaultValue && area.kode_area === defaultValue) {
        option.selected = true;
      }
      
      select.appendChild(option);
    });

    console.log(`✅ Loaded ${result.data.length} area options for DEVELOPER`);
    
  } catch (err) {
    console.error("❌ Error loading area options for developer:", err);
    
    // Fallback untuk developer
    const select = document.getElementById("dev-kode-area");
    if (select) {
      select.innerHTML = `
        <option value="">-- Error loading areas --</option>
        <option value="AREA001">AREA001 - Default Area</option>
      `;
    }
  }
}

// ✅ Event handler untuk developer area change (khusus developer)
function onAreaChange() {
  const dropdown = document.getElementById('dev-kode-area');
  const selectedOption = dropdown.options[dropdown.selectedIndex];
  const areaName = selectedOption.getAttribute('data-area-name') || '';
  
  document.getElementById('dev-area').value = areaName;
}

// Load data developer dari server
async function loadDeveloper(page = 1) {
  try {
    currentDevPage = page;
    devSearchQuery = document.getElementById("developerSearch").value.trim();

    const res = await fetch(`/api/admin/developers/paginate?page=${page}&limit=${devRowsPerPage}&search=${encodeURIComponent(devSearchQuery)}`);
    const result = await res.json();

    if (!result.success) throw new Error(result.message);

    renderDeveloperTable(result.data);
    renderDeveloperPagination(result.page, result.totalPages);
  } catch (err) {
    console.error("Error loading developer:", err);
    alert("❌ Gagal memuat data developer");
  }
}

function renderDeveloperTable(data) {
  const tbody = document.querySelector("#developerTable tbody");
  tbody.innerHTML = "";

  data.forEach(dev => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${dev.kode_area || "-"}</td>
      <td>${dev.area || "-"}</td>
      <td>${dev.kode_cabang}</td>
      <td>${dev.nama_developer}</td>
      <td>${dev.project || "-"}</td>
      <td>${dev.tipe || "-"}</td>
      <td>${dev.latitude || "-"}</td>
      <td>${dev.longitude || "-"}</td>
      <td>${dev.jumlah_kavling || 0}</td>
      <td>${dev.ready_stock || 0}</td>
      <td>${dev.sisa_potensi || 0}</td>
      <td>${dev.terjual || 0}</td>
      <td>
        <button class="btn btn-warning btn-sm" onclick="editDeveloper(${dev.id_developer})">✏️</button>
        <button class="btn btn-danger btn-sm" onclick="deleteDeveloper(${dev.id_developer})">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderDeveloperPagination(page, totalPages) {
  const container = document.getElementById("developerPagination");
  if (!container) {
    console.error("❌ Pagination container not found");
    return;
  }
  
  container.innerHTML = "";

  // Tombol Previous
  const prevBtn = document.createElement("button");
  prevBtn.className = "btn btn-sm btn-outline-primary me-1";
  prevBtn.textContent = "⏮ Prev";
  prevBtn.disabled = page === 1;
  prevBtn.onclick = () => loadDeveloper(page - 1);
  container.appendChild(prevBtn);

  // Tombol-tombol halaman
  let startPage = Math.max(1, page - 2);
  let endPage = Math.min(totalPages, page + 2);

  // Adjust untuk halaman di awal
  if (page <= 2) {
    endPage = Math.min(5, totalPages);
  }
  
  // Adjust untuk halaman di akhir
  if (page >= totalPages - 1) {
    startPage = Math.max(1, totalPages - 4);
  }

  // Buat tombol untuk setiap halaman
  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement("button");
    btn.className = `btn btn-sm ${i === page ? "btn-primary" : "btn-outline-primary"} me-1`;
    btn.textContent = i;
    btn.onclick = () => loadDeveloper(i);
    container.appendChild(btn);
  }

  // Tombol Next
  const nextBtn = document.createElement("button");
  nextBtn.className = "btn btn-sm btn-outline-primary";
  nextBtn.textContent = "Next ⏭";
  nextBtn.disabled = page === totalPages;
  nextBtn.onclick = () => loadDeveloper(page + 1);
  container.appendChild(nextBtn);
}

// Tambah Developer
async function showAddDeveloperForm() {
  try {
    console.log("🔄 Opening add developer form...");
    
    // ✅ Gunakan fungsi khusus developer
    await loadAreaOptionsForDeveloper();
    
    document.getElementById("developerForm").reset();
    document.getElementById("dev-id").value = "";
    new bootstrap.Modal(document.getElementById("developerModal")).show();
    
    console.log("✅ Add developer form opened successfully");
  } catch (err) {
    console.error("❌ Error opening add developer form:", err);
    alert("❌ Gagal membuka form tambah developer");
  }
}

// Edit Developer  
async function editDeveloper(id) {
  try {
    console.log("🔄 Editing developer ID:", id);
    
    const res = await fetch(`/api/admin/developer/${id}`);
    const result = await res.json();
    
    if (!result.success) {
      alert("❌ Gagal ambil data developer: " + result.message);
      return;
    }

    const dev = result.data;
    console.log("📊 Developer data to edit:", dev);
    
    // ✅ Gunakan fungsi khusus developer
    await loadAreaOptionsForDeveloper(dev.kode_area);
    
    // Isi form dengan data developer
    document.getElementById("dev-id").value = dev.id_developer;
    document.getElementById("dev-kode-area").value = dev.kode_area || "";
    document.getElementById("dev-area").value = dev.nama_area || "";
    document.getElementById("dev-kode-cabang").value = dev.kode_cabang || "";
    document.getElementById("dev-cabang-padanan").value = dev.cabang_padanan || "";
    document.getElementById("dev-project").value = dev.project || "";
    document.getElementById("dev-nama").value = dev.nama_developer || "";
    document.getElementById("dev-tipe").value = dev.tipe || "";
    document.getElementById("dev-lat").value = dev.latitude || "";
    document.getElementById("dev-lon").value = dev.longitude || "";
    document.getElementById("dev-kavling").value = dev.jumlah_kavling || 0;
    document.getElementById("dev-ready").value = dev.ready_stock || 0;
    document.getElementById("dev-potensi").value = dev.sisa_potensi || 0;
    document.getElementById("dev-terjual").value = dev.terjual || 0;

    // Trigger onAreaChange untuk mengisi field area
    onAreaChange();

    // Tampilkan modal
    const modalElement = document.getElementById("developerModal");
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    
    console.log("✅ Edit developer form opened successfully");
    
  } catch (err) {
    console.error("❌ Error in editDeveloper:", err);
    alert("❌ Terjadi kesalahan saat mengambil data developer");
  }
}

// Simpan Developer (tetap sama seperti sebelumnya)
document.getElementById("developerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  try {
    const id = document.getElementById("dev-id").value;
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Convert numeric fields
    data.latitude = data.latitude ? parseFloat(data.latitude) : null;
    data.longitude = data.longitude ? parseFloat(data.longitude) : null;
    data.jumlah_kavling = data.jumlah_kavling ? parseInt(data.jumlah_kavling) : 0;
    data.ready_stock = data.ready_stock ? parseInt(data.ready_stock) : 0;
    data.sisa_potensi = data.sisa_potensi ? parseInt(data.sisa_potensi) : 0;
    data.terjual = data.terjual ? parseInt(data.terjual) : 0;

    const url = id ? `/api/admin/developer/${id}` : `/api/admin/developer`;
    const method = id ? "PUT" : "POST";

    console.log("Saving developer:", { id, data, url, method });

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    console.log("Save response:", result);
    
    if (result.success) {
      alert("✅ Data tersimpan");
      const modal = bootstrap.Modal.getInstance(document.getElementById("developerModal"));
      modal.hide();
      loadDeveloper(currentDevPage);
    } else {
      alert("❌ Gagal simpan data: " + (result.message || "Unknown error"));
    }
  } catch (err) {
    console.error("Error saving developer:", err);
    alert("❌ Terjadi kesalahan saat menyimpan data");
  }
});

// Hapus Developer (tetap sama)
async function deleteDeveloper(id) {
  if (!confirm("Yakin hapus data developer ini?")) return;

  try {
    const res = await fetch(`/api/admin/developer/${id}`, { method: "DELETE" });
    const result = await res.json();

    if (result.success) {
      alert("✅ Developer dihapus");
      loadDeveloper(currentDevPage);
    } else {
      alert("❌ Gagal hapus developer: " + result.message);
    }
  } catch (err) {
    console.error("Error deleting developer:", err);
    alert("❌ Terjadi kesalahan saat menghapus data");
  }
}

// =================== PERUSAHAAN K1 ===================
let currentK1Page = 1;
const k1RowsPerPage = 20;
let k1SearchQuery = "";

async function loadK1(page = 1) {
  try {
    currentK1Page = page;
    k1SearchQuery = document.getElementById("k1Search").value.trim();

    const res = await fetch(`/api/admin/k1/paginate?page=${page}&limit=${k1RowsPerPage}&search=${encodeURIComponent(k1SearchQuery)}`);
    const result = await res.json();

    if (!result.success) throw new Error(result.message);

    renderK1Table(result.data);
    renderK1Pagination(result.page, result.totalPages);
  } catch (err) {
    console.error("Error loading K1:", err);
    alert("❌ Gagal memuat data Perusahaan K1");
  }
}

function renderK1Table(data) {
  const tbody = document.querySelector("#k1Table tbody");
  tbody.innerHTML = "";

  data.forEach(k1 => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${k1.nama_perusahaan}</td>
      <td>${k1.kode_cabang}</td>
      <td>${k1.nama_cabang}</td>
      <td>${k1.jumlah_payroll || 0}</td>
      <td>${k1.latitude || "-"}</td>
      <td>${k1.longitude || "-"}</td>
      <td>
        <button class="btn btn-warning btn-sm" onclick="editK1(${k1.id_k1})">✏️</button>
        <button class="btn btn-danger btn-sm" onclick="deleteK1(${k1.id_k1})">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderK1Pagination(page, totalPages) {
  const container = document.getElementById("k1Pagination");
  container.innerHTML = "";

  const prevBtn = document.createElement("button");
  prevBtn.className = "btn btn-sm btn-outline-primary me-1";
  prevBtn.textContent = "⏮ Prev";
  prevBtn.disabled = page === 1;
  prevBtn.onclick = () => loadK1(page - 1);
  container.appendChild(prevBtn);

  for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
    const btn = document.createElement("button");
    btn.className = `btn btn-sm ${i === page ? "btn-primary" : "btn-outline-primary"} me-1`;
    btn.textContent = i;
    btn.onclick = () => loadK1(i);
    container.appendChild(btn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.className = "btn btn-sm btn-outline-primary";
  nextBtn.textContent = "Next ⏭";
  nextBtn.disabled = page === totalPages;
  nextBtn.onclick = () => loadK1(page + 1);
  container.appendChild(nextBtn);
}

// Tambah K1
function showAddK1Form() {
  document.getElementById("k1Form").reset();
  document.getElementById("k1-id").value = "";
  new bootstrap.Modal(document.getElementById("k1Modal")).show();
}

// Edit K1
async function editK1(id) {
  try {
    const res = await fetch(`/api/admin/k1/${id}`);
    const result = await res.json();
    if (!result.success) return alert("❌ Gagal ambil data K1");

    const k1 = result.data;
    document.getElementById("k1-id").value = k1.id_k1;
    document.getElementById("k1-nama").value = k1.nama_perusahaan || "";
    document.getElementById("k1-kode-cabang").value = k1.kode_cabang || "";
    document.getElementById("k1-cabang").value = k1.nama_cabang || "";
    document.getElementById("k1-payroll").value = k1.jumlah_payroll || 0;
    document.getElementById("k1-lat").value = k1.latitude || "";
    document.getElementById("k1-lon").value = k1.longitude || "";

    new bootstrap.Modal(document.getElementById("k1Modal")).show();
  } catch (err) {
    console.error(err);
    alert("❌ Gagal memuat data untuk edit");
  }
}

// Simpan (Create / Update)
document.getElementById("k1Form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("k1-id").value;
  const formData = Object.fromEntries(new FormData(e.target).entries());

  const url = id ? `/api/admin/k1/${id}` : `/api/admin/k1`;
  const method = id ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });
    const result = await res.json();

    if (result.success) {
      alert("✅ Data tersimpan");
      bootstrap.Modal.getInstance(document.getElementById("k1Modal")).hide();
      loadK1(currentK1Page);
    } else {
      alert("❌ Gagal simpan data");
    }
  } catch (err) {
    console.error("Error saving K1:", err);
    alert("❌ Terjadi kesalahan saat menyimpan");
  }
});

// Hapus K1
async function deleteK1(id) {
  if (!confirm("Yakin hapus data perusahaan K1 ini?")) return;

  try {
    const res = await fetch(`/api/admin/k1/${id}`, { method: "DELETE" });
    const result = await res.json();

    if (result.success) {
      alert("✅ Data dihapus");
      loadK1(currentK1Page);
    } else {
      alert("❌ Gagal hapus data");
    }
  } catch (err) {
    console.error("Error deleting K1:", err);
    alert("❌ Terjadi kesalahan saat hapus");
  }
}

// Jalankan otomatis saat halaman admin dimuat
document.addEventListener('DOMContentLoaded', () => {
  loadAreas();
  loadCabang();
  loadDeveloper();
  loadK1();

    // Inisialisasi modal jika diperlukan
  const developerModal = document.getElementById('developerModal');
  if (developerModal) {
    developerModal.addEventListener('hidden.bs.modal', function () {
      document.getElementById("developerForm").reset();
    });
  }
});

// Placeholder edit & delete
function editArea(kode) {
  alert('✏️ Edit area: ' + kode);
}

function deleteArea(kode) {
  alert('🗑️ Hapus area: ' + kode);
}

function showAddAreaForm() {
  alert('➕ Tambah area baru');
}

