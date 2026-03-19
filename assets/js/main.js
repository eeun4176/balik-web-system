/**
 * BALIK-BALIK HOME PAGE JAVASCRIPT
 * Handles Navbar effects, Mobile Menu, and Notifications
 */

document.addEventListener("DOMContentLoaded", function () {
    // --- 1. ELEMENT DECLARATIONS ---
    const navbar = document.getElementById('navbar');
    const navLogo = document.getElementById('nav-logo');
    const navLinks = document.getElementById('nav-links');
    const menuIcon = document.getElementById('menu-icon-svg');
    const backToTop = document.getElementById('backToTop');
    
    // Notification & Profile Elements
    const notifBell = document.getElementById("notif-bell");
    const userIcon = document.getElementById("user-icon");
    const iconWrapper = document.getElementById("icon-wrapper");

    // Mobile Drawer Elements
    const menuBtn = document.getElementById('menu-btn');
    const closeBtn = document.getElementById('close-btn');
    const menuOverlay = document.getElementById('menu-overlay');
    const menuDrawer = document.getElementById('menu-drawer');

    // --- 2. NAVBAR & ICON SCROLL LOGIC ---
    // Changes styles when user scrolls down
    window.addEventListener("scroll", function () {
        const scrollValue = window.scrollY;

        if (scrollValue > 50) {

            // Scrolled State
            navbar.classList.add('bg-white', 'shadow-md', 'py-3', 'text-gray-800', 'border-gray-100');
            navbar.classList.remove('text-white', 'border-white/15', 'py-4');
            
            if (navLogo) {
                navLogo.src = "../images/balik-logo-black.png";
                navLogo.style.height = "60px";
            }
            
            if (menuIcon) menuIcon.classList.add('text-black');
            
            // Force Icons to Black via filters
            if (notifBell) {
                notifBell.classList.remove('brightness-0', 'invert');
                notifBell.style.filter = "brightness(0)";
            }
            if (userIcon && !userIcon.dataset.hasPhoto) userIcon.style.filter = "brightness(0)";
            
            if (iconWrapper) iconWrapper.classList.replace('lg:border-white/50', 'lg:border-gray-200');
        } else {
        
            // Top / Default State
            navbar.classList.remove('bg-white', 'shadow-md', 'py-3', 'text-gray-800', 'border-gray-100');
            navbar.classList.add('text-white', 'border-white/15', 'py-4');
            
            if (navLogo) {
                navLogo.src = "../images/balik-logo-white.png";
                navLogo.style.height = "80px";
            }
            
            if (menuIcon) menuIcon.classList.remove('text-black');

            // Force Icons to White
            if (notifBell) {
                notifBell.classList.add('brightness-0', 'invert');
                notifBell.style.filter = "brightness(0) invert(1)";
            }
            if (userIcon) userIcon.style.filter = "none";
            
            if (iconWrapper) iconWrapper.classList.replace('lg:border-gray-200', 'lg:border-white/50');
        }

        // Back to Top Button Visibility
        if (backToTop) {
            if (scrollValue > 500) {
                backToTop.classList.remove('opacity-0', 'invisible', 'translate-y-10');
                backToTop.classList.add('opacity-100', 'visible', 'translate-y-0');
            } else {
                backToTop.classList.add('opacity-0', 'invisible', 'translate-y-10');
                backToTop.classList.remove('opacity-100', 'visible', 'translate-y-0');
            }
        }
    });

    // --- 3. MOBILE DRAWER LOGIC ---
    // Handles the sliding menu for mobile users
    function toggleMenu(isOpen) {
        if (!menuOverlay || !menuDrawer) return;

        if (isOpen) {
            menuOverlay.classList.remove('opacity-0', 'pointer-events-none');
            menuDrawer.classList.remove('-translate-x-full');
        } else {
            menuOverlay.classList.add('opacity-0', 'pointer-events-none');
            menuDrawer.classList.add('-translate-x-full');
        }
    }

    if (menuBtn) menuBtn.addEventListener('click', () => toggleMenu(true));
    if (closeBtn) closeBtn.addEventListener('click', () => toggleMenu(false));
    if (menuOverlay) {
        menuOverlay.addEventListener('click', (e) => {
            if (e.target === menuOverlay) toggleMenu(false);
        });
    }

    // --- 4. BACK TO TOP CLICK ---
    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- 5. NOTIFICATION TAB SYSTEM --- handled by shared notifications.js
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