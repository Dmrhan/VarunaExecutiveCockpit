import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

// ============================================================================
// Person Analytics - Headcount & Demographics
// ============================================================================
router.get('/headcount', (_req: Request, res: Response) => {
    try {
        const db = getDb();

        const activeCount = (db.queryOne(`SELECT COUNT(*) as n FROM Person WHERE Status = 1`) as { n: number }).n;
        const inactiveCount = (db.queryOne(`SELECT COUNT(*) as n FROM Person WHERE Status = 2`) as { n: number }).n;

        const byRole = db.query(`SELECT RoleId, COUNT(*) as count FROM Person WHERE Status = 1 AND RoleId IS NOT NULL GROUP BY RoleId`);
        const byDealer = db.query(`SELECT DealerId, COUNT(*) as count FROM Person WHERE Status = 1 AND DealerId IS NOT NULL GROUP BY DealerId`);
        const byCompany = db.query(`SELECT CompanyId, COUNT(*) as count FROM Person WHERE Status = 1 AND CompanyId IS NOT NULL GROUP BY CompanyId`);

        const ageExpr = db.driver === 'mssql' ? 'DATEDIFF(day, BirthDate, GETUTCDATE())' : "(julianday('now') - julianday(BirthDate))";
        const avgAge = db.queryOne(`SELECT AVG(CAST(${ageExpr} AS FLOAT) / 365.25) as a FROM Person WHERE BirthDate IS NOT NULL AND Status = 1`) as { a: number };

        // Employment duration (Active only)
        const employmentExpr = db.driver === 'mssql' ? 'DATEDIFF(day, EmploymentDate, GETUTCDATE())' : "(julianday('now') - julianday(EmploymentDate))";
        const avgDuration = db.queryOne(`SELECT AVG(CAST(${employmentExpr} AS FLOAT) / 365.25) as a FROM Person WHERE EmploymentDate IS NOT NULL AND Status = 1`) as { a: number };

        res.json({
            activePersonnelCount: activeCount,
            inactivePersonnelCount: inactiveCount,
            headcountByRole: byRole,
            headcountByDealer: byDealer,
            headcountByCompany: byCompany,
            averageAgeYears: avgAge.a ? Number(avgAge.a.toFixed(1)) : 0,
            averageEmploymentDurationYears: avgDuration.a ? Number(avgDuration.a.toFixed(1)) : 0
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// ============================================================================
// Person Analytics - Manager Distribution
// ============================================================================
router.get('/managers', (_req: Request, res: Response) => {
    try {
        const db = getDb();
        const distribution = db.query(`SELECT ManagerType, COUNT(*) as count FROM Person WHERE Status = 1 AND ManagerType IS NOT NULL GROUP BY ManagerType`);
        res.json({ distribution });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// ============================================================================
// Person Analytics - Time Intelligence (Hiring & Attrition)
// ============================================================================
router.get('/trends', (_req: Request, res: Response) => {
    try {
        const db = getDb();

        const monthExprHire = db.driver === 'mssql' ? 'LEFT(EmploymentDate, 7)' : "strftime('%Y-%m', EmploymentDate)";
        const hiring = db.query(`
            SELECT ${monthExprHire} as month, COUNT(*) as count 
            FROM Person 
            WHERE EmploymentDate IS NOT NULL 
            GROUP BY ${monthExprHire} 
            ORDER BY month DESC 
            ${db.driver === 'mssql' ? 'OFFSET 0 ROWS FETCH NEXT 12 ROWS ONLY' : 'LIMIT 12'}
        `);

        const monthExprAttr = db.driver === 'mssql' ? 'LEFT(EndOfEmploymentDate, 7)' : "strftime('%Y-%m', EndOfEmploymentDate)";
        const attrition = db.query(`
            SELECT ${monthExprAttr} as month, COUNT(*) as count 
            FROM Person 
            WHERE EndOfEmploymentDate IS NOT NULL 
            GROUP BY ${monthExprAttr} 
            ORDER BY month DESC 
            ${db.driver === 'mssql' ? 'OFFSET 0 ROWS FETCH NEXT 12 ROWS ONLY' : 'LIMIT 12'}
        `);

        res.json({
            hiringTrend: hiring,
            attritionTrend: attrition
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
