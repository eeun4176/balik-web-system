/**
 * /api/upload
 * Accepts a single image file and returns its server path.
 */

const express = require('express');

module.exports = function(upload) {
    const router = express.Router();

    router.post('/', upload.single('photo'), (req, res) => {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
        res.json({
            success: true,
            filename: req.file.filename,
            url: `/uploads/${req.file.filename}`
        });
    });

    return router;
};
