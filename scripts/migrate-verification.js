/**
 * B.A.L.I.K. Database Migration - Add Verification Columns
 * For SQLite - Run this ONCE to add verification tracking to reports table
 * 
 * Usage: node scripts/migrate-verification.js
 */

const db = require('../database/db');

async function runMigration() {
    try {
        console.log('🔄 Starting verification migration...\n');

        // Check if columns already exist by checking reports table structure
        try {
            // Try to query the verification_status column
            // If it exists, we'll get a result; if not, we'll get an error
            const existing = await db.getAsync(
                'SELECT verification_status FROM reports LIMIT 1'
            );
            console.log('✅ Verification columns already exist. No migration needed.');
            process.exit(0);
        } catch (err) {
            // Column doesn't exist, proceed with migration
        }

        // Add verification columns
        console.log('📝 Adding verification_status column...');
        try {
            await db.runAsync(`
                ALTER TABLE reports 
                ADD COLUMN verification_status TEXT DEFAULT NULL
            `);
            console.log('✅ Added verification_status column');
        } catch (err) {
            if (!err.message.includes('already exists')) throw err;
            console.log('⚠️  verification_status column already exists');
        }

        console.log('📝 Adding verified_at column...');
        try {
            await db.runAsync(`
                ALTER TABLE reports 
                ADD COLUMN verified_at TEXT DEFAULT NULL
            `);
            console.log('✅ Added verified_at column');
        } catch (err) {
            if (!err.message.includes('already exists')) throw err;
            console.log('⚠️  verified_at column already exists');
        }

        console.log('📝 Adding verified_by_admin_id column...');
        try {
            await db.runAsync(`
                ALTER TABLE reports 
                ADD COLUMN verified_by_admin_id INTEGER DEFAULT NULL
            `);
            console.log('✅ Added verified_by_admin_id column');
        } catch (err) {
            if (!err.message.includes('already exists')) throw err;
            console.log('⚠️  verified_by_admin_id column already exists');
        }

        console.log('📝 Adding declined_at column...');
        try {
            await db.runAsync(`
                ALTER TABLE reports 
                ADD COLUMN declined_at TEXT DEFAULT NULL
            `);
            console.log('✅ Added declined_at column');
        } catch (err) {
            if (!err.message.includes('already exists')) throw err;
            console.log('⚠️  declined_at column already exists');
        }

        console.log('📝 Adding declined_by_admin_id column...');
        try {
            await db.runAsync(`
                ALTER TABLE reports 
                ADD COLUMN declined_by_admin_id INTEGER DEFAULT NULL
            `);
            console.log('✅ Added declined_by_admin_id column');
        } catch (err) {
            if (!err.message.includes('already exists')) throw err;
            console.log('⚠️  declined_by_admin_id column already exists');
        }

        console.log('\n✨ Migration completed successfully!\n');
        process.exit(0);

    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        console.error('\nDetails:', err);
        process.exit(1);
    }
}

// Run the migration
runMigration();