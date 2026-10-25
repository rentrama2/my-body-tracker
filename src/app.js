// BodyFit - Advanced Personal Health & Body Tracker
// State Management
let state = {
    profile: {
        name: "ผู้รักสุขภาพ",
        gender: "female", // 'female' or 'male'
        age: 28,
        height: 165,
        neck: 32, // cm or inches
        activityLevel: "light", // 'sedentary', 'light', 'moderate', 'active'
        unitSystem: "imperial", // 'imperial' (kg/inch) or 'metric' (kg/cm)
        startWeight: 75.0,
        targetWeight: 60.0,
        targetWaist: 28.0,
        macroDiet: "balanced", // 'balanced', 'high-protein', 'low-carb', 'keto'
        waterTarget: 2500 // ml
    },
    logs: [],
    waterLogs: {} // { "YYYY-MM-DD": 1750 }
};

// UI Filter States
let currentFilter = {
    timeRange: 'all', // '7d', '30d', '90d', 'all'
    metricView: 'all' // 'all', 'weight', 'waist'
};

// Temporary Log Form State (Triple Angle Photos: Front, Side, Back)
let currentUploadedPhotos = {
    front: null,
    side: null,
    back: null
};
let currentComparisonAngle = 'front'; // 'front', 'side', 'back'
let currentUploadedPhoto = null;
let currentSelectedTags = [];

// Chart instance
let trendsChart = null;

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
    loadData();
    initApp();
    setupEventListeners();
    initTheme();
    updateUI();
    registerServiceWorker();
});

// Load data from localStorage
function loadData() {
    const savedProfile = localStorage.getItem("bodyfit_profile");
    const savedLogs = localStorage.getItem("bodyfit_logs");
    const savedWater = localStorage.getItem("bodyfit_water");

    if (savedProfile) {
        state.profile = Object.assign(state.profile, JSON.parse(savedProfile));
    } else {
        localStorage.setItem("bodyfit_profile", JSON.stringify(state.profile));
    }

    if (savedLogs) {
        state.logs = JSON.parse(savedLogs);
    } else {
        generateMockData();
        localStorage.setItem("bodyfit_logs", JSON.stringify(state.logs));
    }

    if (savedWater) {
        try {
            state.waterLogs = JSON.parse(savedWater);
        } catch (e) {
            state.waterLogs = {};
        }
    }
}

// Generate realistic starter data
function generateMockData() {
    const mockLogs = [];
    const today = new Date();
    
    // Create 6 weeks of data showing progress
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - (i * 7));
        
        const factor = i / 5; // from 1.0 down to 0.0
        const weight = (state.profile.startWeight + (70.5 - state.profile.startWeight) * (1 - factor) + (Math.random() * 0.3 - 0.15)).toFixed(1);
        
        const waist = state.profile.unitSystem === 'imperial' 
            ? (34 - (5 * (1 - factor)) + (Math.random() * 0.2 - 0.1)).toFixed(1)
            : (86 - (12 * (1 - factor)) + (Math.random() * 0.5 - 0.25)).toFixed(1);
            
        const chest = state.profile.unitSystem === 'imperial'
            ? (38 - (2 * (1 - factor))).toFixed(1)
            : (96 - (5 * (1 - factor))).toFixed(1);
            
        const hips = state.profile.unitSystem === 'imperial'
            ? (40 - (3 * (1 - factor))).toFixed(1)
            : (101 - (7 * (1 - factor))).toFixed(1);

        const neck = state.profile.unitSystem === 'imperial'
            ? (13.0 - (0.5 * (1 - factor))).toFixed(1)
            : (33.0 - (1.2 * (1 - factor))).toFixed(1);

        const arm = state.profile.unitSystem === 'imperial'
            ? (13.5 - (1.0 * (1 - factor))).toFixed(1)
            : (34 - (2.5 * (1 - factor))).toFixed(1);

        const thigh = state.profile.unitSystem === 'imperial'
            ? (23.5 - (1.8 * (1 - factor))).toFixed(1)
            : (59 - (4.5 * (1 - factor))).toFixed(1);

        const tagsPool = ["ออกกำลังกาย", "กินคลีน", "ดื่มน้ำครบ", "หลับเต็มอิ่ม"];
        const selectedTags = i % 2 === 0 ? tagsPool.slice(0, 2) : ["ออกกำลังกาย", "ดื่มน้ำครบ"];

        mockLogs.push({
            id: Date.now() - (i * 1000 * 60 * 60 * 24 * 7),
            date: date.toISOString().split('T')[0],
            weight: parseFloat(weight),
            neck: parseFloat(neck),
            chest: parseFloat(chest),
            waist: parseFloat(waist),
            hips: parseFloat(hips),
            armLeft: parseFloat(arm),
            armRight: parseFloat(arm),
            thighLeft: parseFloat(thigh),
            thighRight: parseFloat(thigh),
            photo: null,
            tags: selectedTags,
            notes: i === 0 ? "สัปดาห์นี้ออกกำลังกายสม่ำเสมอ รู้สึกสดชื่นขึ้นมาก!" : "คุมอาหารได้ดี ดื่มน้ำเกิน 2 ลิตรทุกวัน"
        });
    }
    
    state.logs = mockLogs.sort((a, b) => new Date(a.date) - new Date(b.date));
}

// Save state to localStorage
async function saveState() {
    localStorage.setItem("bodyfit_profile", JSON.stringify(state.profile));
    localStorage.setItem("bodyfit_logs", JSON.stringify(state.logs));
    localStorage.setItem("bodyfit_water", JSON.stringify(state.waterLogs));
    updateUI();
}

// Register PWA Service Worker
function registerServiceWorker() {
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
        navigator.serviceWorker.register('sw.js')
            .then(() => console.log("BodyFit Service Worker Active"))
            .catch(err => console.log("Service Worker Registration Failed:", err));
    }
}

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem("bodyfit_theme") || "neon";
    changeTheme(savedTheme, false);
}

function changeTheme(themeName, doSave = true) {
    document.documentElement.setAttribute("data-theme", themeName);
    if (doSave) {
        localStorage.setItem("bodyfit_theme", themeName);
    }
    const themeSelect = document.getElementById("theme-selector");
    if (themeSelect) themeSelect.value = themeName;
    const profileThemeSelect = document.getElementById("profile-theme-select");
    if (profileThemeSelect) profileThemeSelect.value = themeName;

    // Refresh charts to match new theme colors
    if (trendsChart) {
        renderCharts();
    }
}
window.changeTheme = changeTheme;

// Populate forms with state
function initApp() {
    document.getElementById("user-name").value = state.profile.name || "";
    document.getElementById("user-gender").value = state.profile.gender || "female";
    document.getElementById("user-age").value = state.profile.age || 28;
    document.getElementById("user-height").value = state.profile.height || 165;
    document.getElementById("user-neck").value = state.profile.neck || (state.profile.unitSystem === 'metric' ? 33 : 13);
    document.getElementById("user-activity").value = state.profile.activityLevel || "light";
    document.getElementById("unit-system").value = state.profile.unitSystem || "imperial";
    document.getElementById("start-weight").value = state.profile.startWeight || 75;
    document.getElementById("target-weight").value = state.profile.targetWeight || 60;
    document.getElementById("target-waist").value = state.profile.targetWaist || 28;
    document.getElementById("macro-diet-select").value = state.profile.macroDiet || "balanced";

    // Reset date in log form to today
    document.getElementById("log-date").value = new Date().toISOString().split('T')[0];
    
    updateUnitLabels();
}

// Update unit label displays
function updateUnitLabels() {
    const isMetric = document.getElementById("unit-system").value === "metric";
    const measureUnitText = isMetric ? "ซม." : "นิ้ว";
    const weightUnitText = "กก.";

    document.querySelectorAll(".label-measure-unit").forEach(el => el.textContent = measureUnitText);
    document.querySelectorAll(".label-weight-unit").forEach(el => el.textContent = weightUnitText);
    document.querySelectorAll(".tbl-measure-unit").forEach(el => el.textContent = measureUnitText);
    document.querySelectorAll(".tbl-weight-unit").forEach(el => el.textContent = weightUnitText);

    document.getElementById("unit-waist").textContent = measureUnitText;
    document.getElementById("unit-chest").textContent = measureUnitText;
    document.getElementById("unit-hips").textContent = measureUnitText;
}
window.updateUnitLabels = updateUnitLabels;

// Event Listeners setup
function setupEventListeners() {
    // Navigation for Sidebar & Bottom Nav
    document.querySelectorAll(".nav-item, .bottom-nav-item").forEach(item => {
        item.addEventListener("click", (e) => {
            const targetTab = e.currentTarget.getAttribute("data-tab");
            switchTab(targetTab);
        });
    });

    // Tag chip clicks
    document.querySelectorAll(".tag-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            chip.classList.toggle("active");
            const tag = chip.getAttribute("data-tag");
            if (currentSelectedTags.includes(tag)) {
                currentSelectedTags = currentSelectedTags.filter(t => t !== tag);
            } else {
                currentSelectedTags.push(tag);
            }
        });
    });

    // Quick tag chips in Quick Weight modal
    document.querySelectorAll(".quick-tag-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            chip.classList.toggle("active");
        });
    });

    // Profile form submit
    document.getElementById("profile-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        
        state.profile.name = document.getElementById("user-name").value.trim() || "ผู้ใช้งาน";
        state.profile.gender = document.getElementById("user-gender").value;
        state.profile.age = parseInt(document.getElementById("user-age").value) || 28;
        state.profile.height = parseFloat(document.getElementById("user-height").value) || 165;
        state.profile.neck = parseFloat(document.getElementById("user-neck").value) || 33;
        state.profile.activityLevel = document.getElementById("user-activity").value;
        state.profile.unitSystem = document.getElementById("unit-system").value;
        state.profile.startWeight = parseFloat(document.getElementById("start-weight").value);
        state.profile.targetWeight = parseFloat(document.getElementById("target-weight").value);
        state.profile.targetWaist = parseFloat(document.getElementById("target-waist").value);
        state.profile.macroDiet = document.getElementById("macro-diet-select").value;

        await saveState();
        showToast("บันทึกโปรไฟล์และการตั้งค่าสำเร็จ!", "success");
        switchTab("dashboard");
    });

    // Measurement log form submit
    document.getElementById("measurement-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const logId = document.getElementById("edit-id").value;
        const logDate = document.getElementById("log-date").value;
        
        // Check for duplicates on new entry
        if (!logId && state.logs.some(log => log.date === logDate)) {
            showToast("มีบันทึกของวันที่นี้อยู่แล้ว! กรุณาแก้ไขรายการเดิม", "error");
            return;
        }

        const newLog = {
            id: logId ? parseInt(logId) : Date.now(),
            date: logDate,
            weight: parseFloat(document.getElementById("log-weight").value),
            neck: parseFloat(document.getElementById("log-neck").value) || state.profile.neck || 33,
            chest: parseFloat(document.getElementById("log-chest").value) || 0,
            waist: parseFloat(document.getElementById("log-waist").value),
            hips: parseFloat(document.getElementById("log-hips").value) || 0,
            armLeft: parseFloat(document.getElementById("log-arm-left").value) || 0,
            armRight: parseFloat(document.getElementById("log-arm-right").value) || 0,
            thighLeft: parseFloat(document.getElementById("log-thigh-left").value) || 0,
            thighRight: parseFloat(document.getElementById("log-thigh-right").value) || 0,
            photo: currentUploadedPhotos.front || currentUploadedPhotos.side || currentUploadedPhotos.back || currentUploadedPhoto || null,
            photoFront: currentUploadedPhotos.front,
            photoSide: currentUploadedPhotos.side,
            photoBack: currentUploadedPhotos.back,
            photos: {
                front: currentUploadedPhotos.front,
                side: currentUploadedPhotos.side,
                back: currentUploadedPhotos.back
            },
            tags: [...currentSelectedTags],
            notes: document.getElementById("log-notes").value.trim()
        };

        if (logId) {
            const index = state.logs.findIndex(log => log.id === parseInt(logId));
            if (index !== -1) {
                const old = state.logs[index];
                if (!newLog.photoFront && (old.photoFront || old.photos?.front || old.photo)) {
                    newLog.photoFront = old.photoFront || old.photos?.front || old.photo;
                }
                if (!newLog.photoSide && (old.photoSide || old.photos?.side)) {
                    newLog.photoSide = old.photoSide || old.photos?.side;
                }
                if (!newLog.photoBack && (old.photoBack || old.photos?.back)) {
                    newLog.photoBack = old.photoBack || old.photos?.back;
                }
                newLog.photo = newLog.photoFront || newLog.photoSide || newLog.photoBack || null;
                newLog.photos = {
                    front: newLog.photoFront,
                    side: newLog.photoSide,
                    back: newLog.photoBack
                };
                state.logs[index] = newLog;
            }
        } else {
            state.logs.push(newLog);
        }

        // Sort chronologically
        state.logs.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        await saveState();
        showToast(logId ? "อัปเดตบันทึกสัดส่วนเรียบร้อย!" : "บันทึกข้อมูลสัดส่วนวันนี้สำเร็จ! 🎉", "success");
        resetLogForm();
        switchTab("dashboard");
    });
}

// Helper to retrieve photo for a specific angle from a log
function getLogPhoto(log, angle = 'front') {
    if (!log) return null;
    if (angle === 'front') {
        return log.photoFront || log.photos?.front || log.photo || null;
    } else if (angle === 'side') {
        return log.photoSide || log.photos?.side || null;
    } else if (angle === 'back') {
        return log.photoBack || log.photos?.back || null;
    }
    return null;
}
window.getLogPhoto = getLogPhoto;

// Reset the Log Entry form
function resetLogForm() {
    document.getElementById("measurement-form").reset();
    document.getElementById("edit-id").value = "";
    document.getElementById("log-date").value = new Date().toISOString().split('T')[0];
    document.getElementById("save-log-btn").textContent = "บันทึกข้อมูล";
    removeUploadedPhoto(); // clears all 3 angles
    
    // Clear tags
    currentSelectedTags = [];
    document.querySelectorAll(".tag-chip").forEach(c => c.classList.remove("active"));
}
window.resetLogForm = resetLogForm;

// Photo Upload Handler with Automatic Canvas Compression (supports front, side, back)
function handlePhotoUpload(event, angle = 'front') {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        showToast("กรุณาเลือกไฟล์รูปภาพเท่านั้น", "error");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const maxDim = 640;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxDim) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                }
            } else {
                if (height > maxDim) {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                }
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);

            const compressed = canvas.toDataURL("image/jpeg", 0.75);
            currentUploadedPhotos[angle] = compressed;
            currentUploadedPhoto = currentUploadedPhotos.front || currentUploadedPhotos.side || currentUploadedPhotos.back || compressed;

            const previewImg = document.getElementById(`photo-preview-img-${angle}`);
            const previewWrap = document.getElementById(`photo-preview-wrap-${angle}`);
            const dropzone = document.getElementById(`photo-dropzone-${angle}`);

            if (previewImg && previewWrap && dropzone) {
                previewImg.src = compressed;
                previewWrap.style.display = "block";
                dropzone.style.display = "none";
            }

            const angleLabels = { front: "ด้านหน้า", side: "ด้านข้าง", back: "ด้านหลัง" };
            showToast(`แนบรูป${angleLabels[angle] || ''}เรียบร้อย!`, "success");
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}
window.handlePhotoUpload = handlePhotoUpload;

// Remove uploaded photo in form (angle: 'front', 'side', 'back', or all)
function removeUploadedPhoto(angle) {
    if (angle) {
        currentUploadedPhotos[angle] = null;
        const fileInput = document.getElementById(`log-photo-${angle}`);
        const previewImg = document.getElementById(`photo-preview-img-${angle}`);
        const previewWrap = document.getElementById(`photo-preview-wrap-${angle}`);
        const dropzone = document.getElementById(`photo-dropzone-${angle}`);

        if (fileInput) fileInput.value = "";
        if (previewImg) previewImg.src = "";
        if (previewWrap) previewWrap.style.display = "none";
        if (dropzone) dropzone.style.display = "flex";
    } else {
        ['front', 'side', 'back'].forEach(a => removeUploadedPhoto(a));
    }
    currentUploadedPhoto = currentUploadedPhotos.front || currentUploadedPhotos.side || currentUploadedPhotos.back || null;
}
window.removeUploadedPhoto = removeUploadedPhoto;

// Switch Navigation Tab
function switchTab(tabId) {
    document.querySelectorAll(".tab-content").forEach(tab => {
        tab.classList.remove("active");
    });

    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.toggle("active", item.getAttribute("data-tab") === tabId);
    });

    document.querySelectorAll(".bottom-nav-item").forEach(item => {
        item.classList.toggle("active", item.getAttribute("data-tab") === tabId);
    });

    const targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.classList.add("active");
    }

    if (tabId === "dashboard") {
        renderCharts();
    } else if (tabId === "photos") {
        renderComparisonCard();
        renderPhotoGallery();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.switchTab = switchTab;

// Chart Time-Range Filter
window.setTimeRange = function(range) {
    currentFilter.timeRange = range;
    document.querySelectorAll("#time-filter-pills .filter-pill").forEach(btn => {
        btn.classList.toggle("active", btn.getAttribute("data-range") === range);
    });
    renderCharts();
};

// Chart Metric Filter
window.setMetricView = function(metric) {
    currentFilter.metricView = metric;
    document.querySelectorAll("#metric-filter-pills .filter-pill").forEach(btn => {
        btn.classList.toggle("active", btn.getAttribute("data-metric") === metric);
    });
    renderCharts();
};

// --- DAILY WATER TRACKER ---
function getTodayDateString() {
    return new Date().toISOString().split('T')[0];
}

window.addWater = async function(amount) {
    const today = getTodayDateString();
    const current = state.waterLogs[today] || 0;
    state.waterLogs[today] = Math.max(0, current + amount);
    await saveState();
    showToast(amount > 0 ? `+${amount} มล. เติมน้ำเรียบร้อย! 💧` : `${amount} มล. ปรับลดยอดน้ำ`, "info");
};

window.resetWater = async function() {
    if (confirm("ต้องการรีเซ็ตยอดการดื่มน้ำของวันนี้ใช่หรือไม่?")) {
        const today = getTodayDateString();
        state.waterLogs[today] = 0;
        await saveState();
        showToast("รีเซ็ตยอดดื่มน้ำของวันนี้แล้ว", "info");
    }
};

function updateWaterUI() {
    const today = getTodayDateString();
    const current = state.waterLogs[today] || 0;
    const target = state.profile.waterTarget || 2500;
    const pct = Math.min(100, Math.round((current / target) * 100));

    const amountEl = document.getElementById("water-current-amount");
    const pctEl = document.getElementById("water-pct-label");
    const barEl = document.getElementById("water-progress-fill");
    const adviceEl = document.getElementById("water-advice-msg");

    if (amountEl) amountEl.textContent = `${current.toLocaleString()} / ${target.toLocaleString()} มล.`;
    if (pctEl) pctEl.textContent = `${pct}% (${Math.round(current / 250)} / ${Math.round(target / 250)} แก้ว)`;
    if (barEl) barEl.style.width = `${pct}%`;

    if (adviceEl) {
        if (pct >= 100) {
            adviceEl.textContent = "🎉 ยอดเยี่ยมที่สุด! วันนี้คุณดื่มน้ำครบตามเป้าหมายแล้ว ร่างกายสดชื่นเต็มร้อย";
        } else if (pct >= 50) {
            adviceEl.textContent = `💧 ดื่มไปแล้ว ${pct}% อีกเพียง ${Math.round((target - current) / 250)} แก้วจะพิชิตเป้าหมาย!`;
        } else {
            adviceEl.textContent = "อย่าลืมจิบน้ำสม่ำเสมอระหว่างวัน เพื่อกระตุ้นการเผาผลาญไขมันและผิวพรรณสดใส";
        }
    }
}

// --- QUICK WEIGHT LOG MODAL ---
window.openQuickWeightModal = function() {
    const modal = document.getElementById("quick-weight-modal");
    if (!modal) return;

    document.getElementById("quick-log-date").value = getTodayDateString();
    
    // Pre-fill weight with latest log weight or startWeight
    const sortedLogs = [...state.logs].sort((a, b) => new Date(a.date) - new Date(b.date));
    const latest = sortedLogs[sortedLogs.length - 1];
    document.getElementById("quick-log-weight").value = latest ? latest.weight.toFixed(1) : state.profile.startWeight.toFixed(1);

    modal.style.display = "flex";
};

window.closeQuickWeightModal = function() {
    const modal = document.getElementById("quick-weight-modal");
    if (modal) modal.style.display = "none";
};

window.saveQuickWeight = async function(event) {
    event.preventDefault();
    const date = document.getElementById("quick-log-date").value;
    const weight = parseFloat(document.getElementById("quick-log-weight").value);

    if (!date || isNaN(weight) || weight <= 0) {
        showToast("กรุณากรอกน้ำหนักที่ถูกต้อง", "error");
        return;
    }

    // Collect quick tags
    const quickTags = [];
    document.querySelectorAll(".quick-tag-chip.active").forEach(chip => {
        quickTags.push(chip.getAttribute("data-tag"));
    });

    const existingIndex = state.logs.findIndex(l => l.date === date);

    if (existingIndex !== -1) {
        // Update existing log
        state.logs[existingIndex].weight = weight;
        if (quickTags.length > 0) {
            state.logs[existingIndex].tags = [...new Set([...(state.logs[existingIndex].tags || []), ...quickTags])];
        }
    } else {
        // Create new log (copy previous measurements so charts stay smooth)
        const sortedLogs = [...state.logs].sort((a, b) => new Date(a.date) - new Date(b.date));
        const prev = sortedLogs[sortedLogs.length - 1];

        const newLog = {
            id: Date.now(),
            date: date,
            weight: weight,
            neck: prev ? prev.neck : (state.profile.neck || 33),
            chest: prev ? prev.chest : 0,
            waist: prev ? prev.waist : (state.profile.targetWaist + 3),
            hips: prev ? prev.hips : 0,
            armLeft: prev ? prev.armLeft : 0,
            armRight: prev ? prev.armRight : 0,
            thighLeft: prev ? prev.thighLeft : 0,
            thighRight: prev ? prev.thighRight : 0,
            photo: null,
            tags: quickTags,
            notes: "บันทึกด่วนเฉพาะน้ำหนัก"
        };
        state.logs.push(newLog);
    }

    state.logs.sort((a, b) => new Date(a.date) - new Date(b.date));
    await saveState();

    closeQuickWeightModal();
    showToast(`บันทึกน้ำหนัก ${weight} กก. เรียบร้อย! ⚡`, "success");
};

// --- MACRO SPLIT CALCULATOR ---
window.changeMacroDiet = async function(dietType) {
    state.profile.macroDiet = dietType;
    await saveState();
};

function updateMacroUI(tdeeVal) {
    const dietType = state.profile.macroDiet || "balanced";
    document.getElementById("macro-diet-select").value = dietType;

    // Deficit calorie target (TDEE - 500 kcal, min 1200)
    const targetCalories = Math.max(1200, tdeeVal - 500);

    let pPct = 0.30, cPct = 0.40, fPct = 0.30;
    if (dietType === "high-protein") {
        pPct = 0.40; cPct = 0.35; fPct = 0.25;
    } else if (dietType === "low-carb") {
        pPct = 0.40; cPct = 0.20; fPct = 0.40;
    } else if (dietType === "keto") {
        pPct = 0.25; cPct = 0.05; fPct = 0.70;
    }

    // Grams calculation
    const proteinGrams = Math.round((targetCalories * pPct) / 4);
    const carbsGrams = Math.round((targetCalories * cPct) / 4);
    const fatGrams = Math.round((targetCalories * fPct) / 9);

    document.getElementById("macro-protein-g").textContent = `${proteinGrams}g`;
    document.getElementById("macro-protein-cal").textContent = `${Math.round(proteinGrams * 4)} kcal (${Math.round(pPct * 100)}%)`;

    document.getElementById("macro-carbs-g").textContent = `${carbsGrams}g`;
    document.getElementById("macro-carbs-cal").textContent = `${Math.round(carbsGrams * 4)} kcal (${Math.round(cPct * 100)}%)`;

    document.getElementById("macro-fat-g").textContent = `${fatGrams}g`;
    document.getElementById("macro-fat-cal").textContent = `${Math.round(fatGrams * 9)} kcal (${Math.round(fPct * 100)}%)`;

    // Ratio Bar
    document.getElementById("bar-carb").style.width = `${cPct * 100}%`;
    document.getElementById("bar-protein").style.width = `${pPct * 100}%`;
    document.getElementById("bar-fat").style.width = `${fPct * 100}%`;
}

// --- US NAVY BODY FAT % CALCULATION ---
function calculateBodyFatPercentage(log) {
    if (!log) return null;

    const isMetric = state.profile.unitSystem === 'metric';
    const heightCm = state.profile.height; // always in cm
    const gender = state.profile.gender || "female";

    // Convert measurements to cm for formula
    const neckCm = (log.neck || state.profile.neck || (isMetric ? 33 : 13)) * (isMetric ? 1 : 2.54);
    const waistCm = (log.waist || 80) * (isMetric ? 1 : 2.54);
    const hipsCm = (log.hips || 95) * (isMetric ? 1 : 2.54);

    let bf = 0;
    try {
        if (gender === "male") {
            const diff = waistCm - neckCm;
            if (diff > 0) {
                bf = 495 / (1.0324 - 0.19077 * Math.log10(diff) + 0.15456 * Math.log10(heightCm)) - 450;
            }
        } else {
            const diff = waistCm + hipsCm - neckCm;
            if (diff > 0) {
                bf = 495 / (1.29579 - 0.35004 * Math.log10(diff) + 0.22100 * Math.log10(heightCm)) - 450;
            }
        }
    } catch (e) {
        bf = 0;
    }

    if (isNaN(bf) || bf < 3 || bf > 65) return null;
    return parseFloat(bf.toFixed(1));
}

// --- MINI MILESTONES STEPPER ---
function updateMilestonesStepper(startW, currentW, targetW) {
    const stepperContainer = document.getElementById("milestones-stepper-track");
    if (!stepperContainer) return;

    const totalDiff = Math.abs(startW - targetW);
    if (totalDiff < 2) {
        stepperContainer.innerHTML = `<span style="color:var(--text-muted);font-size:0.8rem;">เป้าหมายใกล้เคียงกับน้ำหนักเริ่มต้น</span>`;
        return;
    }

    // Generate 4-5 checkpoints
    const stepsCount = 5;
    const stepDiff = (targetW - startW) / (stepsCount - 1);
    const checkpoints = [];

    for (let i = 0; i < stepsCount; i++) {
        const val = startW + (stepDiff * i);
        checkpoints.push(parseFloat(val.toFixed(1)));
    }

    let activeIndex = 0;
    let html = "";

    checkpoints.forEach((val, idx) => {
        let isCompleted = false;
        let isActive = false;

        if (startW > targetW) { // losing weight
            if (currentW <= val) {
                isCompleted = true;
            } else if (idx > 0 && currentW <= checkpoints[idx - 1] && currentW > val) {
                isActive = true;
                activeIndex = idx;
            }
        } else { // gaining weight
            if (currentW >= val) {
                isCompleted = true;
            } else if (idx > 0 && currentW >= checkpoints[idx - 1] && currentW < val) {
                isActive = true;
                activeIndex = idx;
            }
        }

        const statusClass = isCompleted ? "completed" : (isActive ? "active" : "locked");
        const icon = isCompleted ? "✓" : (isActive ? "🏃" : (idx === stepsCount - 1 ? "🏁" : `${idx + 1}`));

        html += `
            <div class="step-node ${statusClass}">
                <div class="step-circle">${icon}</div>
                <div class="step-label">${val} กก.</div>
            </div>
        `;
    });

    stepperContainer.innerHTML = html;

    const badgeEl = document.getElementById("stepper-active-badge");
    if (badgeEl) {
        if (currentW <= targetW && startW > targetW) {
            badgeEl.textContent = "🏆 พิชิตทุกด่านแล้ว!";
            badgeEl.style.background = "rgba(16,185,129,0.2)";
            badgeEl.style.color = "var(--success-emerald)";
        } else {
            const nextTarget = checkpoints[activeIndex || 1];
            const toGo = Math.abs(currentW - nextTarget).toFixed(1);
            badgeEl.textContent = `ด่านที่ ${activeIndex || 1}: อีก ${toGo} กก.`;
        }
    }
}

// --- MEASUREMENT MATRIX COMPARISON TABLE ---
function renderMeasurementMatrix(sortedLogs, latestLog) {
    const tbody = document.getElementById("matrix-table-body");
    if (!tbody) return;

    if (!latestLog || sortedLogs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:1.5rem;">ยังไม่มีข้อมูลสถิติเพื่อเปรียบเทียบ</td></tr>`;
        return;
    }

    const firstLog = sortedLogs[0];
    const prevLog = sortedLogs.length >= 2 ? sortedLogs[sortedLogs.length - 2] : null;
    const mUnit = state.profile.unitSystem === 'metric' ? 'ซม.' : 'นิ้ว';

    const firstBF = calculateBodyFatPercentage(firstLog);
    const prevBF = prevLog ? calculateBodyFatPercentage(prevLog) : null;
    const currBF = calculateBodyFatPercentage(latestLog);

    const metrics = [
        { label: "น้ำหนักตัว", key: "weight", unit: "กก.", start: firstLog.weight, prev: prevLog ? prevLog.weight : null, curr: latestLog.weight, lowerBetter: true },
        { label: "รอบเอว", key: "waist", unit: mUnit, start: firstLog.waist, prev: prevLog ? prevLog.waist : null, curr: latestLog.waist, lowerBetter: true },
        { label: "รอบอก", key: "chest", unit: mUnit, start: firstLog.chest || 0, prev: prevLog ? prevLog.chest : null, curr: latestLog.chest || 0, lowerBetter: true },
        { label: "รอบสะโพก", key: "hips", unit: mUnit, start: firstLog.hips || 0, prev: prevLog ? prevLog.hips : null, curr: latestLog.hips || 0, lowerBetter: true },
        { label: "ต้นแขนซ้าย", key: "armLeft", unit: mUnit, start: firstLog.armLeft || 0, prev: prevLog ? prevLog.armLeft : null, curr: latestLog.armLeft || 0, lowerBetter: true },
        { label: "ต้นขาซ้าย", key: "thighLeft", unit: mUnit, start: firstLog.thighLeft || 0, prev: prevLog ? prevLog.thighLeft : null, curr: latestLog.thighLeft || 0, lowerBetter: true },
        { label: "% ไขมันในร่างกาย", key: "bf", unit: "%", start: firstBF, prev: prevBF, curr: currBF, lowerBetter: true }
    ];

    let html = "";
    metrics.forEach(m => {
        if (!m.curr && m.curr !== 0) return;

        const totalDiff = (m.curr && m.start) ? (m.curr - m.start) : null;
        let deltaHtml = `<span class="delta-badge delta-zero">━ 0</span>`;

        if (totalDiff !== null && !isNaN(totalDiff)) {
            const formatted = totalDiff > 0 ? `+${totalDiff.toFixed(1)}` : totalDiff.toFixed(1);
            if (totalDiff === 0) {
                deltaHtml = `<span class="delta-badge delta-zero">━ คงที่</span>`;
            } else {
                const isGood = m.lowerBetter ? totalDiff < 0 : totalDiff > 0;
                const arrow = totalDiff < 0 ? "▼" : "▲";
                deltaHtml = `<span class="delta-badge ${isGood ? 'delta-good' : 'delta-bad'}">${arrow} ${formatted} ${m.unit}</span>`;
            }
        }

        html += `
            <tr>
                <td><strong>${m.label}</strong></td>
                <td>${m.start ? `${m.start.toFixed(1)} ${m.unit}` : '--'}</td>
                <td>${m.prev ? `${m.prev.toFixed(1)} ${m.unit}` : '--'}</td>
                <td><strong style="color:var(--text-primary);">${m.curr.toFixed(1)} ${m.unit}</strong></td>
                <td>${deltaHtml}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// --- WEEKLY SUMMARY REPORT MODAL ---
window.openWeeklyReportModal = function() {
    const modal = document.getElementById("weekly-report-modal");
    if (!modal) return;

    const sortedLogs = [...state.logs].sort((a, b) => new Date(a.date) - new Date(b.date));
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(now.getDate() - 7);

    const weekLogs = sortedLogs.filter(l => new Date(l.date) >= cutoff);
    const daysLogged = weekLogs.length;

    // Weight change in last 7 days
    let weightChangeStr = "0.0 กก.";
    if (weekLogs.length >= 2) {
        const diff = weekLogs[weekLogs.length - 1].weight - weekLogs[0].weight;
        weightChangeStr = diff > 0 ? `+${diff.toFixed(1)} กก.` : `${diff.toFixed(1)} กก.`;
    } else if (sortedLogs.length >= 2) {
        const diff = sortedLogs[sortedLogs.length - 1].weight - sortedLogs[sortedLogs.length - 2].weight;
        weightChangeStr = diff > 0 ? `+${diff.toFixed(1)} กก.` : `${diff.toFixed(1)} กก.`;
    }

    // Weekly water total
    let totalWaterWeek = 0;
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        totalWaterWeek += (state.waterLogs[dStr] || 0);
    }

    // Grade logic
    let grade = "A+";
    let message = "วินัยดีเยี่ยมมาก! ทำสถิติได้อย่างน่าประทับใจ สุขภาพและรูปร่างที่ดีขึ้นอยู่ในมือคุณแล้วครับ";
    if (daysLogged >= 5) {
        grade = "A+";
    } else if (daysLogged >= 3) {
        grade = "A";
        message = "เก่งมากครับ รักษาระดับความต่อเนื่องไว้นะครับ สัปดาห์หน้าเพิ่มความสม่ำเสมออีกนิดจะยอดเยี่ยมเลย";
    } else {
        grade = "B";
        message = "ก้าวเล็กๆ ในแต่ละวันจะนำไปสู่ความสำเร็จใหญ่ มาตั้งเป้าบันทึกให้ครบ 5 วันในสัปดาห์หน้านะครับ!";
    }

    document.getElementById("weekly-grade").textContent = grade;
    document.getElementById("weekly-weight-change").textContent = weightChangeStr;
    document.getElementById("weekly-days-logged").textContent = `${daysLogged} / 7 วัน`;
    document.getElementById("weekly-water-total").textContent = `${(totalWaterWeek / 1000).toFixed(1)} ลิตร`;
    document.getElementById("weekly-streak-val").textContent = document.getElementById("stat-streak").textContent;
    document.getElementById("weekly-advice-text").textContent = message;

    modal.style.display = "flex";
};

window.closeWeeklyReportModal = function() {
    const modal = document.getElementById("weekly-report-modal");
    if (modal) modal.style.display = "none";
};

window.downloadWeeklyReportCard = function() {
    const canvas = document.getElementById("weekly-card-canvas");
    canvas.width = 600;
    canvas.height = 780;
    const ctx = canvas.getContext("2d");

    // Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 600, 780);
    bgGrad.addColorStop(0, "#064e3b");
    bgGrad.addColorStop(0.5, "#0f172a");
    bgGrad.addColorStop(1, "#020617");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 600, 780);

    // Border
    ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, 560, 740);

    // Title
    ctx.textAlign = "center";
    ctx.fillStyle = "#34d399";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText("BodyFit Weekly Report", 300, 80);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "16px sans-serif";
    ctx.fillText(`สรุปผลประจำสัปดาห์ • คุณ ${state.profile.name}`, 300, 110);

    // Big Grade Circle
    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    ctx.arc(300, 185, 50, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 44px sans-serif";
    ctx.fillText(document.getElementById("weekly-grade").textContent, 300, 200);

    // 4 Stats Boxes
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.fillRect(50, 260, 235, 110);
    ctx.fillRect(315, 260, 235, 110);
    ctx.fillRect(50, 390, 235, 110);
    ctx.fillRect(315, 390, 235, 110);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.strokeRect(50, 260, 235, 110);
    ctx.strokeRect(315, 260, 235, 110);
    ctx.strokeRect(50, 390, 235, 110);
    ctx.strokeRect(315, 390, 235, 110);

    // Fill Box Texts
    ctx.font = "14px sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("การเปลี่ยนแปลงน้ำหนัก", 167, 295);
    ctx.fillText("จำนวนวันที่บันทึก", 432, 295);
    ctx.fillText("ปริมาณน้ำที่ดื่มรวม", 167, 425);
    ctx.fillText("วินัยต่อเนื่อง (Streak)", 432, 425);

    ctx.font = "bold 24px sans-serif";
    ctx.fillStyle = "#10b981";
    ctx.fillText(document.getElementById("weekly-weight-change").textContent, 167, 340);
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(document.getElementById("weekly-days-logged").textContent, 432, 340);
    ctx.fillStyle = "#06b6d4";
    ctx.fillText(document.getElementById("weekly-water-total").textContent, 167, 470);
    ctx.fillStyle = "#f59e0b";
    ctx.fillText(document.getElementById("weekly-streak-val").textContent, 432, 470);

    // Message box
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.fillRect(50, 520, 500, 140);
    ctx.strokeRect(50, 520, 500, 140);

    ctx.font = "bold 18px sans-serif";
    ctx.fillStyle = "#f0fdf4";
    ctx.fillText("💡 คำแนะนำสำหรับสัปดาห์นี้", 300, 560);

    ctx.font = "15px sans-serif";
    ctx.fillStyle = "#cbd5e1";
    const msg = document.getElementById("weekly-advice-text").textContent;
    ctx.fillText(msg.length > 50 ? msg.substring(0, 48) + "..." : msg, 300, 605);

    // Footer
    ctx.font = "14px sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText("⚡ สุขภาพดีเริ่มต้นที่ตัวเรา • BodyFit Tracker", 300, 715);

    const link = document.createElement("a");
    link.download = `bodyfit_weekly_${getTodayDateString()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    showToast("บันทึกการ์ดสรุปสัปดาห์เรียบร้อย!", "success");
};

// --- MAIN UI UPDATER ---
function updateUI() {
    // Header & User Info
    document.getElementById("sidebar-name").textContent = state.profile.name;
    document.getElementById("sidebar-goal").textContent = `เป้าหมาย: ${state.profile.targetWeight} กก.`;
    document.getElementById("sidebar-avatar").textContent = state.profile.name.charAt(0).toUpperCase();
    document.getElementById("welcome-message").textContent = `สวัสดี, ${state.profile.name} 👋`;

    document.getElementById("profile-avatar").textContent = state.profile.name.charAt(0).toUpperCase();
    document.getElementById("profile-display-name").textContent = state.profile.name;

    const sortedLogs = [...state.logs].sort((a, b) => new Date(a.date) - new Date(b.date));
    const latestLog = sortedLogs[sortedLogs.length - 1];
    const previousLog = sortedLogs[sortedLogs.length - 2];

    updateUnitLabels();

    // Latest Metrics
    if (latestLog) {
        document.getElementById("metric-weight").textContent = latestLog.weight.toFixed(1);
        document.getElementById("metric-waist").textContent = latestLog.waist.toFixed(1);
        document.getElementById("metric-chest").textContent = latestLog.chest ? latestLog.chest.toFixed(1) : "--";
        document.getElementById("metric-hips").textContent = latestLog.hips ? latestLog.hips.toFixed(1) : "--";

        const mUnit = state.profile.unitSystem === 'metric' ? 'ซม.' : 'นิ้ว';
        updateChangeIndicator("weight", latestLog.weight, previousLog ? previousLog.weight : null, "กก.", true);
        updateChangeIndicator("waist", latestLog.waist, previousLog ? previousLog.waist : null, mUnit, true);
        updateChangeIndicator("chest", latestLog.chest, previousLog ? previousLog.chest : null, mUnit, true);
        updateChangeIndicator("hips", latestLog.hips, previousLog ? previousLog.hips : null, mUnit, true);
    } else {
        document.getElementById("metric-weight").textContent = "--";
        document.getElementById("metric-waist").textContent = "--";
        document.getElementById("metric-chest").textContent = "--";
        document.getElementById("metric-hips").textContent = "--";
    }

    // Motivation Banner & Projection
    updateMotivationBanner(sortedLogs, latestLog);

    // Goal Progress & Mini-Milestones
    updateGoalProgress(latestLog);

    // Health, BMR, TDEE, & Body Fat %
    const tdeeVal = updateCalculators(latestLog);

    // Macros
    updateMacroUI(tdeeVal);

    // Water Tracker
    updateWaterUI();

    // Measurement Matrix Table
    renderMeasurementMatrix(sortedLogs, latestLog);

    // Milestones & Badges
    renderBadges(sortedLogs, latestLog);

    // History Table
    renderHistoryTable();

    // Charts
    renderCharts();
}

// Update Motivation Banner: Streak, Total Lost, Estimated Date
function updateMotivationBanner(sortedLogs, latestLog) {
    if (!latestLog || sortedLogs.length === 0) {
        document.getElementById("stat-streak").textContent = "0 วัน";
        document.getElementById("stat-total-lost").textContent = "0.0 กก.";
        document.getElementById("stat-estimated-date").textContent = "รอการบันทึกแรก";
        return;
    }

    // Streak
    let streak = 1;
    const dates = sortedLogs.map(l => new Date(l.date).setHours(0, 0, 0, 0));
    const uniqueDates = [...new Set(dates)].sort((a, b) => b - a);

    for (let i = 0; i < uniqueDates.length - 1; i++) {
        const diffDays = Math.round((uniqueDates[i] - uniqueDates[i + 1]) / (1000 * 60 * 60 * 24));
        if (diffDays <= 2) {
            streak++;
        } else {
            break;
        }
    }
    document.getElementById("stat-streak").textContent = `${streak} วันต่อเนื่อง`;

    // Total Loss
    const startWeight = state.profile.startWeight;
    const currentWeight = latestLog.weight;
    const totalDiff = startWeight - currentWeight;
    
    if (totalDiff > 0) {
        document.getElementById("stat-total-lost").textContent = `-${totalDiff.toFixed(1)} กก.`;
    } else if (totalDiff < 0) {
        document.getElementById("stat-total-lost").textContent = `+${Math.abs(totalDiff).toFixed(1)} กก.`;
    } else {
        document.getElementById("stat-total-lost").textContent = `0.0 กก.`;
    }

    // Projection
    const targetWeight = state.profile.targetWeight;
    const remainingWeight = currentWeight - targetWeight;

    if (remainingWeight <= 0) {
        document.getElementById("stat-estimated-date").textContent = "🎉 ถึงเป้าหมายแล้ว!";
        document.getElementById("goal-advice-text").textContent = "ยินดีด้วยครับ! คุณบรรลุน้ำหนักเป้าหมายแล้ว รักษาสุขภาพและรูปร่างที่ดีนี้ไว้นะครับ";
    } else if (sortedLogs.length >= 2 && totalDiff > 0) {
        const firstLogDate = new Date(sortedLogs[0].date);
        const lastLogDate = new Date(latestLog.date);
        const daySpan = Math.max(1, Math.round((lastLogDate - firstLogDate) / (1000 * 60 * 60 * 24)));
        const lossPerDay = totalDiff / daySpan;

        if (lossPerDay > 0.01) {
            const daysNeeded = Math.round(remainingWeight / lossPerDay);
            const estDate = new Date();
            estDate.setDate(estDate.getDate() + daysNeeded);
            const estDateStr = estDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
            document.getElementById("stat-estimated-date").textContent = `${estDateStr} (อีก ~${daysNeeded} วัน)`;
            document.getElementById("goal-advice-text").textContent = `คุณลดได้เฉลี่ย ${(lossPerDay * 7).toFixed(1)} กก./สัปดาห์ หากรักษาระดับนี้จะถึงเป้าหมายใน ${estDateStr}!`;
        } else {
            document.getElementById("stat-estimated-date").textContent = "เดินหน้าอย่างสม่ำเสมอ";
        }
    } else {
        document.getElementById("stat-estimated-date").textContent = "บันทึกต่อเนื่องเพื่อคำนวณ";
    }
}

// Calculate and show goal progress bars & stepper
function updateGoalProgress(latestLog) {
    const startW = state.profile.startWeight;
    const targetW = state.profile.targetWeight;
    const currentW = latestLog ? latestLog.weight : startW;
    const measureUnit = state.profile.unitSystem === 'metric' ? 'ซม.' : 'นิ้ว';

    const weightTotalDiff = Math.abs(startW - targetW);
    let weightPct = 0;
    if (weightTotalDiff > 0) {
        if (currentW <= startW && targetW < startW) {
            weightPct = ((startW - currentW) / weightTotalDiff) * 100;
        } else if (currentW >= startW && targetW > startW) {
            weightPct = ((currentW - startW) / weightTotalDiff) * 100;
        }
    }
    weightPct = Math.min(Math.max(weightPct, 0), 100);
    document.getElementById("goal-weight-bar").style.width = `${weightPct}%`;
    document.getElementById("goal-weight-text").textContent = `${currentW.toFixed(1)} / ${targetW.toFixed(1)} กก. (${weightPct.toFixed(0)}%)`;

    // Waist progress
    const startWaist = state.logs[0] ? state.logs[0].waist : (state.profile.targetWaist + 4);
    const targetWaist = state.profile.targetWaist;
    const currentWaist = latestLog ? latestLog.waist : startWaist;

    const waistTotalDiff = Math.abs(startWaist - targetWaist);
    let waistPct = 0;
    if (waistTotalDiff > 0 && currentWaist <= startWaist) {
        waistPct = ((startWaist - currentWaist) / waistTotalDiff) * 100;
    }
    waistPct = Math.min(Math.max(waistPct, 0), 100);
    document.getElementById("goal-waist-bar").style.width = `${waistPct}%`;
    document.getElementById("goal-waist-text").textContent = `${currentWaist.toFixed(1)} / ${targetWaist.toFixed(1)} ${measureUnit} (${waistPct.toFixed(0)}%)`;

    // Mini Milestones Stepper
    updateMilestonesStepper(startW, currentW, targetW);
}

// Indicator delta changes
function updateChangeIndicator(metricId, currentVal, prevVal, unit, lowerIsBetter = true) {
    const indicatorEl = document.getElementById(`change-${metricId}`);
    if (!indicatorEl) return;

    if (prevVal === null || prevVal === undefined || currentVal === null || currentVal === undefined || prevVal === 0) {
        indicatorEl.innerHTML = `<span class="change-neutral">━ ไม่มีข้อมูลก่อนหน้า</span>`;
        return;
    }

    const diff = currentVal - prevVal;
    const formattedDiff = diff > 0 ? `+${diff.toFixed(1)}` : `${diff.toFixed(1)}`;
    
    if (diff === 0) {
        indicatorEl.innerHTML = `<span class="change-neutral">━ คงที่</span>`;
    } else {
        const isImprovement = (diff < 0 && lowerIsBetter) || (diff > 0 && !lowerIsBetter);
        const arrow = diff > 0 ? '▲' : '▼';
        const textClass = isImprovement ? 'change-down' : 'change-up';
        indicatorEl.innerHTML = `<span class="${textClass}">${arrow} ${formattedDiff} ${unit}</span>`;
    }
}

// Metabolism Calculators (BMI, WHR, BMR, TDEE, Body Fat %, Deficit, Protein)
function updateCalculators(latestLog) {
    if (!latestLog) {
        ["calc-bmi", "calc-whr", "calc-bmr", "calc-tdee", "calc-deficit-cal", "calc-protein", "calc-body-fat", "calc-lean-mass"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = "--";
        });
        return 1800;
    }

    const weightKg = latestLog.weight;
    const heightCm = state.profile.height;
    const age = state.profile.age || 28;
    const gender = state.profile.gender || "female";
    const activity = state.profile.activityLevel || "light";

    // 1. BMI: Weight (kg) / Height (m)^2
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    document.getElementById("calc-bmi").textContent = bmi.toFixed(1);

    let bmiStatus = "ปกติ";
    let bmiClass = "status-normal";
    if (bmi < 18.5) {
        bmiStatus = "น้ำหนักน้อย / ผอม";
        bmiClass = "status-warning";
    } else if (bmi >= 23 && bmi < 25) {
        bmiStatus = "น้ำหนักเกิน (ท้วม)";
        bmiClass = "status-warning";
    } else if (bmi >= 25) {
        bmiStatus = "อ้วน";
        bmiClass = "status-danger";
    }
    const bmiStatusEl = document.getElementById("calc-bmi-status");
    bmiStatusEl.textContent = bmiStatus;
    bmiStatusEl.className = `calc-status ${bmiClass}`;

    // 2. WHR: Waist / Hips
    if (latestLog.waist && latestLog.hips) {
        const whr = latestLog.waist / latestLog.hips;
        document.getElementById("calc-whr").textContent = whr.toFixed(2);

        const threshold = gender === "male" ? 0.90 : 0.85;
        let whrStatus = whr > threshold ? "ความเสี่ยงสูงต่อสุขภาพ" : "ความเสี่ยงต่ำ";
        let whrClass = whr > threshold ? "status-danger" : "status-normal";

        const whrStatusEl = document.getElementById("calc-whr-status");
        whrStatusEl.textContent = whrStatus;
        whrStatusEl.className = `calc-status ${whrClass}`;
    } else {
        document.getElementById("calc-whr").textContent = "--";
        document.getElementById("calc-whr-status").textContent = "รอรอบสะโพก";
        document.getElementById("calc-whr-status").className = "calc-status";
    }

    // 3. BMR (Mifflin-St Jeor Equation)
    let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
    if (gender === "male") {
        bmr += 5;
    } else {
        bmr -= 161;
    }
    const bmrVal = Math.round(bmr);
    document.getElementById("calc-bmr").textContent = bmrVal;

    // 4. TDEE
    const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725
    };
    const multiplier = activityMultipliers[activity] || 1.375;
    const tdeeVal = Math.round(bmrVal * multiplier);
    document.getElementById("calc-tdee").textContent = tdeeVal;

    // 5. Calorie Target
    const deficitTarget = Math.max(1200, tdeeVal - 500);
    document.getElementById("calc-deficit-cal").textContent = deficitTarget;

    // 6. Protein Target
    const proteinTarget = Math.round(weightKg * 1.6);
    document.getElementById("calc-protein").textContent = `${proteinTarget}g`;

    // 7. US Navy Body Fat % & Lean Mass
    const bfPct = calculateBodyFatPercentage(latestLog);
    const bfEl = document.getElementById("calc-body-fat");
    const bfStatusEl = document.getElementById("calc-body-fat-status");
    const leanEl = document.getElementById("calc-lean-mass");

    if (bfPct !== null) {
        if (bfEl) bfEl.textContent = `${bfPct}%`;

        // Body Fat Status
        let bfLabel = "มาตรฐาน";
        let bfBadgeClass = "status-normal";
        if (gender === "male") {
            if (bfPct < 10) { bfLabel = "นักกีฬา (Athletic)"; bfBadgeClass = "status-normal"; }
            else if (bfPct <= 15) { bfLabel = "ฟิตเนส (Fitness)"; bfBadgeClass = "status-normal"; }
            else if (bfPct <= 22) { bfLabel = "มาตรฐาน (Average)"; bfBadgeClass = "status-normal"; }
            else { bfLabel = "ไขมันเกิน (Above)"; bfBadgeClass = "status-danger"; }
        } else {
            if (bfPct < 18) { bfLabel = "นักกีฬา (Athletic)"; bfBadgeClass = "status-normal"; }
            else if (bfPct <= 24) { bfLabel = "ฟิตเนส (Fitness)"; bfBadgeClass = "status-normal"; }
            else if (bfPct <= 31) { bfLabel = "มาตรฐาน (Average)"; bfBadgeClass = "status-normal"; }
            else { bfLabel = "ไขมันเกิน (Above)"; bfBadgeClass = "status-danger"; }
        }

        if (bfStatusEl) {
            bfStatusEl.textContent = bfLabel;
            bfStatusEl.className = `calc-status ${bfBadgeClass}`;
        }

        const fatMass = weightKg * (bfPct / 100);
        const leanMass = weightKg - fatMass;
        if (leanEl) leanEl.textContent = `${leanMass.toFixed(1)} กก.`;
    } else {
        if (bfEl) bfEl.textContent = "--";
        if (bfStatusEl) {
            bfStatusEl.textContent = "แตะเพื่อใส่รอบคอ";
            bfStatusEl.className = "calc-status";
        }
        if (leanEl) leanEl.textContent = "--";
    }

    return tdeeVal;
}

// Render Milestones & Badges
function renderBadges(sortedLogs, latestLog) {
    const container = document.getElementById("badges-grid");
    if (!container) return;

    const startW = state.profile.startWeight;
    const currentW = latestLog ? latestLog.weight : startW;
    const minWeight = sortedLogs.length > 0 ? Math.min(...sortedLogs.map(l => l.weight)) : startW;
    const totalLost = startW - minWeight;

    const badges = [
        { icon: "🚀", title: "ก้าวแรกสู่ความฟิต", desc: "เริ่มบันทึกสัดส่วนแรก", unlocked: sortedLogs.length >= 1 },
        { icon: "🔥", title: "วินัย 7 วัน", desc: "มีบันทึกสะสมอย่างน้อย 7 ครั้ง", unlocked: sortedLogs.length >= 7 },
        { icon: "🎯", title: "พิชิต 1 กิโลแรก", desc: "ลดน้ำหนักได้ 1 กก.", unlocked: totalLost >= 1.0 },
        { icon: "🌟", title: "ลดได้ 3 กิโลกรัม", desc: "พัฒนาอย่างก้าวกระโดด", unlocked: totalLost >= 3.0 },
        { icon: "🏆", title: "ลดได้ 5 กิโลกรัม", desc: "การเปลี่ยนแปลงชัดเจน", unlocked: totalLost >= 5.0 },
        { icon: "👗", title: "เอวกระชับลง", desc: "รอบเอวลดได้สำเร็จ", unlocked: sortedLogs.length >= 2 && latestLog && (sortedLogs[0].waist - latestLog.waist) >= 1.0 },
        { icon: "💧", title: "เซียนดื่มน้ำ", desc: "ดื่มน้ำเกิน 2.5 ลิตรใน 1 วัน", unlocked: Object.values(state.waterLogs).some(w => w >= 2500) },
        { icon: "👑", title: "พิชิตเป้าหมาย", desc: "ถึงน้ำหนักเป้าหมายที่ตั้งไว้", unlocked: latestLog && currentW <= state.profile.targetWeight }
    ];

    container.innerHTML = badges.map(b => `
        <div class="badge-item ${b.unlocked ? 'unlocked' : 'locked'}">
            <div class="badge-icon">${b.icon}</div>
            <div class="badge-title">${b.title}</div>
            <div class="badge-desc">${b.desc}</div>
        </div>
    `).join("");
}

// Render Historical log entries to table
function renderHistoryTable() {
    const tbody = document.getElementById("history-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (state.logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 2rem;">ยังไม่มีข้อมูลสัดส่วนที่บันทึกไว้</td></tr>`;
        return;
    }

    const displayLogs = [...state.logs].sort((a, b) => new Date(b.date) - new Date(a.date));

    displayLogs.forEach(log => {
        const dateObj = new Date(log.date);
        const formattedDate = dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

        const armText = (log.armLeft || log.armRight) ? `${log.armLeft.toFixed(1)} / ${log.armRight.toFixed(1)}` : "--";
        const thighText = (log.thighLeft || log.thighRight) ? `${log.thighLeft.toFixed(1)} / ${log.thighRight.toFixed(1)}` : "--";

        const pF = getLogPhoto(log, 'front');
        const pS = getLogPhoto(log, 'side');
        const pB = getLogPhoto(log, 'back');

        let photoHtml = "";
        if (pF || pS || pB) {
            photoHtml = '<div class="tbl-thumb-group">';
            if (pF) photoHtml += `<div class="tbl-thumb-item" onclick="viewPhotoFullscreen('${pF}')" title="ด้านหน้า (Front)"><img src="${pF}" alt="หน้า"><span class="tbl-thumb-tag">F</span></div>`;
            if (pS) photoHtml += `<div class="tbl-thumb-item" onclick="viewPhotoFullscreen('${pS}')" title="ด้านข้าง (Side)"><img src="${pS}" alt="ข้าง"><span class="tbl-thumb-tag">S</span></div>`;
            if (pB) photoHtml += `<div class="tbl-thumb-item" onclick="viewPhotoFullscreen('${pB}')" title="ด้านหลัง (Back)"><img src="${pB}" alt="หลัง"><span class="tbl-thumb-tag">B</span></div>`;
            photoHtml += '</div>';
        } else {
            photoHtml = `<span style="color: var(--text-muted); font-size: 0.8rem;">-</span>`;
        }

        const tagsHtml = (log.tags && log.tags.length > 0)
            ? `<div class="tbl-tags">${log.tags.map(t => `<span class="tbl-tag-pill">${t}</span>`).join("")}</div>`
            : "";
        const noteHtml = log.notes ? `<div class="tbl-notes" title="${log.notes}">${log.notes}</div>` : "";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${formattedDate}</td>
            <td>${photoHtml}</td>
            <td><strong>${log.weight.toFixed(1)}</strong></td>
            <td><strong>${log.waist ? log.waist.toFixed(1) : '--'}</strong></td>
            <td>${log.chest ? log.chest.toFixed(1) : "--"} / ${log.hips ? log.hips.toFixed(1) : "--"}</td>
            <td>${armText}</td>
            <td>${thighText}</td>
            <td>${tagsHtml}${noteHtml || (!tagsHtml ? '<span style="color: var(--text-muted); font-size: 0.8rem;">-</span>' : '')}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon edit-btn" onclick="editLog(${log.id})" title="แก้ไข">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="btn-icon delete-btn" onclick="deleteLog(${log.id})" title="ลบ">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Edit Log Entry
window.editLog = function(logId) {
    const log = state.logs.find(l => l.id === logId);
    if (!log) return;

    document.getElementById("edit-id").value = log.id;
    document.getElementById("log-date").value = log.date;
    document.getElementById("log-weight").value = log.weight;
    document.getElementById("log-neck").value = log.neck || state.profile.neck || "";
    document.getElementById("log-chest").value = log.chest || "";
    document.getElementById("log-waist").value = log.waist || "";
    document.getElementById("log-hips").value = log.hips || "";
    document.getElementById("log-arm-left").value = log.armLeft || "";
    document.getElementById("log-arm-right").value = log.armRight || "";
    document.getElementById("log-thigh-left").value = log.thighLeft || "";
    document.getElementById("log-thigh-right").value = log.thighRight || "";
    document.getElementById("log-notes").value = log.notes || "";

    currentSelectedTags = log.tags ? [...log.tags] : [];
    document.querySelectorAll(".tag-chip").forEach(chip => {
        const tag = chip.getAttribute("data-tag");
        chip.classList.toggle("active", currentSelectedTags.includes(tag));
    });

    // Populate all 3 angle photo slots
    removeUploadedPhoto(); // reset slots first

    const pFront = getLogPhoto(log, 'front');
    const pSide = getLogPhoto(log, 'side');
    const pBack = getLogPhoto(log, 'back');

    if (pFront) {
        currentUploadedPhotos.front = pFront;
        const img = document.getElementById("photo-preview-img-front");
        const wrap = document.getElementById("photo-preview-wrap-front");
        const dz = document.getElementById("photo-dropzone-front");
        if (img && wrap && dz) { img.src = pFront; wrap.style.display = "block"; dz.style.display = "none"; }
    }
    if (pSide) {
        currentUploadedPhotos.side = pSide;
        const img = document.getElementById("photo-preview-img-side");
        const wrap = document.getElementById("photo-preview-wrap-side");
        const dz = document.getElementById("photo-dropzone-side");
        if (img && wrap && dz) { img.src = pSide; wrap.style.display = "block"; dz.style.display = "none"; }
    }
    if (pBack) {
        currentUploadedPhotos.back = pBack;
        const img = document.getElementById("photo-preview-img-back");
        const wrap = document.getElementById("photo-preview-wrap-back");
        const dz = document.getElementById("photo-dropzone-back");
        if (img && wrap && dz) { img.src = pBack; wrap.style.display = "block"; dz.style.display = "none"; }
    }

    document.getElementById("save-log-btn").textContent = "อัปเดตบันทึกสัดส่วน";
    switchTab("log-entry");
    showToast("กรอกข้อมูลเดิมลงในแบบฟอร์มแล้ว สามารถแก้ไขได้เลยครับ", "info");
};

// Delete Log Entry
window.deleteLog = async function(logId) {
    if (confirm("คุณแน่ใจหรือไม่ที่จะลบรายการบันทึกนี้?")) {
        state.logs = state.logs.filter(l => l.id !== logId);
        await saveState();
        showToast("ลบรายการบันทึกเรียบร้อยแล้ว", "success");
    }
};

// View Photo Fullscreen
window.viewPhotoFullscreen = function(photoUrl) {
    const w = window.open("");
    w.document.write(`<body style="margin:0;background:#090d16;display:flex;align-items:center;justify-content:center;height:100vh;"><img src="${photoUrl}" style="max-width:95vw;max-height:95vh;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.8);"></body>`);
};

// Change handler when Current Log selector changes
window.onAfterLogChange = function() {
    const beforeSelect = document.getElementById("before-photo-select");
    const afterSelect = document.getElementById("after-photo-select");
    if (!beforeSelect || !afterSelect) return;

    const currentId = afterSelect.value;
    const sortedLogs = [...state.logs].sort((a, b) => new Date(a.date) - new Date(b.date));
    const currIdx = sortedLogs.findIndex(l => l.id.toString() === currentId);

    if (currIdx > 0) {
        beforeSelect.value = sortedLogs[currIdx - 1].id.toString();
    } else {
        beforeSelect.value = "profile_start";
    }
    renderComparisonCard();
};

// Visual Comparison & Transformation Card Rendering (3 Angles + Body Measurements)
function renderComparisonCard() {
    const container = document.getElementById("comparison-card-preview");
    const noPhotoAlert = document.getElementById("no-photo-alert");
    const beforeSelect = document.getElementById("before-photo-select");
    const afterSelect = document.getElementById("after-photo-select");

    const sortedLogs = [...state.logs].sort((a, b) => new Date(a.date) - new Date(b.date));

    if (sortedLogs.length === 0) {
        if (container) container.innerHTML = "";
        if (noPhotoAlert) {
            noPhotoAlert.style.display = "block";
            noPhotoAlert.innerHTML = `<span>📷 ยังไม่มีประวัติการบันทึก กรุณาเพิ่มบันทึกสัดส่วนหรือรูปถ่ายที่แท็บ "บันทึกข้อมูล"</span>`;
        }
        const selectors = document.querySelector(".compare-selectors");
        if (selectors) selectors.style.display = "none";
        return;
    }

    if (noPhotoAlert) noPhotoAlert.style.display = "none";
    const selectors = document.querySelector(".compare-selectors");
    if (selectors) selectors.style.display = "flex";

    const prevBeforeVal = beforeSelect.value;
    const prevAfterVal = afterSelect.value;

    const afterOptionsHtml = sortedLogs.map(l => {
        const d = new Date(l.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
        const hasPhoto = !!(l.photoFront || l.photoSide || l.photoBack || l.photo || l.photos?.front || l.photos?.side || l.photos?.back);
        return `<option value="${l.id}">${d} (${l.weight} กก.)${hasPhoto ? ' 📸' : ''}</option>`;
    }).join("");
    afterSelect.innerHTML = afterOptionsHtml;

    const startWeight = parseFloat(state.profile.startWeight || 75.0);
    const beforeOptionsHtml = `
        <option value="profile_start">🏁 วันเริ่มต้นโปรไฟล์ (${startWeight} กก.)</option>
        ${afterOptionsHtml}
    `;
    beforeSelect.innerHTML = beforeOptionsHtml;

    if (prevAfterVal && sortedLogs.some(l => l.id.toString() === prevAfterVal)) {
        afterSelect.value = prevAfterVal;
    } else {
        afterSelect.value = sortedLogs[sortedLogs.length - 1].id.toString();
    }

    if (prevBeforeVal && (prevBeforeVal === 'profile_start' || sortedLogs.some(l => l.id.toString() === prevBeforeVal))) {
        beforeSelect.value = prevBeforeVal;
    } else {
        const currIdx = sortedLogs.findIndex(l => l.id.toString() === afterSelect.value);
        if (currIdx > 0) {
            beforeSelect.value = sortedLogs[currIdx - 1].id.toString();
        } else {
            beforeSelect.value = "profile_start";
        }
    }

    const afterLog = sortedLogs.find(l => l.id.toString() === afterSelect.value) || sortedLogs[sortedLogs.length - 1];
    let beforeLog;
    if (beforeSelect.value === 'profile_start') {
        beforeLog = {
            id: 'profile_start',
            date: state.profile.startDate || (afterLog ? new Date(new Date(afterLog.date).getTime() - 86400000 * 7).toISOString() : new Date().toISOString()),
            weight: parseFloat(state.profile.startWeight || 75.0),
            chest: null,
            waist: null,
            hips: null,
            neck: state.profile.neck || null,
            armLeft: null,
            armRight: null,
            thighLeft: null,
            thighRight: null,
            isProfileStart: true
        };
    } else {
        beforeLog = sortedLogs.find(l => l.id.toString() === beforeSelect.value) || sortedLogs[0];
    }

    const mUnit = state.profile.unitSystem === 'metric' ? 'ซม.' : 'นิ้ว';

    // Dates
    const bDate = beforeLog.isProfileStart
        ? `วันเริ่มต้นโปรไฟล์ (${state.profile.startDate ? new Date(state.profile.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : 'ค่าเริ่มต้น'})`
        : new Date(beforeLog.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
    const bDateShort = beforeLog.isProfileStart
        ? 'เริ่มต้น'
        : new Date(beforeLog.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

    const aDate = new Date(afterLog.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
    const aDateShort = new Date(afterLog.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

    // Weight difference
    const weightDiff = (afterLog.weight - beforeLog.weight).toFixed(1);
    let heroPillHtml = "";
    if (parseFloat(weightDiff) < 0) {
        heroPillHtml = `<div class="comp-hero-pill">📉 ลดลง ${Math.abs(parseFloat(weightDiff))} กก. 🎉</div>`;
    } else if (parseFloat(weightDiff) > 0) {
        heroPillHtml = `<div class="comp-hero-pill" style="border-color:#f59e0b;color:#f59e0b;background:rgba(245,158,11,0.15)">📈 เพิ่มขึ้น +${weightDiff} กก.</div>`;
    } else {
        heroPillHtml = `<div class="comp-hero-pill" style="border-color:#94a3b8;color:#94a3b8;background:rgba(255,255,255,0.05)">➖ น้ำหนักคงที่ (${afterLog.weight} กก.)</div>`;
    }

    // Helper: diff badge
    function formatDiffBadge(curVal, prevVal, unit, lowerIsBetter = true) {
        if (curVal === null || curVal === undefined || prevVal === null || prevVal === undefined) return "";
        const diff = curVal - prevVal;
        if (Math.abs(diff) < 0.05) {
            return `<span class="comp-diff-badge comp-diff-zero">คงที่</span>`;
        }
        const isGood = lowerIsBetter ? diff < 0 : diff > 0;
        const cls = isGood ? 'comp-diff-good' : 'comp-diff-bad';
        const sign = diff > 0 ? `+${diff.toFixed(1)}` : `${diff.toFixed(1)}`;
        return `<span class="comp-diff-badge ${cls}">${diff < 0 ? '▼' : '▲'} ${sign} ${unit}</span>`;
    }

    // Helper: photo frame
    function renderPhotoFrame(src, label, badgeClass, isMissing = false, subInfo = '') {
        if (!src || isMissing) {
            return `
                <div class="comp-empty-frame">
                    <span style="font-size:1.6rem;">📷</span>
                    <span style="font-weight:600;">${label}</span>
                    ${subInfo ? `<small style="color:var(--text-muted);font-size:0.75rem;">${subInfo}</small>` : ''}
                </div>
            `;
        }
        return `
            <div class="comp-photo-frame" onclick="viewPhotoFullscreen('${src}')" title="คลิกเพื่อดูรูปขนาดเต็ม">
                <img src="${src}" alt="${label}">
                <div class="comp-photo-badge ${badgeClass}">${label}</div>
            </div>
        `;
    }

    // 3 Angles
    const angles = [
        { key: 'front', icon: '👤', title: '1. ด้านหน้า (Front)' },
        { key: 'side', icon: '🧍', title: '2. ด้านข้าง (Side)' },
        { key: 'back', icon: '🚶', title: '3. ด้านหลัง (Back)' }
    ];

    let photosHtml = `<div class="comp-photos-grid">`;
    angles.forEach(ang => {
        const bPhoto = getLogPhoto(beforeLog, ang.key);
        const aPhoto = getLogPhoto(afterLog, ang.key);

        photosHtml += `
            <div class="comp-angle-card">
                <div class="comp-angle-header">
                    <span>${ang.icon} ${ang.title}</span>
                </div>
                <div class="comp-photo-pair">
                    ${bPhoto 
                        ? renderPhotoFrame(bPhoto, `ครั้งก่อน: ${beforeLog.weight} กก.`, 'comp-badge-before')
                        : renderPhotoFrame(null, 'ครั้งก่อน (ไม่มีรูป)', '', true, `${bDateShort} • ${beforeLog.weight} กก.`)
                    }
                    ${aPhoto 
                        ? renderPhotoFrame(aPhoto, `ครั้งนี้: ${afterLog.weight} กก.`, 'comp-badge-after')
                        : renderPhotoFrame(null, 'ครั้งนี้ (ไม่มีรูป)', '', true, `${aDateShort} • ${afterLog.weight} กก.`)
                    }
                </div>
            </div>
        `;
    });
    photosHtml += `</div>`;

    // Measurements
    const bArm = (beforeLog.armLeft || beforeLog.armRight) ? `${beforeLog.armLeft || 0} / ${beforeLog.armRight || 0}` : null;
    const aArm = (afterLog.armLeft || afterLog.armRight) ? `${afterLog.armLeft || 0} / ${afterLog.armRight || 0}` : null;
    const bThigh = (beforeLog.thighLeft || beforeLog.thighRight) ? `${beforeLog.thighLeft || 0} / ${beforeLog.thighRight || 0}` : null;
    const aThigh = (afterLog.thighLeft || afterLog.thighRight) ? `${afterLog.thighLeft || 0} / ${afterLog.thighRight || 0}` : null;

    const bfBefore = calculateBodyFatPercentage(beforeLog);
    const bfAfter = calculateBodyFatPercentage(afterLog);

    const metrics = [
        {
            icon: '⚖️',
            label: 'น้ำหนักตัว',
            curVal: `${afterLog.weight.toFixed(1)} กก.`,
            prevVal: `${beforeLog.weight.toFixed(1)} กก.`,
            diffBadge: formatDiffBadge(afterLog.weight, beforeLog.weight, 'กก.', true)
        },
        {
            icon: '📏',
            label: 'รอบอก',
            curVal: afterLog.chest ? `${afterLog.chest.toFixed(1)} ${mUnit}` : '--',
            prevVal: beforeLog.chest ? `${beforeLog.chest.toFixed(1)} ${mUnit}` : '--',
            diffBadge: (afterLog.chest && beforeLog.chest) ? formatDiffBadge(afterLog.chest, beforeLog.chest, mUnit, true) : ''
        },
        {
            icon: '⏳',
            label: 'รอบเอว',
            curVal: afterLog.waist ? `${afterLog.waist.toFixed(1)} ${mUnit}` : '--',
            prevVal: beforeLog.waist ? `${beforeLog.waist.toFixed(1)} ${mUnit}` : '--',
            diffBadge: (afterLog.waist && beforeLog.waist) ? formatDiffBadge(afterLog.waist, beforeLog.waist, mUnit, true) : ''
        },
        {
            icon: '💪',
            label: 'รอบแขน (ซ้าย / ขวา)',
            curVal: aArm ? `${aArm} ${mUnit}` : '--',
            prevVal: bArm ? `${bArm} ${mUnit}` : '--',
            diffBadge: (afterLog.armLeft && beforeLog.armLeft) ? formatDiffBadge(afterLog.armLeft, beforeLog.armLeft, mUnit, true) : ''
        },
        {
            icon: '🦵',
            label: 'รอบขา (ซ้าย / ขวา)',
            curVal: aThigh ? `${aThigh} ${mUnit}` : '--',
            prevVal: bThigh ? `${bThigh} ${mUnit}` : '--',
            diffBadge: (afterLog.thighLeft && beforeLog.thighLeft) ? formatDiffBadge(afterLog.thighLeft, beforeLog.thighLeft, mUnit, true) : ''
        },
        {
            icon: '🧬',
            label: 'รอบสะโพก',
            curVal: afterLog.hips ? `${afterLog.hips.toFixed(1)} ${mUnit}` : '--',
            prevVal: beforeLog.hips ? `${beforeLog.hips.toFixed(1)} ${mUnit}` : '--',
            diffBadge: (afterLog.hips && beforeLog.hips) ? formatDiffBadge(afterLog.hips, beforeLog.hips, mUnit, true) : ''
        },
        {
            icon: '🔥',
            label: '% ไขมันในร่างกาย',
            curVal: bfAfter ? `${bfAfter}%` : '--',
            prevVal: bfBefore ? `${bfBefore}%` : '--',
            diffBadge: (bfAfter && bfBefore) ? formatDiffBadge(bfAfter, bfBefore, '%', true) : ''
        }
    ];

    if (afterLog.neck || beforeLog.neck) {
        metrics.push({
            icon: '🧣',
            label: 'รอบคอ',
            curVal: afterLog.neck ? `${afterLog.neck.toFixed(1)} ${mUnit}` : '--',
            prevVal: beforeLog.neck ? `${beforeLog.neck.toFixed(1)} ${mUnit}` : '--',
            diffBadge: (afterLog.neck && beforeLog.neck) ? formatDiffBadge(afterLog.neck, beforeLog.neck, mUnit, true) : ''
        });
    }

    let metricsHtml = `
        <div class="comp-metrics-section">
            <div class="comp-metrics-title">
                <span>📏 รายละเอียดสัดส่วนร่างกาย (Body Measurements: ครั้งก่อน ➔ ครั้งนี้)</span>
            </div>
            <div class="comp-metrics-grid">
    `;

    metrics.forEach(m => {
        metricsHtml += `
            <div class="comp-metric-card">
                <div class="comp-metric-top">
                    <span class="comp-metric-label">${m.icon} ${m.label}</span>
                    ${m.diffBadge || ''}
                </div>
                <div class="comp-metric-comparison-row">
                    <div class="comp-metric-data-col">
                        <span class="comp-metric-tag">ครั้งก่อน (${bDateShort})</span>
                        <span class="comp-metric-num">${m.prevVal}</span>
                    </div>
                    <span class="comp-metric-arrow">➔</span>
                    <div class="comp-metric-data-col" style="text-align: right;">
                        <span class="comp-metric-tag">ครั้งนี้ (${aDateShort})</span>
                        <span class="comp-metric-num highlight">${m.curVal}</span>
                    </div>
                </div>
            </div>
        `;
    });

    metricsHtml += `
            </div>
        </div>
    `;

    container.innerHTML = `
        <div class="comp-card">
            <div class="comp-header">
                <div class="comp-title-group">
                    <h2>✨ BodyFit Transformation Card</h2>
                    <p>${state.profile.name || 'ผู้ใช้งาน'} • ${bDate} ➔ ${aDate}</p>
                </div>
                ${heroPillHtml}
            </div>

            ${photosHtml}

            ${metricsHtml}

            <div class="comp-footer">
                <span>⚡ บันทึกและวิเคราะห์โดย BodyFit • Personal Body Tracker</span>
                <span>คลิกที่รูปเพื่อเปิดดูรูปขนาดใหญ่</span>
            </div>
        </div>
    `;
}
window.renderComparisonCard = renderComparisonCard;
window.renderComparisonSlider = renderComparisonCard; // alias for backwards compatibility

// Export Comparison Card to PNG Image
window.downloadComparisonCard = async function() {
    const beforeSelect = document.getElementById("before-photo-select");
    const afterSelect = document.getElementById("after-photo-select");
    if (!beforeSelect || !afterSelect) return;

    const sortedLogs = [...state.logs].sort((a, b) => new Date(a.date) - new Date(b.date));
    const afterLog = sortedLogs.find(l => l.id.toString() === afterSelect.value) || sortedLogs[sortedLogs.length - 1];

    if (!afterLog) {
        showToast("ไม่พบข้อมูลสัดส่วนเพื่อส่งออก", "error");
        return;
    }

    let beforeLog;
    if (beforeSelect.value === 'profile_start') {
        beforeLog = {
            id: 'profile_start',
            date: state.profile.startDate || (afterLog ? new Date(new Date(afterLog.date).getTime() - 86400000 * 7).toISOString() : new Date().toISOString()),
            weight: parseFloat(state.profile.startWeight || 75.0),
            chest: null,
            waist: null,
            hips: null,
            neck: state.profile.neck || null,
            armLeft: null,
            armRight: null,
            thighLeft: null,
            thighRight: null,
            isProfileStart: true
        };
    } else {
        beforeLog = sortedLogs.find(l => l.id.toString() === beforeSelect.value) || sortedLogs[0];
    }

    showToast("กำลังสร้างการ์ดภาพเปรียบเทียบ...", "info");

    const canvas = document.getElementById("comparison-export-canvas");
    if (!canvas) return;

    const mUnit = state.profile.unitSystem === 'metric' ? 'ซม.' : 'นิ้ว';

    const bDate = beforeLog.isProfileStart
        ? `วันเริ่มต้น (${state.profile.startDate ? new Date(state.profile.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : 'เริ่มต้น'})`
        : new Date(beforeLog.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
    const bDateShort = beforeLog.isProfileStart
        ? 'เริ่มต้น'
        : new Date(beforeLog.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

    const aDate = new Date(afterLog.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
    const aDateShort = new Date(afterLog.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

    // Prepare metric cards
    const bArm = (beforeLog.armLeft || beforeLog.armRight) ? `${beforeLog.armLeft || 0} / ${beforeLog.armRight || 0}` : null;
    const aArm = (afterLog.armLeft || afterLog.armRight) ? `${afterLog.armLeft || 0} / ${afterLog.armRight || 0}` : null;
    const bThigh = (beforeLog.thighLeft || beforeLog.thighRight) ? `${beforeLog.thighLeft || 0} / ${beforeLog.thighRight || 0}` : null;
    const aThigh = (afterLog.thighLeft || afterLog.thighRight) ? `${afterLog.thighLeft || 0} / ${afterLog.thighRight || 0}` : null;

    const bfBefore = calculateBodyFatPercentage(beforeLog);
    const bfAfter = calculateBodyFatPercentage(afterLog);

    function calcDiffPill(cur, prev, unit, lowerIsBetter = true) {
        if (cur === null || cur === undefined || prev === null || prev === undefined) return null;
        const diff = cur - prev;
        if (Math.abs(diff) < 0.05) {
            return { txt: "คงที่", color: "#94a3b8", bg: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.2)" };
        }
        const isGood = lowerIsBetter ? diff < 0 : diff > 0;
        const sign = diff > 0 ? `+${diff.toFixed(1)}` : `${diff.toFixed(1)}`;
        return {
            txt: `${diff < 0 ? '▼' : '▲'} ${sign} ${unit}`,
            color: isGood ? "#34d399" : "#f43f5e",
            bg: isGood ? "rgba(16,185,129,0.18)" : "rgba(244,63,94,0.18)",
            border: isGood ? "rgba(16,185,129,0.4)" : "rgba(244,63,94,0.4)"
        };
    }

    const measCards = [
        {
            label: "⚖️ น้ำหนักตัว",
            cur: `${afterLog.weight.toFixed(1)} กก.`,
            prev: `${beforeLog.weight.toFixed(1)} กก.`,
            diff: calcDiffPill(afterLog.weight, beforeLog.weight, 'กก.', true)
        },
        {
            label: "📏 รอบอก",
            cur: afterLog.chest ? `${afterLog.chest.toFixed(1)} ${mUnit}` : "--",
            prev: beforeLog.chest ? `${beforeLog.chest.toFixed(1)} ${mUnit}` : "--",
            diff: (afterLog.chest && beforeLog.chest) ? calcDiffPill(afterLog.chest, beforeLog.chest, mUnit, true) : null
        },
        {
            label: "⏳ รอบเอว",
            cur: afterLog.waist ? `${afterLog.waist.toFixed(1)} ${mUnit}` : "--",
            prev: beforeLog.waist ? `${beforeLog.waist.toFixed(1)} ${mUnit}` : "--",
            diff: (afterLog.waist && beforeLog.waist) ? calcDiffPill(afterLog.waist, beforeLog.waist, mUnit, true) : null
        },
        {
            label: "💪 รอบแขน (ซ้าย / ขวา)",
            cur: aArm ? `${aArm} ${mUnit}` : "--",
            prev: bArm ? `${bArm} ${mUnit}` : "--",
            diff: (afterLog.armLeft && beforeLog.armLeft) ? calcDiffPill(afterLog.armLeft, beforeLog.armLeft, mUnit, true) : null
        },
        {
            label: "🦵 รอบขา (ซ้าย / ขวา)",
            cur: aThigh ? `${aThigh} ${mUnit}` : "--",
            prev: bThigh ? `${bThigh} ${mUnit}` : "--",
            diff: (afterLog.thighLeft && beforeLog.thighLeft) ? calcDiffPill(afterLog.thighLeft, beforeLog.thighLeft, mUnit, true) : null
        },
        {
            label: "🧬 รอบสะโพก / % ไขมัน",
            cur: `${afterLog.hips ? `${afterLog.hips.toFixed(1)} ${mUnit}` : '--'} ${bfAfter ? `(${bfAfter}%)` : ''}`,
            prev: `${beforeLog.hips ? `${beforeLog.hips.toFixed(1)} ${mUnit}` : '--'} ${bfBefore ? `(${bfBefore}%)` : ''}`,
            diff: (afterLog.hips && beforeLog.hips) ? calcDiffPill(afterLog.hips, beforeLog.hips, mUnit, true) : null
        }
    ];

    const numRows = Math.ceil(measCards.length / 3);
    const cardH = 104;
    const gridY = 660;
    const photoH = 400;

    canvas.width = 1200;
    canvas.height = gridY + numRows * (cardH + 16) + 90;
    const ctx = canvas.getContext("2d");

    // Helper: Rounded Rectangle
    function drawRoundRect(x, y, w, h, r, fillStyle, strokeStyle, strokeWidth = 1) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        if (fillStyle) {
            ctx.fillStyle = fillStyle;
            ctx.fill();
        }
        if (strokeStyle) {
            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = strokeWidth;
            ctx.stroke();
        }
        ctx.restore();
    }

    // Helper: Image loader
    function loadImg(src) {
        return new Promise((resolve) => {
            if (!src) return resolve(null);
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = src;
        });
    }

    // Helper: Draw image with object-fit: cover into rounded rect
    function drawCover(img, x, y, w, h, r = 12, placeholderLabel = "📷 ยังไม่มีรูป") {
        if (!img) {
            drawRoundRect(x, y, w, h, r, "rgba(255,255,255,0.02)", "rgba(255,255,255,0.08)", 1);
            ctx.fillStyle = "#64748b";
            ctx.font = "bold 15px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(placeholderLabel, x + w / 2, y + h / 2);
            return;
        }

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.clip();

        const imgRatio = img.width / img.height;
        const targetRatio = w / h;
        let sWidth, sHeight, sx, sy;

        if (imgRatio > targetRatio) {
            sHeight = img.height;
            sWidth = img.height * targetRatio;
            sx = (img.width - sWidth) / 2;
            sy = 0;
        } else {
            sWidth = img.width;
            sHeight = img.width / targetRatio;
            sx = 0;
            sy = (img.height - sHeight) / 2;
        }

        ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);
        ctx.restore();

        drawRoundRect(x, y, w, h, r, null, "rgba(255,255,255,0.15)", 2);
    }

    // Load images
    const [bFront, aFront, bSide, aSide, bBack, aBack] = await Promise.all([
        loadImg(getLogPhoto(beforeLog, 'front')),
        loadImg(getLogPhoto(afterLog, 'front')),
        loadImg(getLogPhoto(beforeLog, 'side')),
        loadImg(getLogPhoto(afterLog, 'side')),
        loadImg(getLogPhoto(beforeLog, 'back')),
        loadImg(getLogPhoto(afterLog, 'back'))
    ]);

    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, 1200, canvas.height);
    bgGrad.addColorStop(0, "#0b1329");
    bgGrad.addColorStop(0.5, "#090d16");
    bgGrad.addColorStop(1, "#020617");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, canvas.height);

    // Glow
    const glow1 = ctx.createRadialGradient(200, 100, 10, 200, 100, 350);
    glow1.addColorStop(0, "rgba(168, 85, 247, 0.15)");
    glow1.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, 600, 500);

    const glow2 = ctx.createRadialGradient(1000, 200, 10, 1000, 200, 400);
    glow2.addColorStop(0, "rgba(6, 182, 212, 0.12)");
    glow2.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow2;
    ctx.fillRect(600, 0, 600, 500);

    // Outer border frame
    const borderGrad = ctx.createLinearGradient(0, 0, 1200, canvas.height);
    borderGrad.addColorStop(0, "rgba(168, 85, 247, 0.6)");
    borderGrad.addColorStop(0.5, "rgba(6, 182, 212, 0.5)");
    borderGrad.addColorStop(1, "rgba(16, 185, 129, 0.6)");
    drawRoundRect(20, 20, 1160, canvas.height - 40, 24, null, borderGrad, 3);

    // Header Logo Icon Box
    drawRoundRect(55, 55, 60, 60, 16, "#1e293b", "rgba(168,85,247,0.5)", 2);
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 26px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("BF", 85, 94);

    // Title & Subtitle
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 30px sans-serif";
    ctx.fillText("BodyFit Transformation Card", 130, 80);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "17px sans-serif";
    const dateRangeStr = `${state.profile.name || 'ผู้ใช้งาน'} • ${bDate} ➔ ${aDate}`;
    ctx.fillText(dateRangeStr, 130, 108);

    // Hero Pill (Right aligned)
    const weightDiff = (afterLog.weight - beforeLog.weight).toFixed(1);
    ctx.textAlign = "right";
    let pillText = `⚖️ น้ำหนัก ${afterLog.weight} กก.`;
    let pillBg = "rgba(16, 185, 129, 0.2)";
    let pillColor = "#34d399";
    let pillBorder = "rgba(16, 185, 129, 0.4)";

    if (parseFloat(weightDiff) < 0) {
        pillText = `📉 ลดลง ${Math.abs(parseFloat(weightDiff))} กก. 🎉`;
        pillBg = "rgba(16, 185, 129, 0.2)";
        pillColor = "#34d399";
        pillBorder = "rgba(16, 185, 129, 0.5)";
    } else if (parseFloat(weightDiff) > 0) {
        pillText = `📈 เพิ่มขึ้น +${weightDiff} กก.`;
        pillBg = "rgba(245, 158, 11, 0.2)";
        pillColor = "#fbbf24";
        pillBorder = "rgba(245, 158, 11, 0.5)";
    } else {
        pillText = `➖ น้ำหนักคงที่ (${afterLog.weight} กก.)`;
        pillBg = "rgba(255, 255, 255, 0.08)";
        pillColor = "#cbd5e1";
        pillBorder = "rgba(255, 255, 255, 0.2)";
    }

    drawRoundRect(860, 58, 285, 52, 26, pillBg, pillBorder, 1.5);
    ctx.fillStyle = pillColor;
    ctx.font = "bold 19px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(pillText, 1002, 91);

    // Divider
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(55, 136);
    ctx.lineTo(1145, 136);
    ctx.stroke();

    // 3-Angle Photos Section
    const photoY = 155;
    const colW = 346;
    const colGap = 26;
    const startX = 55;

    const angleDefs = [
        { title: "👤 1. ด้านหน้า (Front)", bImg: bFront, aImg: aFront },
        { title: "🧍 2. ด้านข้าง (Side)", bImg: bSide, aImg: aSide },
        { title: "🚶 3. ด้านหลัง (Back)", bImg: bBack, aImg: aBack }
    ];

    angleDefs.forEach((ang, i) => {
        const colX = startX + i * (colW + colGap);

        drawRoundRect(colX, photoY, colW, photoH + 46, 16, "rgba(255,255,255,0.02)", "rgba(255,255,255,0.06)", 1);

        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 17px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(ang.title, colX + 16, photoY + 28);

        const imgAreaY = photoY + 40;
        const imgAreaH = photoH - 4;
        const halfW = (colW - 32) / 2;
        const bX = colX + 12;
        const aX = bX + halfW + 8;

        // Before Photo
        drawCover(ang.bImg, bX, imgAreaY, halfW, imgAreaH, 10, "📷 ครั้งก่อน");
        drawRoundRect(bX + 4, imgAreaY + imgAreaH - 32, halfW - 8, 26, 6, "rgba(15,23,42,0.9)", "rgba(255,255,255,0.1)", 1);
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`Before (${beforeLog.weight})`, bX + halfW / 2, imgAreaY + imgAreaH - 15);

        // After Photo
        drawCover(ang.aImg, aX, imgAreaY, halfW, imgAreaH, 10, "📷 ครั้งนี้");
        drawRoundRect(aX + 4, imgAreaY + imgAreaH - 32, halfW - 8, 26, 6, "rgba(15,23,42,0.9)", "rgba(6,182,212,0.4)", 1);
        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`After (${afterLog.weight})`, aX + halfW / 2, imgAreaY + imgAreaH - 15);
    });

    // Measurements Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("📏 รายละเอียดสัดส่วนร่างกาย (Body Measurements: ครั้งก่อน ➔ ครั้งนี้)", 55, gridY - 14);

    // Metric Cards Grid
    const cardW = 346;

    measCards.forEach((c, idx) => {
        const row = Math.floor(idx / 3);
        const col = idx % 3;
        const mX = startX + col * (cardW + colGap);
        const mY = gridY + row * (cardH + 16);

        // Card container
        drawRoundRect(mX, mY, cardW, cardH, 14, "rgba(255,255,255,0.03)", "rgba(255,255,255,0.08)", 1);

        // Top row: Label + Diff Pill
        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(c.label, mX + 14, mY + 25);

        if (c.diff) {
            drawRoundRect(mX + cardW - 116, mY + 10, 104, 22, 6, c.diff.bg, c.diff.border, 1);
            ctx.fillStyle = c.diff.color;
            ctx.font = "bold 11px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(c.diff.txt, mX + cardW - 64, mY + 25);
        }

        // Comparison Box
        drawRoundRect(mX + 10, mY + 36, cardW - 20, 56, 8, "rgba(0,0,0,0.35)", "rgba(255,255,255,0.05)", 1);

        // Left: Previous Data
        ctx.textAlign = "left";
        ctx.fillStyle = "#64748b";
        ctx.font = "11px sans-serif";
        ctx.fillText(`ครั้งก่อน (${bDateShort})`, mX + 20, mY + 54);

        ctx.fillStyle = "#cbd5e1";
        ctx.font = "bold 15px sans-serif";
        ctx.fillText(c.prev, mX + 20, mY + 77);

        // Center Arrow
        ctx.fillStyle = "#06b6d4";
        ctx.font = "bold 16px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("➔", mX + cardW / 2, mY + 68);

        // Right: Current Data
        ctx.textAlign = "right";
        ctx.fillStyle = "#38bdf8";
        ctx.font = "11px sans-serif";
        ctx.fillText(`ครั้งนี้ (${aDateShort})`, mX + cardW - 20, mY + 54);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 17px sans-serif";
        ctx.fillText(c.cur, mX + cardW - 20, mY + 77);
    });

    // Footer
    const footerY = canvas.height - 35;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(55, footerY - 16);
    ctx.lineTo(1145, footerY - 16);
    ctx.stroke();

    ctx.fillStyle = "#64748b";
    ctx.font = "13px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("⚡ บันทึกและสร้างโดย BodyFit • Personal Fitness & Body Tracker", 55, footerY);

    ctx.textAlign = "right";
    const nowStr = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
    ctx.fillText(`ส่งออกเมื่อ: ${nowStr}`, 1145, footerY);

    // PNG Download
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `bodyfit_transformation_${getTodayDateString()}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("ดาวน์โหลดการ์ดภาพเปรียบเทียบ (PNG) เรียบร้อยแล้ว! 🎉", "success");
};

// Render Gallery Grid (Shows all angles Front, Side, Back)
function renderPhotoGallery() {
    const grid = document.getElementById("photo-gallery-grid");
    if (!grid) return;

    const angleConfigs = [
        { key: 'front', label: 'ด้านหน้า' },
        { key: 'side', label: 'ด้านข้าง' },
        { key: 'back', label: 'ด้านหลัง' }
    ];

    const galleryItems = [];
    const sortedLogs = [...state.logs].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedLogs.forEach(l => {
        const d = new Date(l.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
        angleConfigs.forEach(a => {
            const photoSrc = getLogPhoto(l, a.key);
            if (photoSrc) {
                galleryItems.push({
                    logId: l.id,
                    angle: a.key,
                    angleLabel: a.label,
                    dateStr: d,
                    weight: l.weight,
                    photo: photoSrc
                });
            }
        });
    });

    if (galleryItems.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 1.5rem;">ยังไม่มีรูปถ่ายในระบบ</p>`;
        return;
    }

    grid.innerHTML = galleryItems.map(item => `
        <div class="gallery-item" onclick="selectGalleryPhoto(${item.logId}, '${item.angle}')">
            <img src="${item.photo}" alt="${item.angleLabel} ${item.dateStr}">
            <div class="gallery-info">
                <span><strong>${item.angleLabel}</strong> • ${item.dateStr}</span>
                <strong>${item.weight} กก.</strong>
            </div>
        </div>
    `).join("");
}

window.selectGalleryPhoto = function(logId, angle = 'front') {
    const afterSelect = document.getElementById("after-photo-select");
    if (afterSelect) {
        afterSelect.value = logId;
        if (window.onAfterLogChange) {
            window.onAfterLogChange();
        } else {
            renderComparisonCard();
        }
        document.getElementById("photo-comparison-card").scrollIntoView({ behavior: 'smooth' });
    }
};

// Export to CSV
window.exportCSV = function() {
    if (state.logs.length === 0) {
        showToast("ไม่มีข้อมูลเพื่อส่งออก", "error");
        return;
    }

    const measureUnit = state.profile.unitSystem === 'metric' ? 'ซม.' : 'นิ้ว';
    let csv = "\uFEFFวันที่,น้ำหนัก (กก.),รอบคอ (" + measureUnit + "),รอบเอว (" + measureUnit + "),รอบอก (" + measureUnit + "),รอบสะโพก (" + measureUnit + "),ต้นแขนซ้าย,ต้นแขนขวา,ต้นขาซ้าย,ต้นขาขวา,แท็ก,บันทึกช่วยจำ\n";

    const sortedLogs = [...state.logs].sort((a, b) => new Date(a.date) - new Date(b.date));

    sortedLogs.forEach(log => {
        const tags = (log.tags || []).join("; ");
        const notes = (log.notes || "").replace(/"/g, '""');
        csv += `"${log.date}",${log.weight},${log.neck || 0},${log.waist || 0},${log.chest || 0},${log.hips || 0},${log.armLeft || 0},${log.armRight || 0},${log.thighLeft || 0},${log.thighRight || 0},"${tags}","${notes}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `bodyfit_records_${getTodayDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("ส่งออกไฟล์ Excel (CSV) สำเร็จ!", "success");
};

// Export data to JSON
window.exportData = function() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `bodyfit_backup_${getTodayDateString()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("ส่งออกไฟล์สำรอง JSON สำเร็จ!", "success");
};

// Import data from JSON or CSV
window.importData = async function(event) {
    const inputEl = event.target;
    const file = inputEl.files && inputEl.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const fileContent = (e.target.result || "").trim();
            let importedCount = 0;

            if (file.name.endsWith('.json') || fileContent.startsWith('{') || fileContent.startsWith('[')) {
                const importedData = JSON.parse(fileContent);

                if (Array.isArray(importedData)) {
                    state.logs = importedData;
                    importedCount = importedData.length;
                } else if (importedData.logs && Array.isArray(importedData.logs)) {
                    state.logs = importedData.logs;
                    if (importedData.profile) {
                        state.profile = Object.assign(state.profile, importedData.profile);
                    }
                    if (importedData.waterLogs) {
                        state.waterLogs = Object.assign(state.waterLogs, importedData.waterLogs);
                    }
                    importedCount = importedData.logs.length;
                } else if (importedData.profile) {
                    state.profile = Object.assign(state.profile, importedData.profile);
                    importedCount = 1;
                } else {
                    showToast("ไม่พบข้อมูลสถิติในไฟล์ JSON นี้", "error");
                    inputEl.value = '';
                    return;
                }
            } else if (file.name.endsWith('.csv') || fileContent.includes(',')) {
                const lines = fileContent.split(/\r?\n/).filter(line => line.trim().length > 0);
                if (lines.length > 1) {
                    const parsedLogs = [];
                    for (let i = 1; i < lines.length; i++) {
                        const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
                        if (cols.length >= 2 && cols[0] && !isNaN(parseFloat(cols[1]))) {
                            parsedLogs.push({
                                id: Date.now() - (lines.length - i) * 86400000,
                                date: cols[0],
                                weight: parseFloat(cols[1]),
                                neck: parseFloat(cols[2]) || state.profile.neck || 33,
                                waist: parseFloat(cols[3]) || 0,
                                chest: parseFloat(cols[4]) || 0,
                                hips: parseFloat(cols[5]) || 0,
                                armLeft: parseFloat(cols[6]) || 0,
                                armRight: parseFloat(cols[7]) || 0,
                                thighLeft: parseFloat(cols[8]) || 0,
                                thighRight: parseFloat(cols[9]) || 0,
                                photo: null,
                                tags: cols[10] ? cols[10].split(';').map(t => t.trim()).filter(Boolean) : [],
                                notes: cols[11] || ''
                            });
                        }
                    }
                    if (parsedLogs.length > 0) {
                        state.logs = parsedLogs.sort((a, b) => new Date(a.date) - new Date(b.date));
                        importedCount = parsedLogs.length;
                    } else {
                        showToast("ไม่สามารถอ่านข้อมูลจากไฟล์ CSV ได้", "error");
                        inputEl.value = '';
                        return;
                    }
                } else {
                    showToast("ไฟล์ CSV ไม่มีข้อมูลบันทึก", "error");
                    inputEl.value = '';
                    return;
                }
            } else {
                showToast("กรุณาเลือกไฟล์ .json หรือ .csv", "error");
                inputEl.value = '';
                return;
            }

            await saveState();
            initApp();
            updateUI();
            inputEl.value = '';
            showToast(`นำเข้าข้อมูลสำเร็จ ${importedCount} รายการ! 🎉`, "success");

        } catch (err) {
            console.error("Import Error:", err);
            showToast("เกิดข้อผิดพลาดในการอ่านไฟล์: " + err.message, "error");
            inputEl.value = '';
        }
    };
    reader.readAsText(file);
};

// Shareable Progress Card Modal
window.openShareCardModal = function() {
    const modal = document.getElementById("share-card-modal");
    if (!modal) return;

    const sortedLogs = [...state.logs].sort((a, b) => new Date(a.date) - new Date(b.date));
    const latestLog = sortedLogs[sortedLogs.length - 1];
    const startW = state.profile.startWeight;
    const currentW = latestLog ? latestLog.weight : startW;
    const targetW = state.profile.targetWeight;
    const totalLost = startW - currentW;

    document.getElementById("pc-avatar").textContent = state.profile.name.charAt(0).toUpperCase();
    document.getElementById("pc-name").textContent = state.profile.name;
    document.getElementById("pc-total-loss").textContent = totalLost > 0 ? `-${totalLost.toFixed(1)} กก.` : `${totalLost.toFixed(1)} กก.`;
    document.getElementById("pc-start-weight").textContent = `${startW.toFixed(1)} กก.`;
    document.getElementById("pc-current-weight").textContent = `${currentW.toFixed(1)} กก.`;
    document.getElementById("pc-target-weight").textContent = `${targetW.toFixed(1)} กก.`;

    const mUnit = state.profile.unitSystem === 'metric' ? 'ซม.' : 'นิ้ว';
    if (sortedLogs.length >= 2 && latestLog) {
        const waistLost = sortedLogs[0].waist - latestLog.waist;
        document.getElementById("pc-waist-change").textContent = waistLost > 0 ? `-${waistLost.toFixed(1)} ${mUnit}` : `0 ${mUnit}`;
    } else {
        document.getElementById("pc-waist-change").textContent = `-- ${mUnit}`;
    }

    const diffTotal = Math.abs(startW - targetW);
    let pct = 0;
    if (diffTotal > 0 && currentW <= startW) {
        pct = Math.min(100, Math.round(((startW - currentW) / diffTotal) * 100));
    }
    document.getElementById("pc-goal-pct").textContent = `${pct}%`;
    document.getElementById("pc-streak").textContent = document.getElementById("stat-streak").textContent;

    modal.style.display = "flex";
};

window.closeShareCardModal = function() {
    document.getElementById("share-card-modal").style.display = "none";
};

window.downloadProgressCard = function() {
    const canvas = document.getElementById("card-render-canvas");
    canvas.width = 600;
    canvas.height = 760;
    const ctx = canvas.getContext("2d");

    const bgGrad = ctx.createRadialGradient(300, 100, 50, 300, 380, 500);
    bgGrad.addColorStop(0, "#2e1065");
    bgGrad.addColorStop(0.5, "#0f172a");
    bgGrad.addColorStop(1, "#020617");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 600, 760);

    ctx.strokeStyle = "rgba(168, 85, 247, 0.4)";
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, 560, 720);

    ctx.fillStyle = "#a855f7";
    ctx.beginPath();
    ctx.arc(80, 80, 32, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(state.profile.name.charAt(0).toUpperCase(), 80, 89);

    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText(state.profile.name, 130, 76);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "15px sans-serif";
    ctx.fillText("BodyFit Tracker Milestone Journey", 130, 98);

    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.fillRect(50, 140, 500, 170);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.strokeRect(50, 140, 500, 170);

    const totalLostStr = document.getElementById("pc-total-loss").textContent;
    ctx.textAlign = "center";
    ctx.fillStyle = "#ec4899";
    ctx.font = "bold 58px sans-serif";
    ctx.fillText(totalLostStr, 300, 225);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "18px sans-serif";
    ctx.fillText("น้ำหนักที่ลดลงได้ทั้งหมด 🎉", 300, 270);

    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.fillRect(50, 340, 500, 110);
    ctx.strokeRect(50, 340, 500, 110);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "15px sans-serif";
    ctx.fillText("เริ่มต้น", 130, 375);
    ctx.fillText("ปัจจุบัน", 300, 375);
    ctx.fillText("เป้าหมาย", 470, 375);

    ctx.fillStyle = "#06b6d4";
    ctx.font = "bold 22px sans-serif";
    ctx.fillText("➔", 215, 410);
    ctx.fillText("➔", 385, 410);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px sans-serif";
    ctx.fillText(document.getElementById("pc-start-weight").textContent, 130, 415);
    ctx.fillText(document.getElementById("pc-current-weight").textContent, 300, 415);
    ctx.fillText(document.getElementById("pc-target-weight").textContent, 470, 415);

    ctx.textAlign = "left";
    ctx.fillStyle = "#94a3b8";
    ctx.font = "18px sans-serif";
    ctx.fillText("รอบเอวลดลง:", 80, 500);
    ctx.fillText("ความคืบหน้าเป้าหมาย:", 80, 545);
    ctx.fillText("บันทึกต่อเนื่อง:", 80, 590);

    ctx.textAlign = "right";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText(document.getElementById("pc-waist-change").textContent, 520, 500);
    ctx.fillText(document.getElementById("pc-goal-pct").textContent, 520, 545);
    ctx.fillText(document.getElementById("pc-streak").textContent, 520, 590);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.beginPath();
    ctx.moveTo(80, 630);
    ctx.lineTo(520, 630);
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = "#64748b";
    ctx.font = "15px sans-serif";
    ctx.fillText("⚡ สุขภาพดีเริ่มต้นที่ตัวเรา • BodyFit Personal Tracker", 300, 675);

    const link = document.createElement("a");
    link.download = `bodyfit_progress_card_${getTodayDateString()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    showToast("บันทึกการ์ดรูปภาพความสำเร็จเรียบร้อย!", "success");
};

// Toast Notifications Helper
function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    const icon = type === "success" ? "✓" : (type === "error" ? "✗" : "ℹ");
    toast.innerHTML = `<span style='font-weight: bold; font-size: 1.1rem; margin-right: 6px;'>${icon}</span> <span>${message}</span>`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = "slideIn 0.3s reverse forwards";
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

// Render dynamic Charts using Chart.js with filters
function renderCharts() {
    const canvas = document.getElementById("trendsChart");
    if (!canvas) return;

    if (trendsChart) {
        trendsChart.destroy();
    }

    if (state.logs.length === 0) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#94a3b8";
        ctx.textAlign = "center";
        ctx.font = "16px Outfit";
        ctx.fillText("ยังไม่มีสถิติเพื่อแสดงกราฟบันทึกสัดส่วน", canvas.width / 2, canvas.height / 2);
        return;
    }

    let filteredLogs = [...state.logs].sort((a, b) => new Date(a.date) - new Date(b.date));
    const now = new Date();

    if (currentFilter.timeRange === '7d') {
        const cutoff = new Date();
        cutoff.setDate(now.getDate() - 7);
        filteredLogs = filteredLogs.filter(l => new Date(l.date) >= cutoff);
    } else if (currentFilter.timeRange === '30d') {
        const cutoff = new Date();
        cutoff.setDate(now.getDate() - 30);
        filteredLogs = filteredLogs.filter(l => new Date(l.date) >= cutoff);
    } else if (currentFilter.timeRange === '90d') {
        const cutoff = new Date();
        cutoff.setDate(now.getDate() - 90);
        filteredLogs = filteredLogs.filter(l => new Date(l.date) >= cutoff);
    }

    if (filteredLogs.length === 0) {
        filteredLogs = state.logs.slice(-3);
    }

    const labels = filteredLogs.map(log => {
        const dateObj = new Date(log.date);
        return dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    });

    const weightData = filteredLogs.map(log => log.weight);
    const waistData = filteredLogs.map(log => log.waist);
    const hipsData = filteredLogs.map(log => log.hips || null);

    const measureUnit = state.profile.unitSystem === 'metric' ? 'ซม.' : 'นิ้ว';

    const datasets = [];

    if (currentFilter.metricView === 'all' || currentFilter.metricView === 'weight') {
        datasets.push({
            label: 'น้ำหนัก (กก.)',
            data: weightData,
            borderColor: '#a855f7',
            backgroundColor: 'rgba(168, 85, 247, 0.12)',
            yAxisID: 'yWeight',
            tension: 0.35,
            fill: true,
            borderWidth: 3,
            pointBackgroundColor: '#a855f7',
            pointRadius: 4.5
        });
    }

    if (currentFilter.metricView === 'all' || currentFilter.metricView === 'waist') {
        datasets.push({
            label: `รอบเอว (${measureUnit})`,
            data: waistData,
            borderColor: '#06b6d4',
            backgroundColor: 'transparent',
            yAxisID: currentFilter.metricView === 'waist' ? 'yWeight' : 'yWaist',
            tension: 0.35,
            borderWidth: 3,
            pointBackgroundColor: '#06b6d4',
            pointRadius: 4.5
        });

        if (currentFilter.metricView === 'all') {
            datasets.push({
                label: `รอบสะโพก (${measureUnit})`,
                data: hipsData,
                borderColor: '#3b82f6',
                backgroundColor: 'transparent',
                yAxisID: 'yWaist',
                tension: 0.35,
                borderWidth: 2,
                borderDash: [5, 5],
                pointBackgroundColor: '#3b82f6',
                pointRadius: 3.5
            });
        }
    }

    const showDualAxes = currentFilter.metricView === 'all';

    trendsChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#94a3b8',
                        font: { family: 'Outfit', size: 12 },
                        boxWidth: 14
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#fff',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    padding: 10,
                    titleFont: { family: 'Outfit' },
                    bodyFont: { family: 'Outfit' }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.04)' },
                    ticks: { color: '#94a3b8', font: { family: 'Outfit' } }
                },
                yWeight: {
                    type: 'linear',
                    position: 'left',
                    title: {
                        display: true,
                        text: currentFilter.metricView === 'waist' ? `สัดส่วน (${measureUnit})` : 'น้ำหนัก (กก.)',
                        color: currentFilter.metricView === 'waist' ? '#06b6d4' : '#a855f7',
                        font: { family: 'Outfit', weight: 'bold' }
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.04)' },
                    ticks: { color: '#94a3b8', font: { family: 'Outfit' } }
                },
                yWaist: {
                    type: 'linear',
                    position: 'right',
                    display: showDualAxes,
                    title: {
                        display: showDualAxes,
                        text: `สัดส่วน (${measureUnit})`,
                        color: '#06b6d4',
                        font: { family: 'Outfit', weight: 'bold' }
                    },
                    grid: { drawOnChartArea: false },
                    ticks: { color: '#94a3b8', font: { family: 'Outfit' } }
                }
            }
        }
    });
}
