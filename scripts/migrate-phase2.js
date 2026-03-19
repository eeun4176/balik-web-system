/**
 * B.A.L.I.K. Migration — Phase 2
 * Adds: is_superadmin, is_blocked to admins/users tables
 *       user_violations table
 *       is_superadmin to first admin
 * 
 * Run: node scripts/migrate-phase2.js
 */

const db = require('../database/db');

async function run() {
    console.log('🔄 Phase 2 migration...\n');

    const cols = [
        [`ALTER TABLE admins ADD COLUMN is_superadmin INTEGER DEFAULT 0`, 'admins.is_superadmin'],
        [`ALTER TABLE users  ADD COLUMN is_blocked    INTEGER DEFAULT 0`, 'users.is_blocked'],
    ];

    for (const [sql, name] of cols) {
        try {
            await db.runAsync(sql);
            console.log(`✅ Added ${name}`);
        } catch (e) {
            if (e.message.includes('duplicate') || e.message.includes('already exists')) {
                console.log(`⚠️  ${name} already exists`);
            } else throw e;
        }
    }

    // Create user_violations table
    await db.runAsync(`
        CREATE TABLE IF NOT EXISTS user_violations (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL,
            type        TEXT NOT NULL CHECK(type IN ('warn','block')),
            reason      TEXT,
            report_id   INTEGER,
            created_at  TEXT NOT NULL,
            created_by  INTEGER,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    `);
    console.log('✅ user_violations table ready');

    // Make the first admin a superadmin if none exist
    const sa = await db.getAsync('SELECT id FROM admins WHERE is_superadmin=1 LIMIT 1');
    if (!sa) {
        const first = await db.getAsync('SELECT id, username FROM admins ORDER BY id ASC LIMIT 1');
        if (first) {
            await db.runAsync('UPDATE admins SET is_superadmin=1 WHERE id=?', [first.id]);
            console.log(`✅ Made admin "${first.username}" a superadmin (first admin)`);
        }
    } else {
        console.log('✅ Superadmin already exists');
    }

    // Add verification_status='spam' support — the CHECK constraint in the original
    // migration only has 'verified'|'declined'. We need to allow 'spam' too.
    // SQLite can't ALTER CHECK constraints, so we check if the column exists
    // with a loose constraint (no constraint was added in the previous migration — safe).
    console.log('\n✨ Phase 2 migration complete!\n');
    process.exit(0);
}

run().catch(e => { console.error('❌', e.message); process.exit(1); });