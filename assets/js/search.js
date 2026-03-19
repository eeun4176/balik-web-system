/**
 * SEARCH PAGE JAVASCRIPT
 * - Cards match Figma: image, item name, category, location, date, status, View + Claim buttons
 * - Clicking a card or View opens a detail modal
 * - Claim button goes to confirm-authentication.html?id=X
 * - Notification bell shows recent reports as notifications
 */

document.addEventListener("DOMContentLoaded", async function () {

    // ── 1. SELECTORS ──────────────────────────────────────────────────────
    const navbar      = document.getElementById('navbar');
    const navLogo     = document.getElementById('nav-logo');
    const menuIcon    = document.getElementById('menu-icon-svg');
    const backToTop   = document.getElementById('backToTop');
    const notifBell   = document.getElementById("notif-bell");
    const userIcon    = document.getElementById("user-icon");
    const iconWrapper = document.getElementById("icon-wrapper");
    const menuBtn     = document.getElementById('menu-btn');
    const closeBtn    = document.getElementById('close-btn');
    const menuOverlay = document.getElementById('menu-overlay');
    const menuDrawer  = document.getElementById('menu-drawer');

    const searchInput  = document.getElementById('search-input');
    const searchBtn    = document.getElementById('search-btn');
    const searchHeader = document.getElementById('search-header');
    const resultsMeta  = document.getElementById('results-meta');
    const activeTags   = document.getElementById('active-tags');
    const resultsGrid  = document.getElementById('results-grid');
    const itemsCount   = document.getElementById('items-count');
    const catContainer = document.getElementById('more-categories');
    const locContainer = document.getElementById('more-locations');

    // ── 2. NAVBAR SCROLL ──────────────────────────────────────────────────
    window.addEventListener("scroll", function () {
        const scrolled = window.scrollY > 50;
        navbar.classList.toggle('bg-white',       scrolled);
        navbar.classList.toggle('shadow-md',      scrolled);
        navbar.classList.toggle('py-3',           scrolled);
        navbar.classList.toggle('text-gray-800',  scrolled);
        navbar.classList.toggle('border-gray-100',scrolled);
        navbar.classList.toggle('text-white',    !scrolled);
        navbar.classList.toggle('border-white/15',!scrolled);
        navbar.classList.toggle('py-4',          !scrolled);
        if (navLogo)  { navLogo.src = scrolled ? "../images/balik-logo-black.png" : "../images/balik-logo-white.png"; navLogo.style.height = scrolled ? "60px" : "80px"; }
        if (menuIcon)  menuIcon.classList.toggle('text-black', scrolled);
        if (notifBell) notifBell.style.filter = scrolled ? "brightness(0)" : "brightness(0) invert(1)";
        if (userIcon && !userIcon.dataset.hasPhoto)  userIcon.style.filter  = scrolled ? "brightness(0)" : "none";
        if (iconWrapper) { iconWrapper.classList.toggle('lg:border-white/50', !scrolled); iconWrapper.classList.toggle('lg:border-gray-200', scrolled); }
        if (backToTop) {
            const vis = window.scrollY > 500;
            backToTop.classList.toggle('opacity-0',!vis); backToTop.classList.toggle('invisible',!vis); backToTop.classList.toggle('translate-y-10',!vis);
            backToTop.classList.toggle('opacity-100',vis); backToTop.classList.toggle('visible',vis); backToTop.classList.toggle('translate-y-0',vis);
        }
    });
    if (backToTop) backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // ── 3. MOBILE MENU ────────────────────────────────────────────────────
    function toggleMenu() {
        if (!menuOverlay || !menuDrawer) return;
        menuOverlay.classList.toggle('opacity-0');
        menuOverlay.classList.toggle('pointer-events-none');
        menuDrawer.classList.toggle('-translate-x-full');
    }
    if (menuBtn)     menuBtn.addEventListener('click', toggleMenu);
    if (closeBtn)    closeBtn.addEventListener('click', toggleMenu);
    if (menuOverlay) menuOverlay.addEventListener('click', e => { if (e.target === menuOverlay) toggleMenu(); });

    // ── 4. NOTIFICATION BELL — handled by shared notifications.js ────────────

    // ── 5. LOOKUP DATA ────────────────────────────────────────────────────
    let lookupData = { categories: [], locations: [] };
    try { lookupData = await BALIK_API.getLookupAll(); } catch (e) {}

    // Build filter list from DB data only - first 3 in top container, rest in more container
    function buildFilterList(topContainer, moreContainer, apiItems, prefix) {
        if (!topContainer) return;
        const items = apiItems && apiItems.length ? apiItems.map(i => i.label) : [];
        const makeLabel = (item, idx) => {
            const id = prefix + '-' + idx;
            return '<label class="flex items-center gap-3 cursor-pointer"><input type="checkbox" id="' + id + '" class="filter-checkbox w-5 h-5 rounded text-french-blue" data-filter-label="' + item.replace(/"/g, '&quot;') + '"><span>' + item + '</span></label>';
        };
        topContainer.innerHTML  = items.slice(0, 3).map((item, i) => makeLabel(item, i)).join('');
        if (moreContainer) moreContainer.innerHTML = items.slice(3).map((item, i) => makeLabel(item, i + 3)).join('');
    }
    buildFilterList(
        document.getElementById('top-categories'),
        catContainer,
        lookupData.categories,
        'cat'
    );
    buildFilterList(
        document.getElementById('top-locations'),
        locContainer,
        lookupData.locations,
        'loc'
    );

    // ── 6. ITEM DETAIL MODAL ──────────────────────────────────────────────
    document.body.insertAdjacentHTML('beforeend',
        '<div id="item-modal" class="fixed inset-0 flex items-center justify-center p-4 opacity-0 pointer-events-none transition-opacity duration-300" style="z-index:9999;">'
        + '<div class="absolute inset-0 bg-black/70 backdrop-blur-sm" id="modal-backdrop" style="z-index:0;"></div>'
        + '<div class="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto transform scale-95 transition-transform duration-300" id="modal-box" style="z-index:1;">'
        + '<button id="modal-close" class="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer">'
        + '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>'
        + '</button>'
        + '<div class="h-56 bg-gray-100 rounded-t-3xl overflow-hidden"><div id="modal-image" class="w-full h-full flex items-center justify-center text-gray-300 text-6xl">📦</div></div>'
        + '<div class="p-6">'
        + '<div class="flex justify-between items-start mb-1"><h2 id="modal-title" class="text-xl font-bold text-gray-800 pr-4"></h2><span id="modal-type-badge" class="text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap"></span></div>'
        + '<span id="modal-status-badge" class="inline-block text-xs px-3 py-1 rounded-full mb-4 capitalize"></span>'
        + '<div class="grid grid-cols-2 gap-4 text-sm mb-4">'
        + '<div><p class="text-gray-400 text-xs mb-0.5">Category</p><p id="modal-category" class="font-medium text-gray-700">—</p></div>'
        + '<div><p class="text-gray-400 text-xs mb-0.5">Location</p><p id="modal-location" class="font-medium text-gray-700">—</p></div>'
        + '<div><p class="text-gray-400 text-xs mb-0.5">Date</p><p id="modal-date" class="font-medium text-gray-700">—</p></div>'
        + '<div><p class="text-gray-400 text-xs mb-0.5">Time</p><p id="modal-time" class="font-medium text-gray-700">—</p></div>'
        + '</div>'
        + '<div id="modal-desc-wrap" class="mb-5 hidden"><p class="text-gray-400 text-xs mb-1">Description</p><p id="modal-desc" class="text-sm text-gray-700 leading-relaxed"></p></div>'
        + '<div class="flex gap-3 mt-4">'
        + '<button id="modal-claim-btn" class="flex-1 bg-french-blue text-white py-2.5 rounded-xl font-bold hover:bg-hover-blue transition-colors cursor-pointer">Claim</button>'
        + '<button id="modal-close-btn" class="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition-colors cursor-pointer">Close</button>'
        + '</div></div></div></div>'
    );

    const modal        = document.getElementById('item-modal');
    const modalBox     = document.getElementById('modal-box');
    const modalClose   = document.getElementById('modal-close');
    const modalCloseBtn= document.getElementById('modal-close-btn');
    const modalBackdrop= document.getElementById('modal-backdrop');
    const modalClaimBtn= document.getElementById('modal-claim-btn');

    async function openModal(item) {
        const isFoundItem = item.report_type === 'found';
    const imgEl = document.getElementById('modal-image');
    
    // ── 1. BLUR IMAGE IF FOUND ──
    const blurClass = isFoundItem ? 'blur-lg scale-110' : '';
    imgEl.innerHTML = item.photo
        ? '<img src="' + item.photo + '" class="w-full h-full object-cover transition-all ' + blurClass + '" alt="' + item.item_name + '">'
        : '<span class="text-6xl">📦</span>';

    // ── 2. SET BASIC INFO (Visible to everyone) ──
    document.getElementById('modal-title').textContent = item.item_name || '—';
    document.getElementById('modal-category').textContent = item.category || item.category_label || '—';
    document.getElementById('modal-date').textContent = item.incident_date ? item.incident_date.split('T')[0] : '—';

    // ── 3. CONDITIONAL VISIBILITY (Privacy Layer) ──
    const locElement = document.getElementById('modal-location').parentElement;
    const timeElement = document.getElementById('modal-time').parentElement;
    const descWrap = document.getElementById('modal-desc-wrap');

    if (isFoundItem) {
        // Hide sensitive details for found items
        locElement.classList.add('hidden');
        timeElement.classList.add('hidden');
        descWrap.classList.add('hidden');
    } else {
        // Show all details for lost items
        const loc = [item.location || item.location_label, item.room || item.room_label].filter(Boolean).join(' · ');
        document.getElementById('modal-location').textContent = loc || '—';
        document.getElementById('modal-time').textContent = item.incident_time || '—';
        locElement.classList.remove('hidden');
        timeElement.classList.remove('hidden');

        if (item.description) {
            document.getElementById('modal-desc').textContent = item.description;
            descWrap.classList.remove('hidden');
        } else {
            descWrap.classList.add('hidden');
        }
    }

    // ── 4. BADGES ──
    const typeBadge = document.getElementById('modal-type-badge');
    typeBadge.textContent = isFoundItem ? 'Found' : 'Lost';
    typeBadge.className = 'text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ' + (isFoundItem ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700');

    const statusBadge = document.getElementById('modal-status-badge');
    const statusMap = { active: 'bg-blue-100 text-blue-700', pending: 'bg-yellow-100 text-yellow-700', resolved: 'bg-green-100 text-green-700' };
    statusBadge.textContent = item.status || 'active';
    statusBadge.className = 'inline-block text-xs px-3 py-1 rounded-full mb-4 capitalize ' + (statusMap[item.status] || 'bg-gray-100 text-gray-500');

    // ── 5. MODAL ANIMATION ──
    modal.classList.remove('opacity-0', 'pointer-events-none');
    modalBox.classList.remove('scale-95');
    modalBox.classList.add('scale-100');
    document.body.style.overflow = 'hidden';

    // ── 6. CLAIM BUTTON LOGIC ──
    if (!isFoundItem) {
        modalClaimBtn.style.display = 'none'; // Lost items cannot be claimed
    } else {
        modalClaimBtn.style.display = '';
        modalClaimBtn.textContent = 'Claim';
        modalClaimBtn.disabled = false;
        modalClaimBtn.className = 'flex-1 bg-french-blue text-white py-2.5 rounded-xl font-bold hover:bg-hover-blue transition-colors cursor-pointer';
        modalClaimBtn.onclick = () => { window.location.href = 'confirm-authentication.html?id=' + item.id; };
    }

    // ── 7. CLAIM STATUS CHECK (Existing Logic) ──
    try {
        const su = JSON.parse(localStorage.getItem('balik_user') || '{}');
        if (su.id) {
            const userClaims = await fetch('/api/claims/user/' + su.id).then(r => r.json()).catch(() => []);
            const itemClaims = Array.isArray(userClaims) ? userClaims.filter(c => Number(c.report_id) === Number(item.id)) : [];
            const latestClaim = itemClaims.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
            const rejCount = itemClaims.filter(c => c.claim_status === 'rejected').length;

            if (latestClaim?.claim_status === 'pending') {
                modalClaimBtn.textContent = '⏳ Claim Pending';
                modalClaimBtn.disabled = true;
                modalClaimBtn.className = 'flex-1 bg-yellow-100 text-yellow-700 py-2.5 rounded-xl font-bold cursor-not-allowed';
                modalClaimBtn.onclick = null;
            } else if (latestClaim?.claim_status === 'approved') {
                modalClaimBtn.textContent = '✅ Claim Approved';
                modalClaimBtn.disabled = true;
                modalClaimBtn.className = 'flex-1 bg-green-100 text-green-700 py-2.5 rounded-xl font-bold cursor-not-allowed';
                modalClaimBtn.onclick = null;
            } else if (latestClaim?.claim_status === 'rejected' && rejCount >= 2) {
                modalClaimBtn.textContent = '🚫 No attempts left';
                modalClaimBtn.disabled = true;
                modalClaimBtn.className = 'flex-1 bg-red-100 text-red-500 py-2.5 rounded-xl font-bold cursor-not-allowed';
                modalClaimBtn.onclick = null;
            } else if (latestClaim?.claim_status === 'rejected') {
                modalClaimBtn.textContent = '↩ Retry Claim (1 left)';
                modalClaimBtn.disabled = false;
                modalClaimBtn.className = 'flex-1 bg-orange-500 text-white py-2.5 rounded-xl font-bold hover:bg-orange-600 transition-colors cursor-pointer';
                modalClaimBtn.onclick = () => { window.location.href = 'confirm-authentication.html?id=' + item.id; };
            }
        }
    } catch (e) { /* non-blocking */ }
    }

    function closeModal() {
        modal.classList.add('opacity-0','pointer-events-none');
        modalBox.classList.add('scale-95');
        modalBox.classList.remove('scale-100');
        document.body.style.overflow = '';
    }

    modalClose.addEventListener('click', closeModal);
    modalCloseBtn.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', closeModal);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

    window.openItemModal = function(item) { openModal(item); };
    window.claimItem = async function(id) {

    
        // If user is the reporter, do nothing (card shouldn't show Claim anyway, but safety check)
    try {
        const su = JSON.parse(localStorage.getItem('balik_user') || '{}');
        if (su.id) {
            // Check if user reported this item
            const report = await fetch('/api/reports/' + id).then(r => r.json());
            if (report && Number(report.reporter_id) === Number(su.id)) return;

            const claims = await fetch('/api/claims?report_id=' + id).then(r => r.json());
            const alreadyClaimed = Array.isArray(claims) && claims.some(c => Number(c.claimant_id) === Number(su.id));
            if (alreadyClaimed) {
                const btn = document.querySelector('[onclick="claimItem(' + id + ')"]');
                if (btn) {
                    btn.textContent = '✓ Claim Submitted';
                    btn.disabled = true;
                    btn.className = btn.className.replace('bg-french-blue text-white', 'bg-gray-200 text-gray-500 cursor-not-allowed');
                    btn.onclick = null;
                }
                return;
            }
        }
    } catch(e) { /* non-blocking */ }
    window.location.href = 'confirm-authentication.html?id=' + id;    

    };

    

    window.openModalById = async function(id) {
        try { openModal(await BALIK_API.getReport(id)); } catch(e) { console.error(e); }
    };

    // ── 7. SEARCH ─────────────────────────────────────────────────────────
    let currentPage = 1;

    async function doSearch(page) {
        currentPage = page || 1;
        const q = searchInput ? searchInput.value.trim() : '';
        const selectedCategories = [], selectedLocations = [], selectedStatuses = [];

        // Read only from aside to avoid counting mobile drawer duplicates
        const asideEl = document.querySelector('aside');
        (asideEl || document).querySelectorAll('.filter-checkbox:checked').forEach(cb => {
            const label = cb.dataset.filterLabel || (cb.nextElementSibling ? cb.nextElementSibling.innerText.trim() : '');
            if (!label) return;
            if (cb.closest('#category-list')) selectedCategories.push(label);
            else if (cb.closest('#location-list')) selectedLocations.push(label);
        });
        ['status-active','status-pending'].forEach(id => {
            const el = document.getElementById(id);
            if (el && el.checked) selectedStatuses.push(id.replace('status-',''));
        });

        if (searchHeader) {
            if (q) { searchHeader.classList.remove('hidden'); const qt = document.getElementById('search-query-text'); if (qt) qt.innerText = '"' + q + '"'; }
            else searchHeader.classList.add('hidden');
        }

        if (resultsGrid) resultsGrid.innerHTML = '<div class="col-span-3 flex justify-center items-center py-16"><div class="w-8 h-8 border-4 border-french-blue border-t-transparent rounded-full animate-spin"></div></div>';

        try {
            const su = JSON.parse(localStorage.getItem('balik_user') || '{}');
            const data = await BALIK_API.searchItems({ q, categories: selectedCategories, locations: selectedLocations, statuses: selectedStatuses, page: currentPage, user_id: su.id || '' });
            if (itemsCount) itemsCount.textContent = data.total;
            if (resultsMeta) resultsMeta.classList.remove('hidden');
            renderResults(data.items, data.total, data.limit);
            updateTags();
        } catch (e) {
            if (resultsGrid) resultsGrid.innerHTML = '<p class="text-gray-400 italic text-center col-span-3 py-12">Could not connect to server.</p>';
        }
    }

    //BINAGO NI IAN
           // ── 8. RENDER CARDS (Modified for B.A.L.I.K. Found Item Privacy) ───────────────────────
async function renderResults(items, total, limit) {
    if (!resultsGrid) return;
    if (!items || !items.length) {
        resultsGrid.innerHTML = '<div class="col-span-3 text-center text-gray-400 italic py-16">No items found.</div>';
        renderPagination(0, limit); return;
    }

    let claimStatusMap = {}; 
    try {
        const su = JSON.parse(localStorage.getItem('balik_user') || '{}');
        if (su.id) {
            const userClaims = await fetch('/api/claims/user/' + su.id).then(r => r.json()).catch(() => []);
            if (Array.isArray(userClaims)) {
                userClaims.forEach(c => {
                    const existing = claimStatusMap[Number(c.report_id)];
                    if (!existing || new Date(c.created_at) > new Date(existing.created_at)) {
                        claimStatusMap[Number(c.report_id)] = {
                            status: c.claim_status,
                            rejection_count: Number(c.rejection_count) || 0,
                            created_at: c.created_at
                        };
                    }
                });
            }
        }
    } catch(e) {}

    resultsGrid.innerHTML = items.map(function(item) {
        const claimInfo   = claimStatusMap[Number(item.id)];
        const statusClass = { resolved:'bg-green-100 text-green-700', pending:'bg-yellow-100 text-yellow-700', active:'bg-blue-100 text-blue-700' }[item.status] || 'bg-gray-100 text-gray-500';
        const typeClass   = item.report_type === 'found' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
        const typeLabel   = item.report_type === 'found' ? 'Found' : 'Lost';
        
        // ── 1. BLUR PHOTO FOR FOUND ITEMS ──
        const blurClass   = item.report_type === 'found' ? 'blur-md scale-110' : '';
        const photoEl     = item.photo 
            ? '<img src="' + item.photo + '" class="w-full h-full object-cover transition-all ' + blurClass + '" alt="' + item.item_name + '">' 
            : '<div class="w-full h-full flex items-center justify-center text-gray-300 text-5xl">📦</div>';
        
        const loc         = [item.location, item.room].filter(Boolean).join(' · ');
        const date        = item.incident_date ? item.incident_date.split('T')[0] : '';
        const safeItem    = JSON.stringify(item).replace(/'/g, "\\'");

        let claimBtn = '';
        const su2 = JSON.parse(localStorage.getItem('balik_user') || '{}');
        const isReporter = su2.id && Number(item.reporter_id) === Number(su2.id);

        if (isReporter) {
            claimBtn = '<span class="text-xs text-gray-400 px-4 py-1.5 italic">Your report</span>';
        } else if (!claimInfo) {
            claimBtn = '<button onclick="claimItem(' + item.id + ')" class="text-xs bg-french-blue text-white px-4 py-1.5 rounded-lg font-semibold hover:bg-hover-blue transition-colors cursor-pointer">Claim</button>';
        } else if (claimInfo.status === 'pending') {
            claimBtn = '<button disabled class="text-xs bg-yellow-100 text-yellow-700 px-4 py-1.5 rounded-lg font-semibold cursor-not-allowed">⏳ Pending</button>';
        } else if (claimInfo.status === 'approved') {
            claimBtn = '<button disabled class="text-xs bg-green-100 text-green-700 px-4 py-1.5 rounded-lg font-semibold cursor-not-allowed">✅ Approved</button>';
        } else if (claimInfo.status === 'rejected' && claimInfo.rejection_count >= 2) {
            claimBtn = '<button disabled class="text-xs bg-red-100 text-red-500 px-4 py-1.5 rounded-lg font-semibold cursor-not-allowed">🚫 No attempts left</button>';
        } else if (claimInfo.status === 'rejected') {
            claimBtn = '<button onclick="claimItem(' + item.id + ')" title="1 retry remaining" class="text-xs bg-orange-500 text-white px-4 py-1.5 rounded-lg font-semibold hover:bg-orange-600 transition-colors cursor-pointer">↩ Retry</button>';
        } else {
            claimBtn = '<button onclick="claimItem(' + item.id + ')" class="text-xs bg-french-blue text-white px-4 py-1.5 rounded-lg font-semibold hover:bg-hover-blue transition-colors cursor-pointer">Claim</button>';
        }

        // ── 2. CONDITIONAL LAYOUT FOR FOUND ITEMS (Privacy Mode) ──
        if (item.report_type === 'found') {
            return '<div class="bg-white rounded-3xl shadow-sm overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col">'
                + '<div class="h-44 bg-gray-100 overflow-hidden relative">' + photoEl + '</div>'
                + '<div class="p-5 flex flex-col flex-1">'
                + '<div class="flex justify-between items-start mb-1"><h3 class="font-bold text-gray-800 text-base leading-tight truncate pr-2">' + item.item_name + '</h3></div>'
                + '<p class="text-xs text-gray-400 mb-0.5">Category: <span class="text-gray-600">' + (item.category || '—') + '</span></p>'
                + '<p class="text-xs text-gray-400 mb-3">Date Found: <span class="text-gray-600">' + (date || '—') + '</span></p>'
                + '<div class="flex items-center justify-between mt-auto">'
                + '<span class="text-xs font-bold px-3 py-1 rounded-full ' + typeClass + '">' + typeLabel + '</span>'
                + '<button onclick=\'openItemModal(' + safeItem + ')\' class="text-xs border border-french-blue text-french-blue px-4 py-1.5 rounded-lg font-semibold hover:bg-french-blue hover:text-white transition-colors cursor-pointer">View to Claim</button>'
                + '</div></div></div>';
        }

        // ── 3. STANDARD LAYOUT FOR LOST ITEMS (Full Details) ──
        return '<div class="bg-white rounded-3xl shadow-sm overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col">'
            + '<div class="h-44 bg-gray-100 overflow-hidden cursor-pointer" onclick=\'openItemModal(' + safeItem + ')\'>' + photoEl + '</div>'
            + '<div class="p-5 flex flex-col flex-1">'
            + '<div class="flex justify-between items-start mb-1"><h3 class="font-bold text-gray-800 text-base leading-tight truncate pr-2">' + item.item_name + '</h3><span class="text-xs px-2 py-0.5 rounded-full capitalize shrink-0 ' + statusClass + '">' + (item.status || '') + '</span></div>'
            + '<p class="text-xs text-gray-400 mb-0.5">Category: <span class="text-gray-600">' + (item.category || '—') + '</span></p>'
            + '<p class="text-xs text-gray-400 mb-0.5">Location: <span class="text-gray-600">' + (loc || '—') + '</span></p>'
            + '<p class="text-xs text-gray-400 mb-3">Date ' + typeLabel + ': <span class="text-gray-600">' + (date || '—') + '</span></p>'
            + '<div class="flex items-center justify-between mt-auto">'
            + '<span class="text-xs font-bold px-3 py-1 rounded-full ' + typeClass + '">' + typeLabel + '</span>'
            + '<div class="flex gap-2">'
            + '<button onclick=\'openItemModal(' + safeItem + ')\' class="text-xs border border-french-blue text-french-blue px-4 py-1.5 rounded-lg font-semibold hover:bg-french-blue hover:text-white transition-colors cursor-pointer">View</button>'
            + claimBtn
            + '</div></div></div></div>';
    }).join('');
    renderPagination(total, limit);
}

    // ── 9. PAGINATION ─────────────────────────────────────────────────────
    function renderPagination(total, limit) {
        const container = document.getElementById('pagination-container');
        if (!container) return;
        const totalNum = Number(total) || 0;
        const limitNum = Number(limit) || 12;
        const totalPages = Math.max(1, Math.ceil(totalNum / limitNum));
        if (totalNum === 0) { container.innerHTML = ''; return; }
        const bA = 'w-10 h-10 rounded-xl font-bold transition-colors cursor-pointer bg-french-blue text-white shadow-md';
        const bG = 'w-10 h-10 rounded-xl font-bold transition-colors cursor-pointer bg-gray-200 text-french-blue hover:bg-gray-300';
        const bR = 'w-10 h-10 rounded-xl font-bold transition-colors cursor-pointer bg-gray-200 flex items-center justify-center hover:bg-gray-300 group';
        let html = '<button class="' + bR + '" onclick="changePage(' + (currentPage-1) + ')" ' + (currentPage===1?'disabled':'') + '><img src="../icons/down-arrow.png" class="w-2.5 h-2.5 rotate-90 opacity-60 group-hover:opacity-100" alt="prev"></button>';
        for (let i = 1; i <= totalPages; i++) html += '<button class="' + (i===currentPage?bA:bG) + '" onclick="changePage(' + i + ')">' + i + '</button>';
        html += '<button class="' + bR + '" onclick="changePage(' + (currentPage+1) + ')" ' + (currentPage===totalPages?'disabled':'') + '><img src="../icons/down-arrow.png" class="w-2.5 h-2.5 -rotate-90 opacity-60 group-hover:opacity-100" alt="next"></button>';
        container.innerHTML = html;
    }
    window.changePage = function(page) { if (page < 1) return; doSearch(page); window.scrollTo({ top: 400, behavior: 'smooth' }); };

    // ── 10. FILTER TAGS ───────────────────────────────────────────────────
    function updateTags() {
        if (!activeTags) return;
        activeTags.innerHTML = '';
        // Only read from aside (not mobile drawer clones) to avoid duplicates
        const asideEl = document.querySelector('aside');
        if (!asideEl) return;
        asideEl.querySelectorAll('.filter-checkbox:checked').forEach(cb => {
            if (['status-active','status-pending','status-resolved'].includes(cb.id)) return;
            const label = cb.dataset.filterLabel || (cb.nextElementSibling ? cb.nextElementSibling.innerText.trim() : '');
            if (!label || !cb.id) return;
            const tag = document.createElement('div');
            tag.className = 'bg-french-blue text-white px-4 py-1.5 rounded-full text-xs flex items-center gap-2';
            tag.innerHTML = '<span>' + label + '</span><button class="cursor-pointer hover:opacity-70" onclick="removeTag(\'' + cb.id + '\')">&#x2715;</button>';
            activeTags.appendChild(tag);
        });
        ['status-active','status-pending','status-resolved'].forEach(id => {
            const el = document.getElementById(id);
            if (!el || !el.checked) return;
            const lbl = id.replace('status-',''); const label = lbl.charAt(0).toUpperCase() + lbl.slice(1);
            const tag = document.createElement('div');
            tag.className = 'bg-french-blue text-white px-4 py-1.5 rounded-full text-xs flex items-center gap-2';
            tag.innerHTML = '<span>' + label + '</span><button class="cursor-pointer hover:opacity-70" onclick="removeTag(\'' + id + '\')">&#x2715;</button>';
            activeTags.appendChild(tag);
        });
    }
    window.removeTag = function(id) { const cb = document.getElementById(id); if (cb) { cb.checked = false; updateTags(); doSearch(1); } };

    // ── 11. WIRE UP ───────────────────────────────────────────────────────
    if (searchBtn)   searchBtn.onclick = () => doSearch(1);
    if (searchInput) searchInput.addEventListener('keypress', e => { if (e.key === 'Enter') doSearch(1); });
    document.addEventListener('change', e => {
        if (e.target.classList.contains('filter-checkbox') || ['status-active','status-pending','status-resolved'].includes(e.target.id)) { updateTags(); doSearch(1); }
    });
    const seeMoreCat = document.getElementById('see-more-cat');
    const seeMoreLoc = document.getElementById('see-more-loc');
    if (seeMoreCat) seeMoreCat.onclick = function() { catContainer.classList.toggle('hidden'); this.innerText = catContainer.classList.contains('hidden') ? 'See more' : 'See less'; };
    if (seeMoreLoc) seeMoreLoc.onclick = function() { locContainer.classList.toggle('hidden'); this.innerText = locContainer.classList.contains('hidden') ? 'See more' : 'See less'; };
    window.toggleFilter = (listId, arrowId) => { const l = document.getElementById(listId); const a = document.getElementById(arrowId); if (l) l.classList.toggle('hidden'); if (a) a.classList.toggle('arrow-down'); };
    const clearAll = document.getElementById('clear-all');
    if (clearAll) clearAll.onclick = function() { document.querySelectorAll('.filter-checkbox:checked').forEach(cb => cb.checked = false); updateTags(); doSearch(1); };

    // ── 12. INITIAL LOAD ──────────────────────────────────────────────────
    doSearch(1);
});
// ── Load profile photo from localStorage into navbar user-icon ───────────────
(function loadNavbarPhoto() {
    try {
        const stored = localStorage.getItem('balik_user');
        if (!stored) return;
        const user = JSON.parse(stored);
        if (!user || !user.profile_photo) return;
        const icons = document.querySelectorAll('#user-icon');
        icons.forEach(el => {
            el.src = user.profile_photo;
            el.style.filter = 'none';
            el.style.objectFit = 'cover';
            el.style.borderRadius = '9999px';
            el.dataset.hasPhoto = '1';
        });
    } catch(e) {}
})();
// ── MOBILE FILTER DRAWER ──────────────────────────────────────────────────────
(function initMobileFilter() {
    // Mirror aside filter content into mobile drawer on first open
    let mirrored = false;

    window.toggleMobileFilter = function() {
        const drawer  = document.getElementById('mobile-filter-drawer');
        const overlay = document.getElementById('mobile-filter-overlay');
        if (!drawer) return;

        const isOpen = !drawer.classList.contains('translate-y-full');
        if (isOpen) {
            drawer.classList.add('translate-y-full');
            overlay.classList.add('hidden');
            document.body.style.overflow = '';
        } else {
            // Mirror aside into drawer on first open - copy innerHTML (not clone) to keep same ids
            if (!mirrored) {
                const aside   = document.querySelector('aside');
                const mobileContent = document.getElementById('mobile-filter-content');
                if (aside && mobileContent) {
                    mobileContent.innerHTML = aside.querySelector('.border-t') ? 
                        Array.from(aside.querySelectorAll('.border-t')).map(s => s.outerHTML).join('') : '';
                    // After cloning, deduplicate ids by appending -m suffix to mobile copies
                    mobileContent.querySelectorAll('[id]').forEach(el => {
                        el.id = el.id + '-m';
                    });
                    mirrored = true;
                }
            }
            drawer.classList.remove('translate-y-full');
            overlay.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    };

    // Sync drawer checkboxes ↔ aside checkboxes by matching stable id
    document.addEventListener('change', function(e) {
        if (!e.target.classList.contains('filter-checkbox') &&
            !['status-active','status-pending','status-resolved'].includes(e.target.id)) return;

        const id  = e.target.id;
        const val = e.target.checked;

        // Only sync when id is non-empty (prevents selecting all unlabelled checkboxes)
        if (id) {
            document.querySelectorAll('#' + id).forEach(cb => {
                if (cb !== e.target) cb.checked = val;
            });
        }

        updateMobileFilterCount();
    });

    function updateMobileFilterCount() {
        const total = document.querySelectorAll('aside .filter-checkbox:checked, aside #status-active:checked, aside #status-pending:checked, aside #status-resolved:checked').length;
        const badge = document.getElementById('mobile-filter-count');
        if (!badge) return;
        if (total > 0) {
            badge.textContent = total;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    // Wire clear all buttons
    document.addEventListener('DOMContentLoaded', function() {
        ['clear-all-mobile', 'clear-all-drawer'].forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) btn.onclick = function() {
                document.querySelectorAll('.filter-checkbox').forEach(cb => cb.checked = false);
                ['status-active','status-pending','status-resolved'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.checked = false;
                });
                updateMobileFilterCount();
                if (typeof updateTags === 'function') updateTags();
                if (typeof doSearch === 'function') doSearch(1);
            };
        });
    });
})();