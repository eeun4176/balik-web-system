/**
 * B.A.L.I.K. Frontend API Client
 * Points to Node.js + Express backend (SQLite).
 */

const API_BASE = '/api';

const BALIK_API = {

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

    // ── Auth ─────────────────────────────────────────────────────────────────
    async register(data) {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin', body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `Register failed: ${res.status}`);
        return json;
    },
    async login(email, password) {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin', body: JSON.stringify({ email, password }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `Login failed: ${res.status}`);
        return json;
    },
    async verifyOtp(email, otp) {
        const res = await fetch(`${API_BASE}/auth/verify-otp`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin', body: JSON.stringify({ email, otp }),
        });
        const json = await res.json();
        if (!res.ok) throw Object.assign(new Error(json.error || 'Verification failed'), json);
        return json;
    },
    async resendOtp(email) {
        const res = await fetch(`${API_BASE}/auth/resend-otp`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin', body: JSON.stringify({ email }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Resend failed');
        return json;
    },
    async logout() {
        await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'same-origin' });
    },
    async getMe() {
        const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'same-origin' });
        if (!res.ok) return null;
        return res.json();
    },

    // ── Account ───────────────────────────────────────────────────────────────
    async getAccountStats() {
        const res = await fetch(`${API_BASE}/account/stats`, { credentials: 'same-origin' });
        if (!res.ok) throw new Error(`Stats failed: ${res.status}`);
        return res.json();
    },
    async getMyReports() {
        const res = await fetch(`${API_BASE}/account/reports`, { credentials: 'same-origin' });
        if (!res.ok) throw new Error(`Reports fetch failed: ${res.status}`);
        return res.json();
    },
    async getMyClaims() {
        const res = await fetch(`${API_BASE}/account/claims`, { credentials: 'same-origin' });
        if (!res.ok) throw new Error(`Claims fetch failed: ${res.status}`);
        return res.json();
    },
    async updateAccount(data) {
        const res = await fetch(`${API_BASE}/account/update`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin', body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Update failed');
        return json;
    },
    async updateAvatar(profile_photo) {
        const res = await fetch(`${API_BASE}/account/avatar`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin', body: JSON.stringify({ profile_photo }),
        });
        return res.json();
    },

    // ── Reports ───────────────────────────────────────────────────────────────
    async submitReport(data) {
        const res = await fetch(`${API_BASE}/reports`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin', body: JSON.stringify(data),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Submit failed: ${res.status}`);
        }
        return res.json();
    },
    async searchItems({ q = '', categories = [], locations = [], statuses = [], page = 1 } = {}) {
        const params = new URLSearchParams({
            q, categories: categories.join(','), locations: locations.join(','),
            statuses: statuses.join(','), page,
        });
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
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error(`Status update failed: ${res.status}`);
        return res.json();
    },

    // ── Claims ────────────────────────────────────────────────────────────────
    async submitClaim(data) {
        const res = await fetch(`${API_BASE}/claims`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin', body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(`Claim submit failed: ${res.status}`);
        return res.json();
    },
    async getClaims(reportId) {
        const res = await fetch(`${API_BASE}/claims?report_id=${reportId}`);
        if (!res.ok) throw new Error(`Claims fetch failed: ${res.status}`);
        return res.json();
    },

    // ── Upload ────────────────────────────────────────────────────────────────
    async uploadPhoto(file) {
        const fd = new FormData();
        fd.append('photo', file);
        const res = await fetch(`${API_BASE}/upload`, {
            method: 'POST', credentials: 'same-origin', body: fd,
        });
        if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
        return res.json();
    },

    // ── Helper ────────────────────────────────────────────────────────────────
    populateSelect(selectEl, items, placeholder = '---') {
        selectEl.innerHTML = `<option value="" disabled selected>${placeholder}</option>`;
        items.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item.value ?? item.id;
            opt.textContent = item.label;
            selectEl.appendChild(opt);
        });
    },
};

window.BALIK_API = BALIK_API;

/**
 * B.A.L.I.K. Login / Register / OTP Page JS
 */

// ── Toast ─────────────────────────────────────────────────────────────────────

function showToast(message, isSuccess) {
    const toast = document.getElementById('statusToast');
    toast.textContent = message;
    toast.style.backgroundColor = isSuccess ? '#077FC4' : '#EF4444';
    // Slide in
    toast.style.transform = 'translateX(0)';
    // Slide back out after 3.5 s
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => {
        toast.style.transform = 'translateX(calc(100% + 40px))';
    }, 3500);
}

// ── Hero panel animation ──────────────────────────────────────────────────────

function toggleView(isSignUp) {
    // Track current mode for resize handler
    window._loginMode = isSignUp ? 'register' : 'login';
    // Mobile: no hero, no sliding — just swap panels
    if (window._isMobile && window._isMobile()) {
        window._mobileShowPanel(isSignUp ? 'register-box' : 'login-box');
        return;
    }
    const hero        = document.getElementById('hero-side');
    const heroContent = document.getElementById('hero-content');
    const title       = document.getElementById('hero-title');
    const desc        = document.getElementById('hero-desc');

    heroContent.style.opacity = '0';
    setTimeout(() => {
        if (isSignUp) {
            hero.style.transform = 'translateX(100%)';
            title.innerHTML = 'Create your <br> Account!';
            desc.innerHTML  = 'Register to report or claim lost and <br> found items.';
            showPanel('register');
        } else {
            hero.style.transform = 'translateX(0)';
            title.innerHTML = 'Welcome <br> Back!';
            desc.innerHTML  = 'Sign in to manage your reports <br> and claims.';
            showPanel('login');
        }
        heroContent.style.opacity = '1';
    }, 350);
}

// ── Panel switcher ─────────────────────────────────────────────────────────────
// panels: 'login' | 'register' | 'otp' | 'none'

function showPanel(panel) {
    // Track current mode for resize handler
    if (panel !== 'none') window._loginMode = panel;
    // Mobile: no transforms — just show/hide
    if (window._isMobile && window._isMobile()) {
        const map = { login: 'login-box', register: 'register-box', otp: 'otp-box' };
        if (map[panel]) window._mobileShowPanel(map[panel]);
        return;
    }
    const loginBox    = document.getElementById('login-box');
    const registerBox = document.getElementById('register-box');
    const otpBox      = document.getElementById('otp-box');

    // Hide all first
    [loginBox, registerBox].forEach(el => {
        el.style.opacity       = '0';
        el.style.pointerEvents = 'none';
    });
    loginBox.style.transform    = 'translateX(100%)';
    registerBox.style.transform = 'translateX(-100%)';
    otpBox.classList.add('hidden');
    otpBox.classList.remove('flex');
    otpBox.style.opacity       = '0';
    otpBox.style.pointerEvents = 'none';

    if (panel === 'login') {
        loginBox.style.transform    = 'translateX(0)';
        loginBox.style.opacity      = '1';
        loginBox.style.pointerEvents = 'auto';
    } else if (panel === 'register') {
        registerBox.style.transform    = 'translateX(0)';
        registerBox.style.opacity      = '1';
        registerBox.style.pointerEvents = 'auto';
    } else if (panel === 'otp') {
        otpBox.classList.remove('hidden');
        otpBox.classList.add('flex');
        otpBox.style.opacity       = '1';
        otpBox.style.pointerEvents = 'auto';
    }
    // 'none' — hides everything (called from toggleView during animation)
}

function backToRegister() {
    if (window._isMobile && window._isMobile()) {
        window._mobileShowPanel('register-box');
        return;
    }
    const hero = document.getElementById('hero-side');
    hero.style.transform = 'translateX(100%)';
    showPanel('register');
}

// ── Password Toggle ───────────────────────────────────────────────────────────

const EYE_OPEN = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
    <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
</svg>`;

const EYE_CLOSED = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
    <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/>
</svg>`;

function wirePasswordToggle() {
    const toggle = document.getElementById('toggle-password');
    const input  = document.getElementById('login-password');
    if (!toggle || !input) return;

    // Set initial icon (eye-closed since it starts as password type)
    toggle.innerHTML = EYE_CLOSED;

    toggle.addEventListener('click', function () {
        const isPassword = input.type === 'password';
        input.type       = isPassword ? 'text' : 'password';
        toggle.innerHTML = isPassword ? EYE_OPEN : EYE_CLOSED;
    });
}

// ── Forgot Password ───────────────────────────────────────────────────────────

// _fpStep: 1 = enter email, 2 = enter OTP, 3 = enter new password
let _fpStep  = 1;
let _fpEmail = '';

function showForgotPassword() {
    _fpStep = 1;
    _fpEmail = '';
    document.getElementById('login-form-title').innerHTML =
        'FORGOT <span class="text-[#077FC4]">PASSWORD</span>';
    document.getElementById('login-form-inputs').innerHTML = `
        <p class="text-sm text-gray-400 text-center mb-1">Enter your registered email and we'll send you a reset code.</p>
        <div class="relative">
            <input type="email" id="fp-email" required
                class="w-full px-6 py-4 bg-gray-100 border-none rounded-[20px] text-gray-800 outline-none focus:ring-2 focus:ring-[#077FC4]/20 placeholder:text-gray-400"
                placeholder="Contact Email">
            <span class="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
            </span>
        </div>`;
    document.getElementById('login-submit-btn').innerText = 'Send Reset Code';
    document.getElementById('login-toggle-text').innerHTML =
        '<a href="javascript:void(0)" onclick="showLogin()" class="text-[#077FC4] font-bold hover:underline">Back to Log In</a>';
    window._loginMode = 'forgot';
}

function _showFpStep2(email) {
    _fpStep = 2;
    _fpEmail = email;
    document.getElementById('login-form-title').innerHTML =
        'VERIFY <span class="text-[#077FC4]">CODE</span>';
    document.getElementById('login-form-inputs').innerHTML = `
        <p class="text-sm text-gray-400 text-center mb-1">A 6-digit code was sent to <strong class="text-[#077FC4]">${email}</strong>. Enter it below to continue.</p>
        <div class="relative">
            <input type="text" id="fp-otp" maxlength="6" inputmode="numeric" required
                class="w-full px-6 py-4 bg-gray-100 border-none rounded-[20px] text-gray-800 outline-none focus:ring-2 focus:ring-[#077FC4]/20 placeholder:text-gray-400 tracking-widest text-center text-xl font-bold"
                placeholder="000000">
        </div>`;
    document.getElementById('login-submit-btn').innerText = 'Verify Code';
    document.getElementById('login-toggle-text').innerHTML =
        '<a href="javascript:void(0)" onclick="showForgotPassword()" class="text-[#077FC4] font-bold hover:underline">← Back</a>';
}

function _showFpStep3() {
    _fpStep = 3;
    document.getElementById('login-form-title').innerHTML =
        'NEW <span class="text-[#077FC4]">PASSWORD</span>';
    document.getElementById('login-form-inputs').innerHTML = `
        <p class="text-sm text-gray-400 text-center mb-1">Code verified! Enter your new password below.</p>
        <div class="relative">
            <input type="password" id="fp-new" required
                class="w-full px-6 py-4 bg-gray-100 border-none rounded-[20px] text-gray-800 outline-none focus:ring-2 focus:ring-[#077FC4]/20 placeholder:text-gray-400"
                placeholder="New Password (min. 8 characters)">
        </div>
        <div class="relative">
            <input type="password" id="fp-confirm" required
                class="w-full px-6 py-4 bg-gray-100 border-none rounded-[20px] text-gray-800 outline-none focus:ring-2 focus:ring-[#077FC4]/20 placeholder:text-gray-400"
                placeholder="Confirm New Password">
        </div>`;
    document.getElementById('login-submit-btn').innerText = 'Change Password';
    document.getElementById('login-toggle-text').innerHTML =
        '<a href="javascript:void(0)" onclick="showForgotPassword()" class="text-[#077FC4] font-bold hover:underline">← Start Over</a>';
}

function showLogin() {
    document.getElementById('login-form-title').innerHTML =
        'LOG <span class="text-[#077FC4]">IN</span>';
    document.getElementById('login-form-inputs').innerHTML = `
        <div class="relative">
            <input type="text" id="login-email" name="email" required
                class="w-full px-6 py-4 bg-gray-100 border-none rounded-[20px] text-gray-800 outline-none focus:ring-2 focus:ring-[#077FC4]/20 placeholder:text-gray-400"
                placeholder="Contact Email">
            <span class="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
            </span>
        </div>
        <div class="relative">
            <input type="password" id="login-password" name="password" required
                class="w-full px-6 py-4 bg-gray-100 border-none rounded-[20px] text-gray-800 outline-none focus:ring-2 focus:ring-[#077FC4]/20 placeholder:text-gray-400"
                placeholder="Password">
            <span id="toggle-password" class="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-[#077FC4]"></span>
        </div>
        <div class="flex items-start px-1 pl-6 gap-3">
            <input id="login-terms" type="checkbox" required
                class="w-5 h-5 mt-0.5 shrink-0 text-[#077FC4] border-gray-300 rounded focus:ring-[#077FC4] cursor-pointer">
            <span class="text-xs text-gray-500 font-medium leading-normal">
                I agree to the
                <button type="button" onclick="toggleTermsModal(true)" class="text-[#077FC4] font-bold hover:underline cursor-pointer bg-transparent border-none p-0 font-inherit text-xs">Terms of Service</button>
                and
                <button type="button" onclick="togglePrivacyModal(true)" class="text-[#077FC4] font-bold hover:underline cursor-pointer bg-transparent border-none p-0 font-inherit text-xs">Privacy Policy</button>.
            </span>
        </div>`;
    document.getElementById('login-submit-btn').innerText = 'Sign In';
    document.getElementById('login-toggle-text').innerHTML =
        '<a href="javascript:void(0)" onclick="showForgotPassword()" class="text-[#077FC4] font-bold hover:underline">Forgot Password</a>';
    window._loginMode = 'login';
    _fpStep  = 1;
    _fpEmail = '';
    wirePasswordToggle();
}

// ── OTP Box Logic ─────────────────────────────────────────────────────────────

let _otpEmail       = '';
let _otpTimerHandle = null;

/**
 * Show the OTP panel for the given email.
 * Called after successful registration or when login detects unverified account.
 */
function openOtpPanel(email) {
    _otpEmail = email;

    // Show email in panel
    const display = document.getElementById('otp-email-display');
    if (display) display.textContent = email;

    // Clear inputs + error
    clearOtpInputs();
    hideOtpError();

    // Move hero to left (OTP is on the right side like login)
    const hero = document.getElementById('hero-side');
    if (hero) hero.style.transform = 'translateX(0)';

    // Update hero text immediately — no delay
    const heroContent = document.getElementById('hero-content');
    const heroTitle   = document.getElementById('hero-title');
    const heroDesc    = document.getElementById('hero-desc');
    if (heroTitle) heroTitle.innerHTML = 'Almost <br> There!';
    if (heroDesc)  heroDesc.innerHTML  = 'Check your inbox and enter the <br> 6-digit verification code.';

    showPanel('otp');
    startOtpCountdown(10 * 60); // 10 minutes

    // Focus first box
    setTimeout(() => {
        const boxes = document.querySelectorAll('.otp-input');
        if (boxes[0]) boxes[0].focus();
    }, 100);
}

function clearOtpInputs() {
    document.querySelectorAll('.otp-input').forEach(i => {
        i.value = '';
        i.classList.remove('filled', 'error');
    });
}

function showOtpError(msg) {
    const el = document.getElementById('otp-error');
    if (el) { el.textContent = msg; el.classList.remove('hidden'); }
    document.querySelectorAll('.otp-input').forEach(i => i.classList.add('error'));
    setTimeout(() => { document.querySelectorAll('.otp-input').forEach(i => i.classList.remove('error')); }, 600);
}

function hideOtpError() {
    const el = document.getElementById('otp-error');
    if (el) el.classList.add('hidden');
}

// OTP countdown timer
function startOtpCountdown(seconds) {
    if (_otpTimerHandle) clearInterval(_otpTimerHandle);

    const countdownEl  = document.getElementById('otp-countdown');
    const timerWrapEl  = document.getElementById('otp-timer-wrap');
    const resendBtnEl  = document.getElementById('otp-resend-btn');

    let remaining = seconds;

    function tick() {
        const m = String(Math.floor(remaining / 60)).padStart(2, '0');
        const s = String(remaining % 60).padStart(2, '0');
        if (countdownEl) countdownEl.textContent = `${m}:${s}`;

        if (remaining <= 0) {
            clearInterval(_otpTimerHandle);
            if (timerWrapEl) timerWrapEl.classList.add('hidden');
            if (resendBtnEl) resendBtnEl.classList.remove('hidden');
        }
        remaining--;
    }

    // Show timer, hide resend
    if (timerWrapEl) timerWrapEl.classList.remove('hidden');
    if (resendBtnEl) resendBtnEl.classList.add('hidden');

    tick();
    _otpTimerHandle = setInterval(tick, 1000);
}

// Handle verify button click
async function handleVerifyOtp() {
    hideOtpError();

    const boxes = document.querySelectorAll('.otp-input');
    const otp   = Array.from(boxes).map(b => b.value.trim()).join('');

    if (otp.length < 6) {
        showOtpError('Please enter all 6 digits.');
        return;
    }

    const btn = document.getElementById('otp-verify-btn');
    btn.disabled    = true;
    btn.textContent = 'Verifying...';

    try {
        const result = await BALIK_API.verifyOtp(_otpEmail, otp);

        if (result.success) {
            clearInterval(_otpTimerHandle);

            // Success animation
            btn.textContent = '✓ Verified!';
            btn.classList.replace('bg-[#077FC4]', 'bg-green-500');
            btn.classList.replace('shadow-[#077FC4]/30', 'shadow-green-200');

            showToast('Email verified! You can now log in.', true);
            setTimeout(() => { window.location.reload(); }, 1400);
        }
    } catch (err) {
        btn.disabled    = false;
        btn.textContent = 'Verify Account';

        if (err.tooManyAttempts) {
            showOtpError('Too many attempts. Please request a new code.');
            const timerWrap = document.getElementById('otp-timer-wrap');
            const resendBtn = document.getElementById('otp-resend-btn');
            if (timerWrap) timerWrap.classList.add('hidden');
            if (resendBtn) resendBtn.classList.remove('hidden');
            clearInterval(_otpTimerHandle);
        } else if (err.expired) {
            showOtpError('Code expired. Please request a new one.');
            const timerWrap = document.getElementById('otp-timer-wrap');
            const resendBtn = document.getElementById('otp-resend-btn');
            if (timerWrap) timerWrap.classList.add('hidden');
            if (resendBtn) resendBtn.classList.remove('hidden');
        } else {
            showOtpError(err.message || 'Incorrect code. Please try again.');
        }
    }
}

// Handle resend button
async function handleResendOtp() {
    const resendBtn = document.getElementById('otp-resend-btn');
    resendBtn.textContent = 'Sending...';
    resendBtn.disabled    = true;

    try {
        await BALIK_API.resendOtp(_otpEmail);
        clearOtpInputs();
        hideOtpError();
        startOtpCountdown(10 * 60);
        showToast('A new code has been sent to your email.', true);
    } catch (err) {
        showToast(err.message || 'Could not resend code. Try again.', false);
        resendBtn.disabled    = false;
        resendBtn.textContent = 'Resend Code';
    }
}

// ── OTP Box: keyboard navigation ──────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function () {
    window._loginMode = 'login';
    showPanel('login');

    // Wire password toggle for the static login HTML inputs
    wirePasswordToggle();
    // Wire up OTP input boxes — auto-advance, backspace, paste
    const otpBoxes = document.querySelectorAll('.otp-input');

    otpBoxes.forEach((box, i) => {
        box.addEventListener('input', function () {
            // Only allow digits
            this.value = this.value.replace(/\D/g, '').slice(0, 1);
            if (this.value) {
                this.classList.add('filled');
                if (i < otpBoxes.length - 1) otpBoxes[i + 1].focus();
            } else {
                this.classList.remove('filled');
            }
            hideOtpError();
        });

        box.addEventListener('keydown', function (e) {
            if (e.key === 'Backspace') {
                if (!this.value && i > 0) {
                    otpBoxes[i - 1].value = '';
                    otpBoxes[i - 1].classList.remove('filled');
                    otpBoxes[i - 1].focus();
                }
            } else if (e.key === 'ArrowLeft' && i > 0) {
                otpBoxes[i - 1].focus();
            } else if (e.key === 'ArrowRight' && i < otpBoxes.length - 1) {
                otpBoxes[i + 1].focus();
            } else if (e.key === 'Enter') {
                handleVerifyOtp();
            }
        });

        // Handle paste — fill all boxes at once
        box.addEventListener('paste', function (e) {
            e.preventDefault();
            const pasted = (e.clipboardData || window.clipboardData)
                .getData('text').replace(/\D/g, '').slice(0, 6);
            pasted.split('').forEach((char, idx) => {
                if (otpBoxes[idx]) {
                    otpBoxes[idx].value = char;
                    otpBoxes[idx].classList.add('filled');
                }
            });
            const nextEmpty = Array.from(otpBoxes).findIndex(b => !b.value);
            if (nextEmpty >= 0) otpBoxes[nextEmpty].focus();
            else otpBoxes[otpBoxes.length - 1].focus();
        });
    });

    // ── LOGIN FORM ────────────────────────────────────────────────────────────

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const btn = document.getElementById('login-submit-btn');

            if (window._loginMode === 'forgot') {
                if (_fpStep === 1) {
                    // Step 1: Email → send OTP
                    const email = (document.getElementById('fp-email')?.value || '').trim();
                    if (!email) { showToast('Please enter your email address.', false); return; }
                    btn.disabled = true; btn.textContent = 'Sending...';
                    let _sent = false;
                    try {
                        const res  = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
                        const json = await res.json();
                        if (!res.ok) throw new Error(json.error || 'Failed to send reset code.');
                        _sent = true;
                        btn.disabled = false;
                        showToast('Reset code sent! Check your email.', true);
                        _showFpStep2(email);
                    } catch (err) {
                        showToast(err.message || 'Could not send reset code.', false);
                        btn.disabled = false; btn.textContent = 'Send Reset Code';
                    }

                } else if (_fpStep === 2) {
                    // Step 2: Verify OTP only
                    const otp = (document.getElementById('fp-otp')?.value || '').trim();
                    if (!otp || otp.length < 6) { showToast('Please enter the 6-digit code.', false); return; }
                    // Store OTP for step 3 (backend will validate it on reset)
                    window._fpOtp = otp;
                    _showFpStep3();

                } else {
                    // Step 3: New password → reset
                    const newPass = document.getElementById('fp-new')?.value  || '';
                    const confirm = document.getElementById('fp-confirm')?.value || '';
                    if (!newPass)           { showToast('Please enter a new password.', false); return; }
                    if (newPass.length < 8) { showToast('Password must be at least 8 characters.', false); return; }
                    if (newPass !== confirm) { showToast('Passwords do not match.', false); return; }
                    btn.disabled = true; btn.textContent = 'Changing...';
                    try {
                        const res  = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: _fpEmail, otp: window._fpOtp, new_password: newPass }) });
                        const json = await res.json();
                        if (!res.ok) throw new Error(json.error || 'Reset failed.');
                        showToast('Password changed successfully! You can now log in.', true);
                        btn.disabled = false;
                        setTimeout(() => showLogin(), 1500);
                    } catch (err) {
                        showToast(err.message || 'Reset failed. Please try again.', false);
                        btn.disabled = false; btn.textContent = 'Change Password';
                    }
                }
                return;
            }

            const emailEl    = document.getElementById('login-email')    || loginForm.querySelector('input[type="email"]');
            const passwordEl = document.getElementById('login-password') || loginForm.querySelector('input[type="password"]');
            const terms      = document.getElementById('login-terms');

            if (terms && !terms.checked) { showToast('Please agree to the Terms of Service.', false); return; }

            const email    = emailEl ? emailEl.value.trim() : '';
            const password = passwordEl ? passwordEl.value : '';
            if (!email || !password) { showToast('Please fill in all fields.', false); return; }

            btn.disabled    = true;
            btn.textContent = 'Signing in...';

            try {
                const result = await BALIK_API.login(email, password);
                if (result.success) {
                    // Save to localStorage so account.html and other pages can read the session
                    localStorage.setItem('balik_user', JSON.stringify(result.user));
                    showToast('Welcome back, ' + result.user.name + '!', true);
                    if (result.is_admin) {
                        setTimeout(() => { window.location.href = "/admin/"; }, 1200);
                    } else {
                        setTimeout(() => { window.location.href = "index.html"; }, 1200);
                    }
                }
            } catch (err) {
                btn.disabled    = false;
                btn.textContent = 'Sign In';

                // Unverified account — go to OTP step
                if (err.needsVerification || (err.message && err.message.includes('verified'))) {
                    showToast('Please verify your email first.', false);
                    openOtpPanel(err.email || email);
                } else {
                    showToast(err.message || 'Login failed. Please try again.', false);
                }
            }
        });
    }

    // ── REGISTER FORM ─────────────────────────────────────────────────────────

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const btn = registerForm.querySelector('button[type="submit"]');

            const name     = registerForm.querySelector('input[name="name"]').value.trim();
            const age      = registerForm.querySelector('input[name="age"]').value;
            const affil    = registerForm.querySelector('select[name="affiliation"]').value;
            const email    = registerForm.querySelector('input[name="email"]').value.trim();
            const password = registerForm.querySelector('input[name="password"]').value;
            const confirm  = registerForm.querySelector('input[name="confirm-password"]').value;
            const terms    = registerForm.querySelector('input[type="checkbox"]');

            if (!name || !email || !password) { showToast('Please fill in all required fields.', false); return; }
            if (password !== confirm)          { showToast('Passwords do not match.', false); return; }
            if (password.length < 6)           { showToast('Password must be at least 6 characters.', false); return; }
            if (terms && !terms.checked)       { showToast('Please agree to the Terms of Service.', false); return; }

            btn.disabled    = true;
            btn.textContent = 'Creating account...';

            try {
                const result = await BALIK_API.register({ name, age, affiliation: affil, email, password });

                // Backend returns { success: true, message: '...' } on successful registration
                if (result.success || result.needsVerification) {
                    showToast('Account created! Check your email for the verification code.', true);
                    openOtpPanel(result.email || email);
                } else {
                    // Unexpected response — reset button so user can retry
                    btn.disabled    = false;
                    btn.textContent = 'Create Account';
                    showToast('Something went wrong. Please try again.', false);
                }
            } catch (err) {
                btn.disabled    = false;
                btn.textContent = 'Create Account';
                // Provide a clear, user-friendly message for duplicate email
                const msg = (err.message || '').toLowerCase();
                if (msg.includes('already exists') || msg.includes('email')) {
                    showToast('This email is already registered. Please log in or use a different email.', false);
                } else {
                    showToast(err.message || 'Registration failed. Please try again.', false);
                }
            }
        });
    }
});

// Expose for HTML onclick attributes
window.toggleView     = toggleView;
window.showForgotPassword = showForgotPassword;
window.showLogin      = showLogin;
window.backToRegister = backToRegister;
window.handleVerifyOtp  = handleVerifyOtp;
window.handleResendOtp  = handleResendOtp;
// ── Terms & Privacy Modals ────────────────────────────────────────────────────

// function toggleTermsModal(show) {
//     const modal = document.getElementById('terms-modal');
//     if (!modal) return;
//     if (show) {
//         modal.classList.remove('hidden');
//         modal.style.display = 'flex';
//     } else {
//         modal.classList.add('hidden');
//         modal.style.display = '';
//     }
//     document.body.style.overflow = show ? 'hidden' : '';
// }

// function togglePrivacyModal(show) {
//     const modal = document.getElementById('privacy-policy-modal');
//     if (!modal) return;
//     if (show) {
//         modal.classList.remove('hidden');
//         modal.style.display = 'flex';
//     } else {
//         modal.classList.add('hidden');
//         modal.style.display = '';
//     }
//     document.body.style.overflow = show ? 'hidden' : '';
// }

// window.toggleTermsModal   = toggleTermsModal;
// window.togglePrivacyModal = togglePrivacyModal;
function togglePrivacyModal(show) {
    const modal = document.getElementById('privacy-policy-modal');
    if (!modal) return;
    
    if (show) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        modal.style.zIndex = '99999'; // Ensure it's above the login boxes
        document.body.style.overflow = 'hidden';
    } else {
        modal.classList.add('hidden');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function toggleTermsModal(show) {
    const modal = document.getElementById('terms-modal');
    if (!modal) return;
    
    if (show) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        modal.style.zIndex = '99999';
        document.body.style.overflow = 'hidden';
    } else {
        modal.classList.add('hidden');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Close modal if user clicks outside the white box (on the dark background)
window.onclick = function(event) {
    const pModal = document.getElementById('privacy-policy-modal');
    const tModal = document.getElementById('terms-modal');
    if (event.target == pModal) togglePrivacyModal(false);
    if (event.target == tModal) toggleTermsModal(false);
}