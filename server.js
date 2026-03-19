require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const multer  = require('multer');
const fs      = require('fs');
const session = require('express-session');

require('./database/db'); // initializes DB and seeds data

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session for admin
app.use(session({
    secret: process.env.SESSION_SECRET || 'balik-secret-key-2025',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000 } // 8 hours
    
}));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename:    (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random()*1e9) + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 5*1024*1024 },
    fileFilter: (req, file, cb) => file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Images only'))
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/lookup',  require('./routes/lookup'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/items',   require('./routes/items'));
app.use('/api/users',   require('./routes/users'));
app.use('/api/claims',  require('./routes/claims'));
app.use('/api/upload',  require('./routes/upload')(upload));

// Admin API (session-protected)
app.use('/api/admin',   require('./routes/admin'));

// ── Static files ──────────────────────────────────────────────────────────────
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.use(express.static(path.join(__dirname)));

// ── Serve client pages ────────────────────────────────────────────────────────
const clientDir = path.join(__dirname, 'client');
const clientPages = [
    'index.html','login_register.html','search.html','account.html',
    'report-lost-page.html','report-found-page.html','confirm-authentication.html',
    'verify-otp.html','about-us.html','faqs-help.html',
];

app.get('/', (req, res) => res.sendFile(path.join(clientDir, 'login_register.html')));
clientPages.forEach(page => {
    app.get(`/${page}`, (req, res) => res.sendFile(path.join(clientDir, page)));
});

// ── Admin pages (served from /admin/) ────────────────────────────────────────
const adminDir = path.join(__dirname, 'admin');
const adminPages = [
    'index.html','dashboard.html','claims.html','users.html',
    'reports.html','notifications.html','history.html','settings.html',
    'add-report.html','edit-report.html','view-report.html',
];
adminPages.forEach(page => {
    app.get(`/admin/${page}`, (req, res) => {
        const f = path.join(adminDir, page);
        if (fs.existsSync(f)) res.sendFile(f);
        else res.sendFile(path.join(adminDir, 'index.html'));
    });
});
app.get('/admin', (req, res) => res.sendFile(path.join(adminDir, 'index.html')));

// ── Chatbot proxy (Mistral) ───────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    const apiKey = process.env.MISTRAL_API_KEY || 'w6wS2RXI8f2I1IjbDB9FEaTR1PWCFayq';
    const agentId = process.env.AGENT_ID || 'ag_019c9025025775f792f2f5f444aec7b3';
    try {
        const response = await fetch('https://api.mistral.ai/v1/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ agent_id: agentId, inputs: [{ role: 'user', content: message }] })
        });
        const data = await response.json();
        let reply = '';
        if (data.outputs?.[0]?.content) reply = data.outputs[0].content;
        else if (data.choices?.[0]?.message) reply = data.choices[0].message.content;
        else reply = "I'm sorry, I couldn't process that request right now.";
        res.json({ reply });
    } catch (err) {
        console.error('Chat error:', err);
        res.status(500).json({ error: 'Chat service unavailable.' });
    }
});

app.listen(PORT, () => {
    console.log(`\n✅ B.A.L.I.K. running at http://localhost:${PORT}`);
    console.log(`   User Portal:  http://localhost:${PORT}/`);
    console.log(`   Admin Panel:  http://localhost:${PORT}/admin/\n`);
});
