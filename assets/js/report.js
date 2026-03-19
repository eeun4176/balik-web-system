/**
 * REPORT PAGE JAVASCRIPT
 * Handles both report-lost-page.html and report-found-page.html
 * Dropdowns are loaded from the API. Form submits to the backend.
 */

// ── Toast Notification ─────────────────────────────────────────────────────────
function showToast(message, isSuccess) {
    let toast = document.getElementById('reportToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'reportToast';
        toast.style.cssText = `position:fixed;top:20px;right:20px;z-index:9999;padding:14px 20px;border-radius:14px;color:white;font-weight:600;font-size:0.9rem;max-width:360px;box-shadow:0 8px 24px rgba(0,0,0,0.15);transition:transform 0.4s ease,opacity 0.4s ease;transform:translateX(calc(100% + 40px));opacity:0;`;
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.backgroundColor = isSuccess ? '#077FC4' : '#EF4444';
    toast.style.transform = 'translateX(0)';
    toast.style.opacity = '1';
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => {
        toast.style.transform = 'translateX(calc(100% + 40px))';
        toast.style.opacity = '0';
    }, 3500);
}

document.addEventListener("DOMContentLoaded", async function () {

    // ── 1. ELEMENT SELECTORS ───────────────────────────────────────────────
    const navbar       = document.getElementById('navbar');
    const navLogo      = document.getElementById('nav-logo');
    const menuIcon     = document.getElementById('menu-icon-svg');
    const backToTop    = document.getElementById('backToTop');
    const notifBell    = document.getElementById("notif-bell");
    const userIcon     = document.getElementById("user-icon");
    const iconWrapper  = document.getElementById("icon-wrapper");
    const menuBtn      = document.getElementById('menu-btn');
    const closeBtn     = document.getElementById('close-btn');
    const menuOverlay  = document.getElementById('menu-overlay');
    const menuDrawer   = document.getElementById('menu-drawer');

    const affiliationSelect = document.getElementById('affiliation');
    const dynamicFields     = document.getElementById('dynamic-fields');

    const dateInput = document.getElementById('date-lost');
    const timeInput = document.getElementById('time-lost');
    const tDate     = document.getElementById('turnover-date');
    const tTime     = document.getElementById('turnover-time');

    const btnYes    = document.getElementById('choice-yes');
    const btnNotYet = document.getElementById('choice-not-yet');
    const sectionYes    = document.getElementById('section-yes');
    const sectionNotYet = document.getElementById('section-not-yet');

    const nextBtn      = document.getElementById('next-btn');
    const backToStep1  = document.getElementById('back-to-step1');
    const nextToStep3  = document.getElementById('next-to-step3');
    const backToStep2  = document.getElementById('back-to-step2');

    const step1    = document.getElementById('step-1-container');
    const step2    = document.getElementById('step-2-container');
    const step3    = document.getElementById('step-3-container');
    const circle2  = document.getElementById('step-2');
    const circle3  = document.getElementById('step-3');

    // ── 2. AUTO DATE & TIME ────────────────────────────────────────────────
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');

    if (dateInput) dateInput.value = currentDate;
    if (timeInput) timeInput.value = currentTime;
    if (tDate) tDate.value = currentDate;
    if (tTime) tTime.value = currentTime;

    // ── 3. NAVBAR SCROLL ──────────────────────────────────────────────────
    window.addEventListener("scroll", function () {
        const scrolled = window.scrollY > 50;
        navbar.classList.toggle('bg-white', scrolled);
        navbar.classList.toggle('shadow-md', scrolled);
        navbar.classList.toggle('py-3', scrolled);
        navbar.classList.toggle('text-gray-800', scrolled);
        navbar.classList.toggle('border-gray-100', scrolled);
        navbar.classList.toggle('text-white', !scrolled);
        navbar.classList.toggle('border-white/15', !scrolled);
        navbar.classList.toggle('py-4', !scrolled);
        if (navLogo) {
            navLogo.src = scrolled ? "../images/balik-logo-black.png" : "../images/balik-logo-white.png";
            navLogo.style.height = scrolled ? "60px" : "80px";
        }
        if (menuIcon) menuIcon.classList.toggle('text-black', scrolled);
        if (notifBell) notifBell.style.filter = scrolled ? "brightness(0)" : "brightness(0) invert(1)";
        if (userIcon && !userIcon.dataset.hasPhoto)  userIcon.style.filter  = scrolled ? "brightness(0)" : "none";
        if (iconWrapper) {
            iconWrapper.classList.toggle('lg:border-white/50', !scrolled);
            iconWrapper.classList.toggle('lg:border-gray-200',  scrolled);
        }
        if (backToTop) {
            const vis = window.scrollY > 500;
            backToTop.classList.toggle('opacity-0',     !vis);
            backToTop.classList.toggle('invisible',     !vis);
            backToTop.classList.toggle('translate-y-10',!vis);
            backToTop.classList.toggle('opacity-100',    vis);
            backToTop.classList.toggle('visible',        vis);
            backToTop.classList.toggle('translate-y-0',  vis);
        }
    });

    // ── 4. MOBILE DRAWER ─────────────────────────────────────────────────
    function toggleMenu(isOpen) {
        if (!menuOverlay || !menuDrawer) return;
        menuOverlay.classList.toggle('opacity-0', !isOpen);
        menuOverlay.classList.toggle('pointer-events-none', !isOpen);
        menuDrawer.classList.toggle('-translate-x-full', !isOpen);
    }
    if (menuBtn)     menuBtn.addEventListener('click',    () => toggleMenu(true));
    if (closeBtn)    closeBtn.addEventListener('click',   () => toggleMenu(false));
    if (menuOverlay) menuOverlay.addEventListener('click', e => { if (e.target === menuOverlay) toggleMenu(false); });
    if (backToTop)   backToTop.addEventListener('click',  () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // ── 5. LOAD LOOKUP DATA FROM API ─────────────────────────────────────
    let lookupData = { affiliations: [], programs: [], departments: [], categories: [], locations: [], offices: [] };
    try {
        lookupData = await BALIK_API.getLookupAll();
    } catch (e) {
        console.warn('Could not load lookup data from server. Using fallback.');
    }

    // Populate Category select (step 2)
    const allSelects = document.querySelectorAll('#step-2-container select');
    const categorySelect = allSelects[0];
    if (categorySelect && lookupData.categories.length) {
        BALIK_API.populateSelect(categorySelect, lookupData.categories, '---');
    }

    // Populate Location select
    const locationSelect = document.getElementById('location-select');
    if (locationSelect && lookupData.locations.length) {
        BALIK_API.populateSelect(locationSelect, lookupData.locations, 'Location Lost/Found');
    }

    // Populate "Turn Overed To" select (found page step 3)
    if (lookupData.offices.length) {
        document.querySelectorAll('#section-yes select').forEach(sel => {
            BALIK_API.populateSelect(sel, lookupData.offices, 'Turn Overed To:');
        });
    }

    // Populate Affiliation select
    if (affiliationSelect && lookupData.affiliations.length) {
        BALIK_API.populateSelect(affiliationSelect, lookupData.affiliations, '---');
    }

    // ── 6. DYNAMIC AFFILIATION FIELDS ────────────────────────────────────
    async function renderFields(role) {
        if (!dynamicFields) return;
        const inputClass   = "w-full bg-gray-200/70 border-none rounded-2xl pl-6 pr-12 py-2.5 outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-french-blue transition-all text-gray-700";
        const wrapperClass = "flex flex-col mb-4";
        const labelClass   = "text-sm font-regular text-gray-500 mb-2 block ml-2";
        const arrowIcon    = '<img src="../icons/down-arrow.png" class="absolute right-5 w-4 h-4 object-contain pointer-events-none opacity-60" alt="dropdown icon">';
        const textInput    = inputClass.replace('cursor-pointer', '');

        const phoneInput = '<input type="text" id="contact-number" required placeholder="09XXXXXXXXX" maxlength="14" class="contact-num-mask ' + textInput + '">';

        let html = '';

        if (role === 'student') {
            const programOptions = lookupData.programs.map(p => '<option value="' + p.id + '">' + p.label + '</option>').join('');
            html = '<div class="' + wrapperClass + '"><label class="' + labelClass + '">Student Number:</label><input type="text" id="student-number" required class="' + textInput + '"></div>' +
                '<div class="' + wrapperClass + '"><label class="' + labelClass + '">Program:</label><div class="relative flex items-center"><select id="program-select" class="' + inputClass + '"><option value="" disabled selected>---</option>' + programOptions + '</select>' + arrowIcon + '</div></div>' +
                '<div class="' + wrapperClass + '"><label class="' + labelClass + '">Year:</label><div class="relative flex items-center"><select id="year-select" required class="' + inputClass + '\"><option value="" disabled selected>---</option><option value="1">1st Year</option><option value="2">2nd Year</option><option value="3">3rd Year</option><option value="4">4th Year</option></select>' + arrowIcon + '</div></div>' +
                '<div class="' + wrapperClass + '"><label class="' + labelClass + '">Section:</label><div class="relative flex items-center"><select id="section-select" class="' + inputClass + '"><option value="" disabled selected>---</option></select>' + arrowIcon + '</div></div>' +
                '<div class="' + wrapperClass + '"><label class="' + labelClass + '">Contact Email:</label><input type="email" id="contact-email" class="' + textInput + '"></div>' +
                '<div class="' + wrapperClass + '"><label class="' + labelClass + '">Contact Number:</label>' + phoneInput + '</div>';

        } else if (role === 'faculty') {
            const deptOptions = lookupData.departments.map(d => '<option value="' + d.id + '">' + d.label + '</option>').join('');
            html = '<div class="' + wrapperClass + '"><label class="' + labelClass + '">Employee Number:</label><input type="text" id="employee-number" required class="' + textInput + '"></div>' +
                '<div class="' + wrapperClass + '"><label class="' + labelClass + '">Department:</label><div class="relative flex items-center"><select id="dept-select" class="' + inputClass + '"><option value="" disabled selected>---</option>' + deptOptions + '</select>' + arrowIcon + '</div></div>' +
                '<div class="' + wrapperClass + '"><label class="' + labelClass + '">Contact Email:</label><input type="email" id="contact-email" required class="' + textInput + '"></div>' +
                '<div class="' + wrapperClass + '"><label class="' + labelClass + '">Contact Number:</label>' + phoneInput + '</div>';

        } else if (['non-teaching','security','maintenance'].includes(role)) {
            html = '<div class="' + wrapperClass + '"><label class="' + labelClass + '">Employee Number:</label><input type="text" id="employee-number" required class="' + textInput + '"></div>' +
                '<div class="' + wrapperClass + '"><label class="' + labelClass + '">Contact Email:</label><input type="email" id="contact-email" required class="' + textInput + '"></div>' +
                '<div class="' + wrapperClass + '"><label class="' + labelClass + '">Contact Number:</label>' + phoneInput + '</div>';

        } else if (['visitor','external'].includes(role)) {
            html = '<div class="' + wrapperClass + '"><label class="' + labelClass + '">Contact Email:</label><input type="email" id="contact-email" required class="' + textInput + '"></div>' +
                '<div class="' + wrapperClass + '"><label class="' + labelClass + '">Contact Number:</label>' + phoneInput + '</div>';

        } else {
            html = '<p class="text-sm text-gray-400 ml-2">Please select an affiliation to continue.</p>';
        }

        dynamicFields.innerHTML = html;

        // Year → Section cascade
        if (role === 'student') {
            const yearSel    = document.getElementById('year-select');
            const sectionSel = document.getElementById('section-select');
            if (yearSel) {
                yearSel.addEventListener('change', async function () {
                    try {
                        const sections = await BALIK_API.getSections(this.value);
                        BALIK_API.populateSelect(sectionSel, sections, '---');
                    } catch (e) {
                        // fallback
                        const letters = ['A','B','C','D','E'];
                        sectionSel.innerHTML = '<option value="" disabled selected>---</option>';
                        letters.forEach(l => {
                            const opt = document.createElement('option');
                            opt.value = opt.textContent = this.value + l;
                            sectionSel.appendChild(opt);
                        });
                    }
                });
            }
        }

        // Phone masking
        dynamicFields.querySelectorAll('.contact-num-mask').forEach(input => {
            input.addEventListener('input', function () {
                let v = this.value.replace(/\D/g, '');
                if (v.length > 11) v = v.slice(0, 11);
                let f = v.substring(0, 4);
                if (v.length > 4) f += '-' + v.substring(4, 7);
                if (v.length > 7) f += '-' + v.substring(7, 11);
                this.value = f;
            });
        });
    }

    if (affiliationSelect) {
        affiliationSelect.addEventListener('change', e => renderFields(e.target.value));
        if (affiliationSelect.value) renderFields(affiliationSelect.value);
    }

    // ── 7. LOCATION → ROOM CASCADE ───────────────────────────────────────
    const roomWrapper = document.getElementById('room-wrapper');
    const roomSelect  = document.getElementById('room-select');

    if (locationSelect) {
        locationSelect.addEventListener('change', async function () {
            const locObj = lookupData.locations.find(l => l.id == this.value || l.label === this.value);
            if (locObj && locObj.has_rooms) {
                try {
                    const rooms = await BALIK_API.getRooms(locObj.id);
                    if (rooms.length) {
                        if (roomWrapper) roomWrapper.classList.remove('hidden');
                        BALIK_API.populateSelect(roomSelect, rooms, 'Room');
                        return;
                    }
                } catch (e) { /* fallback below */ }
            }
            if (roomWrapper) roomWrapper.classList.add('hidden');
        });
    }

    // ── 8. STEP NAVIGATION ───────────────────────────────────────────────
    function updateStepUI(circleEl, isActive) {
        if (!circleEl) return;
        circleEl.classList.toggle('bg-french-blue', isActive);
        circleEl.classList.toggle('text-white',     isActive);
        circleEl.classList.toggle('bg-white',      !isActive);
        circleEl.classList.toggle('text-gray-400', !isActive);
    }

    // ── Autofill basic info from logged-in user ────────────────────────────
    (function autofillBasicInfo() {
        const stored = localStorage.getItem('balik_user');
        if (!stored) return;
        try {
            const user = JSON.parse(stored);
            if (!user || !user.id) return;
            fetch('/api/users/' + user.id)
                .then(r => r.json())
                .then(async u => {
                    if (!step1) return;
                    const inputs = step1.querySelectorAll('input');
                    // Full Name
                    if (inputs[0] && u.full_name) {
                        inputs[0].value = u.full_name;
                        inputs[0].readOnly = true;
                        inputs[0].classList.add('bg-gray-100', 'cursor-not-allowed');
                    }
                    // Age
                    if (inputs[1] && u.age) {
                        inputs[1].value = u.age;
                        inputs[1].readOnly = true;
                        inputs[1].classList.add('bg-gray-100', 'cursor-not-allowed');
                    }

                    // Wait until affiliationSelect options are populated (up to 2s)
                    let waited = 0;
                    while (affiliationSelect && affiliationSelect.options.length <= 1 && waited < 2000) {
                        await new Promise(r => setTimeout(r, 100));
                        waited += 100;
                    }

                    // Affiliation select — match by value or label
                    let matchedAffilValue = '';
                    if (affiliationSelect) {
                        for (let opt of affiliationSelect.options) {
                            const labelMatch = u.affiliation_label && opt.text.toLowerCase() === u.affiliation_label.toLowerCase();
                            if (labelMatch) {
                                affiliationSelect.value = opt.value;
                                matchedAffilValue = opt.value;
                                break;
                            }
                        }
                        if (matchedAffilValue) {
                            affiliationSelect.disabled = true;
                            affiliationSelect.classList.add('cursor-not-allowed');
                            await renderFields(matchedAffilValue);
                        }
                    }

                    // Now fill dynamic fields (contact + ID number)
                    const fillFields = () => {
                        // Contact email
                        if (u.contact_email) {
                            const el = document.getElementById('contact-email');
                            if (el) { el.value = u.contact_email; el.readOnly = true; el.classList.add('bg-gray-100','cursor-not-allowed'); }
                        }
                        // Contact number
                        if (u.contact_number) {
                            const el = document.getElementById('contact-number');
                            if (el) { el.value = u.contact_number; el.readOnly = true; el.classList.add('bg-gray-100','cursor-not-allowed'); }
                        }
                        // ID number (Student Number / Employee Number)
                        let extra = {};
                        try { extra = (u.extra_details && typeof u.extra_details === 'object') ? u.extra_details : JSON.parse(u.extra_details || '{}'); } catch(e) {}
                        const affilNow = (affiliationSelect && affiliationSelect.value) || matchedAffilValue || '';
                        const isStudent = affilNow === 'student';
                        const idNum = isStudent
                            ? (extra['Student Number'] || extra['id_number'] || '')
                            : (extra['Employee Number'] || extra['id_number'] || '');
                        if (idNum) {
                            const stuEl = document.getElementById('student-number');
                            const empEl = document.getElementById('employee-number');
                            const target = stuEl || empEl;
                            if (target) { target.value = idNum; target.readOnly = true; target.classList.add('bg-gray-100','cursor-not-allowed'); }
                        }
                    };
                    // Run after renderFields HTML has been set
                    setTimeout(fillFields, 150);
                    setTimeout(fillFields, 500);
                })
                .catch(() => {});
        } catch(e) {}
    })();

    // ── Step 1 → Step 2: validate all required fields ───────────────────
    if (nextBtn) nextBtn.addEventListener('click', () => {
        // Validate name
        const inputs = step1 ? step1.querySelectorAll('input') : [];
        const nameVal = inputs[0] ? inputs[0].value.trim() : '';
        const ageVal  = inputs[1] ? inputs[1].value.trim() : '';
        const affilVal = affiliationSelect ? affiliationSelect.value : '';

        if (!nameVal) { showToast('Please enter your full name.', false); inputs[0] && inputs[0].focus(); return; }
        if (!ageVal)  { showToast('Please enter your age.', false); inputs[1] && inputs[1].focus(); return; }
        if (!affilVal) { showToast('Please select your affiliation.', false); affiliationSelect && affiliationSelect.focus(); return; }

        // Validate all required dynamic fields
        const dynamicRequired = dynamicFields ? dynamicFields.querySelectorAll('input[required], select[required]') : [];
        for (let field of dynamicRequired) {
            if (!field.value.trim()) {
                const label = field.closest('.flex')?.querySelector('label')?.textContent || 'required field';
                showToast('Please fill in: ' + label.replace(':', ''), false);
                field.focus();
                field.style.outline = '2px solid #EF4444';
                field.style.borderRadius = '14px';
                setTimeout(() => { field.style.outline = ''; }, 2000);
                return;
            }
        }

        step1.classList.add('hidden');
        step2.classList.remove('hidden');
        updateStepUI(circle2, true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    if (backToStep1) backToStep1.addEventListener('click', () => { step2.classList.add('hidden'); step1.classList.remove('hidden'); updateStepUI(circle2, false); window.scrollTo({top:0,behavior:'smooth'}); });
    if (nextToStep3) nextToStep3.addEventListener('click', () => {
        // Validate all required fields in step 2
        if (!step2) { populateSummary(); step2.classList.add('hidden'); step3.classList.remove('hidden'); updateStepUI(circle3, true); window.scrollTo({top:0,behavior:'smooth'}); return; }
        // For report-found: photo upload is required
        if (window.location.pathname.includes('report-found')) {
            const photoInput = document.getElementById('photo-upload');
            if (!photoInput || !photoInput.files || !photoInput.files[0]) {
                showToast('Please upload a photo of the found item.', false);
                return;
            }
        }
        const requiredFields = step2.querySelectorAll('input[required], select[required], textarea[required]');
        for (let field of requiredFields) {
            if (!field.value.trim()) {
                const label = field.closest('.flex')?.querySelector('label')?.textContent
                           || field.placeholder || 'required field';
                showToast('Please fill in: ' + label.replace(':', ''), false);
                field.focus();
                field.style.outline = '2px solid #EF4444';
                field.style.borderRadius = '14px';
                setTimeout(() => { field.style.outline = ''; }, 2000);
                return;
            }
        }
        populateSummary();
        step2.classList.add('hidden');
        step3.classList.remove('hidden');
        updateStepUI(circle3, true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    if (backToStep2) backToStep2.addEventListener('click', () => { step3.classList.add('hidden'); step2.classList.remove('hidden'); updateStepUI(circle3, false); window.scrollTo({top:0,behavior:'smooth'}); });

    // ── 9. PHOTO UPLOAD ──────────────────────────────────────────────────
    let uploadedPhotoUrl = null;
    const photoUpload = document.getElementById('photo-upload');
    const fileName    = document.getElementById('file-name');
    if (photoUpload) {
        photoUpload.addEventListener('change', async function () {
            if (this.files && this.files[0]) {
                const file = this.files[0];
                if (fileName) fileName.textContent = file.name;
                try {
                    const result = await BALIK_API.uploadPhoto(file);
                    if (result.url) uploadedPhotoUrl = result.url;
                } catch (e) {
                    uploadedPhotoUrl = URL.createObjectURL(file);
                }
            }
        });
    }

    // ── 10. SUMMARY POPULATION ───────────────────────────────────────────
    function populateSummary() {
        const nameInputs = step1 ? step1.querySelectorAll('input') : [];
        const fullName   = nameInputs[0] ? nameInputs[0].value : '---';
        const age        = nameInputs[1] ? nameInputs[1].value : '---';
        const affLabel   = affiliationSelect && affiliationSelect.selectedIndex >= 0
            ? affiliationSelect.options[affiliationSelect.selectedIndex].text : '---';

        const itemNameInput = step2 ? step2.querySelector('input[type="text"]') : null;
        const categoryEl    = step2 ? step2.querySelector('select') : null;
        const dateEl        = document.getElementById('date-lost');
        const locEl         = document.getElementById('location-select');
        const roomEl        = document.getElementById('room-select');
        const descEl        = step2 ? step2.querySelector('textarea') : null;

        setText('summary-name',        fullName);
        setText('summary-age',         age);
        setText('summary-affiliation', affLabel);
        setText('summary-item-name',   itemNameInput ? itemNameInput.value : 'Item Name');
        setText('summary-category',    categoryEl && categoryEl.selectedIndex >= 0 ? categoryEl.options[categoryEl.selectedIndex].text : '---');
        setText('summary-date',        dateEl ? dateEl.value : '---');
        setText('summary-location',    locEl && locEl.selectedIndex >= 0 ? locEl.options[locEl.selectedIndex].text : '---');
        // Show 'N/A' for room when room wrapper is hidden (no room available) or no room selected
        const roomWrapperEl2 = document.getElementById('room-wrapper');
        const isRoomHidden = !roomWrapperEl2 || roomWrapperEl2.classList.contains('hidden');
        setText('summary-room', isRoomHidden ? 'N/A' : (roomEl && roomEl.selectedIndex > 0 ? roomEl.options[roomEl.selectedIndex].text : 'N/A'));
        setText('summary-desc',        descEl ? descEl.value : '---');

        const previewDiv = document.getElementById('summary-image-preview');
        if (previewDiv && uploadedPhotoUrl) {
            previewDiv.innerHTML = '<img src="' + uploadedPhotoUrl + '" class="w-full h-full object-cover">';
        }

        const detailsDiv = document.getElementById('summary-dynamic-details');
        if (detailsDiv && dynamicFields) {
            const inputs = dynamicFields.querySelectorAll('input, select');
            const labels = dynamicFields.querySelectorAll('label');
            let html = '';
            labels.forEach((lbl, i) => {
                const el  = inputs[i];
                const val = el ? (el.tagName === 'SELECT' ? (el.selectedIndex >= 0 ? el.options[el.selectedIndex].text : '') : el.value) : '---';
                html += '<p><span class="text-light-gray">' + lbl.textContent + '</span> <span>' + (val || '---') + '</span></p>';
            });
            detailsDiv.innerHTML = html || '<p>---</p>';
        }
    }

    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    // ── 11. YES / NOT YET TOGGLE ─────────────────────────────────────────
    function resetChoiceButtons() {
        [btnYes, btnNotYet].forEach(btn => {
            if (!btn) return;
            btn.classList.remove('bg-french-blue','text-white','shadow-lg','shadow-blue-200');
            btn.classList.add('bg-white','text-french-blue');
        });
    }
    function makeChoiceBlue(btn) {
        btn.classList.remove('bg-white','text-french-blue');
        btn.classList.add('bg-french-blue','text-white','shadow-lg','shadow-blue-200');
    }
    if (btnYes)    { btnYes.addEventListener('click',    () => { if(sectionYes) sectionYes.classList.remove('hidden'); if(sectionNotYet) sectionNotYet.classList.add('hidden'); resetChoiceButtons(); makeChoiceBlue(btnYes); }); }
    if (btnNotYet) { btnNotYet.addEventListener('click', () => { if(sectionNotYet) sectionNotYet.classList.remove('hidden'); if(sectionYes) sectionYes.classList.add('hidden'); resetChoiceButtons(); makeChoiceBlue(btnNotYet); }); }

    // ── 12. NOTIFICATION TABS ────────────────────────────────────────────
    window.switchTab = function(type) {
        const unreadTab = document.getElementById('unread-tab');
        const readTab   = document.getElementById('read-tab');
        const content   = document.getElementById('notif-content');
        if (type === 'unread') {
            if(unreadTab) { unreadTab.classList.add('font-bold','text-french-blue'); }
            if(readTab)   { readTab.classList.remove('font-bold','text-french-blue'); }
            if(content)   { content.innerText = "No new notifications"; }
        } else {
            if(readTab)   { readTab.classList.add('font-bold','text-french-blue'); }
            if(unreadTab) { unreadTab.classList.remove('font-bold','text-french-blue'); }
            if(content)   { content.innerText = "No read notifications"; }
        }
    };

    // ── 13. FORM SUBMIT ──────────────────────────────────────────────────
    const isFoundPage  = window.location.pathname.includes('found');
    const confirmCheck = document.getElementById('confirm');
    const submitBtn    = step3 ? Array.from(step3.querySelectorAll('button')).find(b => b.textContent.trim().toLowerCase().includes('submit')) : null;

    if (submitBtn) {
        submitBtn.addEventListener('click', async function () {
            if (!confirmCheck || !confirmCheck.checked) {
                showToast('Please confirm that the information is accurate before submitting.', false);
                return;
            }

            const nameInputs = step1 ? step1.querySelectorAll('input') : [];
            const full_name  = nameInputs[0] ? nameInputs[0].value.trim() : '';
            const age        = nameInputs[1] ? nameInputs[1].value : null;

            if (!full_name) { showToast('Please enter your full name.', false); return; }

            const affValue = affiliationSelect ? affiliationSelect.value : '';

            const extra_details = {};
            if (dynamicFields) {
                dynamicFields.querySelectorAll('input, select').forEach(el => {
                    const key = el.id || 'field_' + Math.random().toString(36).slice(2);
                    extra_details[key] = el.tagName === 'SELECT'
                        ? (el.selectedIndex >= 0 ? el.options[el.selectedIndex].text : '')
                        : el.value;
                });
            }

            const contactEmail  = document.getElementById('contact-email')  ? document.getElementById('contact-email').value  : null;
            const contactNumber = document.getElementById('contact-number') ? document.getElementById('contact-number').value : null;

            const itemNameInput = step2 ? step2.querySelector('input[type="text"]') : null;
            const categoryEl    = step2 ? step2.querySelector('select') : null;
            const descEl        = step2 ? step2.querySelector('textarea') : null;
            const dateEl        = document.getElementById('date-lost');
            const timeEl        = document.getElementById('time-lost');
            const locEl         = document.getElementById('location-select');
            const roomEl        = document.getElementById('room-select');

            let turned_over = 0, office_id = null, turnover_date = null, turnover_time = null;
            if (isFoundPage && btnYes && btnYes.classList.contains('bg-french-blue')) {
                turned_over  = 1;
                const offSel = document.querySelector('#section-yes select');
                office_id    = offSel ? offSel.value : null;
                turnover_date = tDate ? tDate.value : null;
                turnover_time = tTime ? tTime.value : null;
            }

            const payload = {
                full_name,
                age,
                affiliation_value: affValue,
                extra_details,
                contact_email:  contactEmail,
                contact_number: contactNumber,
                report_type:    isFoundPage ? 'found' : 'lost',
                item_name:      itemNameInput ? itemNameInput.value.trim() : '',
                category_id:    categoryEl ? categoryEl.value : null,
                description:    descEl ? descEl.value : null,
                photo:          uploadedPhotoUrl,
                incident_date:  dateEl ? dateEl.value : currentDate,
                incident_time:  timeEl ? timeEl.value : currentTime,
                location_id:    locEl ? locEl.value : null,
                room_id:        (roomEl && roomEl.value) ? roomEl.value : null,
                turned_over,
                office_id,
                turnover_date,
                turnover_time,
            };

            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';

            try {
                const result = await BALIK_API.submitReport(payload);
                if (result.success) {
                    showToast('Report submitted successfully! Thank you.', true);
                    setTimeout(() => { window.location.href = 'index.html'; }, 1500);
                } else {
                    showToast(result.error || 'Something went wrong. Please try again.', false);
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Submit Report';
                }
            } catch (err) {
                showToast('Could not connect to the server. Please try again later.', false);
                console.error(err);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Report';
            }
        });
    }

}); // END DOMContentLoaded
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