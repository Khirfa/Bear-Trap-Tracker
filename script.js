const STORAGE_KEY = 'bear_trap_ultimate_v3';
let gameData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
let currentMode = 'auto';

document.addEventListener('DOMContentLoaded', () => {
    updateClock();
    renderData();
});

// FUNGSI SMART RESET & AUTO-FILL
function checkUID(uid) {
    const data = gameData[uid];
    const nameInput = document.getElementById('charName');
    const heroSelects = document.querySelectorAll('.hero-select');

    if (uid.trim() === "" || !data) {
        nameInput.value = "";
        heroSelects.forEach(s => {
            s.selectedIndex = 0;
            if(s.id.includes('Star')) { toggleTier(s.id.replace('Star', '')); }
        });
        return;
    }

    nameInput.value = data.nickname;
    if (data.history.length > 0) {
        const lastEntry = data.history[data.history.length - 1];
        const heroes = lastEntry.heroes;
        const classes = ['infantry', 'lancer', 'marksman'];
        
        classes.forEach(cls => {
            if (heroes[cls]) {
                document.getElementById(`${cls}Name`).value = heroes[cls].name;
                document.getElementById(`${cls}Star`).value = heroes[cls].star;
                document.getElementById(`${cls}Widget`).value = heroes[cls].widget;
                
                const tierSelect = document.getElementById(`${cls}Tier`);
                if (heroes[cls].star === "5") {
                    tierSelect.value = "MAX";
                } else {
                    tierSelect.value = heroes[cls].tier || "0";
                }
                toggleTier(cls);
            }
        });
    }
}

function toggleTier(className) {
    const star = document.getElementById(`${className}Star`).value;
    const starCol = document.getElementById(`${className}StarCol`);
    const tierCol = document.getElementById(`${className}TierCol`);
    
    if (star === "5") {
        tierCol.style.display = 'none';
        starCol.className = "col-12 transition-all";
    } else {
        tierCol.style.display = 'block';
        starCol.className = "col-6 transition-all";
    }
}

function setDateMode(mode) {
    currentMode = mode;
    document.getElementById('btnAuto').classList.toggle('active', mode === 'auto');
    document.getElementById('btnManual').classList.toggle('active', mode === 'manual');
    document.getElementById('autoContainer').classList.toggle('d-none', mode === 'manual');
    document.getElementById('manualContainer').classList.toggle('d-none', mode === 'auto');
}

function updateClock() {
    const now = new Date();
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    const autoCont = document.getElementById('autoContainer');
    if(autoCont) autoCont.innerText = now.toLocaleDateString('id-ID', options);
    const manualInput = document.getElementById('manualDateInput');
    if(manualInput && !manualInput.value) {
        manualInput.value = now.toISOString().split('T')[0];
    }
}

function formatNumber(input) {
    let value = String(input.value).replace(/\D/g, "");
    input.value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function parseNumber(str) {
    return parseFloat(String(str).replace(/\./g, "")) || 0;
}

function saveToLocal() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameData));
}

function getHeroData(className) {
    const name = document.getElementById(`${className}Name`).value;
    if(!name) return null;
    const star = document.getElementById(`${className}Star`).value;
    const tier = (star === "5") ? "MAX" : document.getElementById(`${className}Tier`).value;
    const widget = document.getElementById(`${className}Widget`).value;
    return { name, star, tier, widget };
}

function saveData() {
    const uidInput = document.getElementById('charUID');
    const nameInput = document.getElementById('charName');
    const noteInput = document.getElementById('charNote');
    const dmgInputs = document.querySelectorAll('.dmg-input');
    const heroSelects = document.querySelectorAll('.hero-select');

    const uid = uidInput.value.trim();
    const name = nameInput.value.trim();
    
    if (!uid || !name) return alert("UID dan Nickname wajib diisi!");

    const roundDamages = Array.from(dmgInputs).map(input => parseNumber(input.value));
    const highestDmg = Math.max(...roundDamages);
    if (highestDmg === 0) return alert("Isi damage ronde!");

    const heroes = {
        infantry: getHeroData('infantry'),
        lancer: getHeroData('lancer'),
        marksman: getHeroData('marksman')
    };

    let dateKey;
    if(currentMode === 'auto') {
        dateKey = document.getElementById('autoContainer').innerText;
    } else {
        const rawDate = new Date(document.getElementById('manualDateInput').value);
        if(!rawDate.getTime()) return alert("Pilih tanggal!");
        dateKey = rawDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    if (!gameData[uid]) {
        gameData[uid] = { nickname: name, history: [] };
    } else {
        gameData[uid].nickname = name;
    }

    const entry = { date: dateKey, damage: highestDmg, rounds: roundDamages, note: noteInput.value || "-", heroes: heroes };
    gameData[uid].history.push(entry);
    saveToLocal();
    renderData();

    uidInput.value = "";
    checkUID(""); 
    noteInput.value = "";
    dmgInputs.forEach(i => i.value = "");
}

window.deleteRow = function(uid, date) {
    if(confirm(`Hapus histori tanggal ${date}?`)) {
        gameData[uid].history = gameData[uid].history.filter(e => e.date !== date);
        if(gameData[uid].history.length === 0) delete gameData[uid];
        saveToLocal(); renderData();
    }
}

window.deleteChar = function(uid) {
    if(confirm(`Hapus seluruh data UID: ${uid}?`)) {
        delete gameData[uid]; saveToLocal(); renderData();
    }
};

// --- FUNGSI BACKUP BARU DENGAN FORMAT BTT_TANGGAL_KODE ---
function exportFullBackup() {
    if (Object.keys(gameData).length === 0) return alert("Tidak ada data untuk dibackup!");
    
    const now = new Date();
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    const dateStr = now.toLocaleDateString('id-ID', options).replace(/ /g, '-');
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const fileName = `BTT_${dateStr}_${randomCode}.json`;

    const dataStr = JSON.stringify(gameData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            gameData = JSON.parse(e.target.result);
            saveToLocal(); renderData();
            alert("Data berhasil diimpor!");
        } catch (err) { alert("File tidak valid."); }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function renderData() {
    const container = document.getElementById('displayArea');
    const uids = Object.keys(gameData);
    if(uids.length === 0) {
        container.innerHTML = '<div class="glass-card text-center py-5"><p class="text-muted mb-0 small">Belum ada histori.</p></div>';
        return;
    }
    
    container.innerHTML = '';
    uids.forEach(uid => {
        const charData = gameData[uid];
        const sortedHistory = [...charData.history].sort((a,b) => new Date(b.date) - new Date(a.date));
        const peak = Math.max(...charData.history.map(h => h.damage));
        
        const card = document.createElement('div');
        card.className = 'glass-card mb-4 shadow-sm';
        card.innerHTML = `
            <div class="char-header">
                <div class="small fw-bold text-muted mb-1">UID: ${uid}</div>
                <h3>${charData.nickname}</h3>
                <div class="d-inline-block px-4 py-2 bg-light border rounded-pill shadow-sm">
                    <small class="d-block text-muted fw-bold" style="font-size: 0.6rem;">PEAK RECORD</small>
                    <span class="fw-bold text-primary" style="font-size: 1.4rem;">${peak.toLocaleString('id-ID')}</span>
                </div>
            </div>
            <div class="chart-wrapper mb-4" style="height: 180px;"><canvas id="chart-${uid}"></canvas></div>
            <div class="section-title"><span>—</span> TIMELINE SERANGAN <span>—</span></div>
            <div class="history-timeline">
                ${sortedHistory.map(e => `
                    <div class="history-item">
                        <button class="btn-delete-item" onclick="deleteRow('${uid}', '${e.date}')">✕</button>
                        <div class="history-header">
                            <span class="history-date text-uppercase">${e.date}</span>
                            <div class="history-header-peak">${e.damage.toLocaleString('id-ID')}</div>
                        </div>
                        <div class="mb-3">
                            ${e.heroes.infantry ? `<span class="hero-tag tag-inf">🛡️ ${e.heroes.infantry.name} ${e.heroes.infantry.star}⭐ ${e.heroes.infantry.tier === 'MAX' ? 'MAX' : 'T'+e.heroes.infantry.tier} (+${e.heroes.infantry.widget})</span>` : ''}
                            ${e.heroes.lancer ? `<span class="hero-tag tag-lan">🐎 ${e.heroes.lancer.name} ${e.heroes.lancer.star}⭐ ${e.heroes.lancer.tier === 'MAX' ? 'MAX' : 'T'+e.heroes.lancer.tier} (+${e.heroes.lancer.widget})</span>` : ''}
                            ${e.heroes.marksman ? `<span class="hero-tag tag-mar">🏹 ${e.heroes.marksman.name} ${e.heroes.marksman.star}⭐ ${e.heroes.marksman.tier === 'MAX' ? 'MAX' : 'T'+e.heroes.marksman.tier} (+${e.heroes.marksman.widget})</span>` : ''}
                        </div>
                        <div class="rounds-container">
                            ${e.rounds.map(r => `<div class="damage-pill">${r.toLocaleString('id-ID')}</div>`).join('')}
                        </div>
                        ${e.note !== "-" ? `<div class="note-box text-center small italic">📝 ${e.note}</div>` : ''}
                    </div>
                `).join('')}
            </div>
            <div class="mt-4 text-center">
                <button class="btn btn-sm text-danger fw-bold text-decoration-none" onclick="deleteChar('${uid}')">Hapus Karakter</button>
            </div>
        `;
        container.appendChild(card);
        new Chart(document.getElementById(`chart-${uid}`), {
            type: 'line',
            data: {
                labels: charData.history.map(h => h.date),
                datasets: [{
                    data: charData.history.map(h => h.damage),
                    borderColor: '#00BFFF',
                    borderWidth: 3,
                    pointBackgroundColor: '#fff',
                    fill: true,
                    backgroundColor: 'rgba(0, 191, 255, 0.05)',
                    tension: 0.3
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { display: false }, x: { ticks: { font: { size: 9, weight: 'bold' }, color: '#a0aec0' }, grid: { display: false } } } }
        });
    });
}