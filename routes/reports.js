const express = require('express');
const router  = express.Router();
const db      = require('../database/db');

// GET /api/reports
router.get('/', async (req, res) => {
    try {
        const { type, status, category_id, location_id, q, page = 1, limit = 12 } = req.query;
        let sql = `
            SELECT r.*, c.label AS category_label, l.label AS location_label,
                   rm.label AS room_label, a.label AS affiliation_label, u.full_name AS reporter_name
            FROM reports r
            LEFT JOIN categories  c  ON c.id = r.category_id
            LEFT JOIN locations   l  ON l.id = r.location_id
            LEFT JOIN rooms      rm  ON rm.id = r.room_id
            LEFT JOIN users       u  ON u.id = r.reporter_id
            LEFT JOIN affiliations a ON a.id = u.affiliation_id
            WHERE r.is_archived = 0`;
        const params = [];
        if (type)        { sql += ' AND r.report_type = ?';  params.push(type); }
        if (status) { sql += ' AND r.status = ?'; params.push(status); }
        if (category_id) { sql += ' AND r.category_id = ?';  params.push(category_id); }
        if (location_id) { sql += ' AND r.location_id = ?';  params.push(location_id); }
        if (q)           { sql += ' AND (r.item_name LIKE ? OR r.description LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }

        const countRow = await db.getAsync(`SELECT COUNT(*) AS total FROM (${sql})`, params);
        sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
        params.push(Number(limit), (Number(page) - 1) * Number(limit));
        const items = await db.allAsync(sql, params);
        res.json({ total: countRow.total, page: Number(page), limit: Number(limit), items });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/reports/:id
router.get('/:id', async (req, res) => {
    try {
        const report = await db.getAsync(`
            SELECT r.*, c.label AS category_label, l.label AS location_label,
                   rm.label AS room_label, o.label AS office_label,
                   u.full_name AS reporter_name, u.contact_email, u.contact_number,
                   a.label AS affiliation_label, u.extra_details
            FROM reports r
            LEFT JOIN categories  c  ON c.id = r.category_id
            LEFT JOIN locations   l  ON l.id = r.location_id
            LEFT JOIN rooms      rm  ON rm.id = r.room_id
            LEFT JOIN offices     o  ON o.id = r.office_id
            LEFT JOIN users       u  ON u.id = r.reporter_id
            LEFT JOIN affiliations a ON a.id = u.affiliation_id
            WHERE r.id = ?`, [req.params.id]);
        if (!report) return res.status(404).json({ error: 'Report not found' });
        res.json(report);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/reports
router.post('/', async (req, res) => {
    try {
        const {
            full_name, age, affiliation_value, extra_details,
            contact_email, contact_number,
            report_type, item_name, category_id, description, photo,
            incident_date, incident_time, location_id, room_id,
            turned_over, office_id, turnover_date, turnover_time
        } = req.body;

        if (!full_name || !report_type || !item_name || !incident_date) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }

        // Resolve affiliation id
        const aff = affiliation_value
            ? await db.getAsync('SELECT id FROM affiliations WHERE value = ?', [affiliation_value])
            : null;

        // Upsert user
        let userId = null;
        if (contact_email) {
            const existing = await db.getAsync('SELECT id FROM users WHERE contact_email = ?', [contact_email]);
            if (existing) userId = existing.id;
        }
        if (!userId) {
            const ins = await db.runAsync(
                'INSERT INTO users (full_name, age, affiliation_id, extra_details, contact_email, contact_number) VALUES (?, ?, ?, ?, ?, ?)',
                [full_name, age || null, aff ? aff.id : null,
                 extra_details ? JSON.stringify(extra_details) : null,
                 contact_email || null, contact_number || null]
            );
            userId = ins.lastID;
        }

        // Insert report
        const ins = await db.runAsync(`
            INSERT INTO reports (report_type, reporter_id, item_name, category_id, description, photo,
                incident_date, incident_time, location_id, room_id, turned_over, office_id, turnover_date, turnover_time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [report_type, userId, item_name, category_id || null, description || null, photo || null,
             incident_date, incident_time || null, location_id || null, room_id || null,
             turned_over ? 1 : 0, office_id || null, turnover_date || null, turnover_time || null]
        );

        // Fix #3: Log report creation to activity_logs for admin history
        db.runAsync(
            `INSERT INTO activity_logs (admin_id, action_type, description, ip_address, created_at)
             VALUES (NULL, 'New Report', ?, '0.0.0.0', datetime('now'))`,
            [`User "${full_name}" submitted a ${report_type} report for "${item_name}" (Report #${ins.lastID})`]
        ).catch(()=>{});

        // Fix #5 & #3: Create notification for the reporter
        if (userId) {
            db.runAsync(
                `INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at)
                 VALUES (?, 'report', ?, ?, ?, 0, datetime('now'))`,
                [userId,
                 `Report Submitted: ${item_name}`,
                 `Your ${report_type} report for "${item_name}" has been submitted and is pending review.`,
                 `/account.html`]
            ).catch(()=>{});
        }

        res.status(201).json({ success: true, reportId: ins.lastID, userId });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

        // PATCH /api/reports/:id/status // replaced
        router.patch('/:id/status', async (req, res) => {
            try {
                const { status } = req.body;
                if (!['active', 'pending', 'resolved'].includes(status))
                    return res.status(400).json({ error: 'Invalid status.' });

                // resolved → archive; active/pending → unarchive
                const is_archived = status === 'resolved' ? 1 : 0;

                await db.runAsync(
                `UPDATE reports SET status = ?, is_archived = ?,
                archived_at = CASE WHEN ? = 1 THEN datetime('now') ELSE NULL END,
                updated_at = datetime('now') WHERE id = ?`,
                [status, is_archived, is_archived, req.params.id]
            );
                res.json({ success: true });
            } catch (err) { res.status(500).json({ error: err.message }); }
        });


// PATCH /api/reports/:id/cancel  (Fix #10 - user cancels their own report)
router.patch('/:id/cancel', async (req, res) => {
    try {
        const { user_id } = req.body;
        const report = await db.getAsync('SELECT * FROM reports WHERE id = ?', [req.params.id]);
        if (!report) return res.status(404).json({ error: 'Report not found.' });
        if (report.reporter_id != user_id) return res.status(403).json({ error: 'You can only cancel your own reports.' });
        if (report.status === 'resolved' || report.is_archived) return res.status(400).json({ error: 'This report cannot be cancelled.' });
        await db.runAsync(
            `UPDATE reports SET status='resolved', is_archived=1, archived_at=datetime('now'), updated_at=datetime('now') WHERE id=?`,
            [req.params.id]
        );
        // Log cancellation
        db.runAsync(
            `INSERT INTO activity_logs (admin_id, action_type, description, ip_address, created_at)
             VALUES (NULL, 'Report Cancelled', ?, '0.0.0.0', datetime('now'))`,
            [`User (ID ${user_id}) cancelled their report for "${report.item_name}" (Report #${report.id})`]
        ).catch(()=>{});
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/reports/:id
router.delete('/:id', async (req, res) => {
    try {
        await db.runAsync('DELETE FROM reports WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
