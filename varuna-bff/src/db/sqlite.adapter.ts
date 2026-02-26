import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { IDbAdapter, IDbResult } from './adapter.interface';

const DB_PATH = path.join(__dirname, '../../varuna.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

export class SqliteAdapter implements IDbAdapter {
    readonly driver = 'sqlite' as const;
    private db: Database.Database;

    constructor() {
        this.db = new Database(DB_PATH);
        this.db.pragma('journal_mode = WAL');
        this.db.pragma('foreign_keys = ON');
        this._applySchema();
        console.log('[DB:SQLite] Connected. Path:', DB_PATH);
    }

    private _applySchema(): void {
        const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
        this.db.exec(schema);
        console.log('[DB:SQLite] Schema applied.');
    }

    query<T = any>(sql: string, params: any[] | Record<string, any> = []): T[] {
        return this.db.prepare(sql).all(params) as T[];
    }

    queryOne<T = any>(sql: string, params: any[] | Record<string, any> = []): T | undefined {
        return this.db.prepare(sql).get(params) as T | undefined;
    }

    execute(sql: string, params: any[] | Record<string, any> = []): IDbResult {
        const result = this.db.prepare(sql).run(params);
        return {
            changes: result.changes,
            lastInsertRowid: result.lastInsertRowid,
        };
    }

    transaction<T>(fn: () => T): T {
        return this.db.transaction(fn)() as T;
    }

    prepare(sql: string): any {
        const stmt = this.db.prepare(sql);
        return {
            all: (...params: any[]) => {
                const p = params.length === 1 && (Array.isArray(params[0]) || typeof params[0] === 'object') ? params[0] : params;
                return stmt.all(p);
            },
            get: (...params: any[]) => {
                const p = params.length === 1 && (Array.isArray(params[0]) || typeof params[0] === 'object') ? params[0] : params;
                return stmt.get(p);
            },
            run: (...params: any[]) => {
                const p = params.length === 1 && (Array.isArray(params[0]) || typeof params[0] === 'object') ? params[0] : params;
                const result = stmt.run(p);
                return {
                    changes: result.changes,
                    lastInsertRowid: result.lastInsertRowid,
                };
            }
        };
    }

    /** Expose raw db for routes that still need prepare() directly (legacy compat). */
    getRawDb(): Database.Database {
        return this.db;
    }
}
