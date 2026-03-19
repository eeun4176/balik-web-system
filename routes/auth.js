/**
 * B.A.L.I.K. Auth Routes
 * Uses crypto (built-in) for password hashing - no external deps needed.
 * OTP emails are logged to console; swap sendEmail() for nodemailer in production.
 */

const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const db      = require('../database/db');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
    const [salt, hash] = stored.split(':');
    const inputHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(inputHash, 'hex'));
}

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function otpExpiry() {
    // 10 minutes from now
    const d = new Date(Date.now() + 10 * 60 * 1000);
    return d.toISOString();
}

/**
 * Send OTP via email.
 * In production: replace this with nodemailer / SendGrid / etc.
 * For now: logs to console and returns the OTP so you can test in browser console.
 */
async function sendOTPEmail(email, otp, name, purpose = 'verify') {
    const isReset   = purpose === 'reset';
    const subject   = isReset ? 'B.A.L.I.K. Password Reset' : 'B.A.L.I.K. Email Verification';
    const heading   = isReset ? 'Reset your B.A.L.I.K. password' : 'Verify your B.A.L.I.K. account';
    const bodyText  = isReset
        ? `Hi ${name}, use the OTP below to reset your password:`
        : `Hi ${name}, use the OTP below to activate your account:`;

    console.log(`\n📧 ─────────────────────────────────────────`);
    console.log(`   TO:      ${email}`);
    console.log(`   NAME:    ${name}`);
    console.log(`   PURPOSE: ${purpose}`);
    console.log(`   OTP:     ${otp}`);
    console.log(`   EXPIRES: 10 minutes`);
    console.log(`   ─────────────────────────────────────────\n`);

    if (process.env.MAIL_USER && process.env.MAIL_PASS) {
        try {
            const nodemailer = require('nodemailer');
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
            });
            await transporter.sendMail({
                from: `"B.A.L.I.K. - Sarmiento Campus" <${process.env.MAIL_USER}>`,
                to: email,
                subject,
                html: `
                  <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:16px">
                    <h2 style="color:#077FC4">${heading}</h2>
                    <p>${bodyText}</p>
                    <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#077FC4;margin:24px 0">${otp}</div>
                    <p style="color:#6b7280;font-size:12px">This code expires in 10 minutes.</p>
                  </div>`
            });
            console.log(`📨 Email sent to ${email}`);
        } catch (mailErr) {
            console.error('⚠️  Email send failed (check MAIL_USER / MAIL_PASS):', mailErr.message);
        }
    } else {
        console.log('⚠️  MAIL_USER / MAIL_PASS not set — running in console-OTP mode.');
    }
}

// ─── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', async (req, res) => {
    try {
        const { name, age, affiliation, email, password } = req.body;

        if (!name || !email || !password)
            return res.status(400).json({ error: 'Name, email and password are required.' });

        if (password.length < 8)
            return res.status(400).json({ error: 'Password must be at least 8 characters.' });

        // Check duplicate email
        const existing = await db.getAsync('SELECT id FROM accounts WHERE email = ?', [email]);
        if (existing)
            return res.status(409).json({ error: 'An account with this email already exists.' });

        // Get affiliation id
        let affil_id = null;
        if (affiliation) {
            const affil = await db.getAsync('SELECT id FROM affiliations WHERE value = ?', [affiliation]);
            if (affil) affil_id = affil.id;
        }

        // Create user record
        const userResult = await db.runAsync(
            `INSERT INTO users (full_name, age, affiliation_id, contact_email) VALUES (?, ?, ?, ?)`,
            [name, age || null, affil_id, email]
        );
        const userId = userResult.lastID;

        // Create account record (unverified)
        const passwordHash = hashPassword(password);
        await db.runAsync(
            `INSERT INTO accounts (user_id, email, password_hash, is_verified) VALUES (?, ?, ?, 0)`,
            [userId, email, passwordHash]
        );

        // Generate and store OTP
        const otp = generateOTP();
        await db.runAsync(
            `INSERT INTO otp_verifications (email, otp_code, expires_at) VALUES (?, ?, ?)`,
            [email, otp, otpExpiry()]
        );

        await sendOTPEmail(email, otp, name);

        res.json({ success: true, message: 'Account created. Check your email for the OTP verification code.' });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ─── POST /api/auth/verify-otp ────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp)
            return res.status(400).json({ error: 'Email and OTP are required.' });

        // Find latest unused OTP
        const record = await db.getAsync(
            `SELECT * FROM otp_verifications
             WHERE email = ? AND otp_code = ? AND used = 0
             ORDER BY id DESC LIMIT 1`,
            [email, otp]
        );

        if (!record)
            return res.status(400).json({ error: 'Invalid OTP. Please check your code or request a new one.' });

        if (new Date() > new Date(record.expires_at))
            return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });

        // Mark OTP as used
        await db.runAsync('UPDATE otp_verifications SET used = 1 WHERE id = ?', [record.id]);

        // Mark account as verified
        await db.runAsync('UPDATE accounts SET is_verified = 1 WHERE email = ?', [email]);

        res.json({ success: true, message: 'Email verified! You can now log in.' });
    } catch (err) {
        console.error('Verify OTP error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ─── POST /api/auth/resend-otp ────────────────────────────────────────────────
router.post('/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;

        const account = await db.getAsync('SELECT * FROM accounts WHERE email = ?', [email]);
        if (!account)
            return res.status(404).json({ error: 'No account found with this email.' });

        if (account.is_verified)
            return res.status(400).json({ error: 'This account is already verified.' });

        // Invalidate old OTPs
        await db.runAsync('UPDATE otp_verifications SET used = 1 WHERE email = ?', [email]);

        const otp = generateOTP();
        await db.runAsync(
            `INSERT INTO otp_verifications (email, otp_code, expires_at) VALUES (?, ?, ?)`,
            [email, otp, otpExpiry()]
        );

        const user = await db.getAsync('SELECT full_name FROM users WHERE contact_email = ?', [email]);
        await sendOTPEmail(email, otp, user ? user.full_name : 'User', 'reset');

        res.json({ success: true, message: 'A new OTP has been sent to your email.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            return res.status(400).json({ error: 'Email and password are required.' });

        // ── Check admin table first (username = email field for admin login) ──
        const adminAccount = await db.getAsync(
            'SELECT * FROM admins WHERE username = ?', [email]
        );
        if (adminAccount) {
            let valid = false;
            try { valid = verifyPassword(password, adminAccount.password_hash); } catch {}
            if (valid) {
                // Set admin session
                req.session.adminId       = adminAccount.id;
                req.session.adminUsername = adminAccount.username;
                req.session.adminFullname = adminAccount.full_name;
                req.session.is_superadmin = adminAccount.is_superadmin;
                return req.session.save((err) => {
                    if (err) return res.status(500).json({ error: 'Session error' });
                    return res.json({
                        success: true,
                        is_admin: true,
                        user: {
                            id: adminAccount.id,
                            name: adminAccount.full_name,
                            email: adminAccount.username,
                            is_superadmin: adminAccount.is_superadmin
                        }
                    });
                });
            }
        }

        // ── Regular user login ────────────────────────────────────────────────
        const account = await db.getAsync(
            `SELECT a.*, u.full_name, u.profile_photo, u.id AS user_id
             FROM accounts a JOIN users u ON u.id = a.user_id
             WHERE a.email = ?`, [email]
        );

        if (!account)
            return res.status(401).json({ error: 'Invalid email or password.' });

        if (!account.is_verified)
            return res.status(403).json({ error: 'Please verify your email before logging in.', needsVerification: true, email });

        // Check if user is blocked
        const userInfo = await db.getAsync('SELECT is_blocked FROM users WHERE id = ?', [account.user_id]);
        if (userInfo && userInfo.is_blocked) {
            return res.status(403).json({ error: 'Your account has been blocked. Please contact the administrator.' });
        }

        let valid = false;
        try { valid = verifyPassword(password, account.password_hash); } catch {}
        if (!valid)
            return res.status(401).json({ error: 'Invalid email or password.' });

        // Return user data (no session cookies needed; client stores in localStorage)
        res.json({
            success: true,
            is_admin: false,
            user: {
                id: account.user_id,
                name: account.full_name,
                email: account.email,
                profile_photo: account.profile_photo
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
    res.json({ success: true });
});

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        const account = await db.getAsync('SELECT * FROM accounts WHERE email = ?', [email]);
        if (!account)
            return res.status(404).json({ error: 'No account found with this email.' });

        // Invalidate old OTPs
        await db.runAsync('UPDATE otp_verifications SET used = 1 WHERE email = ?', [email]);

        const otp = generateOTP();
        await db.runAsync(
            `INSERT INTO otp_verifications (email, otp_code, expires_at) VALUES (?, ?, ?)`,
            [email, otp, otpExpiry()]
        );

        const user = await db.getAsync('SELECT full_name FROM users WHERE contact_email = ?', [email]);
        await sendOTPEmail(email, otp, user ? user.full_name : 'User', 'reset');

        res.json({ success: true, message: 'An OTP has been sent to your email to reset your password.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── POST /api/auth/reset-password ───────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, new_password } = req.body;

        if (!email || !otp || !new_password)
            return res.status(400).json({ error: 'All fields are required.' });

        const record = await db.getAsync(
            `SELECT * FROM otp_verifications WHERE email = ? AND otp_code = ? AND used = 0 ORDER BY id DESC LIMIT 1`,
            [email, otp]
        );

        if (!record) return res.status(400).json({ error: 'Invalid OTP.' });
        if (new Date() > new Date(record.expires_at))
            return res.status(400).json({ error: 'OTP has expired.' });

        await db.runAsync('UPDATE otp_verifications SET used = 1 WHERE id = ?', [record.id]);
        const newHash = hashPassword(new_password);
        await db.runAsync('UPDATE accounts SET password_hash = ? WHERE email = ?', [newHash, email]);

        res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;