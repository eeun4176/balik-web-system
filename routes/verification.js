/**
 * B.A.L.I.K. Verification Routes
 * Handles report verification and similar report matching
 * Adapted for SQLite database
 */

const express = require('express');
const router = express.Router();
const db = require('../database/db');


// ────────────────────────────────────────────────────────────────────────────
// GET /api/admin/verification/pending
// Get next pending verification report with similar matches
// ────────────────────────────────────────────────────────────────────────────
router.get('/pending', async (req, res) => {
    try {
        const { page = 1, cat = '', type = '', reporter = '' } = req.query;
        const pageSize = 10;
        

        // Get next pending report
        const pendingReports = await db.allAsync(`
            SELECT 
                r.id,
                r.item_name,
                r.report_type,
                r.category_id,
                r.location_id,
                r.room_id,
                r.description,
                r.incident_date,
                r.incident_time,
                r.status,
                r.photo,
                r.reporter_id,
                r.created_at,
                c.label as category_label,
                l.label as location_label,
                ro.label as room_label,
                u.full_name,
                u.contact_email,
                u.contact_number,
                a.label as aff_label
            FROM reports r
            LEFT JOIN categories c ON r.category_id = c.id
            LEFT JOIN locations l ON r.location_id = l.id
            LEFT JOIN rooms ro ON r.room_id = ro.id
            LEFT JOIN users u ON r.reporter_id = u.id
            LEFT JOIN affiliations a ON u.affiliation_id = a.id
            WHERE (r.verification_status IS NULL OR r.verification_status = '' OR r.verification_status = 'pending')
            AND r.status IN ('active', 'pending')
            ORDER BY r.created_at ASC
            LIMIT 1
        `);

        if (!pendingReports || pendingReports.length === 0) {
            return res.json({
                report: null,
                similar_reports: [],
                total_similar: 0,
                message: 'No pending verifications'
            });
        }

        const currentReport = pendingReports[0];

        // Find similar reports
        let similarQuery = `
            SELECT 
                r.id,
                r.item_name,
                r.report_type,
                r.category_id,
                r.location_id,
                r.incident_date,
                r.reporter_id,
                c.label as category_label,
                l.label as location_label,
                u.full_name,
                a.label as aff_label
            FROM reports r
            LEFT JOIN categories c ON r.category_id = c.id
            LEFT JOIN locations l ON r.location_id = l.id
            LEFT JOIN users u ON r.reporter_id = u.id
            LEFT JOIN affiliations a ON u.affiliation_id = a.id
            WHERE r.id != ?
            AND r.status IN ('active', 'pending', 'resolved')
            AND (
                r.category_id = ?
                OR (r.location_id = ? AND r.report_type != ?)
                OR r.item_name LIKE ?
            )
        `;

        const params = [
            currentReport.id,
            currentReport.category_id,
            currentReport.location_id,
            currentReport.report_type,
            `%${currentReport.item_name}%`
        ];

        // Apply filters
        if (cat && cat !== '') {
            similarQuery += ` AND r.category_id = ?`;
            params.push(cat);
        }

        if (type && type !== '') {
            similarQuery += ` AND r.report_type = ?`;
            params.push(type);
        }

        if (reporter && reporter !== '') {
            similarQuery += ` AND u.full_name LIKE ?`;
            params.push(`%${reporter}%`);
        }

        // Pagination
        similarQuery += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
        params.push(pageSize, (parseInt(page) - 1) * pageSize);

        const similarReports = await db.allAsync(similarQuery, params);

        // Get total count
        let countQuery = `
            SELECT COUNT(*) as total
            FROM reports r
            LEFT JOIN users u ON r.reporter_id = u.id
            WHERE r.id != ?
            AND r.status IN ('active', 'pending', 'resolved')
            AND (
                r.category_id = ?
                OR (r.location_id = ? AND r.report_type != ?)
                OR r.item_name LIKE ?
            )
        `;

        const countParams = [
            currentReport.id,
            currentReport.category_id,
            currentReport.location_id,
            currentReport.report_type,
            `%${currentReport.item_name}%`
        ];

        if (cat && cat !== '') {
            countQuery += ` AND r.category_id = ?`;
            countParams.push(cat);
        }

        if (type && type !== '') {
            countQuery += ` AND r.report_type = ?`;
            countParams.push(type);
        }

        if (reporter && reporter !== '') {
            countQuery += ` AND u.full_name LIKE ?`;
            countParams.push(`%${reporter}%`);
        }

        const countResult = await db.getAsync(countQuery, countParams);
        const totalSimilar = countResult?.total || 0;

        // Get lookup data
        const categories = await db.allAsync(`
            SELECT id, label
            FROM categories
            ORDER BY sort_order ASC, label ASC
        `);

        return res.json({
            report: currentReport,
            similar_reports: similarReports || [],
            total_similar: totalSimilar,
            per_page: pageSize,
            page: parseInt(page),
            lookup: {
                categories: categories || []
            }
        });

    } catch (err) {
        console.error('Verification pending error:', err);
        return res.status(500).json({ error: err.message });
    }
});

// ────────────────────────────────────────────────────────────────────────────
// POST /api/admin/verification/:id/verify
// Mark a report as verified
// ────────────────────────────────────────────────────────────────────────────
router.post('/:id/verify', async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.session.adminId;

        // Check if report exists
        const report = await db.getAsync('SELECT id FROM reports WHERE id = ?', [id]);
        if (!report) {
            return res.status(404).json({ success: false, error: 'Report not found' });
        }

        // Update verification status
        await db.runAsync(`
            UPDATE reports
            SET 
                verification_status = 'verified',
                verified_at = datetime('now'),
                verified_by_admin_id = ?
            WHERE id = ?
        `, [adminId, id]);

        // Log the action
        await db.runAsync(`
            INSERT INTO activity_logs 
            (admin_id, action_type, description)
            VALUES (?, 'verify_report', ?)
        `, [adminId, `Report #${id} verified`]);

        return res.json({
            success: true,
            message: `Report #${id} has been verified`,
            report_id: id
        });

    } catch (err) {
        console.error('Verify report error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

// ────────────────────────────────────────────────────────────────────────────
// POST /api/admin/verification/:id/decline
// Mark a report as declined
// ────────────────────────────────────────────────────────────────────────────
router.post('/:id/decline', async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.session.adminId;

        // Check if report exists
        const report = await db.getAsync('SELECT id, status FROM reports WHERE id = ?', [id]);
        if (!report) {
            return res.status(404).json({ success: false, error: 'Report not found' });
        }

        // Update verification status
        await db.runAsync(`
            UPDATE reports
            SET 
                verification_status = 'declined',
                declined_at = datetime('now'),
                declined_by_admin_id = ?,
                status = 'resolved'
            WHERE id = ?
        `, [adminId, id]);

        // Log the action
        await db.runAsync(`
            INSERT INTO activity_logs 
            (admin_id, action_type, description)
            VALUES (?, 'decline_report', ?)
        `, [adminId, `Report #${id} verification declined`]);

        return res.json({
            success: true,
            message: `Report #${id} has been declined`,
            report_id: id
        });

    } catch (err) {
        console.error('Decline report error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;