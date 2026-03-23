import { getDb } from './src/db/database';

async function run() {
    const db = getDb();
    try {
        if (db.driver === 'mssql') {
            const rows = db.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Opportunity'");
            console.log("MSSQL Columns:", rows.map((r: any) => r.COLUMN_NAME).filter((c: string) => c.includes('Closed')));
        } else {
            console.log("Not MSSQL driver. Driver is:", db.driver);
            const rows = db.query("PRAGMA table_info(Opportunity)");
            console.log("SQLite Columns:");
        }
    } catch (e) {
        console.error("Error:", e);
    }
    process.exit(0);
}

run();
