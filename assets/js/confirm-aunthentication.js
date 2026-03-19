// CONFIRM-AUTHENTICATION PAGE JS

document.addEventListener("DOMContentLoaded", function () {
    // --- 1. SELECTORS ---
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
    
    const affiliationSelect = document.getElementById('affiliation');
    const dynamicFields = document.getElementById('dynamic-fields');
    
    // Step Containers
    const step1 = document.getElementById('step-1-container'); 
    const step2 = document.getElementById('step-2-container'); 
    const step3 = document.getElementById('step-3-container'); 

    // Progress Circles
    const circle2 = document.getElementById('step-2');
    const circle3 = document.getElementById('step-3');

    // Navigation Buttons
    const nextBtn = document.getElementById('next-btn'); 
    const nextToStep3 = document.getElementById('next-to-step3'); 
    const backBtn = document.getElementById('back-btn'); 

    // --- LOAD ITEM DETAILS FROM URL ?id= ---
    const urlParams  = new URLSearchParams(window.location.search);
    const reportId   = urlParams.get('id');

    async function loadReportDetails() {
    if (!reportId) return;
    try {
        const item = await BALIK_API.getReport(reportId);
        if (!item || item.error) return;

        // --- 1. FIXED IMAGE BLUR ---
        const imgEl = document.getElementById('summary-item-image');
        if (imgEl) {
            if (item.photo) {
                imgEl.src = item.photo;
                imgEl.classList.remove('hidden');
                // Use 'blur-md' for a noticeable Tailwind blur
                imgEl.classList.add('blur-md'); 
            } else {
                imgEl.src = '';
                imgEl.classList.add('hidden');
                imgEl.classList.remove('blur-md');
            }
        }

        // Item name
        const nameEl = document.getElementById('summary-item-name');
        if (nameEl) nameEl.textContent = item.item_name || '---';

        // --- 2. FIXED ACTIVE COLOR ---
        // --- FIXED ACTIVE COLOR & TEXT ---
        const statusEl = document.getElementById('summary-status');
        if (statusEl) {
            // Force the text to be "Active" if it's active, otherwise use the item status
            const rawStatus = item.status || 'Active';
            
            if (rawStatus.toLowerCase() === 'active') {
                statusEl.textContent = 'Active'; // Ensures it says "Active"
                
                // Remove ALL possible conflicting color classes first
                statusEl.classList.remove('text-gray-900', 'text-gray-600', 'text-gray-400', 'text-red-600');
                
                // Add the green classes
                statusEl.classList.add('text-color-green', 'font-bold');
            } else {
                statusEl.textContent = rawStatus;
                statusEl.classList.remove('text-green-600');
                statusEl.classList.add('text-gray-600');
            }
        }

        // Category
        const catEl = document.getElementById('summary-category');
        if (catEl) catEl.textContent = item.category_label || '---';

        // Date
        const dateEl = document.getElementById('summary-date');
        if (dateEl) dateEl.textContent = item.incident_date ? item.incident_date.split('T')[0] : '---';

        // Location
        const locEl = document.getElementById('summary-location');
        if (locEl) locEl.textContent = item.location_label || '---';

        // Room
        const roomEl = document.getElementById('summary-room');
        if (roomEl) roomEl.textContent = item.room_label || 'N/A';

        // Description
        const descEl = document.getElementById('summary-description');
        if (descEl) descEl.textContent = item.description || 'No description provided.';

    } catch (e) {
        console.error('Could not load report details:', e);
    }
}

    loadReportDetails();

    // --- AUTO-DATE & TIME LOGIC ---
    const dateInput = document.getElementById('date-lost');
    const timeInput = document.getElementById('time-lost');

    if (dateInput && timeInput) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        dateInput.value = `${year}-${month}-${day}`;

        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        timeInput.value = `${hours}:${minutes}`;
    }

    // --- 2. NAVBAR & BACK TO TOP SCROLL LOGIC ---
    window.addEventListener("scroll", function () {
        const scrollValue = window.scrollY; // FIXED: Added missing scrollValue definition

        if (scrollValue > 50) { // FIXED: Added missing conditional check
            // Scrolled State
            navbar.classList.add('bg-white', 'shadow-md', 'py-3', 'text-gray-800', 'border-gray-100');
            navbar.classList.remove('text-white', 'border-white/15', 'py-4');
            
            if (navLogo) {
                navLogo.src = "../images/balik-logo-black.png";
                navLogo.style.height = "60px";
            }
            
            if (menuIcon) menuIcon.classList.add('text-black');
            
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

    // --- 3. DYNAMIC FIELDS LOGIC ---
    function renderFields(role) {
        if (!dynamicFields) return;
        let html = '';
        const labelClass = "text-sm font-regular text-gray-500 mb-2 block ml-2";
        const inputClass = "w-full bg-gray-200/70 border-none rounded-2xl pl-6 pr-12 py-2.5 outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-french-blue transition-all text-gray-700";
        const wrapperClass = "flex flex-col mb-4";
        const arrowIcon = `<img src="../icons/down-arrow.png" class="absolute right-5 w-4 h-4 object-contain pointer-events-none opacity-60" alt="dropdown icon">`;

        if (role === 'student') {
            html = `
                <div class="${wrapperClass}">
                    <label class="${labelClass}">Student Number:</label>
                        <input type="text" id="student-number" required class="${inputClass.replace('cursor-pointer', '')}">
                </div>

                <div class="${wrapperClass}">
                    <label class="${labelClass}">Program:</label>
                        <div class="relative flex items-center">
                            <select required class="${inputClass}">
                                <option value="" disabled selected>---</option>
                                <option>BS Information Technology</option>
                                <option>BS Data Science</option>
                                <option>BS Hospitality Management</option>
                                <option>BS Tourism Management</option>
                                <option>Bachelor of Elementary Education</option>
                                <option>Bachelor of Secondary Education</option>
                                <option>BS Business Administration</option>
                                <option>BS Entrepreneurship</option>
                                <option>Bachelor of Industrial Technology</option>
                            </select>${arrowIcon}</div></div>

                <div class="${wrapperClass}">
                    <label class="${labelClass}">Year:</label>
                        <div class="relative flex items-center">
                            <select id="year-select" required class="${inputClass}">
                                <option value="" disabled selected>---</option>
                                <option value="1">1st Year</option>
                                <option value="2">2nd Year</option>
                                <option value="3">3rd Year</option>
                                <option value="4">4th Year</option>
                            </select>${arrowIcon}</div></div>

                <div class="${wrapperClass}">
                    <label class="${labelClass}">Section:</label>
                        <div class="relative flex items-center">
                            <select id="section-select" required class="${inputClass}">
                                <option value="" disabled selected>---</option>
                            </select>${arrowIcon}
                        </div>
                </div>

                <div class="${wrapperClass}">
                    <label class="${labelClass}">Contact Email:</label>
                        <input type="email" class="${inputClass.replace('cursor-pointer', '')}">
                </div>

                <div class="${wrapperClass}">
                    <label class="${labelClass}">Contact Number:</label>
                        <input 
                        type="text" 
                        id="contact-number" 
                        required 
                        placeholder="09XXXXXXXXX" 
                        maxlength="11"
                        oninput="this.value = this.value.replace(/[^0-9]/g, '');"
                        pattern="[0-9]{11}"
                        title="Please enter exactly 11 digits."
                        class="contact-num-mask ${inputClass.replace('cursor-pointer', '')}"
                    >
                </div>`;

        } else if (role === 'faculty') {
            html = `
                <div class="${wrapperClass}">
                    <label class="${labelClass}">Employee Number:</label>
                    <input type="text" id="employee-number" required class="${inputClass.replace('cursor-pointer', '')}">
                </div>
                    
                <div class="${wrapperClass}">
                    <label class="${labelClass}">Department:</label>
                    <div class="relative flex items-center">
                        <select class="${inputClass}">
                            <option value="" disabled selected>---</option>
                            <option>ITDS Department</option>
                            <option>HTM Department</option>
                            <option>GATE Department</option>
                            <option>BindTech Department</option>
                        </select>
                        ${arrowIcon}
                    </div>
                </div>

                <div class="${wrapperClass}">
                    <label class="${labelClass}">Contact Email:</label>
                    <input type="email" required class="${inputClass.replace('cursor-pointer', '')}">
                </div>

                <div class="${wrapperClass}">
                    <label class="${labelClass}">Contact Number:</label>
                    <input 
                        type="text" 
                        id="contact-number" 
                        required 
                        placeholder="09XXXXXXXXX" 
                        maxlength="11"
                        oninput="this.value = this.value.replace(/[^0-9]/g, '');"
                        pattern="[0-9]{11}"
                        title="Please enter exactly 11 digits."
                        class="contact-num-mask ${inputClass.replace('cursor-pointer', '')}"
                    >
                </div>`;

        } else if (role === 'non-teaching' || role === 'security' || role === 'maintenance') {
            html = `
                <div class="${wrapperClass}">
                    <label class="${labelClass}">Employee Number:</label>
                    <input type="text" id="employee-number" required class="${inputClass.replace('cursor-pointer', '')}">
                </div>

                <div class="${wrapperClass}">
                    <label class="${labelClass}">Contact Email:</label>
                    <input type="email" id="contact-email" required class="${inputClass.replace('cursor-pointer', '')}">
                </div>

                <div class="${wrapperClass}">
                    <label class="${labelClass}">Contact Number:</label>
                    <input 
                        type="text" 
                        id="contact-number" 
                        required 
                        placeholder="09XXXXXXXXX" 
                        maxlength="11"
                        oninput="this.value = this.value.replace(/[^0-9]/g, '');"
                        pattern="[0-9]{11}"
                        title="Please enter exactly 11 digits."
                        class="contact-num-mask ${inputClass.replace('cursor-pointer', '')}"
                    >
                </div>`;

        } else if (role === 'visitor' || role === 'external') {
            html = `
                <div class="${wrapperClass}">
                    <label class="${labelClass}">Contact Email:</label>
                    <input type="email" id="contact-email" required class="${inputClass.replace('cursor-pointer', '')}">
                </div>

                <div class="${wrapperClass}">
                    <label class="${labelClass}">Contact Number:</label>
                    <input 
                        type="text" 
                        id="contact-number" 
                        required 
                        placeholder="09XXXXXXXXX" 
                        maxlength="11"
                        oninput="this.value = this.value.replace(/[^0-9]/g, '');"
                        pattern="[0-9]{11}"
                        title="Please enter exactly 11 digits."
                        class="contact-num-mask ${inputClass.replace('cursor-pointer', '')}"
                    >
                </div>`;
        } else {
            // Default fallback
            html = `<p class="text-sm text-gray-400 ml-2">Please select an affiliation to continue.</p>`;
        }

        dynamicFields.innerHTML = html;

        // Auto-fill email from logged-in user after dynamic fields render
        try {
            const storedUser = JSON.parse(localStorage.getItem('balik_user') || '{}');
            if (storedUser.id) {
                fetch('/api/users/' + storedUser.id)
                    .then(r => r.json())
                    .then(u => {
                        const tryFill = () => {
                            if (u.contact_email) {
                                dynamicFields.querySelectorAll('input[type="email"]').forEach(el => {
                                    el.value = u.contact_email;
                                    el.readOnly = true;
                                    el.classList.add('bg-gray-100', 'cursor-not-allowed');
                                });
                            }
                            if (u.contact_number) {
                                const numEl = dynamicFields.querySelector('#contact-number');
                                if (numEl) {
                                    numEl.value = u.contact_number;
                                    numEl.readOnly = true;
                                    numEl.classList.add('bg-gray-100', 'cursor-not-allowed');
                                }
                            }
                            // Autofill ID number (Student/Employee Number)
                            let extra = {};
                            try { extra = (u.extra_details && typeof u.extra_details === 'object') ? u.extra_details : JSON.parse(u.extra_details || '{}'); } catch(e) {}
                            const currentAffil = affiliationSelect ? affiliationSelect.value : '';
                            const idNum = currentAffil === 'student'
                                ? (extra['Student Number'] || extra['id_number'] || '')
                                : (extra['Employee Number'] || extra['id_number'] || '');
                            if (idNum) {
                                const stuEl = dynamicFields.querySelector('#student-number');
                                const empEl = dynamicFields.querySelector('#employee-number');
                                const target = stuEl || empEl;
                                if (target) {
                                    target.value = idNum;
                                    target.readOnly = true;
                                    target.classList.add('bg-gray-100', 'cursor-not-allowed');
                                }
                            }
                        };
                        tryFill();
                        setTimeout(tryFill, 200);
                        setTimeout(tryFill, 600);
                    })
                    .catch(() => {});
            }
        } catch(e) {}

        if (role === 'student') {
            const yearSelect = document.getElementById('year-select');
            const sectionSelect = document.getElementById('section-select');
            yearSelect.addEventListener('change', () => {
                const year = yearSelect.value;
                const sections = ['A', 'B', 'C', 'D', 'E'];
                sectionSelect.innerHTML = `<option value="" disabled selected>---</option>` + 
                    sections.map(s => `<option value="${year}${s}">${year}${s}</option>`).join('');
            });
        }
    }

    if (affiliationSelect) {
        affiliationSelect.addEventListener('change', (e) => renderFields(e.target.value));
        renderFields(affiliationSelect.value);
    }

   // --- 4. STEP PROGRESS LOGIC ---

    // Move from Step 1 to Step 2
    // ── Autofill basic info from logged-in user ──────────────────────────
    (function autofillBasicInfo() {
        const stored = localStorage.getItem('balik_user');
        if (!stored) return;
        try {
            const user = JSON.parse(stored);
            if (!user || !user.id) return;
            fetch('/api/users/' + user.id)
                .then(r => r.json())
                .then(u => {
                    if (!step2) return;
                    const inputs = step2.querySelectorAll('input[type="text"], input:not([type="file"])');
                    if (inputs[0] && u.full_name) {
                        inputs[0].value = u.full_name;
                        inputs[0].readOnly = true;
                        inputs[0].classList.add('bg-gray-100', 'cursor-not-allowed');
                    }
                    if (inputs[1] && u.age) {
                        inputs[1].value = u.age;
                        inputs[1].readOnly = true;
                        inputs[1].classList.add('bg-gray-100', 'cursor-not-allowed');
                    }
                    const affilSel = step2.querySelector('select#affiliation');
                    if (affilSel && u.affiliation_label) {
                        for (let opt of affilSel.options) {
                            if (opt.text.toLowerCase() === u.affiliation_label.toLowerCase()) {
                                affilSel.value = opt.value;
                                affilSel.disabled = true;
                                affilSel.classList.add('cursor-not-allowed');
                                // trigger change for dynamic fields
                                affilSel.dispatchEvent(new Event('change'));
                                break;
                            }
                        }
                    }
                    // Fill contact + ID number after dynamic fields render
                    const fillContactFields = () => {
                        if (u.contact_email) {
                            const emailInput = step2.querySelector('#contact-email') || dynamicFields && dynamicFields.querySelector('input[type="email"]');
                            if (emailInput) { emailInput.value = u.contact_email; emailInput.readOnly = true; emailInput.classList.add('bg-gray-100','cursor-not-allowed'); }
                        }
                        if (u.contact_number) {
                            const numInput = step2.querySelector('#contact-number');
                            if (numInput) { numInput.value = u.contact_number; numInput.readOnly = true; numInput.classList.add('bg-gray-100','cursor-not-allowed'); }
                        }
                        // ID number autofill
                        let extra = {};
                        try { extra = (u.extra_details && typeof u.extra_details === 'object') ? u.extra_details : JSON.parse(u.extra_details || '{}'); } catch(e) {}
                        const affilNow = affilSel ? affilSel.value : '';
                        const idNum = affilNow === 'student'
                            ? (extra['Student Number'] || extra['id_number'] || '')
                            : (extra['Employee Number'] || extra['id_number'] || '');
                        if (idNum) {
                            const stuEl = step2.querySelector('#student-number');
                            const empEl = step2.querySelector('#employee-number');
                            const target = stuEl || empEl;
                            if (target) { target.value = idNum; target.readOnly = true; target.classList.add('bg-gray-100','cursor-not-allowed'); }
                        }
                    };
                    fillContactFields();
                    setTimeout(fillContactFields, 200);
                    setTimeout(fillContactFields, 600);
                })
                .catch(() => {});
        } catch(e) {}
    })();

    if (nextBtn) {
        nextBtn.addEventListener('click', async () => {
            // Check if user already has an ACTIVE (pending/approved) claim — allow retry after rejection
            if (reportId) {
                try {
                    const su = JSON.parse(localStorage.getItem('balik_user') || '{}');
                    if (su.id) {
                        const existingClaims = await fetch('/api/claims?report_id=' + reportId).then(r => r.json());
                        if (Array.isArray(existingClaims)) {
                            const myClaims = existingClaims.filter(c => Number(c.claimant_id) === Number(su.id));
                            const hasActive = myClaims.some(c => c.claim_status === 'pending' || c.claim_status === 'approved');
                            const rejCount  = myClaims.filter(c => c.claim_status === 'rejected').length;
                            if (hasActive) {
                                showFieldToast('You already have an active claim for this item.');
                                return;
                            }
                            if (rejCount >= 2) {
                                showFieldToast('You have reached the maximum of 2 claim attempts for this item.');
                                return;
                            }
                        }
                    }
                } catch(e) { /* non-blocking */ }
            }

            step1.classList.add('hidden');
            step2.classList.remove('hidden');

            if (circle2) {
                circle2.classList.add('bg-french-blue', 'text-white', 'border-french-blue');
                circle2.classList.remove('bg-white', 'text-gray-400', 'border-gray-300');
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Move from Step 2 to Step 3
    function showFieldToast(msg, success) {
        let t = document.getElementById('reportToast');
        if (!t) { t = document.createElement('div'); t.id = 'reportToast'; t.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;padding:14px 20px;border-radius:14px;color:white;font-weight:600;font-size:0.9rem;max-width:360px;box-shadow:0 8px 24px rgba(0,0,0,0.15);transition:transform 0.4s ease,opacity 0.4s ease;transform:translateX(calc(100% + 40px));opacity:0;'; document.body.appendChild(t); }
        t.style.background = success ? '#10B981' : '#EF4444';
        t.textContent = msg; t.style.transform = 'translateX(0)'; t.style.opacity = '1';
        clearTimeout(t._h); t._h = setTimeout(() => { t.style.transform = 'translateX(calc(100% + 40px))'; t.style.opacity = '0'; }, success ? 4000 : 3500);
    }

    if (nextToStep3) {
        nextToStep3.addEventListener('click', () => {
            if (!step2) { step2.classList.add('hidden'); step3.classList.remove('hidden'); initStep3Fields(); window.scrollTo({top:0,behavior:'smooth'}); return; }
            // Validate all required fields in step 2
            const nameInputs = step2.querySelectorAll('input[type="text"], input[type="email"]');
            let nameVal = nameInputs[0] ? nameInputs[0].value.trim() : '';
            let ageVal  = nameInputs[1] ? nameInputs[1].value.trim() : '';
            const affilSel = step2.querySelector('select#affiliation');
            const affilVal = affilSel ? affilSel.value : '';

            if (!nameVal) { showFieldToast('Please enter your full name.'); nameInputs[0] && nameInputs[0].focus(); return; }
            if (!ageVal)  { showFieldToast('Please enter your age.'); nameInputs[1] && nameInputs[1].focus(); return; }
            if (!affilVal) { showFieldToast('Please select your affiliation.'); affilSel && affilSel.focus(); return; }

            // Check dynamic required fields
            const dynamicReq = step2.querySelectorAll('input[required], select[required]');
            for (let field of dynamicReq) {
                if (field === affilSel) continue;
                if (!field.value.trim()) {
                    const label = field.closest('div')?.querySelector('label')?.textContent || field.placeholder || 'a required field';
                    showFieldToast('Please fill in: ' + label.replace(':', ''));
                    field.focus();
                    field.style.outline = '2px solid #EF4444'; field.style.borderRadius = '14px';
                    setTimeout(() => { field.style.outline = ''; }, 2000);
                    return;
                }
            }

            step2.classList.add('hidden');
            step3.classList.remove('hidden');

            if (circle3) {
                circle3.classList.add('bg-french-blue', 'text-white', 'border-french-blue');
                circle3.classList.remove('bg-white', 'text-gray-400', 'border-gray-300');
            }
            initStep3Fields();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Back button: Step 2 to Step 1
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            step2.classList.add('hidden');      // Hide Step 2
            step1.classList.remove('hidden');   // Show Step 1
            
            if (circle2) {
                circle2.classList.remove('bg-french-blue', 'text-white', 'border-french-blue');
                circle2.classList.add('bg-white', 'text-gray-400', 'border-gray-300');
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Back button: Step 3 to Step 2
    const backToStep2Btn = document.getElementById('back-to-step2');
    if (backToStep2Btn) {
        backToStep2Btn.addEventListener('click', () => {
            step3.classList.add('hidden');      // Hide Step 3
            step2.classList.remove('hidden');   // Show Step 2
            
            if (circle3) {
                circle3.classList.remove('bg-french-blue', 'text-white', 'border-french-blue');
                circle3.classList.add('bg-white', 'text-gray-400', 'border-gray-300');
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    // --- 5. LOCATION DATA ---
    const buildingData = {
        "Building A": ["Ground Floor", "ROTC Office", "Room 112A", "DHTM Faculty", "Coffee stall (Brewlsu)", "Canteen", "Room 214", "Gender and Development Office", "Room 213 Sea Laboratory", "Campus Research Development uUit", "Room 215", "Room 216", "Room 217", "IoT Room 314", "Business Hub", "Student Government Office", "Student Publication Office(Laurel)", "Room 312", "Room 313"],
        "Building B": ["Women's Restroom", "Room 101", "Business Administration Faculty", "Registrar", "Admission Office", "Guidance Office", "Cashier", "Office of the College Secretary", "Room 201", "ITDS Department Faculty", "Room 203", "Room 204", "Room 205", "Room 206", "Library", "Room 303", "Room 304", "MIS Office", "Room 306"],
        "Building C": ["Room 107", "Room 108", "Room 109", "Room 110", "Room 111", "Room 207", "Room 208", "Room 209", "Room 210", "Room 201", "Gate Department Faculty", "Study Area", "Room 307", "Room 308", "Room 309", "Soc Hall 3", "Soc Hall 2", "Soc Hall 1"],
        "Building D": ["Restroom", "Study Area", "Room 101", "Room 102", "Room 201", "Room 202"],
        "Building E": ["Ground Floor", "Gymnasium", "Room 101", "Room 102", "Room 103", "Room 201", "Room 202", "Room 203"],
        "FIL CHI 2": ["Room 101", "Room 102"]
    };

    function initStep3Fields() {
        const claimDate = document.getElementById('claim-date');
        const claimTime = document.getElementById('claim-time');
        if (claimDate && claimTime) {
            const now = new Date();
            claimDate.value = now.toISOString().split('T')[0];
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            claimTime.value = `${hours}:${minutes}`;
        }
    }

    const claimLocation = document.getElementById('claim-location');
    const claimRoomSelect = document.getElementById('room-select');
    const roomWrapper = document.getElementById('room-wrapper');

    if (claimLocation && claimRoomSelect && roomWrapper) {
        claimLocation.addEventListener('change', function() {
            const selectedValue = this.value;
            const rooms = buildingData[selectedValue];
            if (rooms) {
                roomWrapper.classList.remove('hidden');
                claimRoomSelect.innerHTML = '<option value="" disabled selected>Room</option>' +
                    rooms.map(r => `<option value="${r}">${r}</option>`).join('');
            } else {
                roomWrapper.classList.add('hidden');
            }
        });
    }


    // --- 6. IDENTITY & VERIFICATION ---
    window.switchVerify = function(method) {
        const layoutOtp = document.getElementById('layout-otp');
        const layoutId = document.getElementById('layout-id');
        const input = document.getElementById('contact-verify-input');
        const buttons = document.querySelectorAll('.verify-btn');
        
        buttons.forEach(btn => btn.classList.remove('active-verify', 'bg-french-blue', 'text-white'));
        layoutOtp.classList.add('hidden');
        layoutId.classList.add('hidden');

        if (method === 'otp' || method === 'sms') {
            layoutOtp.classList.remove('hidden');
            input.placeholder = method === 'otp' ? "Enter email address..." : "Enter mobile number...";
            document.getElementById(method === 'otp' ? 'btn-otp' : 'btn-sms').classList.add('active-verify', 'bg-french-blue', 'text-white');
        } else if (method === 'id') {
            layoutId.classList.remove('hidden');
            document.getElementById('btn-id').classList.add('active-verify', 'bg-french-blue', 'text-white');
        }
    }

    const idInput = document.getElementById('id-upload-input');
    const idPreviewImg = document.getElementById('id-preview-img');
    const idFileName = document.getElementById('id-file-name');

    if (idInput) {
        idInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                idFileName.textContent = `Selected: ${this.files[0].name}`;
                idFileName.classList.remove('hidden');
                const reader = new FileReader();
                reader.onload = (e) => { 
                    idPreviewImg.src = e.target.result; 
                    idPreviewImg.classList.add('w-full', 'h-full'); 
                }
                reader.readAsDataURL(this.files[0]);
            }
        });
    }

    // --- YES/NO CLAIMED TOGGLE ---
    const btnYes = document.getElementById('choice-yes');
    const btnNotYet = document.getElementById('choice-not-yet');
    const sectionYes = document.getElementById('section-yes');
    const sectionNotYet = document.getElementById('section-not-yet');

    if (btnNotYet && btnYes) {
        btnNotYet.addEventListener('click', () => {
            btnNotYet.classList.add('bg-french-blue', 'text-white');
            btnYes.classList.remove('bg-french-blue', 'text-white');
            sectionYes.classList.add('hidden');
            sectionNotYet.classList.remove('hidden');
        });
        btnYes.addEventListener('click', () => {
            btnYes.classList.add('bg-french-blue', 'text-white');
            btnNotYet.classList.remove('bg-french-blue', 'text-white');
            sectionNotYet.classList.add('hidden');
            sectionYes.classList.remove('hidden');
        });
    }

    // --- SUBMIT CLAIM BUTTON ---
    // Try to find by ID first (set in HTML), or fallback to text search with normalized whitespace
    const submitClaimBtn = document.getElementById('submit-claim-btn') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.replace(/\s+/g,' ').trim().toLowerCase().includes('submit claim'));

    if (submitClaimBtn) {
        submitClaimBtn.id = 'submit-claim-btn';
        submitClaimBtn.addEventListener('click', async function () {
            // ── Step 3 field validation ───────────────────────────────────────
            const claimDateVal = document.getElementById('claim-date')?.value;
            const claimLocVal  = document.getElementById('claim-location')?.value;
            const textareas    = document.querySelectorAll('#step-3-container textarea');
            const descVal      = textareas[0] ? textareas[0].value.trim() : '';

            const claimRoomVal  = document.getElementById('room-select')?.value;
            const roomWrapperEl = document.getElementById('room-wrapper');
            const isRoomVisible = roomWrapperEl && !roomWrapperEl.classList.contains('hidden');
            const uniqueVal     = textareas[1] ? textareas[1].value.trim() : '';

            if (!claimDateVal)  { showFieldToast('Please select when you lost the item.'); return; }
            if (!claimLocVal)   { showFieldToast('Please select where you lost it (Where did you lose it?).'); return; }
            if (isRoomVisible && !claimRoomVal) { showFieldToast('Please select the room where you lost the item.'); return; }
            if (!descVal)       { showFieldToast('Please describe the item in detail.'); return; }
            if (!uniqueVal)     { showFieldToast('Please fill in the unique marks or contents field.'); return; }

            const agreeCheckbox = document.getElementById('agree');
            if (!agreeCheckbox || !agreeCheckbox.checked) {
                showFieldToast('Please check the agreement checkbox before submitting.');
                return;
            }

            if (!reportId) {
                showFieldToast('No item selected. Please go back and select an item to claim.');
                return;
            }

            // ── Collect all data ─────────────────────────────────────────────
            const step2El      = document.getElementById('step-2-container');
            const allInputs    = step2El ? step2El.querySelectorAll('input[type="text"], input[type="email"]') : [];
            const full_name    = allInputs[0] ? allInputs[0].value.trim() : '';
            const age          = allInputs[1] ? allInputs[1].value : null;
            const affilSel     = document.getElementById('affiliation');
            const affiliation  = affilSel ? affilSel.value : null;
            if (!full_name)    { showFieldToast('Please enter your full name in Basic Information.'); return; }

            const extra_details = {};
            const dynFields     = document.getElementById('dynamic-fields');
            if (dynFields) {
                dynFields.querySelectorAll('input, select').forEach(el => {
                    const labelEl = el.closest('div.flex')?.querySelector('label');
                    const key     = el.id || (labelEl ? labelEl.textContent.trim().replace(':','') : ('field_' + Math.random().toString(36).slice(2)));
                    extra_details[key] = el.tagName === 'SELECT'
                        ? (el.selectedIndex > 0 ? el.options[el.selectedIndex].text : '')
                        : el.value;
                });
            }

            // Get contact_email: try #contact-email first, then any email input in dynamic-fields
            let contact_email = document.getElementById('contact-email')?.value || null;
            if (!contact_email) {
                const dynEmailInput = document.querySelector('#dynamic-fields input[type="email"]');
                if (dynEmailInput) contact_email = dynEmailInput.value || null;
            }
            // Also try from logged-in user data as final fallback
            if (!contact_email) {
                try {
                    const su = JSON.parse(localStorage.getItem('balik_user') || '{}');
                    if (su.contact_email) contact_email = su.contact_email;
                } catch(e) {}
            }
            const claim_date     = document.getElementById('claim-date')?.value      || null;
            const claim_time     = document.getElementById('claim-time')?.value      || null;
            const location_lost  = document.getElementById('claim-location')?.value  || null;
            const room_lost      = document.getElementById('room-select')?.value      || null;
            const item_description = textareas[0] ? textareas[0].value.trim() : null;
            const unique_marks   = textareas[1] ? textareas[1].value.trim() : null;

            // Photo upload (optional)
            let proof_photo = null;
            const photoInput = document.getElementById('photo-upload');
            if (photoInput?.files?.[0]) {
                try {
                    const result = await BALIK_API.uploadPhoto(photoInput.files[0]);
                    if (result.url) proof_photo = result.url;
                } catch (e) {}
            }

            // Include logged-in user_id so claimant_id is always set correctly
            let claimant_user_id = null;
            try {
                const su = JSON.parse(localStorage.getItem('balik_user') || '{}');
                if (su.id) claimant_user_id = su.id;
            } catch(e) {}

            const payload = {
                report_id:       parseInt(reportId),
                claimant_user_id,
                full_name,       age,
                affiliation,     extra_details,
                contact_email,
                claim_date,      claim_time,
                location_lost,   room_lost,
                item_description, unique_marks,
                proof_photo,
            };

            submitClaimBtn.disabled    = true;
            submitClaimBtn.textContent = 'Submitting...';

            try {
                const result = await BALIK_API.submitClaim(payload);
                if (result.success) {
                    showFieldToast('Claim submitted! The item is now pending. You will be contacted for verification.', true);
                    setTimeout(() => { window.location.href = 'search.html'; }, 2500);
                } else {
                    const errMsg = result.error || 'Something went wrong. Please try again.';
                    showFieldToast(errMsg);
                    submitClaimBtn.disabled    = false;
                    submitClaimBtn.textContent = 'Submit Claim';
                }
            } catch (err) {
                showFieldToast(err.message || 'Could not connect to the server. Please try again.');
                console.error(err);
                submitClaimBtn.disabled    = false;
                submitClaimBtn.textContent = 'Submit Claim';
            }
        });
    }

    // --- MOBILE DRAWER LOGIC ---
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

    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- NOTIFICATION TAB SYSTEM ---
    window.switchTab = function(type) {
        const unreadTab = document.getElementById('unread-tab');
        const readTab = document.getElementById('read-tab');
        const content = document.getElementById('notif-content');
        if (!unreadTab || !readTab || !content) return;

        if (type === 'unread') {
            unreadTab.classList.add('font-bold', 'text-french-blue');
            unreadTab.classList.remove('font-medium', 'text-gray-500');
            readTab.classList.remove('font-bold', 'text-french-blue');
            readTab.classList.add('font-medium', 'text-gray-500');
            content.innerText = "No new notifications";
        } else {
            readTab.classList.add('font-bold', 'text-french-blue');
            readTab.classList.remove('font-medium', 'text-gray-500');
            unreadTab.classList.remove('font-bold', 'text-french-blue');
            unreadTab.classList.add('font-medium', 'text-gray-500');
            content.innerText = "No read notifications";
        }
    };
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