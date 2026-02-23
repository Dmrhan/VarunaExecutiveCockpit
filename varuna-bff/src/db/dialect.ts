/**
 * SQL Dialect helpers — produce correct SQL fragments for the active driver.
 *
 * Usage:
 *   import { D } from '../db/dialect';
 *   sql`WHERE ${D.yearMonth('InvoiceDate')} = '2026-02'`
 */

const driver = (process.env.DB_DRIVER || 'sqlite').toLowerCase();
const isMssql = driver === 'mssql';

export const D = {
    /** Current UTC timestamp */
    now: () => isMssql ? 'GETUTCDATE()' : "datetime('now')",

    /** Format a date column as YYYY-MM */
    yearMonth: (col: string) =>
        isMssql ? `FORMAT(CAST(${col} AS DATE), 'yyyy-MM')` : `strftime('%Y-%m', ${col})`,

    /** Format a date column as YYYY */
    year: (col: string) =>
        isMssql ? `YEAR(${col})` : `strftime('%Y', ${col})`,

    /** Format a date column as YYYY-WW (ISO week) */
    yearWeek: (col: string) =>
        isMssql ? `FORMAT(${col}, 'yyyy-WW')` : `strftime('%Y-%W', ${col})`,

    /** Truncate to date (strip time) */
    toDate: (expr: string) =>
        isMssql ? `CAST(${expr} AS DATE)` : `date(${expr})`,

    /** Add/subtract days from an expression */
    dateAdd: (expr: string, days: number) =>
        isMssql
            ? `DATEADD(day, ${days}, ${expr})`
            : `date(${expr}, '${days > 0 ? '+' : ''}${days} days')`,

    /** Compare a date column to current date */
    today: () => isMssql ? 'CAST(GETUTCDATE() AS DATE)' : "date('now')",

    /**
     * UPSERT pattern snippet.
     * SQLite: "INSERT ... ON CONFLICT(Id) DO UPDATE SET ..."
     * MSSQL : "MERGE ... USING ... WHEN MATCHED / WHEN NOT MATCHED ..."
     * NOTE: For complex upserts, each adapter builds the SQL itself.
     *       This helper returns a simple string label for logging.
     */
    upsertStrategy: () => isMssql ? 'MERGE' : 'INSERT_OR_REPLACE',

    /** Active driver name */
    driver: driver as 'sqlite' | 'mssql',
} as const;
