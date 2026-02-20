import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../varuna.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db: Database.Database;

export function getDb(): Database.Database {
    if (!db) {
        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
        applySchema(db);
    }
    return db;
}

function applySchema(database: Database.Database): void {
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    database.exec(schema);
    console.log('[DB] Schema applied successfully. DB path:', DB_PATH);
}

// Allow running directly for migration: `npx ts-node src/db/database.ts`
if (require.main === module) {
    const database = getDb();
    const tables = database.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).all() as { name: string }[];
    console.log('[DB] Tables created:', tables.map(t => t.name).join(', '));
    process.exit(0);
}
