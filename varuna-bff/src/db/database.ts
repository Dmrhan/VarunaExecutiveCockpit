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
 * Returns the active adapter typed as `any` for backward compatibility.
 *
 * Sync routes (sync-*.ts) that call db.prepare() / db.transaction() directly
 * continue to work in SQLite mode without any changes. At runtime the adapter
 * transparently proxies these calls to better-sqlite3.
 *
 * New analytics routes should use getDbAdapter() to get the typed IDbAdapter.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getDb(): any {
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
