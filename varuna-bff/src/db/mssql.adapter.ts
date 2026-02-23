import * as mssql from 'mssql';
import { IDbAdapter, IDbResult } from './adapter.interface';

/**
 * MssqlAdapter — wraps the `mssql` package with a synchronous-style interface
 * using `deasync` so route files don't need to be converted to async/await.
 *
 * Required env variables:
 *   MSSQL_SERVER, MSSQL_DATABASE, MSSQL_USER, MSSQL_PASSWORD
 * Optional:
 *   MSSQL_PORT (default: 1433), MSSQL_ENCRYPT (default: true), MSSQL_TRUST_CERT (default: false)
 */

// deasync turns a Promise into a synchronous call
// eslint-disable-next-line @typescript-eslint/no-var-requires
const deasync = require('deasync');

function runSync<T>(promise: Promise<T>): T {
    let done = false;
    let result: T;
    let error: any;

    promise
        .then((r) => { result = r; done = true; })
        .catch((e) => { error = e; done = true; });

    // Spin the event loop until done
    deasync.loopWhile(() => !done);

    if (error) throw error;
    return result!;
}

function buildConfig(): mssql.config {
    return {
        server: process.env.MSSQL_SERVER || 'localhost',
        database: process.env.MSSQL_DATABASE || 'VarunaDB',
        user: process.env.MSSQL_USER,
        password: process.env.MSSQL_PASSWORD,
        port: parseInt(process.env.MSSQL_PORT || '1433', 10),
        options: {
            encrypt: process.env.MSSQL_ENCRYPT !== 'false',
            trustServerCertificate: process.env.MSSQL_TRUST_CERT === 'true',
        },
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000,
        },
    };
}

export class MssqlAdapter implements IDbAdapter {
    readonly driver = 'mssql' as const;
    private pool: mssql.ConnectionPool;

    constructor() {
        const config = buildConfig();
        this.pool = runSync(new mssql.ConnectionPool(config).connect());
        console.log(
            `[DB:MSSQL] Connected → ${config.server}/${config.database}`
        );
        this._applySchema();
    }

    private _applySchema(): void {
        const fs = require('fs');
        const path = require('path');
        const schemaPath = path.join(__dirname, 'schema.mssql.sql');
        if (!fs.existsSync(schemaPath)) {
            console.warn('[DB:MSSQL] schema.mssql.sql not found — skipping schema apply.');
            return;
        }
        const sql = fs.readFileSync(schemaPath, 'utf-8');
        // Split on GO statements (T-SQL batch separator)
        const batches = sql.split(/^\s*GO\s*$/im).filter((b: string) => b.trim());
        for (const batch of batches) {
            runSync(this.pool.request().query(batch));
        }
        console.log('[DB:MSSQL] Schema applied.');
    }

    /** Convert positional ? params to @p0, @p1, ... and bind them. */
    private _buildRequest(sql: string, params: any[]): { sql: string; request: mssql.Request } {
        let idx = 0;
        const request = this.pool.request();
        const paramSql = sql.replace(/\?/g, () => {
            const name = `p${idx}`;
            request.input(name, params[idx]);
            idx++;
            return `@${name}`;
        });
        return { sql: paramSql, request };
    }

    query<T = any>(sql: string, params: any[] = []): T[] {
        const { sql: paramSql, request } = this._buildRequest(sql, params);
        const result = runSync(request.query<T>(paramSql));
        return result.recordset;
    }

    queryOne<T = any>(sql: string, params: any[] = []): T | undefined {
        const rows = this.query<T>(sql, params);
        return rows[0];
    }

    execute(sql: string, params: any[] = []): IDbResult {
        const { sql: paramSql, request } = this._buildRequest(sql, params);
        const result = runSync(request.query(paramSql));
        return {
            changes: result.rowsAffected?.[0] ?? 0,
        };
    }

    transaction<T>(fn: () => T): T {
        const tx = new mssql.Transaction(this.pool);
        runSync(tx.begin());
        try {
            const result = fn();
            runSync(tx.commit());
            return result;
        } catch (err) {
            runSync(tx.rollback());
            throw err;
        }
    }

    /** Expose the connection pool for advanced use cases. */
    getPool(): mssql.ConnectionPool {
        return this.pool;
    }
}
