/**
 * BALIK-BALIK PROJECT - MAIN JAVASCRIPT
 */

document.addEventListener("DOMContentLoaded", function () {

    // --- 1. ELEMENT DECLARATIONS ---
    const navbar = document.getElementById('navbar');
    const navLogo = document.getElementById('nav-logo');
    const navLinks = document.getElementById('nav-links');
    const menuIcon = document.getElementById('menu-icon-svg');
    const backToTop = document.getElementById('backToTop');
    const iconWrapper = document.getElementById('icon-wrapper');
    const notifBell = document.getElementById('notif-bell');
    const userIcon = document.getElementById('user-icon');

    const menuBtn = document.getElementById('menu-btn');
    const closeBtn = document.getElementById('close-btn');
    const menuOverlay = document.getElementById('menu-overlay');
    const menuDrawer = document.getElementById('menu-drawer');

    // --- 2. CORE SCROLL LOGIC ---
    function handleScrollEffects() {
        const scrollValue = window.scrollY;
        const isScrolled  = scrollValue > 50;

        if (isScrolled) {
            navbar.classList.add('bg-white', 'shadow-md', 'py-3', 'text-gray-800', 'border-gray-100');
            navbar.classList.remove('text-white', 'py-4');
            if (navLogo) navLogo.src = "../images/balik-logo-black.png";
            if (notifBell) notifBell.style.filter = "brightness(0)";
            if (userIcon && !userIcon.dataset.hasPhoto) userIcon.style.filter = "brightness(0)";
        } else {
            navbar.classList.remove('bg-white', 'shadow-md', 'py-3', 'text-gray-800', 'border-gray-100');
            navbar.classList.add('text-white', 'py-4');
            if (navLogo) navLogo.src = "../images/balik-logo-white.png";
            if (notifBell) notifBell.style.filter = "brightness(0) invert(1)";
            if (userIcon) userIcon.style.filter = "none";
        }

        if (backToTop) {
            const isVisible = scrollValue > 500;
            backToTop.classList.toggle('opacity-100', isVisible);
            backToTop.classList.toggle('visible', isVisible);
            backToTop.classList.toggle('translate-y-0', isVisible);
        }
    }

    window.addEventListener("scroll", handleScrollEffects);
    handleScrollEffects();

    // --- 3. NAVIGATION & MODAL INTERACTION ---
    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Mobile Drawer Toggle
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            menuOverlay.classList.remove('opacity-0', 'pointer-events-none');
            menuDrawer.classList.remove('-translate-x-full');
        });
    }
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            menuOverlay.classList.add('opacity-0', 'pointer-events-none');
            menuDrawer.classList.add('-translate-x-full');
        });
    }

    // --- 5. TAB SWITCHING LOGIC ---
    const overviewTabBtn = document.getElementById('overview-tab-btn');
    const reportTabBtn = document.getElementById('report-tab-btn');
    const overviewView = document.getElementById('overview-view');
    const reportsView = document.getElementById('reports-view');
    const claimsTabBtn = document.getElementById('claims-tab-btn');
    const claimsView = document.getElementById('claims-view');
    const settingsTabBtn = document.getElementById('settings-tab-btn');
    const settingsView = document.getElementById('settings-view');

    function switchTab(clickedBtn, targetView) {
        // Hide all views
        document.querySelectorAll('.tab-content').forEach(view => view.classList.add('hidden'));
        // Show target view
        targetView.classList.remove('hidden');

        // Reset all sidebar buttons
        document.querySelectorAll('.tab-link').forEach(btn => {
            btn.classList.remove('bg-french-blue', 'text-white', 'font-medium', 'shadow-sm');
            btn.classList.add('text-gray-500', 'hover:bg-gray-50');
        });

        // Highlight clicked button
        clickedBtn.classList.add('bg-french-blue', 'text-white', 'font-medium', 'shadow-sm');
        clickedBtn.classList.remove('text-gray-500', 'hover:bg-gray-50');
    }

    if (overviewTabBtn) {
        overviewTabBtn.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(overviewTabBtn, overviewView);
        });
    }

    if (reportTabBtn) {
        reportTabBtn.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(reportTabBtn, reportsView);
        });
    }

    // Add the event listener to handle the click
    if (claimsTabBtn) {
    claimsTabBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Uses the switchTab function from the previous step
        switchTab(claimsTabBtn, claimsView);
        });
    }

    if (settingsTabBtn) {
    settingsTabBtn.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab(settingsTabBtn, settingsView);
        });
    }   

    // --- 6. PROFILE MODAL LOGIC ---
    const uploadModal = document.getElementById('upload-modal');
    const selectionView = document.getElementById('selection-view');
    const previewView = document.getElementById('preview-view');
    const imagePreview = document.getElementById('image-preview');
    const fileInput = document.getElementById('modal-file-input');

    // This function must be attached to window to work with onclick=""
    window.resetModal = function() {
        console.log("Cancelling/Resetting Modal..."); // Debugging check
        
        // 1. Reset the views
        if (selectionView) selectionView.classList.remove('hidden');
        if (previewView) previewView.classList.add('hidden');
        
        // 2. Clear the data
        if (imagePreview) imagePreview.src = '#';
        if (fileInput) fileInput.value = ''; // This "cancels" the selected file
    };

    window.openUploadModal = function() {
        if (uploadModal) {
            uploadModal.classList.remove('hidden');
            window.resetModal(); // Always start fresh
        }
    };

    window.closeUploadModal = function() {
        if (uploadModal) {
            uploadModal.classList.add('hidden');
            window.resetModal(); // Cleanup when closing
        }
    };

    // Update the File Input listener
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.src = e.target.result;
                    selectionView.classList.add('hidden');
                    previewView.classList.remove('hidden');
                }
                reader.readAsDataURL(file);
            }
        });
    }

    // --- 7. EDIT DETAILS MODAL LOGIC ---
    // --- 7. EDIT DETAILS MODAL LOGIC ---
    const editDetailsModal = document.getElementById('edit-details-modal');

    // AUTOFILL REQUEST: Function to sync data to other forms
    window.autofillUserForms = function() {
        const stored = localStorage.getItem('balik_user');
        if (!stored) return;
        const u = JSON.parse(stored);

        // Map storage data to Report/Claim form fields
        const mapping = {
            'report-fullname': u.full_name || u.name || '',
            'report-email':    u.contact_email || '',
            'report-phone':    u.contact_number || '',
            'report-id':       u.id_number || '',
            'claim-fullname':  u.full_name || u.name || '',
            'claim-email':     u.contact_email || '',
            'claim-phone':     u.contact_number || ''
        };

        for (const [id, val] of Object.entries(mapping)) {
            const el = document.getElementById(id);
            if (el) el.value = val;
        }

        // Sync the ID label in the report form
        const reportLabel = document.getElementById('report-id-label');
        if (reportLabel) {
            reportLabel.textContent = (u.affiliation === 'student') ? 'Student Number:' : 'Employee Number:';
        }
    };

    // 1. Instant Label Switcher for the Modal
    const editAffilSelect = document.getElementById('edit-affiliation');
    if (editAffilSelect) {
        editAffilSelect.addEventListener('change', function() {
            const label = document.getElementById('edit-id-label');
            if (label) {
                // If "student" is selected, use Student Number, otherwise Employee Number
                label.textContent = (this.value === 'student') ? 'Student Number:' : 'Employee Number:';
            }
        });
    }

    window.openEditModal = function() {
        if (editDetailsModal) {
            // Pre-populate fields from current display values
            const nameField  = document.getElementById('edit-fullname');
            const emailField = document.getElementById('edit-email');
            const numField   = document.getElementById('edit-number');
            const affilSel   = document.getElementById('edit-affiliation');
            const idField    = document.getElementById('edit-id-number');
            const idLabel    = document.getElementById('edit-id-label');

            if (nameField)  nameField.value  = document.getElementById('display-fullname')?.value || '';
            if (emailField) emailField.value = document.getElementById('display-email')?.value || '';
            if (numField)   numField.value   = document.getElementById('display-number')?.value || '';
            
            const stored = localStorage.getItem('balik_user');
            if (stored) {
                const u = JSON.parse(stored);
                if (affilSel && u.affiliation) affilSel.value = u.affiliation;
                if (idField && u.id_number) idField.value = u.id_number;

                // Ensure label is correct upon opening
                if (idLabel) {
                    idLabel.textContent = (u.affiliation === 'student') ? 'Student Number:' : 'Employee Number:';
                }
            }

            editDetailsModal.classList.remove('hidden');
            editDetailsModal.style.pointerEvents = "auto";
        }
    };

    window.closeEditModal = function() {
        if (editDetailsModal) {
            // Add hidden and ensure it stops blocking the screen
            editDetailsModal.classList.add('hidden');
            editDetailsModal.style.pointerEvents = "none";
            console.log("Edit Modal Closed");
        }
    };

    // CONFIRM BUTTON (Inside the Modal)
    window.saveEditedDetails = async function() {
        const stored = localStorage.getItem('balik_user');
        if (!stored) return;
        const user = JSON.parse(stored);

        const nameInput   = document.getElementById('edit-fullname');
        const affilSelect = document.getElementById('edit-affiliation');
        const emailInput  = document.getElementById('edit-email');
        const numInput    = document.getElementById('edit-number');
        const idInput     = document.getElementById('edit-id-number');

        const full_name      = nameInput   ? nameInput.value.trim() : '';
        const affilVal       = affilSelect ? affilSelect.value : '';
        const contact_email  = emailInput  ? emailInput.value.trim() : '';
        const contact_number = numInput    ? numInput.value.trim() : '';
        const id_number      = idInput     ? idInput.value.trim() : '';

        if (!full_name) { alert('Please enter your full name.'); return; }

        try {
            await fetch(`/api/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    full_name, 
                    contact_email, 
                    contact_number, 
                    id_number,
                    affiliation_id: affilVal ? Number(affilVal) : null 
                })
            });

            // Update display
            document.querySelectorAll('.profile-name, #profile-name, #display-name, #user-full-name').forEach(el => { el.textContent = full_name; });
            const selectedAffilText = affilSelect ? (affilSelect.options[affilSelect.selectedIndex]?.text || '') : '';
            if (selectedAffilText) {
                const affilEl = document.getElementById('user-affiliation');
                if (affilEl) affilEl.textContent = selectedAffilText;
                const dispAffil = document.getElementById('display-affiliation');
                if (dispAffil) dispAffil.value = selectedAffilText;
            }

            // Update main settings ID display and label
            const displayIdLabel = document.getElementById('display-id-label');
            if (displayIdLabel) {
                displayIdLabel.textContent = (affilVal === 'student') ? 'Student Number:' : 'Employee Number:';
            }
            const displayIdNum = document.getElementById('display-id-number');
            if (displayIdNum) displayIdNum.value = id_number;

            // Update localStorage
            user.name = full_name;
            user.contact_number = contact_number;
            user.contact_email  = contact_email;
            user.affiliation    = affilVal;
            user.id_number      = id_number;
            localStorage.setItem('balik_user', JSON.stringify(user));
            
            // Update settings display fields (keep them in sync)
            const dispName = document.getElementById('display-fullname');
            if (dispName) dispName.value = full_name;
            const dispNum = document.getElementById('display-number');
            if (dispNum) dispNum.value = contact_number;
            const dispEmail = document.getElementById('display-email');
            if (dispEmail) dispEmail.value = contact_email;

            // Trigger autofill refresh
            window.autofillUserForms();

        } catch(e) { console.error(e); }

        window.closeEditModal();

        let toast = document.getElementById('accountToast');
        if (!toast) { toast = document.createElement('div'); toast.id = 'accountToast'; toast.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;padding:14px 20px;border-radius:14px;color:white;font-weight:600;font-size:0.9rem;max-width:360px;box-shadow:0 8px 24px rgba(0,0,0,0.15);transition:transform 0.4s ease,opacity 0.4s ease;transform:translateX(calc(100% + 40px));opacity:0;background:#077FC4;'; document.body.appendChild(toast); }
        toast.textContent = '✓ Details updated successfully!';
        toast.style.transform = 'translateX(0)'; toast.style.opacity = '1';
        clearTimeout(toast._t); toast._t = setTimeout(() => { toast.style.transform = 'translateX(calc(100% + 40px))'; toast.style.opacity = '0'; }, 3500);
    };

    // SAVE BUTTON (The main form submission)
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
        settingsForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const stored = localStorage.getItem('balik_user');
            if (!stored) return;
            const user = JSON.parse(stored);

            // Collect current values from display fields
            const full_name      = document.getElementById('display-fullname')?.value?.trim()  || '';
            const contact_email  = document.getElementById('display-email')?.value?.trim()     || '';
            const contact_number = document.getElementById('display-number')?.value?.trim()    || '';

            if (!full_name) { alert('Please enter your full name.'); return; }

            const saveBtn = e.target.querySelector('button[type="submit"]');
            const originalText = saveBtn ? saveBtn.innerText : '';
            if (saveBtn) { saveBtn.disabled = true; saveBtn.innerText = 'Saving...'; }

            try {
                const res = await fetch(`/api/users/${user.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ full_name, contact_email, contact_number })
                });
                if (!res.ok) throw new Error('Failed to save.');

                // Update localStorage
                user.name           = full_name;
                user.contact_email  = contact_email;
                user.contact_number = contact_number;
                localStorage.setItem('balik_user', JSON.stringify(user));

                // Update all name display elements on the page
                document.querySelectorAll('.profile-name, #profile-name, #display-name, #user-full-name').forEach(el => {
                    el.textContent = full_name;
                });

                // Show toast notification
                (function() {
                    let toast = document.getElementById('accountToast');
                    if (!toast) {
                        toast = document.createElement('div');
                        toast.id = 'accountToast';
                        toast.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;padding:14px 20px;border-radius:14px;color:white;font-weight:600;font-size:0.9rem;max-width:360px;box-shadow:0 8px 24px rgba(0,0,0,0.15);transition:transform 0.4s ease,opacity 0.4s ease;transform:translateX(calc(100% + 40px));opacity:0;background:#077FC4;';
                        document.body.appendChild(toast);
                    }
                    toast.textContent = '✓ Account details saved successfully!';
                    toast.style.transform = 'translateX(0)';
                    toast.style.opacity = '1';
                    clearTimeout(toast._t);
                    toast._t = setTimeout(() => { toast.style.transform = 'translateX(calc(100% + 40px))'; toast.style.opacity = '0'; }, 3500);
                })();

                if (saveBtn) {
                    saveBtn.innerText = 'Saved!';
                    saveBtn.classList.replace('bg-french-blue', 'bg-green-500');
                    setTimeout(() => {
                        saveBtn.innerText = originalText;
                        saveBtn.classList.replace('bg-green-500', 'bg-french-blue');
                        saveBtn.disabled = false;
                    }, 3000);
                }
                
                // Keep autofill in sync
                window.autofillUserForms();

            } catch(err) {
                console.error(err);
                alert('Failed to save changes. Please try again.');
                if (saveBtn) { saveBtn.disabled = false; saveBtn.innerText = originalText; }
            }
        });
    }

    }); // END DOM CONTENT LOADED
// ─── AUTH & PROFILE DATA ──────────────────────────────────────────────────────

(function loadUserData() {
    const stored = localStorage.getItem('balik_user');
    if (!stored) {
        // Not logged in — redirect to login
        window.location.href = 'login_register.html';
        return;
    }

    const user = JSON.parse(stored);
    const userId = user.id;

    // ── Set visible name / photo ─────────────────────────────────────────────
    const nameEls = document.querySelectorAll('.profile-name, #profile-name, #display-name');
    nameEls.forEach(el => { el.textContent = user.name || 'User'; });

    const photoEls = document.querySelectorAll('.profile-photo, #profile-photo, #user-icon');
    photoEls.forEach(el => {
        if (user.profile_photo) el.src = user.profile_photo;
    });

    // ── Fetch full user record ────────────────────────────────────────────────
    fetch(`/api/users/${userId}`)
        .then(r => r.json())
        .then(u => {
            // Profile sidebar
            const setEl    = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || '—'; };
            const setInput = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };

            setEl('user-full-name', u.full_name);
            setEl('user-affiliation', u.affiliation_label);

            // Settings form inputs — use IDs for reliability
            setInput('display-fullname',    u.full_name);
            setInput('display-affiliation', u.affiliation_label);
            setInput('display-email',       u.contact_email);
            setInput('display-number',      u.contact_number);

            // Fix #4: Load ID number from backend extra_details
            let extra = {};
            try { extra = typeof u.extra_details === 'object' ? u.extra_details : JSON.parse(u.extra_details || '{}'); } catch(e) {}
            const affilVal = (u.affiliation_label || '').toLowerCase();
            const isStudent = affilVal.includes('student');
            const idNum = isStudent ? (extra['Student Number'] || extra['id_number'] || '') : (extra['Employee Number'] || extra['id_number'] || '');
            
            const displayIdLabel = document.getElementById('display-id-label');
            const displayIdNum   = document.getElementById('display-id-number');
            const editIdLabel    = document.getElementById('id-number-label');
            if (displayIdLabel) displayIdLabel.textContent = isStudent ? 'Student Number:' : 'Employee Number:';
            if (editIdLabel)    editIdLabel.textContent    = isStudent ? 'Student Number:' : 'Employee Number:';
            if (displayIdNum)   displayIdNum.value = idNum;

            // Sync localStorage with backend id_number
            try {
                const stored = localStorage.getItem('balik_user');
                if (stored) {
                    const cachedUser = JSON.parse(stored);
                    cachedUser.id_number  = idNum;
                    cachedUser.affiliation = isStudent ? 'student' : (u.affiliation_label || '');
                    localStorage.setItem('balik_user', JSON.stringify(cachedUser));
                }
            } catch(e) {}

            // Update user icon if photo available
            if (u.profile_photo) {
                const icons = document.querySelectorAll('#user-icon');
                icons.forEach(el => {
                    el.src = u.profile_photo;
                    el.style.objectFit = 'cover';
                    el.style.borderRadius = '9999px';
                    el.style.filter = 'none';
                    el.dataset.hasPhoto = '1';
                });
                // Always update the profile picture container with the photo
                const container = document.getElementById('profile-display-container');
                if (container) container.innerHTML = '<img src="' + u.profile_photo + '" class="w-full h-full object-cover rounded-full" alt="Profile">';
                // Keep localStorage in sync with server data
                try {
                    const stored = localStorage.getItem('balik_user');
                    if (stored) {
                        const cachedUser = JSON.parse(stored);
                        cachedUser.profile_photo = u.profile_photo;
                        localStorage.setItem('balik_user', JSON.stringify(cachedUser));
                    }
                } catch(e) {}
            }
        })
        .catch(console.error);

    // ── Fetch stats ───────────────────────────────────────────────────────────
    const updateStat = (id, val) => {
        const el = document.getElementById(id);
        if (el) { el.value = val ?? 0; el.textContent = val ?? 0; }
    };

    // Single combined fetch — stats + reports + claims
    Promise.all([
        fetch(`/api/users/${userId}/stats`).then(r => r.json()).catch(() => ({})),
        fetch(`/api/users/${userId}/reports`).then(r => r.json()).catch(() => []),
        fetch(`/api/users/${userId}/claims`).then(r => r.json()).catch(() => [])
    ]).then(([stats, reports, claims]) => {
        // Stats cards
        updateStat('stat-submitted', stats.total_submitted ?? 0);
        updateStat('stat-active',    stats.total_active    ?? 0);
        updateStat('stat-claimed',   stats.total_resolved  ?? 0);
        // Count pending claims directly from the claims array — always accurate
        const pendingCount = Array.isArray(claims)
            ? claims.filter(c => c.claim_status === 'pending').length
            : 0;
        updateStat('stat-pending', pendingCount);

        // Reports table
        window._reportsData = reports;
        window._reportsSortKey = null;
        window._reportsSortAsc = true;
        renderReports(reports);

        // Claims table
        window._claimsData = claims;
        window._claimsSortKey = null;
        window._claimsSortAsc = true;
        renderClaims(claims);

        buildRecentActivities();
    }).catch(console.error);

    function buildRecentActivities() {
        const container = document.getElementById('recent-activities-list');
        if (!container) return;
        const reports = (window._reportsData || []).map(r => ({
            type: 'report',
            label: (r.report_type === 'lost' ? '🔴 Reported Lost' : '🟢 Reported Found') + ': ' + (r.item_name || '—'),
            date: r.created_at || r.incident_date,
            statusColor: r.report_type === 'lost' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700',
            status: r.report_type
        }));
        const claims = (window._claimsData || []).map(c => ({
            type: 'claim',
            label: '📋 Claimed: ' + (c.item_name || '—'),
            date: c.created_at,
            statusColor: { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' }[c.claim_status] || 'bg-gray-100 text-gray-500',
            status: c.claim_status
        }));
        const all = [...reports, ...claims]
            .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

        window._activitiesData = all;
        renderActivities(all, 1);
    }

    function renderActivities(all, page) {
        const container = document.getElementById('recent-activities-list');
        if (!container) return;
        const ACTIVITY_PAGE_SIZE = 5;
        page = page || 1;
        window._activitiesPage = page;

        if (!all || all.length === 0) {
            container.innerHTML = '<p class="text-gray-400 text-sm italic text-center py-6">No recent activity yet.</p>';
            renderActivityPagination(0, 1, 1);
            return;
        }

        const totalPages = Math.max(1, Math.ceil(all.length / ACTIVITY_PAGE_SIZE));
        if (page > totalPages) page = window._activitiesPage = 1;
        const paged = all.slice((page - 1) * ACTIVITY_PAGE_SIZE, page * ACTIVITY_PAGE_SIZE);

        container.innerHTML = paged.map(a => {
            const d = a.date ? new Date(a.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
            return `<div class="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <span class="text-sm text-gray-700">${a.label}</span>
                <div class="flex items-center gap-2 shrink-0 ml-2">
                    <span class="px-2 py-0.5 rounded-full text-xs font-semibold ${a.statusColor} capitalize">${a.status}</span>
                    <span class="text-xs text-gray-400">${d}</span>
                </div>
            </div>`;
        }).join('');

        renderActivityPagination(all.length, page, totalPages);
    }
    window.renderActivities = function(all, page) { renderActivities(all || window._activitiesData || [], page); };

    function renderActivityPagination(total, page, totalPages) {
        const container = document.getElementById('activities-pagination');
        if (!container) return;
        let html = `<div class="flex items-center justify-between text-sm mt-3">`;
        html += `<span class="text-gray-400 text-xs">${total} activit${total !== 1 ? 'ies' : 'y'}</span>`;
        html += `<div class="flex items-center gap-1">`;
        html += `<button onclick="renderActivities(window._activitiesData,${page-1})" ${page===1?'disabled':''} class="px-3 py-1.5 rounded-lg border ${page===1?'text-gray-300 cursor-not-allowed border-gray-100':'text-gray-600 hover:bg-gray-100 border-gray-200 cursor-pointer'}">‹</button>`;
        for (let i = 1; i <= totalPages; i++) {
            html += `<button onclick="renderActivities(window._activitiesData,${i})" class="px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${i===page?'bg-french-blue text-white border-french-blue':'text-gray-600 hover:bg-gray-100 border-gray-200'}">${i}</button>`;
        }
        html += `<button onclick="renderActivities(window._activitiesData,${page+1})" ${page===totalPages?'disabled':''} class="px-3 py-1.5 rounded-lg border ${page===totalPages?'text-gray-300 cursor-not-allowed border-gray-100':'text-gray-600 hover:bg-gray-100 border-gray-200 cursor-pointer'}">›</button>`;
        html += `</div></div>`;
        container.innerHTML = html;
    }

    // ── Logout button — shows confirmation modal ──────────────────────────────
    document.querySelectorAll('[data-logout], a[href="#"].text-red-600').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();
            openLogoutModal();
        });
    });
})();

// ── Logout Modal — handled by shared logout.js ────────────────────────────────

// ─── Render Reports Table ─────────────────────────────────────────────────────
const REPORTS_PAGE_SIZE = 5;
let _reportsPage = 1;
let _claimsPage  = 1;

function renderReports(reports, page) {
    page = page || _reportsPage;
    _reportsPage = page;
    const tbody = document.querySelector('#reports-view tbody, #reports-table tbody');
    if (!tbody) return;

    if (!reports || reports.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-12 text-gray-400 italic text-sm">You haven't submitted any reports yet.</td></tr>`;
        renderPagination('reports-pagination', 0, 1, 1);
        return;
    }

    // Filter by search
    const q = (document.getElementById('reports-search')?.value || '').toLowerCase();
    const filtered = q ? reports.filter(r => (r.item_name || '').toLowerCase().includes(q) || (r.status || '').toLowerCase().includes(q) || (r.report_type || '').toLowerCase().includes(q)) : reports;

    const totalPages = Math.max(1, Math.ceil(filtered.length / REPORTS_PAGE_SIZE));
    if (page > totalPages) page = _reportsPage = 1;
    const paged = filtered.slice((page - 1) * REPORTS_PAGE_SIZE, page * REPORTS_PAGE_SIZE);

    if (paged.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-12 text-gray-400 italic text-sm">No results found.</td></tr>`;
        renderPagination('reports-pagination', 0, 1, 1);
        return;
    }

    tbody.innerHTML = paged.map(r => {
        const date       = r.incident_date ? new Date(r.incident_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
        const typeColor  = r.report_type === 'lost' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';
        const statusColor = { active: 'bg-blue-100 text-blue-700', pending: 'bg-yellow-100 text-yellow-700', resolved: 'bg-gray-100 text-gray-600' }[r.status] || 'bg-gray-100 text-gray-500';
        // Fix #10: Only show cancel if report is not resolved/archived
        const canCancel = r.report_type === 'lost' && r.status !== 'resolved' && !r.is_archived;
        return `
        <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <td class="py-3 px-4 font-medium text-gray-800">${r.item_name}</td>
            <td class="py-3 px-4">
                <span class="px-3 py-1 rounded-full text-xs font-semibold ${typeColor} capitalize">${r.report_type}</span>
            </td>
            <td class="py-3 px-4">
                <span class="px-3 py-1 rounded-full text-xs font-semibold ${statusColor} capitalize">${r.status}</span>
            </td>
            <td class="py-3 px-4 text-gray-400 text-xs">${date}</td>
            <td class="py-3 px-4">
                ${canCancel ? `<button onclick="cancelReport(${r.id})" class="px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors">Cancel</button>` : ''}
            </td>
        </tr>`;
    }).join('');

    renderPagination('reports-pagination', filtered.length, page, totalPages);
}

// ─── Render Claims Table ──────────────────────────────────────────────────────
function renderClaims(claims, page) {
    page = page || _claimsPage;
    _claimsPage = page;
    const tbody = document.querySelector('#claims-table tbody, #claims-tbody');
    if (!tbody) return;

    if (!claims || claims.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center py-12 text-gray-400 italic text-sm">You haven't submitted any claims yet.</td></tr>`;
        renderPagination('claims-pagination', 0, 1, 1);
        return;
    }

    const q = (document.getElementById('claims-search')?.value || '').toLowerCase();
    const filtered = q ? claims.filter(c => (c.item_name || '').toLowerCase().includes(q) || (c.claim_status || '').toLowerCase().includes(q)) : claims;

    const totalPages = Math.max(1, Math.ceil(filtered.length / REPORTS_PAGE_SIZE));
    if (page > totalPages) page = _claimsPage = 1;
    const paged = filtered.slice((page - 1) * REPORTS_PAGE_SIZE, page * REPORTS_PAGE_SIZE);

    if (paged.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center py-12 text-gray-400 italic text-sm">No results found.</td></tr>`;
        renderPagination('claims-pagination', 0, 1, 1);
        return;
    }

    tbody.innerHTML = paged.map(c => {
        const date = c.created_at ? new Date(c.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
        const statusColor = { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' }[c.claim_status] || 'bg-gray-100 text-gray-500';
        return `
        <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <td class="py-3 px-4 font-medium text-gray-800">${c.item_name || '—'}</td>
            <td class="py-3 px-4">
                <span class="px-3 py-1 rounded-full text-xs font-semibold ${statusColor} capitalize">${c.claim_status}</span>
            </td>
            <td class="py-3 px-4 text-gray-400 text-xs">${date}</td>
        </tr>`;
    }).join('');

    renderPagination('claims-pagination', filtered.length, page, totalPages);
}

function renderPagination(containerId, total, page, totalPages) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (total === 0) { container.innerHTML = ''; return; }
    const isReports = containerId === 'reports-pagination';
    let html = `<div class="flex items-center gap-1 text-sm">`;
    html += `<button onclick="${isReports ? 'renderReports(window._reportsData,' : 'renderClaims(window._claimsData,'}${page - 1})" ${page === 1 ? 'disabled' : ''} class="px-3 py-1.5 rounded-lg border ${page === 1 ? 'text-gray-300 cursor-not-allowed border-gray-100' : 'text-gray-600 hover:bg-gray-100 border-gray-200 cursor-pointer'}">‹</button>`;
    for (let i = 1; i <= totalPages; i++) {
        html += `<button onclick="${isReports ? 'renderReports(window._reportsData,' : 'renderClaims(window._claimsData,'}${i})" class="px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${i === page ? 'bg-french-blue text-white border-french-blue' : 'text-gray-600 hover:bg-gray-100 border-gray-200'}">${i}</button>`;
    }
    html += `<button onclick="${isReports ? 'renderReports(window._reportsData,' : 'renderClaims(window._claimsData,'}${page + 1})" ${page === totalPages ? 'disabled' : ''} class="px-3 py-1.5 rounded-lg border ${page === totalPages ? 'text-gray-300 cursor-not-allowed border-gray-100' : 'text-gray-600 hover:bg-gray-100 border-gray-200 cursor-pointer'}">›</button>`;
    html += `</div>`;
    container.innerHTML = html;
}

// ── Save Profile Picture ─────────────────────────────────────────────────────
window.saveProfilePicture = async function() {
    const fileInput = document.getElementById('modal-file-input');
    if (!fileInput || !fileInput.files[0]) { return; }

    const file = fileInput.files[0];
    const stored = localStorage.getItem('balik_user');
    if (!stored) return;
    const user = JSON.parse(stored);

    const btn = document.querySelector('#preview-view button.bg-french-blue');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }

    try {
        // Upload the file first
        const fd = new FormData();
        fd.append('photo', file);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!uploadRes.ok) throw new Error('Upload failed');
        const uploadData = await uploadRes.json();
        const photoUrl = uploadData.url || uploadData.path;

        // Save to user profile
        await fetch(`/api/users/${user.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profile_photo: photoUrl })
        });

        // Update localStorage
        user.profile_photo = photoUrl;
        localStorage.setItem('balik_user', JSON.stringify(user));

        // Update all user icon images on the page and reset filter override
        document.querySelectorAll('#user-icon').forEach(el => {
            el.src = photoUrl;
            el.style.filter = 'none';
            el.style.objectFit = 'cover';
            el.style.borderRadius = '9999px';
            el.dataset.hasPhoto = '1';
        });
        const container = document.getElementById('profile-display-container');
        if (container) container.innerHTML = `<img src="${photoUrl}" class="w-full h-full object-cover" alt="Profile">`;

        window.closeUploadModal();

        // Success toast
        let toast = document.getElementById('accountToast');
        if (!toast) { toast = document.createElement('div'); toast.id = 'accountToast'; toast.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;padding:14px 20px;border-radius:14px;color:white;font-weight:600;font-size:0.9rem;max-width:360px;box-shadow:0 8px 24px rgba(0,0,0,0.15);transition:transform 0.4s ease,opacity 0.4s ease;transform:translateX(calc(100% + 40px));opacity:0;background:#077FC4;'; document.body.appendChild(toast); }
        toast.textContent = '✓ Profile picture updated successfully!';
        toast.style.transform = 'translateX(0)'; toast.style.opacity = '1';
        clearTimeout(toast._t); toast._t = setTimeout(() => { toast.style.transform = 'translateX(calc(100% + 40px))'; toast.style.opacity = '0'; }, 3500);

    } catch (err) {
        let toast = document.getElementById('accountToast');
        if (!toast) { toast = document.createElement('div'); toast.id = 'accountToast'; toast.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;padding:14px 20px;border-radius:14px;color:white;font-weight:600;font-size:0.9rem;max-width:360px;box-shadow:0 8px 24px rgba(0,0,0,0.15);transition:transform 0.4s ease,opacity 0.4s ease;transform:translateX(calc(100% + 40px));opacity:0;background:#EF4444;'; document.body.appendChild(toast); }
        toast.textContent = 'Failed to upload photo. Please try again.';
        toast.style.transform = 'translateX(0)'; toast.style.opacity = '1';
        clearTimeout(toast._t); toast._t = setTimeout(() => { toast.style.transform = 'translateX(calc(100% + 40px))'; toast.style.opacity = '0'; }, 3500);
        if (btn) { btn.disabled = false; btn.textContent = 'Set as profile picture'; }
    }
};

// ── Handle Dynamic Affiliation Labels ────────────────────────────────────────
window.updateAffiliationUI = function(user) {
    const idLabel = document.getElementById('display-id-label');
    const idInput = document.getElementById('display-id-number');
    
    if (!idLabel || !idInput) return;

    if (user.affiliation === 'Student') {
        idLabel.textContent = 'Student Number:';
    } else {
        idLabel.textContent = 'Employee Number:';
    }
    idInput.value = user.id_number || ''; 
};

// ── Update Profile Data with Cascade ─────────────────────────────────────────
// Note: Ensure your DB foreign keys use ON UPDATE CASCADE
window.saveAccountSettings = async function(updatedData) {
    const stored = localStorage.getItem('balik_user');
    const user = JSON.parse(stored);

    try {
        const response = await fetch(`/api/users/${user.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        if (response.ok) {
            const newUser = { ...user, ...updatedData };
            localStorage.setItem('balik_user', JSON.stringify(newUser));
            window.updateAffiliationUI(newUser);
            // Show Success Toast...
        }
    } catch (err) {
        console.error("Save failed", err);
    }
};

// ─── Sort Table ───────────────────────────────────────────────────────────────
window.sortTable = function(tableType, key) {
    const dataKey = tableType === 'reports' ? '_reportsData' : '_claimsData';
    const sortKeyKey = tableType === 'reports' ? '_reportsSortKey' : '_claimsSortKey';
    const sortAscKey = tableType === 'reports' ? '_reportsSortAsc' : '_claimsSortAsc';

    const data = window[dataKey];
    if (!data) return;

    // Toggle sort direction if same key
    if (window[sortKeyKey] === key) {
        window[sortAscKey] = !window[sortAscKey];
    } else {
        window[sortKeyKey] = key;
        window[sortAscKey] = true;
    }

    const asc = window[sortAscKey];
    const sorted = [...data].sort((a, b) => {
        const av = (a[key] || '').toString().toLowerCase();
        const bv = (b[key] || '').toString().toLowerCase();
        return asc ? av.localeCompare(bv) : bv.localeCompare(av);
    });

    // Update sort icons
    document.querySelectorAll(`th[onclick*="${tableType}"]`).forEach(th => {
        const span = th.querySelector('span');
        if (!span) return;
        if (th.getAttribute('onclick').includes(`'${key}'`)) {
            span.textContent = asc ? ' ↑' : ' ↓';
            th.style.color = '#077FC4';
        } else {
            span.textContent = ' ⇅';
            th.style.color = '';
        }
    });

    if (tableType === 'reports') renderReports(sorted);
    else renderClaims(sorted);
};

//AI Chat Bot

const backToTop = document.getElementById('backToTop');
const chatFab = document.getElementById('chat-fab');
const chatModal = document.getElementById('chat-modal');

window.addEventListener('scroll', () => {
    // Re-select if they aren't globally available
    const backToTop = document.getElementById('backToTop');
    const chatFab = document.getElementById('chat-fab');
    const chatModal = document.getElementById('chat-modal');

    if (window.scrollY > 300) {
        if (backToTop) backToTop.classList.remove('opacity-0', 'translate-y-10', 'invisible');
        if (chatFab) chatFab.classList.add('is-scrolled');
        if (chatModal) chatModal.classList.add('is-scrolled');
    } else {
        if (backToTop) backToTop.classList.add('opacity-0', 'translate-y-10', 'invisible');
        if (chatFab) chatFab.classList.remove('is-scrolled');
        if (chatModal) chatModal.classList.remove('is-scrolled');
    }
});

    // Send Message Logic
    const input = document.getElementById('chat-input');
    const messages = document.getElementById('chat-messages');

    function sendMessage() {
        const text = input ? input.value.trim() : '';
        if (!text) return;

        appendMessage(text, 'user');
        if (input) input.value = '';

        // Simulated AI response
        setTimeout(() => {
            appendMessage("I'll look into that for you. Please wait...", 'bot');
        }, 800);
    }

    function appendMessage(text, sender) {
        if (!messages) return;
        const msg = document.createElement('div');
        msg.className = `chat-msg ${sender}`;
        msg.innerText = text;
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
    }

    // Allow Enter key to send
    if (input) input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    (function () {
        let chatOpen = false;
        window.chatToggle = function () {
            chatOpen = !chatOpen;
            document.getElementById('chat-modal').classList.toggle('open', chatOpen);
            if (chatOpen && document.getElementById('chat-messages').children.length === 0) chatLoadHistory();
        };

        function chatAddMsg(text, role, id) {
            const win = document.getElementById('chat-messages');
            const div = document.createElement('div');
            div.className = 'chat-msg ' + role;
            if (id) div.id = id;
            div.textContent = text;
            win.appendChild(div);
            win.scrollTop = win.scrollHeight;
            return div;
        }

        window.chatSend = async function (e) {
            e.preventDefault();
            const inp = document.getElementById('chat-input');
            const msg = inp.value.trim();
            if (!msg) return;
            chatAddMsg(msg, 'user');
            inp.value = '';
            const tid = 'typing-' + Date.now();
            const tEl = chatAddMsg('● ● ●', 'bot', tid);
            tEl.innerHTML = '<span class="typing-dot">●</span><span class="typing-dot">●</span><span class="typing-dot">●</span>';
            
            try {
                const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg }) });
                const data = await res.json();
                const reply = data.reply || "I couldn't process that right now.";
                tEl.textContent = reply;
                chatSaveHistory(msg, reply);
            } catch (err) {
                tEl.textContent = 'Error connecting to AI assistant.';
            }
        };

        function chatSaveHistory(u, b) {
            try { const h = JSON.parse(localStorage.getItem('balik_chat') || '[]'); h.push({ u, b }); if (h.length > 30) h.shift(); localStorage.setItem('balik_chat', JSON.stringify(h)); } catch (e) { }
        }
        function chatLoadHistory() {
            const win = document.getElementById('chat-messages');
            try {
                const h = JSON.parse(localStorage.getItem('balik_chat') || '[]');
                if (h.length === 0) {
                    chatAddMsg("👋 Hi there! I'm B.A.L.I.K. AI — your automated Lost & Found assistant for BulSU Bustos Campus. I can help you search for lost items, guide you through reporting a lost or found item, and answer questions about the claiming process. How can I help you today?", 'bot');
                    return;
                }
                    h.forEach(item => { chatAddMsg(item.u, 'user'); chatAddMsg(item.b, 'bot'); });
            } catch (e) { chatAddMsg("👋 Hi! I'm B.A.L.I.K. AI. How can I help you today?", 'bot'); }
        }
        
        // Auto-open with greeting after 3 seconds on first visit
        if (!localStorage.getItem('balik_chat_greeted')) {
            setTimeout(function () {
                localStorage.setItem('balik_chat_greeted', '1');
                chatToggle();
            }, 3000);
        }
    })();
// Fix #10: Cancel report function
// Fix #5: Cancel report with proper confirmation modal
window.cancelReport = async function(reportId) {
    showCancelConfirmModal(reportId);
};

function showCancelConfirmModal(reportId) {
    // Remove existing modal if any
    var existing = document.getElementById('cancel-report-modal');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.id = 'cancel-report-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;';
    modal.innerHTML = `
        <div style="background:#fff;border-radius:16px;max-width:420px;width:100%;padding:28px;box-shadow:0 20px 60px rgba(0,0,0,0.2);animation:slideUp 0.2s ease;">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
                <div style="width:44px;height:44px;border-radius:50%;background:#fff5f5;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">⚠️</div>
                <div>
                    <h3 style="font-size:16px;font-weight:700;color:#1a202c;margin:0 0 4px;">Cancel Report?</h3>
                    <p style="font-size:13px;color:#718096;margin:0;">This will mark your report as resolved.</p>
                </div>
            </div>
            <p style="font-size:13px;color:#4a5568;line-height:1.6;margin-bottom:20px;">
                Use this if you found your lost item on your own without the system's help. 
                This action <strong>cannot be undone</strong>.
            </p>
            <div style="display:flex;gap:10px;justify-content:flex-end;">
                <button onclick="document.getElementById('cancel-report-modal').remove()" 
                    style="padding:9px 20px;border-radius:9px;border:1px solid #e2e8f0;background:#fff;color:#4a5568;font-size:13px;font-weight:500;cursor:pointer;">
                    Keep Report
                </button>
                <button onclick="confirmCancelReport(${reportId})"
                    style="padding:9px 20px;border-radius:9px;border:none;background:#e53e3e;color:#fff;font-size:13px;font-weight:600;cursor:pointer;">
                    Yes, Cancel Report
                </button>
            </div>
        </div>`;
    document.body.appendChild(modal);
    // Close on backdrop click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) modal.remove();
    });
}

window.confirmCancelReport = async function(reportId) {
    var modal = document.getElementById('cancel-report-modal');
    if (modal) modal.remove();
    
    const stored = localStorage.getItem('balik_user');
    if (!stored) return;
    const user = JSON.parse(stored);
    try {
        const res  = await fetch('/api/reports/' + reportId + '/cancel', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id })
        });
        const data = await res.json();
        if (data.success) {
            const reportsRes = await fetch('/api/users/' + user.id + '/reports');
            const reports = await reportsRes.json();
            window._reportsData = reports;
            renderReports(reports);

            // --- NOTIFICATION START ---
            (function() {
                let toast = document.getElementById('cancelToast');
                if (!toast) {
                    toast = document.createElement('div');
                    toast.id = 'cancelToast';
                    toast.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;padding:14px 20px;border-radius:14px;color:white;font-weight:600;font-size:0.9rem;max-width:360px;box-shadow:0 8px 24px rgba(0,0,0,0.15);transition:transform 0.4s ease,opacity 0.4s ease;transform:translateX(calc(100% + 40px));opacity:0;background:#e53e3e;'; // Red background for cancel
                    document.body.appendChild(toast);
                }
                toast.textContent = '✓ Report cancelled successfully.';
                toast.style.transform = 'translateX(0)';
                toast.style.opacity = '1';
                clearTimeout(toast._t);
                toast._t = setTimeout(() => { 
                    toast.style.transform = 'translateX(calc(100% + 40px))'; 
                    toast.style.opacity = '0'; 
                }, 3500);
            })();
            // --- NOTIFICATION END ---

            const toastFn = window.showToast || function(m,s) { /* alert removed to use toast instead */ };
            toastFn('Report cancelled successfully.', true);
        } else {
            alert(data.error || 'Could not cancel report.');
        }
    } catch(e) {
        alert('Error cancelling report.');
    }
};

