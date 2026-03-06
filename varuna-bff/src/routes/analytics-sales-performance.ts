import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

// GET /api/analytics/sales-performance/dashboard
// Calculates Won Revenue based on CrmOrderProducts for 'Closed' (1) orders, grouped by Person.
router.get('/dashboard', (req: Request, res: Response) => {
    const db = getDb();

    let whereClauses = ['o.Status = 1']; // Strict closed order requirement
    const params: any = {};

    // Standardize optional Company ID filter. We can fallback to user's test value if needed, 
    // but better to allow frontend to pass it dynamically.
    if (req.query.companyId) {
        whereClauses.push('o.CompanyId = @companyId');
        params.companyId = req.query.companyId;
    } else {
        // Fallback or explicit filter if no tenant provided 
        // Note: The user provided specifically '4f1687e4-f282-4601-a3cc-ef612e00c3e4'
        whereClauses.push("o.CompanyId = '4f1687e4-f282-4601-a3cc-ef612e00c3e4'");
    }

    if (req.query.from) {
        whereClauses.push('o.CreateOrderDate >= @from');
        params.from = req.query.from;
    }

    if (req.query.to) {
        whereClauses.push('o.CreateOrderDate <= @to');
        params.to = req.query.to;
    }

    if (req.query.ownerId) {
        whereClauses.push('o.ProposalOwnerId = @ownerId');
        params.ownerId = req.query.ownerId;
    }

    if (req.query.teamId) {
        const teamIds = String(req.query.teamId).split(',');
        const placeholders = teamIds.map((_, i) => `@teamId${i}`).join(',');
        whereClauses.push(`o.ProposalOwnerId IN (SELECT PersonId FROM TeamMember WHERE TeamId IN (${placeholders}))`);
        teamIds.forEach((id, i) => params[`teamId${i}`] = id);
    }

    const whereString = 'WHERE ' + whereClauses.join(' AND ');

    // Query formulation mapping precisely to:
    // SELECT per.Id AS PersonId, per.Name, per.SurName, SUM(ISNULL(p.Total_Amount,0)) AS TotalAmount
    // FROM dbo.CrmOrderProducts p INNER JOIN dbo.CrmOrder o ON p.CrmOrderId = o.Id INNER JOIN dbo.Person per ON o.ProposalOwnerId = per.Id ...
    // Note: Converted ISNULL to standard COALESCE for cross-DB (SQLite/MSSQL) safety.
    const querySql = `
        SELECT 
            per.Id AS PersonId,
            per.Name,
            per.SurName,
            COUNT(DISTINCT o.Id) AS WonDealsCount,
            SUM(COALESCE(p.Total_Amount, 0)) AS TotalAmount
        FROM CrmOrderProducts p 
        INNER JOIN CrmOrder o ON p.CrmOrderId = o.Id
        INNER JOIN Person per ON o.ProposalOwnerId = per.Id
        ${whereString}
        GROUP BY 
            per.Id,
            per.Name,
            per.SurName
        ORDER BY 
            TotalAmount DESC
    `;

    try {
        const rows = db.query(querySql, params) as any[];
        return res.json({ value: rows });
    } catch (error) {
        console.error("Error fetching order dashboard analytics", error);
        return res.status(500).json({ error: "Failed to fetch order dashboard analytics" });
    }
});

export default router;
