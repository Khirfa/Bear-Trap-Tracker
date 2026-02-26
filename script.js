const STORAGE_KEY = 'btt_pro_final_repo';
let gameData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
let currentMode = 'auto';

document.addEventListener('DOMContentLoaded', () => {
    updateClock();
    renderData();
});

function checkUID(uid) {
    const data = gameData[uid];
    const nameInput = document.getElementById('charName');
    const heroSelects = document.querySelectorAll('.hero-select');
    if (uid.trim() === "" || !data) {
        nameInput.value = "";
        heroSelects.forEach(s => {
            s.selectedIndex = 0;
            if(s.id.includes('Star')) toggleTier(s.id.replace('Star', ''));
        });
        return;
    }
    nameInput.value = data.nickname;
    if (data.history.length > 0) {
        const heroes = data.history[data.history.length - 1].heroes;
        ['infantry', 'lancer', 'marksman'].forEach(cls => {
            if (heroes[cls]) {
                document.getElementById(`${cls}Name`).value = heroes[cls].name;
                document.getElementById(`${cls}Star`).value = heroes[cls].star;
                document.getElementById(`${cls}Widget`).value = heroes[cls].widget;
                const ts = document.getElementById(`${cls}Tier`);
                if (heroes[cls].star === "5") ts.value = "MAX";
                else ts.value = heroes[cls].tier || "0";
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
    document.getElementById('autoContainer').innerText = now.toLocaleDateString('id-ID', options);
    if(!document.getElementById('manualDateInput').value) document.getElementById('manualDateInput').value = now.toISOString().split('T')[0];
}

function formatNumber(input) {
    let v = input.value.replace(/\D/g, "");
    input.value = v.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function parseNumber(str) { return parseFloat(str.replace(/\./g, "")) || 0; }

function saveToLocal() { localStorage.setItem(STORAGE_KEY, JSON.stringify(gameData)); }

function getHeroData(cls) {
    const name = document.getElementById(`${cls}Name`).value;
    if(!name) return null;
    const star = document.getElementById(`${cls}Star`).value;
    return { name, star, tier: (star === "5" ? "MAX" : document.getElementById(`${cls}Tier`).value), widget: document.getElementById(`${cls}Widget`).value };
}

function saveData() {
    const uidI = document.getElementById('charUID'), nameI = document.getElementById('charName'), noteI = document.getElementById('charNote'), dmgI = document.querySelectorAll('.dmg-input');
    if (!uidI.value || !nameI.value) return alert("UID & Nickname wajib!");
    const rd = Array.from(dmgI).map(i => parseNumber(i.value));
    const highest = Math.max(...rd);
    if (highest === 0) return alert("Isi damage!");
    
    let dk = currentMode === 'auto' ? document.getElementById('autoContainer').innerText : new Date(document.getElementById('manualDateInput').value).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });

    if (!gameData[uidI.value]) gameData[uidI.value] = { nickname: nameI.value, history: [] };
    else gameData[uidI.value].nickname = nameI.value;

    gameData[uidI.value].history.push({ date: dk, damage: highest, rounds: rd, note: noteI.value || "-", heroes: { infantry: getHeroData('infantry'), lancer: getHeroData('lancer'), marksman: getHeroData('marksman') } });
    
    saveToLocal(); renderData();
    uidI.value = ""; checkUID(""); noteI.value = ""; dmgI.forEach(i => i.value = "");
}

function toggleDetail(uid) {
    const content = document.getElementById(`detail-${uid}`);
    const isVisible = content.style.display === "block";
    content.style.display = isVisible ? "none" : "block";
    if (!isVisible) renderChart(uid);
}

function renderChart(uid) {
    const ctx = document.getElementById(`chart-${uid}`);
    if (!ctx || ctx.getAttribute('data-done') === 'true') return;
    const history = gameData[uid].history;
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: history.map(h => h.date),
            datasets: [{
                data: history.map(h => h.damage),
                borderColor: '#00BFFF', borderWidth: 3, pointBackgroundColor: '#fff', fill: true, backgroundColor: 'rgba(0, 191, 255, 0.05)', tension: 0.3
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { display: false }, x: { ticks: { font: { size: 8 } }, grid: { display: false } } } }
    });
    ctx.setAttribute('data-done', 'true');
}

function renderData() {
    const container = document.getElementById('displayArea'), search = document.getElementById('searchInput').value.toLowerCase(), stats = document.getElementById('searchStats'), uids = Object.keys(gameData);
    if(uids.length === 0) { container.innerHTML = '<div class="glass-card text-center py-5">Belum ada data.</div>'; stats.innerText = ""; return; }
    
    const filtered = uids.filter(uid => uid.toLowerCase().includes(search) || gameData[uid].nickname.toLowerCase().includes(search));
    stats.innerText = `Menampilkan ${filtered.length} dari ${uids.length} Karakter`;
    container.innerHTML = '';
    
    filtered.forEach(uid => {
        const d = gameData[uid], hist = [...d.history].sort((a,b) => new Date(b.date) - new Date(a.date)), peak = Math.max(...d.history.map(h => h.damage));
        const card = document.createElement('div');
        card.className = 'glass-card mb-3 p-0 overflow-hidden shadow-sm';
        card.innerHTML = `
            <div class="char-row-header" onclick="toggleDetail('${uid}')">
                <div><small class="text-muted d-block" style="font-size:0.6rem">UID: ${uid}</small><span class="fw-bold">${d.nickname}</span></div>
                <div class="text-end"><span class="peak-badge-mini">${peak.toLocaleString('id-ID')}</span><i class="ms-2 small opacity-50">▼</i></div>
            </div>
            <div id="detail-${uid}" class="char-details-content">
                <div class="chart-wrapper mb-4" style="height: 160px;"><canvas id="chart-${uid}"></canvas></div>
                <div class="history-timeline">
                    ${hist.map(e => `
                        <div class="history-item">
                            <button class="btn-delete-item" onclick="deleteRow('${uid}', '${e.date}')">✕</button>
                            <div class="history-header">
                                <span class="history-date">${e.date}</span>
                            </div>
                            <span class="history-peak-val">${e.damage.toLocaleString('id-ID')}</span>
                            <div class="mb-2">
                                ${e.heroes.infantry ? `<span class="hero-tag tag-inf">🛡️ ${e.heroes.infantry.name} ${e.heroes.infantry.star}⭐ ${e.heroes.infantry.tier} (+${e.heroes.infantry.widget})</span>` : ''}
                                ${e.heroes.lancer ? `<span class="hero-tag tag-lan">🐎 ${e.heroes.lancer.name} ${e.heroes.lancer.star}⭐ ${e.heroes.lancer.tier} (+${e.heroes.lancer.widget})</span>` : ''}
                                ${e.heroes.marksman ? `<span class="hero-tag tag-mar">🏹 ${e.heroes.marksman.name} ${e.heroes.marksman.star}⭐ ${e.heroes.marksman.tier} (+${e.heroes.marksman.widget})</span>` : ''}
                            </div>
                            <div class="rounds-container">${e.rounds.map(r => `<div class="damage-pill">${r.toLocaleString('id-ID')}</div>`).join('')}</div>
                            ${e.note !== "-" ? `<div class="note-box mt-2">📝 ${e.note}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-sm text-danger w-100 mt-3 fw-bold" onclick="deleteChar('${uid}')">Hapus Karakter Permanen</button>
            </div>`;
        container.appendChild(card);
    });
}

window.deleteRow = (uid, date) => { if(confirm(`Hapus data ${date}?`)) { gameData[uid].history = gameData[uid].history.filter(e => e.date !== date); if(gameData[uid].history.length === 0) delete gameData[uid]; saveToLocal(); renderData(); } };
window.deleteChar = (uid) => { if(confirm(`Hapus permanen ${uid}?`)) { delete gameData[uid]; saveToLocal(); renderData(); } };

function exportFullBackup() {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const fileName = `BTT_${new Date().toLocaleDateString('id-ID').replace(/\//g,'-')}_${random}.json`;
    const blob = new Blob([JSON.stringify(gameData, null, 2)], { type: "application/json" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = fileName; link.click();
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if(confirm("Gabungkan data backup? UID yang sama akan diperbarui.")) {
                for (let uid in imported) {
                    if (gameData[uid]) { gameData[uid].nickname = imported[uid].nickname; gameData[uid].history = imported[uid].history; }
                    else gameData[uid] = imported[uid];
                }
                saveToLocal(); renderData(); alert("Berhasil!");
            }
        } catch (err) { alert("File tidak valid!"); }
    };
    reader.readAsText(file);
    event.target.value = '';
}