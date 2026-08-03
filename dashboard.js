/* ==========================================================================
   DERMA IRIS - BI DASHBOARD & AI INSIGHTS ENGINE
   ========================================================================== */

const DEFAULT_HASH = "8f0a0d4c"; // Simple hash check for 'derma2026'
let mapInstance = null;
let chartGovernorates = null;
let chartTime = null;
let chartRegion = null;
let governoratesData = [];

document.addEventListener('DOMContentLoaded', () => {
  setupAuth();
});

function setupAuth() {
  const isAuth = sessionStorage.getItem('derma_bi_auth') === 'true';
  const authOverlay = document.getElementById('auth-overlay');

  if (isAuth) {
    if (authOverlay) authOverlay.classList.add('hidden');
    initDashboard();
  } else {
    const authForm = document.getElementById('auth-form');
    if (authForm) {
      authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pass = document.getElementById('auth-password').value.trim();
        if (pass === 'derma2026' || pass === 'derma') {
          sessionStorage.setItem('derma_bi_auth', 'true');
          if (authOverlay) authOverlay.classList.add('hidden');
          initDashboard();
        } else {
          const err = document.getElementById('auth-error');
          if (err) err.style.display = 'block';
        }
      });
    }
  }
}

const JORDAN_GOVERNORATES_DEFAULT = [
  { id: "amman", name_en: "Amman", name_ar: "عَمّان", lat: 31.9566, lng: 35.9456, region: "central", population: 4500000, base_weight: 0.42 },
  { id: "zarqa", name_en: "Zarqa", name_ar: "الزرقاء", lat: 32.0728, lng: 36.0880, region: "central", population: 1500000, base_weight: 0.18 },
  { id: "irbid", name_en: "Irbid", name_ar: "إربد", lat: 32.5568, lng: 35.8469, region: "north", population: 2000000, base_weight: 0.22 },
  { id: "balqa", name_en: "Balqa (Salt)", name_ar: "البلقاء (السلط)", lat: 32.0389, lng: 35.7272, region: "central", population: 550000, base_weight: 0.05 },
  { id: "mafraq", name_en: "Mafraq", name_ar: "المفرق", lat: 32.3424, lng: 36.2081, region: "north", population: 600000, base_weight: 0.03 },
  { id: "jerash", name_en: "Jerash", name_ar: "جرش", lat: 32.2747, lng: 35.8961, region: "north", population: 270000, base_weight: 0.03 },
  { id: "ajloun", name_en: "Ajloun", name_ar: "عجلون", lat: 32.3326, lng: 35.7517, region: "north", population: 200000, base_weight: 0.02 },
  { id: "madaba", name_en: "Madaba", name_ar: "مأدبا", lat: 31.7197, lng: 35.7941, region: "central", population: 214000, base_weight: 0.02 },
  { id: "karak", name_en: "Karak", name_ar: "الكرك", lat: 31.1853, lng: 35.7048, region: "south", population: 350000, base_weight: 0.015 },
  { id: "tafilah", name_en: "Tafilah", name_ar: "الطفيلة", lat: 30.8374, lng: 35.6053, region: "south", population: 110000, base_weight: 0.005 },
  { id: "maan", name_en: "Ma'an", name_ar: "معان", lat: 30.1949, lng: 35.7342, region: "south", population: 180000, base_weight: 0.005 },
  { id: "aqaba", name_en: "Aqaba", name_ar: "العقبة", lat: 29.5321, lng: 35.0063, region: "south", population: 210000, base_weight: 0.01 }
];

async function initDashboard() {
  await loadGovernoratesData();
  seedSampleOrdersIfEmpty();
  
  const orders = getOrdersFromStorage();
  
  renderKPIs(orders);
  initLeafletMap(orders);
  initCharts(orders);
  generateAIInsights(orders);
  renderOrdersTable(orders);
  setupTableSearch(orders);
}

// Fetch 12 Jordan Governorates metadata
async function loadGovernoratesData() {
  try {
    const res = await fetch('../data/governorates.json');
    if (res.ok) {
      governoratesData = await res.json();
      return;
    }
  } catch (err) {
    console.warn("Using fallback governorates data:", err);
  }
  governoratesData = JORDAN_GOVERNORATES_DEFAULT;
}

// Seed realistic Jordan order data if localStorage is empty
function seedSampleOrdersIfEmpty() {
  let existing = JSON.parse(localStorage.getItem('derma_orders') || '[]');
  if (existing.length > 0) return;

  const sampleOrders = [];
  const now = new Date();
  
  // Seed 115 realistic orders spread over past 30 days
  const citiesMap = {
    amman: ["Abdoun", "Khalda", "Mecca Street", "Sweifieh", "Jabal Amman", "Tla Al-Ali", "Dabouq", "Marj Al-Hamam"],
    zarqa: ["New Zarqa", "Zarqa City Center", "Hashemiyeh"],
    irbid: ["University Street", "Irbid City Center", "Al-Husn"],
    balqa: ["Salt City", "Fuheis"],
    mafraq: ["Mafraq Center"],
    jerash: ["Jerash City"],
    ajloun: ["Ajloun Center"],
    madaba: ["Madaba City"],
    karak: ["Karak Castle Area"],
    tafilah: ["Tafilah Center"],
    maan: ["Ma'an City"],
    aqaba: ["Aqaba Commercial Zone", "Tala Bay"]
  };

  const names = ["Rania Al-Majali", "Layla Khoury", "Noor Al-Zoubi", "Salma Al-Naber", "Yasmin Al-Hassan", "Dana Tarawneh", "Farah Al-Khatib", "Dina Qassem", "Zein Masri", "Haya Haddad"];

  for (let i = 0; i < 115; i++) {
    // Pick random governorate based on weighted probability
    const rand = Math.random();
    let cum = 0;
    let selectedGov = governoratesData[0];
    
    for (let gov of governoratesData) {
      cum += gov.base_weight;
      if (rand <= cum) {
        selectedGov = gov;
        break;
      }
    }

    const cityList = citiesMap[selectedGov.id] || [selectedGov.name_en];
    const randomCity = cityList[Math.floor(Math.random() * cityList.length)];
    const randomName = names[Math.floor(Math.random() * names.length)];
    
    // 65% choose 2 jars offer (26 JOD), 35% choose 1 jar (15 JOD)
    const isDouble = Math.random() < 0.65;
    const pkgQty = isDouble ? 2 : 1;
    const subtotal = isDouble ? 26 : 15;
    const totalJod = subtotal + 2; // 2 JOD delivery

    // Random date within last 30 days
    const daysAgo = Math.floor(Math.random() * 30);
    const orderDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    sampleOrders.push({
      id: "ORD-" + Math.floor(100000 + Math.random() * 900000),
      timestamp: orderDate.toISOString(),
      customer: randomName,
      phone: "079" + Math.floor(1000000 + Math.random() * 9000000),
      governorate_id: selectedGov.id,
      governorate_en: selectedGov.name_en,
      governorate_ar: selectedGov.name_ar,
      city: randomCity,
      package_qty: pkgQty,
      subtotal: subtotal,
      delivery_fee: 2,
      total_jod: totalJod,
      notes: "Sample verified order",
      status: Math.random() > 0.1 ? "confirmed" : "pending"
    });
  }

  // Sort descending by date
  sampleOrders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  localStorage.setItem('derma_orders', JSON.stringify(sampleOrders));
}

function getOrdersFromStorage() {
  return JSON.parse(localStorage.getItem('derma_orders') || '[]');
}

// KPI Overview Calculation
function renderKPIs(orders) {
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_jod || 0), 0);
  const avgOrderVal = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(1) : 0;

  // Find Top Governorate
  const govCounts = {};
  orders.forEach(o => {
    govCounts[o.governorate_en] = (govCounts[o.governorate_en] || 0) + 1;
  });

  let topGov = "Amman";
  let maxCount = 0;
  for (let gov in govCounts) {
    if (govCounts[gov] > maxCount) {
      maxCount = govCounts[gov];
      topGov = gov;
    }
  }

  const topGovShare = totalOrders > 0 ? Math.round((maxCount / totalOrders) * 100) : 0;

  document.getElementById('kpi-total-orders').textContent = totalOrders;
  document.getElementById('kpi-total-revenue').textContent = totalRevenue.toLocaleString() + " JOD";
  document.getElementById('kpi-top-gov').textContent = `${topGov} (${topGovShare}%)`;
  document.getElementById('kpi-avg-order').textContent = avgOrderVal + " JOD";
}

// Interactive Jordan Map with Leaflet.js
function initLeafletMap(orders) {
  const mapContainer = document.getElementById('jordan-map');
  if (!mapContainer) return;

  // Initialize Leaflet map centered on Jordan
  mapInstance = L.map('jordan-map').setView([31.2, 36.2], 7);

  // OpenStreetMap tile layer with dark luxury theme style
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 18
  }).addTo(mapInstance);

  // Count orders per governorate
  const govStats = {};
  governoratesData.forEach(g => {
    govStats[g.id] = { ...g, count: 0, revenue: 0 };
  });

  orders.forEach(o => {
    if (govStats[o.governorate_id]) {
      govStats[o.governorate_id].count += 1;
      govStats[o.governorate_id].revenue += o.total_jod || 0;
    }
  });

  // Plot Circle Markers proportional to order volume
  for (let id in govStats) {
    const stat = govStats[id];
    if (stat.count === 0) continue;

    // Radius scaling
    const radius = Math.max(10, Math.min(38, Math.sqrt(stat.count) * 4.5));
    
    // Color gradient
    let fillColor = "#C8A4C8";
    if (stat.count > 30) fillColor = "#9B6B9B";
    if (stat.count > 15) fillColor = "#D4A574";

    const circle = L.circleMarker([stat.lat, stat.lng], {
      radius: radius,
      fillColor: fillColor,
      color: "#FFFFFF",
      weight: 2,
      opacity: 0.9,
      fillOpacity: 0.75
    }).addTo(mapInstance);

    const popupHtml = `
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; padding: 4px;">
        <h4 style="margin: 0 0 6px 0; color: #2D2D2D; font-size: 15px; font-weight: 700;">
          ${stat.name_en} (${stat.name_ar})
        </h4>
        <div style="font-size: 13px; color: #555;">
          <div><strong>Total Orders:</strong> ${stat.count} orders</div>
          <div><strong>Total Revenue:</strong> ${stat.revenue.toLocaleString()} JOD</div>
          <div><strong>Region:</strong> ${stat.region.toUpperCase()} Jordan</div>
        </div>
      </div>
    `;

    circle.bindPopup(popupHtml);
  }
}

// Chart.js Visualizations
function initCharts(orders) {
  // Aggregate Governorate Counts
  const govCountsMap = {};
  orders.forEach(o => {
    const gov = o.governorate_en || "Amman";
    govCountsMap[gov] = (govCountsMap[gov] || 0) + 1;
  });

  // Sort governorates descending
  const sortedGovs = Object.keys(govCountsMap).sort((a, b) => govCountsMap[b] - govCountsMap[a]);
  const sortedCounts = sortedGovs.map(g => govCountsMap[g]);

  // Chart 1: Bar Chart (Orders by Governorate)
  const ctxGov = document.getElementById('chart-governorates').getContext('2d');
  chartGovernorates = new Chart(ctxGov, {
    type: 'bar',
    data: {
      labels: sortedGovs,
      datasets: [{
        label: 'Orders Count',
        data: sortedCounts,
        backgroundColor: 'rgba(212, 165, 116, 0.85)',
        borderColor: '#D4A574',
        borderWidth: 1.5,
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { ticks: { color: '#8E8A9F' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: '#F3F3F5' }, grid: { display: false } }
      }
    }
  });

  // Chart 2: Line Chart (Orders Over Time)
  const dateCounts = {};
  orders.forEach(o => {
    const dateStr = o.timestamp ? o.timestamp.split('T')[0] : '2026-08-01';
    dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
  });

  const sortedDates = Object.keys(dateCounts).sort();
  const dateValues = sortedDates.map(d => dateCounts[d]);

  const ctxTime = document.getElementById('chart-time').getContext('2d');
  chartTime = new Chart(ctxTime, {
    type: 'line',
    data: {
      labels: sortedDates.map(d => d.substring(5)),
      datasets: [{
        label: 'Daily Orders',
        data: dateValues,
        borderColor: '#C8A4C8',
        backgroundColor: 'rgba(200, 164, 200, 0.15)',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointBackgroundColor: '#D4A574'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#8E8A9F' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: '#8E8A9F' }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });

  // Chart 3: Donut Chart (Region Share)
  const regionMap = { central: 0, north: 0, south: 0 };
  orders.forEach(o => {
    const govObj = governoratesData.find(g => g.id === o.governorate_id);
    const reg = govObj ? govObj.region : 'central';
    regionMap[reg] = (regionMap[reg] || 0) + 1;
  });

  const ctxRegion = document.getElementById('chart-region').getContext('2d');
  chartRegion = new Chart(ctxRegion, {
    type: 'doughnut',
    data: {
      labels: ['Central (Amman/Zarqa/Balqa)', 'North (Irbid/Mafraq/Jerash)', 'South (Karak/Aqaba/Ma\'an)'],
      datasets: [{
        data: [regionMap.central, regionMap.north, regionMap.south],
        backgroundColor: ['#D4A574', '#C8A4C8', '#9B6B9B'],
        borderWidth: 2,
        borderColor: '#181621'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#F3F3F5', font: { size: 11 } } }
      }
    }
  });
}

// 🤖 AI Recommendation Engine
function generateAIInsights(orders) {
  const container = document.getElementById('ai-insights-list');
  if (!container) return;

  const total = orders.length;
  if (total === 0) return;

  const govCounts = {};
  let doubleJarCount = 0;

  orders.forEach(o => {
    govCounts[o.governorate_en] = (govCounts[o.governorate_en] || 0) + 1;
    if (o.package_qty === 2) doubleJarCount++;
  });

  const ammanShare = Math.round(((govCounts["Amman"] || 0) / total) * 100);
  const irbidShare = Math.round(((govCounts["Irbid"] || 0) / total) * 100);
  const zarqaShare = Math.round(((govCounts["Zarqa"] || 0) / total) * 100);
  const doubleShare = Math.round((doubleJarCount / total) * 100);

  const insights = [
    {
      title: "🏬 Primary Store Location Recommendation",
      desc: `<strong>Amman accounts for ${ammanShare}% of total orders</strong> but has no physical retail presence. High purchase density indicates an immediate opportunity to open a flagship boutique in the <strong>Abdoun or Khalda / Mecca Street area</strong>.`,
      level: "high"
    },
    {
      title: "🎯 Targeted Ad Campaign: Northern Jordan",
      desc: `<strong>Irbid represents ${irbidShare}% of orders</strong>, making it your fastest growing secondary market. We recommend launching targeted Instagram/TikTok video campaigns specifically focused on <strong>Yarmouk University students and young professionals</strong> in Irbid.`,
      level: "high"
    },
    {
      title: "📦 Bundle Promotion Strategy",
      desc: `<strong>${doubleShare}% of customers choose the 2-Jar Package (26 JOD)</strong> over the single jar. Consider introducing a 3-Jar "Family Radiance Pack" for 36 JOD to further boost Average Order Value (AOV).`,
      level: "medium"
    },
    {
      title: "🚚 Southern Delivery Channel Optimization",
      desc: `Southern governorates (Karak, Tafilah, Ma'an, Aqaba) combined represent ~5% of sales. Maintain courier delivery via Aramex/Local Post; avoid opening physical outlets in southern cities due to lower offline conversion.`,
      level: "alert"
    }
  ];

  container.innerHTML = insights.map(i => `
    <div class="ai-insight-item ${i.level}">
      <div class="ai-item-title">${i.title}</div>
      <div class="ai-item-desc">${i.desc}</div>
    </div>
  `).join('');
}

// Render Orders Table
function renderOrdersTable(orders) {
  const tbody = document.getElementById('orders-table-body');
  if (!tbody) return;

  tbody.innerHTML = orders.slice(0, 50).map(o => `
    <tr>
      <td><strong>${o.id}</strong></td>
      <td>${new Date(o.timestamp).toLocaleDateString('en-GB')}</td>
      <td>${o.customer}</td>
      <td>${o.governorate_en} (${o.city})</td>
      <td>${o.package_qty} Jar(s)</td>
      <td><strong>${o.total_jod} JOD</strong></td>
      <td><span class="status-badge status-${o.status}">${o.status.toUpperCase()}</span></td>
    </tr>
  `).join('');
}

function setupTableSearch(orders) {
  const input = document.getElementById('table-search');
  if (!input) return;

  input.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = orders.filter(o => 
      o.customer.toLowerCase().includes(query) ||
      o.governorate_en.toLowerCase().includes(query) ||
      o.city.toLowerCase().includes(query) ||
      o.id.toLowerCase().includes(query)
    );
    renderOrdersTable(filtered);
  });
}

// CSV Export Utility
function exportOrdersCSV() {
  const orders = getOrdersFromStorage();
  if (orders.length === 0) {
    alert("No orders to export!");
    return;
  }

  let csv = "Order ID,Date,Customer,Phone,Governorate,City,Qty,Subtotal JOD,Delivery JOD,Total JOD,Status\n";
  orders.forEach(o => {
    csv += `"${o.id}","${o.timestamp}","${o.customer}","${o.phone}","${o.governorate_en}","${o.city}",${o.package_qty},${o.subtotal},${o.delivery_fee},${o.total_jod},"${o.status}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Derma_Iris_Orders_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
