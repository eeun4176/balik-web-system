/**
 * B.A.L.I.K. Frontend API Client
 * Points to Node.js + Express backend (SQLite).
 * Run: node server.js  →  http://localhost:3000
 */

const API_BASE = '/api';

const BALIK_API = {

    // ── Lookup / Dropdowns ───────────────────────────────────────────────────

    async getLookupAll() {
        const res = await fetch(`${API_BASE}/lookup/all`);
        if (!res.ok) throw new Error(`Lookup failed: ${res.status}`);
        return res.json();
    },

    async getRooms(locationId) {
        const res = await fetch(`${API_BASE}/lookup/rooms/${locationId}`);
        if (!res.ok) throw new Error(`Rooms fetch failed: ${res.status}`);
        return res.json();
    },

    async getSections(year) {
        const res = await fetch(`${API_BASE}/lookup/sections/${year}`);
        if (!res.ok) throw new Error(`Sections fetch failed: ${res.status}`);
        return res.json();
    },

    // ── Reports ──────────────────────────────────────────────────────────────

    async submitReport(data) {
        const res = await fetch(`${API_BASE}/reports`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(data),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Submit failed: ${res.status}`);
        }
        return res.json();
    },

    async searchItems({ q = '', categories = [], locations = [], statuses = [], page = 1, user_id } = {}) {
        const params = new URLSearchParams({
            q,
            categories: categories.join(','),
            locations:  locations.join(','),
            statuses:   statuses.join(','),
            page,
        });
        if (user_id) params.set('user_id', user_id);
        const res = await fetch(`${API_BASE}/items/search?${params}`);
        if (!res.ok) throw new Error(`Search failed: ${res.status}`);
        return res.json();
    },

    async getReport(id) {
        const res = await fetch(`${API_BASE}/reports/${id}`);
        if (!res.ok) throw new Error(`Report fetch failed: ${res.status}`);
        return res.json();
    },

    async updateReportStatus(id, status) {
        const res = await fetch(`${API_BASE}/reports/${id}/status`, {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error(`Status update failed: ${res.status}`);
        return res.json();
    },

    // ── Claims ───────────────────────────────────────────────────────────────

    async submitClaim(data) {
        const res = await fetch(`${API_BASE}/claims`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(data),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `Claim submit failed: ${res.status}`);
        return json;
    },

    async getClaims(reportId) {
        const res = await fetch(`${API_BASE}/claims?report_id=${reportId}`);
        if (!res.ok) throw new Error(`Claims fetch failed: ${res.status}`);
        return res.json();
    },

    // ── Upload ───────────────────────────────────────────────────────────────

    async uploadPhoto(file) {
        const fd = new FormData();
        fd.append('photo', file);
        const res = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            body:   fd,
        });
        if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
        return res.json();
    },

    // ── Helper ───────────────────────────────────────────────────────────────

    populateSelect(selectEl, items, placeholder = '---') {
        selectEl.innerHTML = `<option value="" disabled selected>${placeholder}</option>`;
        items.forEach(item => {
            const opt = document.createElement('option');
            opt.value       = item.value ?? item.id;
            opt.textContent = item.label;
            selectEl.appendChild(opt);
        });
    },
};

window.BALIK_API = BALIK_API;