const express = require('express');
const router  = express.Router();
const db      = require('../database/db');

router.get('/search', async (req, res) => {
    try {
        const { q = '', categories = '', locations = '', statuses = '', page = 1, limit = 12 } = req.query;

        let whereClauses = ['1=1'];
        const params = [];

        // ── Resolved items are archived — never show in user search ──────────
        whereClauses.push('r.is_archived = 0');
        whereClauses.push("r.report_type = 'found'");

        

        // Hide items the logged-in user personally reported
        const loggedInUserId = req.query.user_id ? Number(req.query.user_id) : null;
        if (loggedInUserId) {
            whereClauses.push('r.reporter_id != ?');
            params.push(loggedInUserId);
        }

        if (q) {
            whereClauses.push('(r.item_name LIKE ? OR r.description LIKE ?)');
            params.push(`%${q}%`, `%${q}%`);
        }

        const cats = categories.split(',').map(s => s.trim()).filter(Boolean);
        if (cats.length) {
            whereClauses.push(`c.label IN (${cats.map(() => '?').join(',')})`);
            params.push(...cats);
        }

        const locs = locations.split(',').map(s => s.trim()).filter(Boolean);
        if (locs.length) {
            whereClauses.push(`l.label IN (${locs.map(() => '?').join(',')})`);
            params.push(...locs);
        }

        // Strip 'resolved' — resolved = archived = hidden from users
        const sts = statuses.split(',').map(s => s.trim()).filter(Boolean)
                             .filter(s => s !== 'resolved');
        if (sts.length) {
            whereClauses.push(`r.status IN (${sts.map(() => '?').join(',')})`);
            params.push(...sts);
        }

        const whereSQL = whereClauses.join(' AND ');

        const joins = `
            FROM reports r
            LEFT JOIN categories c  ON c.id = r.category_id
            LEFT JOIN locations  l  ON l.id = r.location_id
            LEFT JOIN rooms     rm  ON rm.id = r.room_id`;

        const countRow = await db.getAsync(
            `SELECT COUNT(*) AS total ${joins} WHERE ${whereSQL}`, params
        );
        const total = countRow ? Number(countRow.total) : 0;

        const offset = (Number(page) - 1) * Number(limit);
        const items = await db.allAsync(
            `SELECT r.id, r.report_type, r.status, r.ready_to_claim,
                r.item_name, r.description, r.photo,
                r.incident_date, r.incident_time, r.reporter_id,
                c.label AS category, l.label AS location, rm.label AS room
             ${joins}
             WHERE ${whereSQL}
             ORDER BY r.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, Number(limit), offset]
        );

        res.json({ total, page: Number(page), limit: Number(limit), items });
    } catch (err) {
        console.error('Search error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;