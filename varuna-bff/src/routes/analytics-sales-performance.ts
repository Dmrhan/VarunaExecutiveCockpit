import { Router, Request, Response } from 'express';
import { getDb } from '../../db/database';

const router = Router();

// GET /api/analytics/contract/dashboard
// Calculates Won Revenue based on CrmOrderProducts for 'Closed' (1) orders, grouped by Owner.
router.get('/dashboard', (req: Request, res: Response) => {
    const db = getDb();

    let whereClauses = ['o.Status = 1']; // Only Closed orders (revenue realized)
    const params: any = {};

    if (req.query.from) {
        whereClauses.push('o.CreateOrderDate >= @from');
        params.from = req.query.from;
    }

    if (req.query.to) {
        whereClauses.push('o.CreateOrderDate <= @to');
        params.to = req.query.to;
    }

    const whereString = 'WHERE ' + whereClauses.join(' AND ');

    // Join CrmOrder with CrmOrderProducts to get real product revenue, and Person for owner info.
    const querySql = `
        SELECT 
            o.ProposalOwnerId AS OwnerId,
            p.PersonNameSurname AS OwnerName,
            COUNT(DISTINCT o.Id) AS WonDealsCount,
            SUM(cop.Total_Amount) AS TotalRevenue
        FROM CrmOrder o
        INNER JOIN CrmOrderProducts cop ON o.Id = cop.CrmOrderId
        LEFT JOIN Person p ON o.ProposalOwnerId = p.Id
        ${whereString}
        GROUP BY o.ProposalOwnerId, p.PersonNameSurname
        ORDER BY TotalRevenue DESC
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
