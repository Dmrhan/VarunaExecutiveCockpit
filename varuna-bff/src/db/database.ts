import { IDbAdapter } from './adapter.interface';
import { SqliteAdapter } from './sqlite.adapter';
import { MssqlAdapter } from './mssql.adapter';

let adapter: IDbAdapter;

/**
 * getDb — Factory that returns the singleton instance of the database adapter.
 * Controlled by process.env.DB_DRIVER ('sqlite' | 'mssql').
 */
export function getDb(): IDbAdapter {
    if (!adapter) {
        const driver = (process.env.DB_DRIVER || 'sqlite').toLowerCase();

        if (driver === 'mssql') {
            adapter = new MssqlAdapter();
        } else {
            adapter = new SqliteAdapter();
        }
    }
    return adapter;
}

// Allow running directly for migration: `npx ts-node src/db/database.ts`
if (require.main === module) {
    const db = getDb();
    // Use the abstraction's query method for a smoke test
    const tables = db.query<{ name: string }>(
        db.driver === 'mssql'
            ? "SELECT name FROM sys.objects WHERE type = 'U' ORDER BY name"
            : "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    console.log(`[DB:${db.driver.toUpperCase()}] Tables found:`, tables.map(t => t.name).join(', '));
    process.exit(0);
}
