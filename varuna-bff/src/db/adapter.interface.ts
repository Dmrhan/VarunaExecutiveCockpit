/**
 * IDbAdapter — Database-agnostic query interface.
 * Implemented by SqliteAdapter and MssqlAdapter.
 */
export interface IDbResult {
    changes: number;
    lastInsertRowid?: number | bigint | string;
}

export interface IDbAdapter {
    /**
     * Execute a SELECT and return all rows.
     * Use positional `?` placeholders shared by both drivers.
     */
    query<T = any>(sql: string, params?: any[]): T[];

    /**
     * Execute a SELECT and return the first row (or undefined).
     */
    queryOne<T = any>(sql: string, params?: any[]): T | undefined;

    /**
     * Execute an INSERT / UPDATE / DELETE statement.
     */
    execute(sql: string, params?: any[]): IDbResult;

    /**
     * Run multiple operations atomically.
     * The callback should use the adapter methods, NOT the raw driver.
     */
    transaction<T>(fn: () => T): T;

    /**
     * Driver name for diagnostics.
     */
    readonly driver: 'sqlite' | 'mssql';
}
