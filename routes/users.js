const express = require('express');
const router  = express.Router();
const db      = require('../database/db');

router.get('/:id/stats', async (req, res) => {
    try {
        const uid = req.params.id;
        const stats = await db.getAsync(`
            SELECT
                COUNT(*) AS total_submitted,
                SUM(CASE WHEN status = 'active'   THEN 1 ELSE 0 END) AS total_active,
                SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS total_resolved,
                SUM(CASE WHEN status = 'pending'  THEN 1 ELSE 0 END) AS total_pending
            FROM reports WHERE reporter_id = ?`, [uid]);

        // Count claims submitted by this user
        const claimStats = await db.getAsync(`
            SELECT
                COUNT(*) AS total_claims,
                SUM(CASE WHEN claim_status = 'pending'  THEN 1 ELSE 0 END) AS total_claims_pending,
                SUM(CASE WHEN claim_status = 'approved' THEN 1 ELSE 0 END) AS total_claims_approved
            FROM claims WHERE claimant_id = ?`, [uid]);

        res.json({
            ...(stats || { total_submitted: 0, total_active: 0, total_resolved: 0, total_pending: 0 }),
            total_claims:          claimStats ? claimStats.total_claims          : 0,
            total_claims_pending:  claimStats ? claimStats.total_claims_pending  : 0,
            total_claims_approved: claimStats ? claimStats.total_claims_approved : 0,
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id/claims', async (req, res) => {
    try {
        const userId = req.params.id;

        // Get user's contact email for fallback matching
        const user = await db.getAsync('SELECT contact_email FROM users WHERE id = ?', [userId]);
        const contactEmail = user ? user.contact_email : null;

        // Backfill: update any NULL claimant_id claims where the message JSON contains this user's email
        if (contactEmail) {
            const nullClaims = await db.allAsync(
                `SELECT id, message FROM claims WHERE claimant_id IS NULL AND message LIKE ?`,
                [`%${contactEmail}%`]
            );
            for (const c of nullClaims) {
                try {
                    const msg = JSON.parse(c.message);
                    if (msg.contact_email === contactEmail) {
                        await db.runAsync('UPDATE claims SET claimant_id = ? WHERE id = ?', [userId, c.id]);
                    }
                } catch(e) {}
            }
        }

        // Now fetch all claims for this user
        const rows = await db.allAsync(`
            SELECT cl.*, r.item_name, r.report_type, r.incident_date,
                   c.label AS category_label, l.label AS location_label
            FROM claims cl
            JOIN reports r ON r.id = cl.report_id
            LEFT JOIN categories c ON c.id = r.category_id
            LEFT JOIN locations l ON l.id = r.location_id
            WHERE cl.claimant_id = ?
            ORDER BY cl.created_at DESC`, [userId]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id/reports', async (req, res) => {
    try {
        const rows = await db.allAsync(`
            SELECT r.*, c.label AS category_label, l.label AS location_label
            FROM reports r
            LEFT JOIN categories c ON c.id = r.category_id
            LEFT JOIN locations l ON l.id = r.location_id
            WHERE r.reporter_id = ?
            ORDER BY r.created_at DESC`, [req.params.id]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});


// GET /api/users/:id/notifications  (Fix #5)
router.get('/:id/notifications', async (req, res) => {
    try {
        const rows = await db.allAsync(
            `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
            [req.params.id]
        );
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/users/:id/notifications/mark-read  (Fix #5)
router.post('/:id/notifications/mark-read', async (req, res) => {
    try {
        const { ids } = req.body; // array of notification ids to mark read
        if (ids && ids.length) {
            const ph = ids.map(() => '?').join(',');
            await db.runAsync(
                `UPDATE notifications SET is_read=1 WHERE user_id=? AND id IN (${ph})`,
                [req.params.id, ...ids]
            );
        } else {
            await db.runAsync(
                `UPDATE notifications SET is_read=1 WHERE user_id=?`,
                [req.params.id]
            );
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
    try {
        const user = await db.getAsync(`
            SELECT u.*, a.label AS affiliation_label
            FROM users u LEFT JOIN affiliations a ON a.id = u.affiliation_id
            WHERE u.id = ?`, [req.params.id]);
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.extra_details) { try { user.extra_details = JSON.parse(user.extra_details); } catch {} }
        res.json(user);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id', async (req, res) => {
    try {
        const { full_name, age, contact_email, contact_number, profile_photo, affiliation_id, affiliation_value } = req.body;

        // Resolve affiliation_id: accept either a numeric id or a value string like 'student'
        let resolvedAffilId = affiliation_id || null;
        if (!resolvedAffilId && affiliation_value) {
            const affil = await db.getAsync('SELECT id FROM affiliations WHERE value = ?', [affiliation_value]);
            if (affil) resolvedAffilId = affil.id;
        }

        // Fix #4: Handle id_number - store in extra_details
        const { id_number } = req.body;
        if (id_number !== undefined) {
            const existing = await db.getAsync('SELECT extra_details, affiliation_id FROM users WHERE id=?', [req.params.id]);
            let extra = {};
            try { extra = JSON.parse(existing?.extra_details || '{}'); } catch {}
            // Determine if student or employee based on affiliation
            const affil = resolvedAffilId || existing?.affiliation_id;
            let affilRow = null;
            if (affil) affilRow = await db.getAsync('SELECT value FROM affiliations WHERE id=?', [affil]);
            const affilVal = (affilRow?.value || '').toLowerCase();
            if (affilVal === 'student') {
                extra['Student Number'] = id_number || '';
            } else {
                extra['Employee Number'] = id_number || '';
            }
            // Also store under both keys for backwards compat
            extra['id_number'] = id_number || '';
            await db.runAsync(
                `UPDATE users SET
                    full_name      = COALESCE(?, full_name),
                    age            = COALESCE(?, age),
                    contact_email  = COALESCE(?, contact_email),
                    contact_number = COALESCE(?, contact_number),
                    profile_photo  = COALESCE(?, profile_photo),
                    affiliation_id = COALESCE(?, affiliation_id),
                    extra_details  = ?
                 WHERE id = ?`,
                [full_name, age, contact_email, contact_number, profile_photo, resolvedAffilId, JSON.stringify(extra), req.params.id]
            );
        } else {
            await db.runAsync(
                `UPDATE users SET
                    full_name      = COALESCE(?, full_name),
                    age            = COALESCE(?, age),
                    contact_email  = COALESCE(?, contact_email),
                    contact_number = COALESCE(?, contact_number),
                    profile_photo  = COALESCE(?, profile_photo),
                    affiliation_id = COALESCE(?, affiliation_id)
                 WHERE id = ?`,
                [full_name, age, contact_email, contact_number, profile_photo, resolvedAffilId, req.params.id]
            );
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;