/**
 * BALIK-BALIK PROJECT - MAIN JAVASCRIPT
 * Version: 1.2
 * Description: Handles dynamic navbar states, scroll-to-top visibility, 
 * mobile navigation drawer, notification tabs, and FAQ interactions.
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
    const mapModal = document.getElementById('mapModal');

    // --- 2. CORE SCROLL LOGIC ---
    /**
     * Updates UI elements based on the vertical scroll position.
     * Transitions navbar from transparent/dark to solid white.
     */
    function handleScrollEffects() {
        const scrollValue = window.scrollY;
        const isScrolled  = scrollValue > 50;

        if (isScrolled) {
            // Scrolled State (White Theme)
            navbar.classList.add('bg-white', 'shadow-md', 'py-3', 'text-gray-800', 'border-gray-100');
            navbar.classList.remove('text-white', 'border-white/15', 'py-4', 'border-b');
            
            if (navLogo) {
                navLogo.src = "../images/balik-logo-black.png";
                navLogo.style.height = "60px";
            }
            if (navLinks) navLinks.classList.replace('text-white', 'text-gray-800');
            if (menuIcon) menuIcon.classList.add('text-black');
            
            // Icon Filters: Black
            if (notifBell) {
                notifBell.classList.remove('brightness-0', 'invert');
                notifBell.style.filter = "brightness(0)";
            }
            if (userIcon && !userIcon.dataset.hasPhoto) userIcon.style.filter = "brightness(0)";
            if (iconWrapper) iconWrapper.classList.replace('lg:border-white/50', 'lg:border-gray-200');

        } else {
            // Top State (Transparent/Dark Theme)
            navbar.classList.remove('bg-white', 'shadow-md', 'py-3', 'text-gray-800', 'border-gray-100');
            navbar.classList.add('text-white', 'border-white/15', 'py-4');
            
            if (navLogo) {
                navLogo.src = "../images/balik-logo-white.png";
                navLogo.style.height = "80px";
            }
            if (navLinks) navLinks.classList.replace('text-gray-800', 'text-white');
            if (menuIcon) menuIcon.classList.remove('text-black');

            // Icon Filters: White
            if (notifBell) {
                notifBell.classList.add('brightness-0', 'invert');
                notifBell.style.filter = "brightness(0) invert(1)";
            }
            if (userIcon) userIcon.style.filter = "none";
            if (iconWrapper) iconWrapper.classList.replace('lg:border-gray-200', 'lg:border-white/50');
        }

        // --- 3. BACK TO TOP VISIBILITY ---
        if (backToTop) {
            const isVisible = scrollValue > 500;
            backToTop.classList.toggle('opacity-100', isVisible);
            backToTop.classList.toggle('visible', isVisible);
            backToTop.classList.toggle('translate-y-0', isVisible);
            backToTop.classList.toggle('opacity-0', !isVisible);
            backToTop.classList.toggle('invisible', !isVisible);
            backToTop.classList.toggle('translate-y-10', !isVisible);
        }
    }

    // Attach scroll listener and trigger once on load
    window.addEventListener("scroll", handleScrollEffects);
    handleScrollEffects();

    // --- 4. NAVIGATION & MODAL INTERACTION ---

    // Back to Top Smooth Click
    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Mobile Drawer Toggle
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

    // Map Modal Controls
    window.openMap = function() {
        if (mapModal) {
            mapModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    };

    window.closeMap = function() {
        if (mapModal) {
            mapModal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    };

    // --- 5. NOTIFICATION SYSTEM --- handled by shared notifications.js
});

/**
 * FAQ INTERACTION (Global Scope)
 * Toggles accordion state for FAQ items.
 */
function toggleFAQ(element) {
    const item     = element.parentElement;
    const content  = item.querySelector('.faq-content');
    const question = item.querySelector('.faq-question');
    const arrow    = item.querySelector('.faq-arrow');
    
    // Auto-close other items
    document.querySelectorAll('.faq-item').forEach(otherItem => {
        if (otherItem !== item) {
            otherItem.classList.replace('bg-french-blue', 'bg-white');
            otherItem.querySelector('.faq-content').style.maxHeight = null;
            otherItem.querySelector('.faq-question').classList.replace('text-white', 'text-gray-700');
            const otherArrow = otherItem.querySelector('.faq-arrow');
            otherArrow.classList.remove('rotate-180', 'text-white');
            otherArrow.classList.add('text-gray-400');
        }
    });

    const isOpen = item.classList.contains('bg-french-blue');

    if (isOpen) {
        item.classList.replace('bg-french-blue', 'bg-white');
        content.style.maxHeight = null;
        question.classList.replace('text-white', 'text-gray-700');
        arrow.classList.remove('rotate-180', 'text-white');
        arrow.classList.add('text-gray-400');
    } else {
        item.classList.replace('bg-white', 'bg-french-blue');
        content.style.maxHeight = content.scrollHeight + "px";
        question.classList.replace('text-gray-700', 'text-white');
        arrow.classList.replace('text-gray-400', 'text-white');
        arrow.classList.add('rotate-180');
    }
}