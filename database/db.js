/**
 * B.A.L.I.K. Merged Database
 * Single SQLite DB for both user and admin dashboards.
 */

const sqlite3 = require('sqlite3').verbose();
const path    = require('path');
const crypto  = require('crypto');

const DB_PATH = path.join(__dirname, 'balik.db');
const db      = new sqlite3.Database(DB_PATH);

db.runAsync = (sql, params = []) => new Promise((res, rej) => {
    db.run(sql, params, function (err) {
        if (err) rej(err);
        else res({ lastID: this.lastID, changes: this.changes });
    });
});
db.getAsync = (sql, params = []) => new Promise((res, rej) => {
    db.get(sql, params, (err, row) => err ? rej(err) : res(row));
});
db.allAsync = (sql, params = []) => new Promise((res, rej) => {
    db.all(sql, params, (err, rows) => err ? rej(err) : res(rows));
});

async function init() {
    await db.runAsync('PRAGMA foreign_keys = ON');
    await db.runAsync('PRAGMA journal_mode = WAL');

    const tables = [
        `CREATE TABLE IF NOT EXISTS affiliations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            value TEXT NOT NULL UNIQUE, label TEXT NOT NULL, sort_order INTEGER DEFAULT 0
        )`,
        `CREATE TABLE IF NOT EXISTS programs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            label TEXT NOT NULL UNIQUE, sort_order INTEGER DEFAULT 0
        )`,
        `CREATE TABLE IF NOT EXISTS departments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            label TEXT NOT NULL UNIQUE, sort_order INTEGER DEFAULT 0
        )`,
        `CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            label TEXT NOT NULL UNIQUE, sort_order INTEGER DEFAULT 0
        )`,
        `CREATE TABLE IF NOT EXISTS locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            label TEXT NOT NULL UNIQUE, has_rooms INTEGER DEFAULT 1, sort_order INTEGER DEFAULT 0
        )`,
        `CREATE TABLE IF NOT EXISTS rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
            label TEXT NOT NULL, sort_order INTEGER DEFAULT 0
        )`,
        `CREATE TABLE IF NOT EXISTS offices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            label TEXT NOT NULL UNIQUE, sort_order INTEGER DEFAULT 0
        )`,
        `CREATE TABLE IF NOT EXISTS sections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            year INTEGER NOT NULL, label TEXT NOT NULL, sort_order INTEGER DEFAULT 0
        )`,
        `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL, age INTEGER,
            affiliation_id INTEGER REFERENCES affiliations(id),
            extra_details TEXT, contact_email TEXT UNIQUE, contact_number TEXT,
            profile_photo TEXT, is_blocked INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        )`,
        `CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
            is_verified INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now'))
        )`,
        `CREATE TABLE IF NOT EXISTS otp_verifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL, otp_code TEXT NOT NULL,
            expires_at TEXT NOT NULL, used INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        )`,
        `CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            report_type TEXT NOT NULL CHECK(report_type IN ('lost','found')),
            status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','pending','resolved')),
            reporter_id INTEGER REFERENCES users(id),
            item_name TEXT NOT NULL,
            category_id INTEGER REFERENCES categories(id),
            description TEXT, photo TEXT,
            incident_date TEXT NOT NULL, incident_time TEXT,
            location_id INTEGER REFERENCES locations(id),
            room_id INTEGER REFERENCES rooms(id),
            turned_over INTEGER DEFAULT 0,
            office_id INTEGER REFERENCES offices(id),
            turnover_date TEXT, turnover_time TEXT,
            ready_to_claim INTEGER DEFAULT 0,
            is_archived INTEGER DEFAULT 0,
            archived_at TEXT,
            verification_status TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        )`,
        `CREATE TABLE IF NOT EXISTS claims (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            report_id INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
            claimant_id INTEGER REFERENCES users(id),
            claim_status TEXT NOT NULL DEFAULT 'pending' CHECK(claim_status IN ('pending','approved','rejected')),
            message TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        )`,
        // Admin tables
        `CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            full_name TEXT,
            is_superadmin INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        )`,
        `CREATE TABLE IF NOT EXISTS activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            admin_id INTEGER REFERENCES admins(id),
            action_type TEXT NOT NULL, description TEXT, ip_address TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        )`,
        `CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            type TEXT, title TEXT, message TEXT, link TEXT,
            is_read INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        )`,
    ];

    for (const sql of tables) await db.runAsync(sql);

    // Migration: add missing columns to existing DBs
    const migrations = [
        'ALTER TABLE reports ADD COLUMN ready_to_claim INTEGER DEFAULT 0',
        'ALTER TABLE reports ADD COLUMN is_archived INTEGER DEFAULT 0',
        'ALTER TABLE reports ADD COLUMN archived_at TEXT',
        'ALTER TABLE reports ADD COLUMN verification_status TEXT',
        'ALTER TABLE reports ADD COLUMN verified_at TEXT',
        'ALTER TABLE reports ADD COLUMN verified_by_admin_id INTEGER',
        'ALTER TABLE reports ADD COLUMN declined_at TEXT',
        'ALTER TABLE reports ADD COLUMN declined_by_admin_id INTEGER',
        'ALTER TABLE admins ADD COLUMN is_superadmin INTEGER DEFAULT 0',
        'ALTER TABLE users ADD COLUMN is_blocked INTEGER DEFAULT 0',
        'ALTER TABLE notifications ADD COLUMN user_id INTEGER REFERENCES users(id)',
    ];
    for (const m of migrations) {
        try { await db.runAsync(m); } catch(e){}
    }

    await seed();
    console.log('✅ Database ready:', DB_PATH);
}

async function seedTable(table, rows, columns) {
    const row = await db.getAsync(`SELECT COUNT(*) AS c FROM ${table}`);
    if (row.c > 0) return;
    const ph   = columns.map(() => '?').join(', ');
    const stmt = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${ph})`;
    for (const r of rows) await db.runAsync(stmt, r);
    console.log(`  ✔ Seeded: ${table}`);
}

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

async function seed() {
    await seedTable('affiliations', [
        ['student','Student',1],['faculty','Faculty',2],['non-teaching','Non-Teaching Staff',3],
        ['security','Security Personnel',4],['maintenance','Maintenance Personnel',5],
        ['visitor','Visitor',6],['external','Externals',7],
    ], ['value','label','sort_order']);

    await seedTable('programs', [
        ['BS Information Technology',1],['BS Data Science',2],['BS Hospitality Management',3],
        ['BS Tourism Management',4],['Bachelor of Elementary Education',5],
        ['Bachelor of Secondary Education',6],['BS Business Administration',7],
        ['BS Entrepreneurship',8],['Bachelor of Industrial Technology',9],
    ], ['label','sort_order']);

    await seedTable('departments', [
        ['ITDS Department',1],['HTM Department',2],['GATE Department',3],['BindTech Department',4],
    ], ['label','sort_order']);

    await seedTable('categories', [
        ['Electronics',1],['Documents / IDs',2],['Wallets & Cash',3],['Bags & Luggage',4],
        ['Clothing & Accessories',5],['Jewelry & Valuables',6],['School Supplies',7],
        ['Books & Notebooks',8],['Keys',9],['Water Bottles & Food Containers',10],
        ['Sports Equipment',11],['Personal Care Items',12],['Medical Items',13],
        ['Umbrellas',14],['Miscellaneous',15],
    ], ['label','sort_order']);

    await seedTable('locations', [
        ['Building A',1,1],['Building B',1,2],['Building C',1,3],['Building D',1,4],
        ['Building E',1,5],['Fil Chi 2',1,6],['New Building',0,7],['Activity Center',0,8],
        ['Octagon Study Area',0,9],['Clinic',0,10],['Garden',0,11],
    ], ['label','has_rooms','sort_order']);

    const roomCount = await db.getAsync('SELECT COUNT(*) AS c FROM rooms');
    if (roomCount.c === 0) {
        const roomData = {
            'Building A': ["Ground Floor","ROTC Office","Room 112A","DHTM Faculty","Coffee stall (Brewlsu)","Canteen","Room 214","Gender and Development Office","Room 213 Sea Laboratory","Campus Research Development Unit","Room 215","Room 216","Room 217","IoT Room 314","Business Hub","Student Government Office","Student Publication Office (Laurel)","Room 312","Room 313"],
            'Building B': ["Women's Restroom","Room 101","Business Administration Faculty","Registrar","Admission Office","Guidance Office","Cashier","Office of the College Secretary","Room 201","ITDS Department Faculty","Room 203","Room 204","Room 205","Room 206","Library","Room 303","Room 304","MIS Office","Room 306"],
            'Building C': ["Room 107","Room 108","Room 109","Room 110","Room 111","Room 207","Room 208","Room 209","Room 210","Room 201","Gate Department Faculty","Study Area","Room 307","Room 308","Room 309","Soc Hall 3","Soc Hall 2","Soc Hall 1"],
            'Building D': ["Restroom","Study Area","Room 101","Room 102","Room 201","Room 202"],
            'Building E': ["Ground Floor","Gymnasium","Room 101","Room 102","Room 103","Room 201","Room 202","Room 203"],
            'Fil Chi 2':  ["Room 101","Room 102"],
        };
        for (const [locLabel, rooms] of Object.entries(roomData)) {
            const loc = await db.getAsync('SELECT id FROM locations WHERE label = ?', [locLabel]);
            if (loc) {
                let i = 1;
                for (const r of rooms) await db.runAsync('INSERT INTO rooms (location_id, label, sort_order) VALUES (?, ?, ?)', [loc.id, r, i++]);
            }
        }
        console.log('  ✔ Seeded: rooms');
    }

    await seedTable('offices', [['Admin Office',1],['LSC Office',2]], ['label','sort_order']);

    const secCount = await db.getAsync('SELECT COUNT(*) AS c FROM sections');
    if (secCount.c === 0) {
        let i = 1;
        for (const yr of [1,2,3,4])
            for (const letter of ['A','B','C','D','E'])
                await db.runAsync('INSERT INTO sections (year, label, sort_order) VALUES (?, ?, ?)', [yr, `${yr}${letter}`, i++]);
        console.log('  ✔ Seeded: sections');
    }

    // Seed default superadmin account (password: admin123)
    const adminCount = await db.getAsync('SELECT COUNT(*) AS c FROM admins');
    if (adminCount.c === 0) {
        const hash = hashPassword('admin123');
        await db.runAsync('INSERT INTO admins (username, password_hash, full_name, is_superadmin) VALUES (?, ?, ?, ?)',
            ['admin', hash, 'Administrator', 1]);
        console.log('  ✔ Seeded: admins (admin / admin123)');
    }
}

init().catch(err => { console.error('❌ Database init failed:', err); process.exit(1); });

module.exports = db;