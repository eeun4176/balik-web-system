const express = require('express');
const router  = express.Router();
const db      = require('../database/db');

// ─── POST /api/claims ─────────────────────────────────────────────────────────
// Submit a new claim for a found item
router.post('/', async (req, res) => {
    try {
        const {
            report_id, claimant_user_id, full_name, age, affiliation, extra_details,
            contact_email, claim_date, claim_time,
            location_lost, room_lost, item_description, unique_marks, proof_photo
        } = req.body;

        if (!report_id) return res.status(400).json({ error: 'report_id is required.' });
        if (!full_name) return res.status(400).json({ error: 'full_name is required.' });

        // Verify the report exists and is a found item
        const report = await db.getAsync('SELECT * FROM reports WHERE id = ?', [report_id]);
        if (!report) return res.status(404).json({ error: 'Report not found.' });
        if (report.status === 'resolved') return res.status(400).json({ error: 'This item has already been claimed.' });

        // ── Check for duplicate: one claim per item per user ─────────────────
        const parsedClaimantId = claimant_user_id ? Number(claimant_user_id) : null;

if (parsedClaimantId) {
    // Block if item is archived/resolved
    if (report.is_archived) {
        return res.status(400).json({ error: 'This item has already been resolved.' });
    }

    // ── 2-attempt limit: count prior rejections ───────────────────────
    const rejRow = await db.getAsync(
        `SELECT COUNT(*) AS cnt FROM claims
         WHERE report_id = ? AND claimant_id = ? AND claim_status = 'rejected'`,
        [Number(report_id), parsedClaimantId]
    );
    if ((rejRow?.cnt || 0) >= 2) {
        return res.status(400).json({
            error: 'You have reached the maximum of 2 claim attempts for this item.',
            attempts_exhausted: true
        });
    }

    // ── Block if pending or approved claim already exists ─────────────
    const activeClaim = await db.getAsync(
        `SELECT id FROM claims
         WHERE report_id = ? AND claimant_id = ? AND claim_status IN ('pending','approved')`,
        [Number(report_id), parsedClaimantId]
    );
    if (activeClaim) {
        return res.status(400).json({ error: 'You already have an active claim for this item.' });
    }
}

// Also check by email for NULL claimant_id cases
if (contact_email) {
    const allClaims = await db.allAsync(
        `SELECT id, message, claimant_id, claim_status FROM claims WHERE report_id = ?`,
        [Number(report_id)]
    );
    for (const ec of allClaims) {
        if (ec.claim_status === 'rejected') continue; // rejections are ok to retry
        if (parsedClaimantId && ec.claimant_id === parsedClaimantId) continue;
        try {
            const msg = JSON.parse(ec.message || '{}');
            if (msg.contact_email === contact_email &&
                ['pending','approved'].includes(ec.claim_status)) {
                return res.status(400).json({ error: 'You already have an active claim for this item.' });
            }
        } catch(e) {}
    }
}
        // Build a message/details JSON blob from the claim data
        const message = JSON.stringify({
            full_name, age, affiliation,
            extra_details: extra_details || {},
            contact_email,
            claim_date, claim_time,
            location_lost, room_lost,
            item_description, unique_marks,
            proof_photo
        });

        // Resolve claimant_id: prefer explicit user_id, fallback to email lookup
        let claimant_id = parsedClaimantId;
        if (!claimant_id && contact_email) {
            const account = await db.getAsync('SELECT user_id FROM accounts WHERE email = ?', [contact_email]);
            if (account) claimant_id = account.user_id;
        }

        // Insert claim
        const result = await db.runAsync(
            `INSERT INTO claims (report_id, claimant_id, claim_status, message)
             VALUES (?, ?, 'pending', ?)`,
            [report_id, claimant_id, message]
        );

        // Update report status to pending
        // Set report to pending only if it was active (don't overwrite other states)
        await db.runAsync(
            `UPDATE reports SET status = 'pending', updated_at = datetime('now')
            WHERE id = ? AND status = 'active'`,
            [report_id]
        );

        // Fix #3: Log claim to activity_logs for admin history
        db.runAsync(
            `INSERT INTO activity_logs (admin_id, action_type, description, ip_address, created_at)
             VALUES (NULL, 'New Claim', ?, '0.0.0.0', datetime('now'))`,
            [`"${full_name}" submitted a claim for Report #${report_id} (Claim #${result.lastID})`]
        ).catch(()=>{});

        // Notification for the claimant (user-side)
        if (claimant_id) {
            const rpt = await db.getAsync('SELECT item_name FROM reports WHERE id=?', [report_id]);
            db.runAsync(
                `INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at)
                 VALUES (?, 'claim', ?, ?, ?, 0, datetime('now'))`,
                [claimant_id,
                 'Claim Submitted',
                 `Your claim for "${rpt ? rpt.item_name : 'item'}" has been submitted and is under review.`,
                 '/account.html']
            ).catch(()=>{});
        }

        // Fix 4: Admin notification (user_id NULL) — alert admin of new claim
        const rptForAdmin = await db.getAsync('SELECT item_name FROM reports WHERE id=?', [report_id]);
        db.runAsync(
            `INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at)
             VALUES (NULL, 'claim', 'New Claim Submitted 📋', ?, '/admin/index.html', 0, datetime('now'))`,
            [`"${full_name}" filed a claim for "${rptForAdmin ? rptForAdmin.item_name : 'Report #' + report_id}" (Claim #${result.lastID})`]
        ).catch(()=>{});

        res.json({ success: true, claim_id: result.lastID, message: 'Claim submitted successfully.' });
    } catch (err) {
        console.error('Claim submit error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/claims?report_id=:id ───────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const { report_id } = req.query;
        if (!report_id) return res.status(400).json({ error: 'report_id query param required.' });
        const claims = await db.allAsync(
            'SELECT * FROM claims WHERE report_id = ? ORDER BY created_at DESC',
            [report_id]
        );
        res.json(claims);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/claims/user/:userId ─────────────────────────────────────────────
router.get('/user/:userId', async (req, res) => {
    try {
        const claims = await db.allAsync(
            `SELECT c.*, r.item_name, r.report_type, r.photo, r.is_archived,
                    (SELECT COUNT(*) FROM claims c2
                     WHERE c2.report_id = c.report_id
                       AND c2.claimant_id = c.claimant_id
                       AND c2.claim_status = 'rejected') AS rejection_count
             FROM claims c
             JOIN reports r ON r.id = c.report_id
             WHERE c.claimant_id = ?
             ORDER BY c.created_at DESC`,
            [req.params.userId]
        );
        res.json(claims);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;