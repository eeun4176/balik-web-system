/**
 * notifications.js — Notification system using mouseenter/mouseleave on the bell wrapper.
 * The dropdown is CSS group-hover controlled, so we hook into the parent div's hover events.
 */
(function () {
    var _unreadIds      = [];
    var _loaded         = false;   // already fetched for this hover session
    var _markReadTimer  = null;

    function getUser() {
        try { return JSON.parse(localStorage.getItem('balik_user') || 'null'); } catch(e) { return null; }
    }

    function escHtml(s) {
        return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    async function fetchNotifications() {
        var user = getUser();
        if (!user || !user.id) return [];
        try {
            var r = await fetch('/api/users/' + user.id + '/notifications');
            return r.ok ? await r.json() : [];
        } catch(e) { return []; }
    }

    function updateBadge(count) {
        var dot = document.getElementById('notif-dot');
        if (dot) dot.style.display = count > 0 ? 'block' : 'none';
        // Also look for inline badge spans
        var badge = document.getElementById('notif-badge');
        if (badge) { badge.textContent = count; badge.style.display = count > 0 ? '' : 'none'; }
    }

    function renderItems(items, tab) {
        var box = document.getElementById('notif-content');
        if (!box) return;
        if (!items.length) {
            box.innerHTML = '<p style="text-align:center;color:#9ca3af;font-size:0.75rem;font-style:italic;padding:2rem 1rem;">' +
                (tab === 'unread' ? 'No new notifications' : 'No read notifications') + '</p>';
            return;
        }
        box.innerHTML = items.map(function(n) {
            var color = n.type === 'claim' ? '#f87171' : '#4ade80';
            var date  = (n.created_at || '').split('T')[0];
            var link  = escHtml(n.link || '/account.html');
            return '<div onclick="window.location.href=\'' + link + '\'" ' +
                'style="display:flex;align-items:flex-start;gap:12px;padding:10px 14px;border-bottom:1px solid #f3f4f6;cursor:pointer;transition:background .15s;" ' +
                'onmouseover="this.style.background=\'#f9fafb\'" onmouseout="this.style.background=\'transparent\'">' +
                '<div style="margin-top:5px;width:8px;height:8px;min-width:8px;border-radius:50%;background:' + color + ';"></div>' +
                '<div style="flex:1;min-width:0;">' +
                  '<p style="font-size:0.74rem;font-weight:600;color:#1f2937;margin:0 0 2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escHtml(n.title||'') + '</p>' +
                  '<p style="font-size:0.7rem;color:#6b7280;margin:0 0 2px;line-height:1.4;">' + escHtml(n.message||'') + '</p>' +
                  '<p style="font-size:0.68rem;color:#d1d5db;margin:0;">' + date + '</p>' +
                '</div></div>';
        }).join('');
    }

    async function loadTab(tab) {
        var box = document.getElementById('notif-content');
        if (box) box.innerHTML = '<p style="text-align:center;color:#9ca3af;font-size:0.75rem;padding:2rem;">Loading…</p>';

        var all    = await fetchNotifications();
        var unread = all.filter(function(n){ return !n.is_read; });
        var read   = all.filter(function(n){ return  n.is_read; });

        _unreadIds = unread.map(function(n){ return n.id; });
        updateBadge(unread.length);

        renderItems(tab === 'unread' ? unread : read, tab);
    }

    // Tab switch called from HTML onclick
    window.switchTab = function(tab) {
        var ut = document.getElementById('unread-tab');
        var rt = document.getElementById('read-tab');
        if (ut && rt) {
            var active   = 'font-bold text-french-blue'.split(' ');
            var inactive = 'font-medium text-gray-500'.split(' ');
            if (tab === 'unread') {
                active.forEach(c=>ut.classList.add(c));    inactive.forEach(c=>ut.classList.remove(c));
                inactive.forEach(c=>rt.classList.add(c)); active.forEach(c=>rt.classList.remove(c));
            } else {
                active.forEach(c=>rt.classList.add(c));    inactive.forEach(c=>rt.classList.remove(c));
                inactive.forEach(c=>ut.classList.add(c)); active.forEach(c=>ut.classList.remove(c));
            }
        }
        loadTab(tab);
    };

    function markAllRead() {
        if (!_unreadIds.length) return;
        var user = getUser();
        if (!user || !user.id) return;
        var ids = _unreadIds.slice();
        _unreadIds = [];
        fetch('/api/users/' + user.id + '/notifications/mark-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: ids })
        }).then(function(){ updateBadge(0); }).catch(function(){});
    }

    function setupBellHover() {
        var bell = document.getElementById('notif-bell');
        if (!bell) return;
        // Walk up to find the "relative group" wrapper div
        var wrapper = bell.closest('div[class*="relative"]');
        if (!wrapper) return;

        // Add id for easier debugging
        wrapper.id = wrapper.id || 'notif-wrapper';

        wrapper.addEventListener('mouseenter', function() {
            _loaded = false;  // always reload fresh on open
            clearTimeout(_markReadTimer);
            // Reset to "unread" tab
            var ut = document.getElementById('unread-tab');
            var rt = document.getElementById('read-tab');
            if (ut) { ut.classList.add('font-bold','text-french-blue'); ut.classList.remove('font-medium','text-gray-500'); }
            if (rt) { rt.classList.remove('font-bold','text-french-blue'); rt.classList.add('font-medium','text-gray-500'); }
            loadTab('unread');
        });

        wrapper.addEventListener('mouseleave', function() {
            // Delay mark-as-read so user can still see them briefly
            _markReadTimer = setTimeout(function() {
                markAllRead();
            }, 500);
        });
    }

    // Init badge on page load (without opening dropdown)
    async function initBadge() {
        var all = await fetchNotifications();
        updateBadge(all.filter(function(n){ return !n.is_read; }).length);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function(){ setupBellHover(); initBadge(); });
    } else {
        setupBellHover(); initBadge();
    }
})();

setInterval(initBadge, 60000);