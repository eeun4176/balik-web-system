/**
 * logout.js — Shared logout confirmation modal for all B.A.L.I.K. pages.
 * Uses inline styles for all visual properties so it works regardless of
 * which Tailwind classes are compiled into the project's style.css.
 */

(function () {
    function injectModal() {
        if (document.getElementById('logout-modal')) return;

        const overlay = document.createElement('div');
        overlay.id = 'logout-modal';
        Object.assign(overlay.style, {
            position: 'fixed', inset: '0', zIndex: '9999',
            display: 'none', alignItems: 'center', justifyContent: 'center',
            padding: '16px'
        });

        overlay.innerHTML = `
            <div id="logout-modal-backdrop" onclick="closeLogoutModal()" style="
                position:absolute; inset:0;
                background:rgba(0,0,0,0.5);
                backdrop-filter:blur(4px);
                -webkit-backdrop-filter:blur(4px);
            "></div>
            <div style="
                position:relative; background:#fff; border-radius:16px;
                box-shadow:0 25px 50px rgba(0,0,0,0.25);
                padding:32px; width:100%; max-width:360px;
                display:flex; flex-direction:column; align-items:center; gap:16px;
            ">
                <div style="
                    width:56px; height:56px; border-radius:50%;
                    background:#fee2e2; display:flex; align-items:center; justify-content:center;
                    margin-bottom:4px;
                ">
                    <svg width="28" height="28" fill="none" stroke="#ef4444" viewBox="0 0 24 24" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"/>
                    </svg>
                </div>
                <h3 style="font-size:1.2rem; font-weight:700; color:#1f2937; margin:0;">Log Out?</h3>
                <p style="font-size:0.875rem; color:#6b7280; text-align:center; margin:0;">
                    Are you sure you want to log out of your B.A.L.I.K. account?
                </p>
                <div style="display:flex; gap:12px; width:100%; margin-top:8px;">
                    <button onclick="closeLogoutModal()" style="
                        flex:1; padding:12px; border-radius:12px;
                        border:1.5px solid #e5e7eb; background:#fff;
                        color:#4b5563; font-weight:600; font-size:0.95rem;
                        cursor:pointer; font-family:inherit;
                        transition:background .15s;
                    " onmouseover="this.style.background='#f9fafb'"
                       onmouseout="this.style.background='#fff'">Cancel</button>
                    <button onclick="confirmLogout()" style="
                        flex:1; padding:12px; border-radius:12px;
                        border:none; background:#ef4444;
                        color:#fff; font-weight:600; font-size:0.95rem;
                        cursor:pointer; font-family:inherit;
                        box-shadow:0 4px 12px rgba(239,68,68,0.35);
                        transition:background .15s;
                    " onmouseover="this.style.background='#dc2626'"
                       onmouseout="this.style.background='#ef4444'">Log Out</button>
                </div>
            </div>`;

        document.body.appendChild(overlay);
    }

    function wireLogout() {
        injectModal();
        document.querySelectorAll('[data-logout]').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                openLogoutModal();
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', wireLogout);
    } else {
        wireLogout();
    }
})();

function openLogoutModal() {
    const modal = document.getElementById('logout-modal');
    if (modal) { modal.style.display = 'flex'; }
}

function closeLogoutModal() {
    const modal = document.getElementById('logout-modal');
    if (modal) { modal.style.display = 'none'; }
}

function confirmLogout() {
    localStorage.removeItem('balik_user');
    fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
        .finally(() => { window.location.href = 'login_register.html'; });
}

window.openLogoutModal  = openLogoutModal;
window.closeLogoutModal = closeLogoutModal;
window.confirmLogout    = confirmLogout;