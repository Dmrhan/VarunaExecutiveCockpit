import { IDbAdapter, IDbResult } from './adapter.interface';

/**
 * MssqlAdapter — wraps the `mssql` package with a synchronous-style interface
 * using `deasync` so route files don't need to be converted to async/await.
 *
 * Required env variables:
 *   MSSQL_SERVER, MSSQL_DATABASE, MSSQL_USER, MSSQL_PASSWORD
 * Optional:
 *   MSSQL_PORT (default: 1433), MSSQL_ENCRYPT (default: true), MSSQL_TRUST_CERT (default: false)
 *
 * NOTE: mssql is loaded with require() to avoid @types/mssql dependency issues.
 */

/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
const mssql = require('mssql');
const deasync = require('deasync');

function runSync<T>(promise: Promise<T>): T {
    let done = false;
    let result: any;
    let error: any;

    promise
        .then((r: any) => { result = r; done = true; })
        .catch((e: any) => { error = e; done = true; });

    deasync.loopWhile(() => !done);

    if (error) throw error;
    return result as T;
}

function buildConfig(): any {
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
        pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
    };
}

export class MssqlAdapter implements IDbAdapter {
    readonly driver = 'mssql' as const;
    private pool: any;
    private _currentTransaction: any = null;

    constructor() {
        const config = buildConfig();
        this.pool = runSync(new mssql.ConnectionPool(config).connect());
        console.log(`[DB:MSSQL] Connected → ${config.server}/${config.database}`);
        this._applySchema();
        this._applySeed();
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
        const batches = sql.split(/^\s*GO\s*$/im).filter((b: string) => b.trim());
        for (const batch of batches) {
            runSync(this.pool.request().query(batch));
        }
        console.log('[DB:MSSQL] Schema applied.');
    }

    private _applySeed(): void {
        const fs = require('fs');
        const path = require('path');
        const seedPath = path.join(__dirname, 'seed_enums.mssql.sql');
        if (!fs.existsSync(seedPath)) {
            // Seeding is optional but recommended
            return;
        }
        const sql = fs.readFileSync(seedPath, 'utf-8');
        // MSSQL can handle multiple inserts, but let's be safe and split if there are GO markers
        const batches = sql.split(/^\s*GO\s*$/im).filter((b: string) => b.trim());
        for (const batch of batches) {
            runSync(this.pool.request().query(batch));
        }
        console.log('[DB:MSSQL] Seed data applied.');
    }

    private _buildRequest(sql: string, params: any[] | Record<string, any>): { sql: string; request: any } {
        const request = this._currentTransaction ? this._currentTransaction.request() : this.pool.request();
        let paramSql = sql;

        if (Array.isArray(params)) {
            let idx = 0;
            paramSql = sql.replace(/\?/g, () => {
                const name = `p${idx}`;
                request.input(name, params[idx]);
                idx++;
                return `@${name}`;
            });
        } else {
            // Named parameters: @name or :name or $name (common in SQLite)
            // SQL Server uses @name natively.
            for (const [key, value] of Object.entries(params)) {
                request.input(key, value);
            }
            // Optional: convert :param and $param to @param if routes use them
            paramSql = sql.replace(/[:$](\w+)/g, '@$1');
        }
        return { sql: paramSql, request };
    }

    query<T = any>(sql: string, params: any[] | Record<string, any> = []): T[] {
        const { sql: paramSql, request } = this._buildRequest(sql, params);
        const result: any = runSync(request.query(paramSql));
        return result.recordset as T[];
    }

    queryOne<T = any>(sql: string, params: any[] | Record<string, any> = []): T | undefined {
        const rows = this.query<T>(sql, params);
        return rows[0];
    }

    execute(sql: string, params: any[] | Record<string, any> = []): IDbResult {
        const { sql: paramSql, request } = this._buildRequest(sql, params);
        const result: any = runSync(request.query(paramSql));
        return {
            changes: result.rowsAffected?.[0] ?? 0,
        };
    }

    transaction<T>(fn: () => T): T {
        if (this._currentTransaction) {
            // Nested transactions not supported in this simple wrapper
            return fn();
        }

        const tx = new mssql.Transaction(this.pool);
        runSync(tx.begin());
        this._currentTransaction = tx;
        try {
            const result = fn();
            runSync(tx.commit());
            return result;
        } catch (err) {
            runSync(tx.rollback());
            throw err;
        } finally {
            this._currentTransaction = null;
        }
    }

    prepare(sql: string): any {
        // Return a wrapper that matches better-sqlite3 Statement interface
        return {
            all: (...params: any[]) => {
                const p = params.length === 1 && (Array.isArray(params[0]) || typeof params[0] === 'object') ? params[0] : params;
                return this.query(sql, p);
            },
            get: (...params: any[]) => {
                const p = params.length === 1 && (Array.isArray(params[0]) || typeof params[0] === 'object') ? params[0] : params;
                return this.queryOne(sql, p);
            },
            run: (...params: any[]) => {
                const p = params.length === 1 && (Array.isArray(params[0]) || typeof params[0] === 'object') ? params[0] : params;
                return this.execute(sql, p);
            }
        };
    }

    getPool(): any {
        return this.pool;
    }
}
