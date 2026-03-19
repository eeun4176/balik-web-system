const express = require('express');
const router  = express.Router();
const db      = require('../database/db');

router.get('/affiliations', async (req, res) => {
    res.json(await db.allAsync('SELECT * FROM affiliations ORDER BY sort_order'));
});
router.get('/programs', async (req, res) => {
    res.json(await db.allAsync('SELECT * FROM programs ORDER BY sort_order'));
});
router.get('/departments', async (req, res) => {
    res.json(await db.allAsync('SELECT * FROM departments ORDER BY sort_order'));
});
router.get('/categories', async (req, res) => {
    res.json(await db.allAsync('SELECT * FROM categories ORDER BY sort_order'));
});
router.get('/locations', async (req, res) => {
    res.json(await db.allAsync('SELECT * FROM locations ORDER BY sort_order'));
});
router.get('/rooms/:locationId', async (req, res) => {
    res.json(await db.allAsync('SELECT * FROM rooms WHERE location_id = ? ORDER BY sort_order', [req.params.locationId]));
});
router.get('/sections/:year', async (req, res) => {
    res.json(await db.allAsync('SELECT * FROM sections WHERE year = ? ORDER BY sort_order', [req.params.year]));
});
router.get('/offices', async (req, res) => {
    res.json(await db.allAsync('SELECT * FROM offices ORDER BY sort_order'));
});
router.get('/all', async (req, res) => {
    const [affiliations, programs, departments, categories, locations, offices] = await Promise.all([
        db.allAsync('SELECT * FROM affiliations ORDER BY sort_order'),
        db.allAsync('SELECT * FROM programs ORDER BY sort_order'),
        db.allAsync('SELECT * FROM departments ORDER BY sort_order'),
        db.allAsync('SELECT * FROM categories ORDER BY sort_order'),
        db.allAsync('SELECT * FROM locations ORDER BY sort_order'),
        db.allAsync('SELECT * FROM offices ORDER BY sort_order'),
    ]);
    res.json({ affiliations, programs, departments, categories, locations, offices });
});

module.exports = router;
