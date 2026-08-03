/* ==========================================================================
   DERMA IRIS - ORDER PROCESSING & LOCALSTORAGE SYNC (JORDAN COD)
   ========================================================================== */

const WHATSAPP_NUMBER = "962791924669";
const DELIVERY_FEE = 2; // JOD

let selectedPackage = {
  qty: 1,
  price: 15
};

document.addEventListener('DOMContentLoaded', () => {
  loadGovernorates();
  setupPackageSelectors();
  setupOrderForm();
});

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

// Load 12 Jordan Governorates into Select Dropdown
async function loadGovernorates() {
  const govSelect = document.getElementById('governorate-select');
  if (!govSelect) return;

  let governorates = JORDAN_GOVERNORATES_DEFAULT;

  try {
    const response = await fetch('data/governorates.json');
    if (response.ok) {
      governorates = await response.json();
    }
  } catch (err) {
    console.warn("Using fallback governorates data:", err);
  }

  // Clear initial options keeping placeholder
  govSelect.innerHTML = `<option value="" disabled selected data-i18n="select_gov">Select your governorate</option>`;
  
  governorates.forEach(gov => {
    const option = document.createElement('option');
    option.value = gov.id;
    option.setAttribute('data-name-en', gov.name_en);
    option.setAttribute('data-name-ar', gov.name_ar);
    
    const currentLang = localStorage.getItem('derma_lang') || 'en';
    option.textContent = currentLang === 'ar' ? gov.name_ar : gov.name_en;
    govSelect.appendChild(option);
  });

  // Listen for language change to update governorate names
  window.addEventListener('languageChanged', (e) => {
    const lang = e.detail.lang;
    Array.from(govSelect.options).forEach(opt => {
      if (opt.value) {
        opt.textContent = lang === 'ar' ? opt.getAttribute('data-name-ar') : opt.getAttribute('data-name-en');
      }
    });
  });
}

// Package Selection Handler (Single 15 JOD vs Double 26 JOD)
function setupPackageSelectors() {
  const pkgOptions = document.querySelectorAll('.pkg-option');
  pkgOptions.forEach(option => {
    option.addEventListener('click', () => {
      pkgOptions.forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');
      
      const radio = option.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;

      const qty = parseInt(option.getAttribute('data-qty'));
      const price = parseInt(option.getAttribute('data-price'));
      
      selectedPackage = { qty, price };
      updatePriceDisplay();
    });
  });
}

function updatePriceDisplay() {
  const subtotalEl = document.getElementById('price-subtotal-val');
  const totalEl = document.getElementById('price-total-val');
  
  if (subtotalEl && totalEl) {
    const subtotal = selectedPackage.price;
    const total = subtotal + DELIVERY_FEE;
    
    subtotalEl.textContent = `${subtotal} JOD`;
    totalEl.textContent = `${total} JOD`;
  }
}

// Order Submission Handling
function setupOrderForm() {
  const form = document.getElementById('derma-order-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const fullName = document.getElementById('order-fullname').value.trim();
    const phone = document.getElementById('order-phone').value.trim();
    const governorateSelect = document.getElementById('governorate-select');
    const governorateId = governorateSelect.value;
    const city = document.getElementById('order-city').value.trim();
    const notes = document.getElementById('order-notes').value.trim();

    // Validation
    if (!fullName || !phone || !governorateId || !city) {
      alert(currentLang === 'ar' ? "يرجى ملء جميع الحقول المطلوبة." : "Please fill in all required fields.");
      return;
    }

    // Jordanian phone check (079, 078, 077)
    const phoneClean = phone.replace(/\s+/g, '');
    if (!/^07[789]\d{7}$/.test(phoneClean) && !/^\+9627[789]\d{7}$/.test(phoneClean)) {
      alert(currentLang === 'ar' ? "يرجى إدخال رقم هاتف أردني صحيح (مثال: 0791234567)" : "Please enter a valid Jordanian phone number (e.g. 0791234567)");
      return;
    }

    const selectedGovOption = governorateSelect.options[governorateSelect.selectedIndex];
    const govNameEn = selectedGovOption.getAttribute('data-name-en');
    const govNameAr = selectedGovOption.getAttribute('data-name-ar');

    const totalAmount = selectedPackage.price + DELIVERY_FEE;

    const orderData = {
      id: "ORD-" + Math.floor(100000 + Math.random() * 900000),
      timestamp: new Date().toISOString(),
      customer: fullName,
      phone: phoneClean,
      governorate_id: governorateId,
      governorate_en: govNameEn,
      governorate_ar: govNameAr,
      city: city,
      package_qty: selectedPackage.qty,
      subtotal: selectedPackage.price,
      delivery_fee: DELIVERY_FEE,
      total_jod: totalAmount,
      notes: notes,
      status: "pending"
    };

    // Save to LocalStorage
    saveOrderToStorage(orderData);

    // Show Confirmation Modal
    const modal = document.getElementById('order-success-modal');
    if (modal) modal.classList.add('active');

    // Reset Form
    form.reset();
  });

  // Direct WhatsApp Button Listener
  const waBtn = document.getElementById('btn-order-whatsapp');
  if (waBtn) {
    waBtn.addEventListener('click', () => {
      const fullName = document.getElementById('order-fullname').value.trim() || "(Customer)";
      const governorateSelect = document.getElementById('governorate-select');
      const govName = governorateSelect.selectedIndex > 0 ? governorateSelect.options[governorateSelect.selectedIndex].text : "Jordan";
      const city = document.getElementById('order-city').value.trim() || "";

      const msg = `Hello Derma Iris! I would like to order Derma Iris Cream.\n\nName: ${fullName}\nGovernorate: ${govName}\nCity/Area: ${city}\nPackage: ${selectedPackage.qty} Jar(s) (${selectedPackage.price} JOD)\nTotal: ${selectedPackage.price + DELIVERY_FEE} JOD (COD)`;
      
      const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, '_blank');
    });
  }
}

// Store in LocalStorage for Dashboard sync
function saveOrderToStorage(order) {
  let existingOrders = JSON.parse(localStorage.getItem('derma_orders') || '[]');
  existingOrders.unshift(order);
  localStorage.setItem('derma_orders', JSON.stringify(existingOrders));
}

// Modal Close Listener
document.addEventListener('click', (e) => {
  if (e.target.matches('#modal-close-btn') || e.target.matches('.modal-overlay')) {
    const modal = document.getElementById('order-success-modal');
    if (modal) modal.classList.remove('active');
  }
});
