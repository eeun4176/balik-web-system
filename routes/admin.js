/**
 * B.A.L.I.K. Admin API Routes
 * Handles all admin operations: auth, reports, claims, users, logs, settings
 */
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../database/db');

// ────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ────────────────────────────────────────────────────────────────────────────

function hashPassword(pw) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(pw, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

function verifyPassword(pw, stored) {
    const [salt, hash] = stored.split(':');
    try {
        const input = crypto.scryptSync(pw, salt, 64).toString('hex');
        return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(input, 'hex'));
    } catch {
        return false;
    }
}

function logActivity(adminId, actionType, description, ip = '0.0.0.0') {
    db.runAsync(
        `INSERT INTO activity_logs (admin_id, action_type, description, ip_address, created_at)
         VALUES (?, ?, ?, ?, datetime('now'))`,
        [adminId, actionType, description, ip]
    ).catch(() => {});
}

function getIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0].trim()
        || req.ip || '0.0.0.0';
}

async function sendEmailNotification(to, subject, html) {
    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
        console.log(`📧 [EMAIL SKIPPED - no MAIL config]\n   TO: ${to}\n   SUBJECT: ${subject}`);
        return;
    }
    try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
        });
        await transporter.sendMail({
            from: `"B.A.L.I.K. - Sarmiento Campus" <${process.env.MAIL_USER}>`,
            to, subject, html
        });
        console.log(`📨 Email sent to ${to}`);
    } catch (err) {
        console.error('⚠️ Email send failed:', err.message);
    }
}

function claimEmailHtml(decision, itemName, claimantName, reason, officeLabel, turnoverDate) {
    const approved = decision === 'approved';
    return `
        <div style="font-family:'Segoe UI',sans-serif;max-width:520px;margin:auto;padding:0;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
            <div style="background:${approved ? 'linear-gradient(135deg,#077FC4,#17c3b2)' : 'linear-gradient(135deg,#ef4444,#f87171)'};padding:28px 32px;text-align:center">
                <div style="font-size:40px;margin-bottom:8px">${approved ? '✅' : '❌'}</div>
                <h2 style="color:#fff;margin:0;font-size:20px">${approved ? 'Claim Approved!' : 'Claim Rejected'}</h2>
            </div>
            <div style="padding:28px 32px">
                <p style="color:#374151;margin:0 0 16px">Hi <strong>${claimantName || 'there'}</strong>,</p>
                <p style="color:#374151;margin:0 0 16px">Your claim for <strong>"${itemName}"</strong> has been <strong style="color:${approved ? '#077FC4' : '#ef4444'}">${approved ? 'approved' : 'rejected'}</strong>.</p>
                ${approved ? `
                <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin:20px 0">
                    <div style="font-weight:700;color:#166534;margin-bottom:8px;font-size:14px">📍 Next Steps — Pick Up Your Item</div>
                    ${officeLabel ? `<p style="margin:4px 0;color:#374151;font-size:14px"><strong>Location:</strong> ${officeLabel}</p>` : ''}
                    ${turnoverDate ? `<p style="margin:4px 0;color:#374151;font-size:14px"><strong>Available from:</strong> ${turnoverDate}</p>` : ''}
                    <p style="margin:8px 0 0;color:#6b7280;font-size:13px">Please bring a valid ID when picking up your item. Visit the indicated location during office hours.</p>
                </div>` : `
                ${reason ? `
                <div style="background:#fff5f5;border:1px solid #fecaca;border-radius:12px;padding:16px 20px;margin:20px 0">
                    <div style="font-weight:700;color:#991b1b;margin-bottom:6px;font-size:14px">Reason for Rejection</div>
                    <p style="margin:0;color:#374151;font-size:14px">${reason}</p>
                </div>` : ''}
                <p style="color:#6b7280;font-size:13px;margin:16px 0 0">You may submit a new claim if you still believe this item belongs to you, subject to the retry limit.</p>`}
                <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
                <p style="color:#9ca3af;font-size:12px;margin:0;text-align:center">— B.A.L.I.K. Lost &amp; Found System · BulSU - Sarmiento Campus</p>
            </div>
        </div>`;
}

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES (No auth required)
// ────────────────────────────────────────────────────────────────────────────

// ── POST /api/admin/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required.' });
        }

        const admin = await db.getAsync('SELECT * FROM admins WHERE username = ?', [username]);
        if (!admin || !verifyPassword(password, admin.password_hash)) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        req.session.adminId       = admin.id;
        req.session.adminUsername = admin.username;
        req.session.adminFullname = admin.full_name;
        req.session.is_superadmin = admin.is_superadmin;

        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.json({ success: false, error: 'Session error' });
            }
            logActivity(admin.id, 'Login', `Admin ${admin.username} logged in`, getIP(req));
            res.json({
                success: true,
                admin: {
                    id: admin.id,
                    username: admin.username,
                    full_name: admin.full_name,
                    is_superadmin: admin.is_superadmin
                }
            });
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ────────────────────────────────────────────────────────────────────────────
// SESSION CHECK MIDDLEWARE
// Apply to ALL routes below this point
// ────────────────────────────────────────────────────────────────────────────

router.use((req, res, next) => {
    if (!req.session || !req.session.adminId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
});

// ────────────────────────────────────────────────────────────────────────────
// PROTECTED ROUTES
// ────────────────────────────────────────────────────────────────────────────

// Import verification routes
const verificationRoutes = require('./verification');
router.use('/verification', verificationRoutes);

// ── POST /api/admin/logout
router.post('/logout', (req, res) => {
    logActivity(req.session.adminId, 'Logout', `Admin ${req.session.adminUsername} logged out`, getIP(req));
    req.session.destroy(() => res.json({ success: true }));
});

// ── GET /api/admin/me
router.get('/me', (req, res) => {
    res.json({
        id:           req.session.adminId,
        username:     req.session.adminUsername,
        full_name:    req.session.adminFullname,
        is_superadmin: req.session.is_superadmin
    });
});

// ── GET /api/admin/stats
router.get('/stats', async (req, res) => {
    try {
        const stats = await db.getAsync(`
            SELECT COUNT(*) AS total,
                SUM(CASE WHEN status='active'   AND (ready_to_claim=0 OR ready_to_claim IS NULL) THEN 1 ELSE 0 END) AS active,
                SUM(CASE WHEN status='pending'  AND (ready_to_claim=0 OR ready_to_claim IS NULL) THEN 1 ELSE 0 END) AS pending,
                SUM(CASE WHEN ready_to_claim=1  THEN 1 ELSE 0 END) AS ready,
                SUM(CASE WHEN status='resolved' THEN 1 ELSE 0 END) AS resolved,
                SUM(CASE WHEN report_type='lost'  THEN 1 ELSE 0 END) AS lost,
                SUM(CASE WHEN report_type='found' THEN 1 ELSE 0 END) AS found
            FROM reports`);

        const pending_claims  = await db.getAsync(`SELECT COUNT(*) AS c FROM claims WHERE claim_status='pending'`);
        const unread_notifs   = await db.getAsync(`SELECT COUNT(*) AS c FROM notifications WHERE user_id IS NULL AND is_read=0`);
        const verifyRes       = await db.getAsync(
            "SELECT COUNT(*) as count FROM reports WHERE verification_status IS NULL AND status IN ('active','pending')"
        );

        res.json({
            ...stats,
            pending_claims:        pending_claims.c,
            unread_notifs:         unread_notifs.c,
            pending_verifications: verifyRes?.count || 0
        });
    } catch (err) {
        console.error('Stats error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ────────────────────────────────────────────────────────────────────────────
// REPORTS — specific routes MUST come before wildcard /:id routes
// ────────────────────────────────────────────────────────────────────────────

// ── GET /api/admin/reports
router.get('/reports', async (req, res) => {
    try {
        const { status, type, cat, loc, q, from, to, page = 1 } = req.query;
        const per = 20, offset = (parseInt(page) - 1) * per;
        const where = ['r.is_archived = 0'], params = [];

        if (status && ['active','pending','resolved'].includes(status)) {
            where.push('r.status=?'); params.push(status);
        }
        if (type && ['lost','found'].includes(type)) {
            where.push('r.report_type=?'); params.push(type);
        }
        if (cat)  { where.push('r.category_id=?'); params.push(parseInt(cat)); }
        if (loc)  { where.push('r.location_id=?'); params.push(parseInt(loc)); }
        if (q) {
            where.push('(r.item_name LIKE ? OR u.full_name LIKE ? OR r.description LIKE ?)');
            params.push(`%${q}%`, `%${q}%`, `%${q}%`);
        }
        if (from) { where.push('r.incident_date>=?'); params.push(from); }
        if (to)   { where.push('r.incident_date<=?'); params.push(to); }

        const wSql = where.join(' AND ');

        const total = await db.getAsync(
            `SELECT COUNT(*) AS c FROM reports r LEFT JOIN users u ON r.reporter_id=u.id WHERE ${wSql}`,
            params
        );

        const rows = await db.allAsync(`
            SELECT r.id, r.report_type, r.status, r.item_name, r.incident_date, r.incident_time,
                   r.photo, r.turned_over, r.created_at, r.ready_to_claim,
                   c.label AS category_label, l.label AS location_label, rm.label AS room_label,
                   u.full_name, u.contact_number,
                   a.label AS aff_label,
                   (SELECT COUNT(*) FROM claims cl WHERE cl.report_id=r.id) AS claim_count,
                   (SELECT COUNT(*) FROM claims cl WHERE cl.report_id=r.id AND cl.claim_status='pending') AS pending_claims
            FROM reports r
            LEFT JOIN categories  c  ON r.category_id   = c.id
            LEFT JOIN locations   l  ON r.location_id   = l.id
            LEFT JOIN rooms      rm  ON r.room_id        = rm.id
            LEFT JOIN users       u  ON r.reporter_id    = u.id
            LEFT JOIN affiliations a ON u.affiliation_id = a.id
            WHERE ${wSql}
            ORDER BY r.created_at DESC LIMIT ${per} OFFSET ${offset}`,
            params
        );

        res.json({ total: total.c, page: parseInt(page), per_page: per, reports: rows });
    } catch (err) {
        console.error('Reports error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/admin/reports/archived  ← MUST be before /reports/:id
router.get('/reports/archived', async (req, res) => {
    try {
        const page   = Math.max(1, parseInt(req.query.page) || 1);
        const limit  = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.q ? `%${req.query.q}%` : '%';

        const total = await db.getAsync(
            `SELECT COUNT(*) as cnt FROM reports r
             WHERE r.is_archived = 1
             AND (r.item_name LIKE ? OR r.description LIKE ?)`,
            [search, search]
        );

        const items = await db.allAsync(
            `SELECT r.*,
                    c.label  AS category,
                    l.label  AS location,
                    rm.label AS room,
                    u.full_name      AS reporter_name,
                    u.contact_email  AS reporter_email,
                    a.label          AS reporter_affiliation
             FROM reports r
             LEFT JOIN categories  c  ON c.id  = r.category_id
             LEFT JOIN locations   l  ON l.id  = r.location_id
             LEFT JOIN rooms       rm ON rm.id = r.room_id
             LEFT JOIN users       u  ON u.id  = r.reporter_id
             LEFT JOIN affiliations a ON a.id  = u.affiliation_id
             WHERE r.is_archived = 1
             AND (r.item_name LIKE ? OR r.description LIKE ?)
             ORDER BY r.archived_at DESC
             LIMIT ? OFFSET ?`,
            [search, search, limit, offset]
        );

        res.json({ items, total: total.cnt, page, limit });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ── POST /api/admin/reports/bulk-delete  ← MUST be before /reports/:id
router.post('/reports/bulk-delete', async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || !ids.length) {
            return res.status(400).json({ error: 'No IDs' });
        }
        const ph = ids.map(() => '?').join(',');
        await db.runAsync(`DELETE FROM reports WHERE id IN (${ph})`, ids);
        logActivity(req.session.adminId, 'Bulk Delete', `Deleted reports: ${ids.join(',')}`, getIP(req));
        res.json({ success: true, count: ids.length });
    } catch (err) {
        console.error('Bulk delete error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/admin/reports (add new)  ← MUST be before /reports/:id
router.post('/reports', async (req, res) => {
    try {
        const {
            item_name, report_type, category_id, location_id, room_id, description,
            incident_date, incident_time, office_id, turnover_date, turnover_time
        } = req.body;

        const turned_over = report_type === 'found' ? (req.body.turned_over ? 1 : 0) : 0;

        const r = await db.runAsync(`
            INSERT INTO reports (item_name, report_type, status, category_id, location_id, room_id,
                description, incident_date, incident_time, turned_over, office_id, turnover_date, turnover_time)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [item_name, report_type, 'active',
             category_id||null, location_id||null, room_id||null,
             description, incident_date, incident_time||null,
             turned_over, office_id||null, turnover_date||null, turnover_time||null]
        );

        logActivity(req.session.adminId, 'Add', `Added report #${r.lastID}: ${item_name}`, getIP(req));
        res.json({ success: true, id: r.lastID });
    } catch (err) {
        console.error('Add report error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/admin/reports/:id
router.get('/reports/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const rpt = await db.getAsync(`
            SELECT r.*, c.label AS category_label, l.label AS location_label,
                   rm.label AS room_label, o.label AS office_label,
                   u.id AS user_id, u.full_name, u.age, u.contact_number, u.contact_email,
                   u.profile_photo, u.extra_details, u.created_at AS user_created,
                   a.label AS aff_label, a.value AS aff_value
            FROM reports r
            LEFT JOIN categories  c  ON r.category_id   = c.id
            LEFT JOIN locations   l  ON r.location_id   = l.id
            LEFT JOIN rooms      rm  ON r.room_id        = rm.id
            LEFT JOIN offices     o  ON r.office_id      = o.id
            LEFT JOIN users       u  ON r.reporter_id    = u.id
            LEFT JOIN affiliations a ON u.affiliation_id = a.id
            WHERE r.id = ?`, [id]
        );

        if (!rpt) return res.status(404).json({ error: 'Not found' });

        const claims = await db.allAsync(`
            SELECT cl.*, u.full_name AS claimant_name, u.contact_number AS claimant_phone,
                   u.contact_email AS claimant_email, a.label AS claimant_aff
            FROM claims cl
            LEFT JOIN users        u ON cl.claimant_id  = u.id
            LEFT JOIN affiliations a ON u.affiliation_id = a.id
            WHERE cl.report_id = ? ORDER BY cl.created_at DESC`, [id]
        );

        res.json({ report: rpt, claims });
    } catch (err) {
        console.error('Report detail error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/admin/reports/:id/edit-data
router.get('/reports/:id/edit-data', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const rpt = await db.getAsync('SELECT * FROM reports WHERE id=?', [id]);
        if (!rpt) return res.status(404).json({ error: 'Not found' });

        const [cats, locs, offices] = await Promise.all([
            db.allAsync('SELECT id,label FROM categories ORDER BY sort_order'),
            db.allAsync('SELECT id,label,has_rooms FROM locations ORDER BY sort_order'),
            db.allAsync('SELECT id,label FROM offices ORDER BY sort_order'),
        ]);

        let rooms = [];
        if (rpt.location_id) {
            rooms = await db.allAsync(
                'SELECT id,label FROM rooms WHERE location_id=? ORDER BY sort_order',
                [rpt.location_id]
            );
        }

        res.json({ report: rpt, categories: cats, locations: locs, rooms, offices });
    } catch (err) {
        console.error('Edit data error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ── PATCH /api/admin/reports/:id/status
router.patch('/reports/:id/status', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        let { status } = req.body;
        let ready_to_claim = 0;
        let is_archived    = 0;
        let dbStatus       = status;

        if (status === 'ready_to_claim') {
            dbStatus       = 'active';
            ready_to_claim = 1;
        } else if (status === 'resolved') {
            is_archived = 1;
        }

        await db.runAsync(
            `UPDATE reports SET status=?, ready_to_claim=?, is_archived=?,
             updated_at=datetime('now') WHERE id=?`,
            [dbStatus, ready_to_claim, is_archived, id]
        );
        logActivity(req.session.adminId, 'Status Update', `Report #${id} → ${status}`, getIP(req));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── PUT /api/admin/reports/:id
router.put('/reports/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const {
            item_name, report_type, category_id, location_id, room_id,
            description, incident_date, incident_time,
            status, turned_over, office_id, turnover_date
        } = req.body;

        const is_archived = (status === 'resolved') ? 1 : 0;

        await db.runAsync(`
            UPDATE reports SET
                item_name=?, report_type=?, category_id=?, location_id=?, room_id=?,
                description=?, incident_date=?, incident_time=?,
                status=?, turned_over=?, office_id=?, turnover_date=?,
                is_archived=?, updated_at=datetime('now')
            WHERE id=?`,
            [
                item_name, report_type,
                category_id||null, location_id||null, room_id||null,
                description, incident_date, incident_time||null,
                status||'active', turned_over ? 1 : 0,
                office_id||null, turnover_date||null,
                is_archived, id
            ]
        );
        logActivity(req.session.adminId, 'Edit Report', `Updated report #${id}`, getIP(req));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/admin/reports/:id/archive
router.post('/reports/:id/archive', async (req, res) => {
    try {
        await db.runAsync(
            `UPDATE reports SET is_archived = 1, status = 'resolved',
             archived_at = datetime('now'), updated_at = datetime('now')
             WHERE id = ?`,
            [req.params.id]
        );
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ── POST /api/admin/reports/:id/restore
router.post('/reports/:id/restore', async (req, res) => {
    try {
        await db.runAsync(
            `UPDATE reports SET is_archived = 0, status = 'active',
             archived_at = NULL, updated_at = datetime('now')
             WHERE id = ?`,
            [req.params.id]
        );
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ── POST /api/admin/reports/:id/spam
router.post('/reports/:id/spam', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { action = 'spam_only', reason = '' } = req.body;

        await db.runAsync(
            `UPDATE reports SET status='resolved', is_archived=1, updated_at=datetime('now') WHERE id=?`,
            [id]
        );

        if (action === 'warn' || action === 'block') {
            const report = await db.getAsync(
                `SELECT r.reporter_id, u.contact_email, u.full_name
                 FROM reports r LEFT JOIN users u ON r.reporter_id=u.id WHERE r.id=?`, [id]
            );
            if (report?.reporter_id) {
                if (action === 'block') {
                    await db.runAsync(`UPDATE users SET is_blocked=1 WHERE id=?`, [report.reporter_id]);
                }
                if (report.contact_email) {
                    const subject = action === 'block'
                        ? '🚫 Your B.A.L.I.K. account has been blocked'
                        : '⚠️ Warning from B.A.L.I.K.';
                    const html = `
                        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:16px">
                            <h2 style="color:${action==='block'?'#e53e3e':'#d97706'}">${subject}</h2>
                            <p>Hi <strong>${report.full_name||'there'}</strong>,</p>
                            <p>Your report has been flagged as spam.</p>
                            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
                            <p style="color:#6b7280;font-size:12px">— B.A.L.I.K. System</p>
                        </div>`;
                    await sendEmailNotification(report.contact_email, subject, html);
                }
            }
        }

        logActivity(req.session.adminId, 'Spam', `Report #${id} marked spam (${action})`, getIP(req));
        res.json({ success: true });
    } catch (err) {
        console.error('Spam error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ── DELETE /api/admin/reports/:id (permanent delete — archived items only)
router.delete('/reports/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await db.runAsync(`DELETE FROM claims  WHERE report_id = ?`, [id]);
        await db.runAsync(`DELETE FROM reports WHERE id = ? AND is_archived = 1`, [id]);
        logActivity(req.session.adminId, 'Delete', `Permanently deleted report #${id}`, getIP(req));
        res.json({ success: true });
    } catch (err) {
        console.error('Delete report error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ────────────────────────────────────────────────────────────────────────────
// CLAIMS
// ────────────────────────────────────────────────────────────────────────────

// ── GET /api/admin/claims
router.get('/claims', async (req, res) => {
    try {
        const { status = '', page = 1 } = req.query;
        const per = 20, offset = (parseInt(page) - 1) * per;
        const where = [], params = [];

        if (status && ['pending','approved','rejected'].includes(status)) {
            where.push('cl.claim_status=?'); params.push(status);
        }

        const wSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

        const total = await db.getAsync(`SELECT COUNT(*) AS c FROM claims cl ${wSql}`, params);
        const rows  = await db.allAsync(`
            SELECT cl.id, cl.claim_status, cl.message, cl.created_at,
                   r.id AS report_id, r.item_name, r.report_type, r.status AS report_status,
                   u.full_name AS claimant_name, u.contact_number AS claimant_phone,
                   u.contact_email AS claimant_email, a.label AS claimant_aff
            FROM claims cl
            LEFT JOIN reports      r ON cl.report_id   = r.id
            LEFT JOIN users        u ON cl.claimant_id = u.id
            LEFT JOIN affiliations a ON u.affiliation_id = a.id
            ${wSql} ORDER BY cl.created_at DESC LIMIT ${per} OFFSET ${offset}`,
            params
        );

        res.json({ total: total.c, claims: rows });
    } catch (err) {
        console.error('Claims error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/admin/claims/:id/decision
router.post('/claims/:id/decision', async (req, res) => {
    try {
        const claimId = parseInt(req.params.id);
        const { decision, report_id, rejection_reason } = req.body;

        if (!['approved','rejected'].includes(decision))
            return res.status(400).json({ error: 'Invalid decision' });

        const claim = await db.getAsync(
            `SELECT cl.*, u.contact_email, u.full_name as claimant_name,
                    r.item_name, r.office_id, r.turnover_date,
                    o.label AS office_label
             FROM claims cl
             LEFT JOIN users   u ON cl.claimant_id = u.id
             LEFT JOIN reports r ON cl.report_id   = r.id
             LEFT JOIN offices o ON r.office_id    = o.id
             WHERE cl.id = ?`, [claimId]
        );

        await db.runAsync(
            `UPDATE claims SET claim_status=?, updated_at=datetime('now') WHERE id=?`,
            [decision, claimId]
        );

        if (decision === 'approved') {
            await db.runAsync(
                `UPDATE reports SET status='resolved', ready_to_claim=0, is_archived=1,
                 updated_at=datetime('now') WHERE id=?`, [report_id]
            );
            await db.runAsync(
                `UPDATE claims SET claim_status='rejected', updated_at=datetime('now')
                 WHERE report_id=? AND id!=? AND claim_status='pending'`,
                [report_id, claimId]
            );
        } else {
            const rej = await db.getAsync(
                `SELECT COUNT(*) as cnt FROM claims
                 WHERE report_id=? AND claimant_id=? AND claim_status='rejected'`,
                [report_id, claim?.claimant_id]
            );
            const canRetry = (rej?.cnt || 1) < 2;
        }

        // Send email notification
        // Fix 5: Send rich email with pickup location for approved, reason for rejected
        if (claim?.contact_email) {
            const subject = decision === 'approved'
                ? `✅ Your claim for "${claim.item_name}" has been approved — Pickup Details Inside`
                : `❌ Your claim for "${claim.item_name}" has been rejected`;
            await sendEmailNotification(
                claim.contact_email, subject,
                claimEmailHtml(
                    decision,
                    claim.item_name,
                    claim.claimant_name,
                    rejection_reason || '',
                    claim.office_label || null,
                    claim.turnover_date || null
                )
            );
        }

        logActivity(req.session.adminId, 'Claim', `Claim #${claimId} for "${claim?.item_name}" → ${decision} (claimant: ${claim?.claimant_name || 'Unknown'})`, getIP(req));

        // Fix 2 & 8: Create in-app notification for the claimant (user-side)
        if (claim?.claimant_id) {
            const notifTitle = decision === 'approved' ? 'Claim Approved ✅' : 'Claim Rejected ❌';
            const notifMsg   = decision === 'approved'
                ? `Your claim for "${claim.item_name}" has been approved!${claim.office_label ? ' Please pick it up at: ' + claim.office_label + '.' : ' Please proceed to pick up your item.'}`
                : `Your claim for "${claim.item_name}" was rejected.${rejection_reason ? ' Reason: ' + rejection_reason : ''} You may retry if attempts remain.`;
            await db.runAsync(
                `INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at)
                 VALUES (?, 'claim', ?, ?, '/account.html', 0, datetime('now'))`,
                [claim.claimant_id, notifTitle, notifMsg]
            );
        }

        // Fix 2 & 4: Create admin-side notification (user_id NULL) for the decision
        await db.runAsync(
            `INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at)
             VALUES (NULL, 'claim', ?, ?, ?, 0, datetime('now'))`,
            [
                `Claim ${decision === 'approved' ? 'Approved ✅' : 'Rejected ❌'}`,
                `Claim #${claimId} for "${claim?.item_name}" — ${decision} (claimant: ${claim?.claimant_name || 'Unknown'})`,
                `/admin/index.html`
            ]
        );

        res.json({ success: true });
    } catch (err) {
        console.error('Claim decision error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ────────────────────────────────────────────────────────────────────────────
// USERS
// ────────────────────────────────────────────────────────────────────────────

// ── GET /api/admin/users
router.get('/users', async (req, res) => {
    try {
        const { q = '', page = 1 } = req.query;
        const per = 20, offset = (parseInt(page) - 1) * per;
        const where = [], params = [];

        if (q) {
            where.push('(u.full_name LIKE ? OR u.contact_email LIKE ? OR u.contact_number LIKE ?)');
            params.push(`%${q}%`, `%${q}%`, `%${q}%`);
        }

        const wSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

        const total = await db.getAsync(`SELECT COUNT(*) AS c FROM users u ${wSql}`, params);
        const rows  = await db.allAsync(`
            SELECT u.id, u.full_name, u.age, u.contact_email, u.contact_number,
                   u.profile_photo, u.extra_details, u.created_at,
                   a.label AS aff_label,
                   (SELECT COUNT(*) FROM reports WHERE reporter_id=u.id) AS report_count,
                   (SELECT COUNT(*) FROM claims  WHERE claimant_id=u.id) AS claim_count
            FROM users u LEFT JOIN affiliations a ON u.affiliation_id=a.id
            ${wSql} ORDER BY u.created_at DESC LIMIT ${per} OFFSET ${offset}`,
            params
        );

        res.json({ total: total.c, users: rows });
    } catch (err) {
        console.error('Users error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/admin/users/:id
router.get('/users/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const u  = await db.getAsync(`
            SELECT u.id, u.full_name, u.age, u.contact_email, u.contact_number,
                   u.profile_photo, u.extra_details, u.created_at, u.affiliation_id,
                   u.is_blocked,
                   a.label AS aff_label,
                   (SELECT COUNT(*) FROM reports WHERE reporter_id=u.id) AS report_count,
                   (SELECT COUNT(*) FROM claims  WHERE claimant_id=u.id) AS claim_count
            FROM users u LEFT JOIN affiliations a ON u.affiliation_id=a.id
            WHERE u.id=?`, [id]
        );
        if (!u) return res.status(404).json({ error: 'User not found' });
        res.json(u);
    } catch (err) {
        console.error('Get user error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ── PUT /api/admin/users/:id
router.put('/users/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { full_name, age, contact_email, contact_number, affiliation_id,
                student_number, employee_number } = req.body;

        // Merge ID numbers into extra_details
        const existing = await db.getAsync('SELECT extra_details FROM users WHERE id=?', [id]);
        let extra = {};
        try { extra = JSON.parse(existing?.extra_details || '{}'); } catch {}

        if (student_number  !== undefined) extra['Student Number']  = student_number  || '';
        if (employee_number !== undefined) extra['Employee Number'] = employee_number || '';

        if (req.body.penalties !== undefined) {
            extra['penalties'] = parseInt(req.body.penalties) || 0;
        }

        await db.runAsync(`
            UPDATE users SET full_name=?, age=?, contact_email=?, contact_number=?,
                             affiliation_id=?, extra_details=?
            WHERE id=?`,
            [full_name, age||null, contact_email, contact_number,
             affiliation_id||null, JSON.stringify(extra), id]
        );

        if (contact_email) {
            await db.runAsync(`UPDATE accounts SET email=? WHERE user_id=?`, [contact_email, id]);
        }

        logActivity(req.session.adminId, 'Edit User', `Edited user #${id}`, getIP(req));
        res.json({ success: true });
    } catch (err) {
        console.error('Update user error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ── DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        // Delete in correct order to respect foreign key constraints
        // 1. Delete claims where user is the claimant
        await db.runAsync('DELETE FROM claims WHERE claimant_id=?', [id]);
        
        // 2. Delete claims for reports the user created, then delete those reports
        await db.runAsync('DELETE FROM claims WHERE report_id IN (SELECT id FROM reports WHERE reporter_id=?)', [id]);
        
        // 3. Delete reports where user is the reporter
        await db.runAsync('DELETE FROM reports WHERE reporter_id=?', [id]);
        
        // 4. Delete notifications for the user
        await db.runAsync('DELETE FROM notifications WHERE user_id=?', [id]);
        
        // 5. Delete accounts (will cascade to sessions if needed)
        await db.runAsync('DELETE FROM accounts WHERE user_id=?', [id]);
        
        // 6. Finally delete the user
        await db.runAsync('DELETE FROM users WHERE id=?', [id]);
        
        logActivity(req.session.adminId, 'User Delete', `Deleted user #${id} and all related data`, getIP(req));
        res.json({ success: true });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ error: err.message });
    }
});


// ── POST /api/admin/users/:id/block (Fix #8)
router.post('/users/:id/block', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { block } = req.body; // 1 = block, 0 = unblock
        await db.runAsync('UPDATE users SET is_blocked = ? WHERE id = ?', [block ? 1 : 0, id]);
        logActivity(req.session.adminId, block ? 'Block User' : 'Unblock User', `${block ? 'Blocked' : 'Unblocked'} user #${id}`, getIP(req));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ────────────────────────────────────────────────────────────────────────────
// ADMINS (superadmin only)
// ────────────────────────────────────────────────────────────────────────────

// ── GET /api/admin/admins
router.get('/admins', async (req, res) => {
    try {
        if (!req.session.is_superadmin) return res.status(403).json({ error: 'Forbidden' });
        const rows = await db.allAsync(
            'SELECT id, username, full_name, is_superadmin, created_at FROM admins ORDER BY created_at'
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/admin/admins
router.post('/admins', async (req, res) => {
    try {
        if (!req.session.is_superadmin) return res.status(403).json({ error: 'Forbidden' });
        const { username, full_name, password, is_superadmin } = req.body;
        if (!username || !password || password.length < 8)
            return res.status(400).json({ error: 'Username and password (min 8 chars) required.' });
        const exists = await db.getAsync('SELECT id FROM admins WHERE username=?', [username]);
        if (exists) return res.status(400).json({ error: 'Username already taken.' });
        const r = await db.runAsync(
            `INSERT INTO admins (username, full_name, password_hash, is_superadmin, created_at)
             VALUES (?, ?, ?, ?, datetime('now'))`,
            [username, full_name||'', hashPassword(password), is_superadmin ? 1 : 0]
        );
        logActivity(req.session.adminId, 'Add Admin', `Added admin: ${username}`, getIP(req));
        res.json({ success: true, id: r.lastID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── PUT /api/admin/admins/:id
router.put('/admins/:id', async (req, res) => {
    try {
        if (!req.session.is_superadmin) return res.status(403).json({ error: 'Forbidden' });
        const id = parseInt(req.params.id);
        const { full_name, password, is_superadmin } = req.body;
        if (password && password.length > 0) {
            await db.runAsync(
                `UPDATE admins SET full_name=?, password_hash=?, is_superadmin=? WHERE id=?`,
                [full_name||'', hashPassword(password), is_superadmin ? 1 : 0, id]
            );
        } else {
            await db.runAsync(
                `UPDATE admins SET full_name=?, is_superadmin=? WHERE id=?`,
                [full_name||'', is_superadmin ? 1 : 0, id]
            );
        }
        logActivity(req.session.adminId, 'Edit Admin', `Edited admin #${id}`, getIP(req));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── DELETE /api/admin/admins/:id
router.delete('/admins/:id', async (req, res) => {
    try {
        if (!req.session.is_superadmin) return res.status(403).json({ error: 'Forbidden' });
        const id = parseInt(req.params.id);
        if (id === req.session.adminId) return res.status(400).json({ error: 'Cannot delete yourself.' });
        await db.runAsync('DELETE FROM admins WHERE id=?', [id]);
        logActivity(req.session.adminId, 'Delete Admin', `Deleted admin #${id}`, getIP(req));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ────────────────────────────────────────────────────────────────────────────

router.get('/notifications', async (req, res) => {
    try {
        // Fix 4: Only return admin-level notifications (user_id IS NULL)
        const rows = await db.allAsync(
            'SELECT * FROM notifications WHERE user_id IS NULL ORDER BY created_at DESC LIMIT 100'
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/notifications/mark-read', async (req, res) => {
    try {
        await db.runAsync('UPDATE notifications SET is_read=1 WHERE user_id IS NULL AND is_read=0');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ────────────────────────────────────────────────────────────────────────────
// LOGS
// ────────────────────────────────────────────────────────────────────────────

router.get('/logs', async (req, res) => {
    try {
        const { date = '', page = 1 } = req.query;
        const per = 20, offset = (parseInt(page) - 1) * per;
        const where = [], params = [];

        if (date) { where.push("DATE(l.created_at)=?"); params.push(date); }

        const wSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

        const total = await db.getAsync(`SELECT COUNT(*) AS c FROM activity_logs l ${wSql}`, params);
        const rows  = await db.allAsync(`
            SELECT l.id, l.action_type, l.description, l.created_at, a.username, a.full_name
            FROM activity_logs l LEFT JOIN admins a ON l.admin_id=a.id
            ${wSql} ORDER BY l.created_at DESC LIMIT ${per} OFFSET ${offset}`,
            params
        );

        res.json({ total: total.c, logs: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ────────────────────────────────────────────────────────────────────────────
// LOOKUP
// ────────────────────────────────────────────────────────────────────────────

router.get('/lookup', async (req, res) => {
    try {
        const [cats, locs, offices, affiliations] = await Promise.all([
            db.allAsync('SELECT id,label FROM categories ORDER BY sort_order'),
            db.allAsync('SELECT id,label,has_rooms FROM locations ORDER BY sort_order'),
            db.allAsync('SELECT id,label FROM offices ORDER BY sort_order'),
            db.allAsync('SELECT id,value,label FROM affiliations ORDER BY sort_order'),
        ]);
        res.json({ categories: cats, locations: locs, offices, affiliations });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/lookup/rooms/:locationId', async (req, res) => {
    try {
        const rows = await db.allAsync(
            'SELECT id,label FROM rooms WHERE location_id=? ORDER BY sort_order',
            [req.params.locationId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ────────────────────────────────────────────────────────────────────────────
// REPORT GENERATION
// ────────────────────────────────────────────────────────────────────────────

router.get('/report-data', async (req, res) => {
    try {
        const { status, type, date_from, date_to } = req.query;
        const where = ['1=1'], params = [];

        if (status && ['active','pending','resolved'].includes(status)) {
            where.push('r.status=?'); params.push(status);
        }
        if (type && ['lost','found'].includes(type)) {
            where.push('r.report_type=?'); params.push(type);
        }
        if (date_from) { where.push('r.incident_date>=?'); params.push(date_from); }
        if (date_to)   { where.push('r.incident_date<=?'); params.push(date_to); }

        const rows = await db.allAsync(`
            SELECT r.id, r.report_type, r.status, r.item_name, r.incident_date,
                   r.turned_over, r.created_at,
                   c.label AS category_label, l.label AS location_label, rm.label AS room_label,
                   o.label AS office_label, u.full_name, u.contact_number, u.contact_email,
                   a.label AS aff_label
            FROM reports r
            LEFT JOIN categories  c  ON r.category_id   = c.id
            LEFT JOIN locations   l  ON r.location_id   = l.id
            LEFT JOIN rooms      rm  ON r.room_id        = rm.id
            LEFT JOIN offices     o  ON r.office_id      = o.id
            LEFT JOIN users       u  ON r.reporter_id    = u.id
            LEFT JOIN affiliations a ON u.affiliation_id = a.id
            WHERE ${where.join(' AND ')} ORDER BY r.incident_date DESC`,
            params
        );

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ────────────────────────────────────────────────────────────────────────────
// SETTINGS
// ────────────────────────────────────────────────────────────────────────────

router.post('/settings/password', async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        const admin = await db.getAsync('SELECT * FROM admins WHERE id=?', [req.session.adminId]);

        if (!verifyPassword(current_password, admin.password_hash)) {
            return res.status(400).json({ error: 'Current password incorrect.' });
        }

        await db.runAsync(
            'UPDATE admins SET password_hash=? WHERE id=?',
            [hashPassword(new_password), req.session.adminId]
        );
        logActivity(req.session.adminId, 'Settings', 'Password changed', getIP(req));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;