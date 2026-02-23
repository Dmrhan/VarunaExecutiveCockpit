import { IDbAdapter } from './adapter.interface';
import { SqliteAdapter } from './sqlite.adapter';

let _adapter: IDbAdapter | null = null;

/**
 * Returns the active DB adapter based on the DB_DRIVER env variable.
 *   DB_DRIVER=sqlite  (default) — uses better-sqlite3
 *   DB_DRIVER=mssql             — uses mssql + deasync
 */
export function getDbAdapter(): IDbAdapter {
    if (!_adapter) {
        const driver = (process.env.DB_DRIVER || 'sqlite').toLowerCase();
        console.log(`[DB] Initializing adapter: ${driver}`);

        if (driver === 'mssql') {
            const { MssqlAdapter } = require('./mssql.adapter');
            _adapter = new MssqlAdapter();
        } else {
            const { SqliteAdapter } = require('./sqlite.adapter');
            _adapter = new SqliteAdapter();
        }
    }
    return _adapter!;
}

/**
 * Alias kept for backward compatibility.
 * All existing route files that call `getDb()` will still work,
 * but they receive the adapter instead of the raw better-sqlite3 instance.
 *
 * NOTE: Sync routes that call db.prepare() directly must be updated
 *       to use adapter.query() / adapter.execute() / adapter.transaction().
 *       For now, SqliteAdapter.getRawDb() provides the old interface during migration.
 */
export function getDb(): IDbAdapter {
    return getDbAdapter();
}

/**
 * Returns the raw better-sqlite3 Database instance.
 * ONLY valid when DB_DRIVER=sqlite.
 * Used by sync/* routes that still call db.prepare().run() directly.
 * On MSSQL these routes should be migrated to use adapter.execute() instead.
 */
export function getRawSqliteDb(): import('better-sqlite3').Database {
    const adapter = getDbAdapter();
    if (adapter.driver !== 'sqlite') {
        throw new Error(
            '[DB] getRawSqliteDb() is only available in SQLite mode. ' +
            'Migrate the calling route to use adapter.execute() / adapter.query().'
        );
    }
    return (adapter as SqliteAdapter).getRawDb();
}

// Allow running directly for diagnostics:  npx ts-node src/db/database.ts
if (require.main === module) {
    const adapter = getDbAdapter();
    console.log(`[DB] Driver: ${adapter.driver}`);
    if (adapter.driver === 'sqlite') {
        const rows = adapter.query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
        console.log('[DB] Tables:', rows.map((r: any) => r.name).join(', '));
    } else {
        console.log('[DB] MSSQL connected.');
    }
    process.exit(0);
}
