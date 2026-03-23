import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

function buildFilters(req: Request) {
    const whereClauses = ['o.DealStatus = 0']; // "0" represents Open status
    const params: any = {};

    if (req.query.companyId) {
        whereClauses.push('o.CompanyId = @companyId');
        params.companyId = req.query.companyId;
    }

    if (req.query.from) {
        whereClauses.push('o.FirstCreatedDate >= @from');
        params.from = req.query.from;
    }

    if (req.query.to) {
        whereClauses.push('o.FirstCreatedDate <= @to');
        params.to = req.query.to;
    }

    if (req.query.asOfDate) {
        whereClauses.push('o.FirstCreatedDate <= @asOfDate');
        params.asOfDate = req.query.asOfDate;
    }

    if (req.query.ownerId) {
        const ownerIds = String(req.query.ownerId).split(',');
        const placeholders = ownerIds.map((_, i) => `@ownerId${i}`).join(',');
        whereClauses.push(`o.OwnerId IN (${placeholders})`);
        ownerIds.forEach((id, i) => params[`ownerId${i}`] = id);
    }

    if (req.query.teamId) {
        const teamIds = String(req.query.teamId).split(',');
        const placeholders = teamIds.map((_, i) => `@teamId${i}`).join(',');
        whereClauses.push(`o.OwnerId IN (SELECT PersonId FROM TeamMember WHERE TeamId IN (${placeholders}))`);
        teamIds.forEach((id, i) => params[`teamId${i}`] = id);
    }

    if (req.query.product) {
        const products = String(req.query.product).split(',');
        const placeholders = products.map((_, i) => `@product${i}`).join(',');
        whereClauses.push(`o.ProductGroupId IN (SELECT Id FROM ProductGroup WHERE Name IN (${placeholders}))`);
        products.forEach((p, i) => params[`product${i}`] = p);
    }

    return { whereString: 'WHERE ' + whereClauses.join(' AND '), params };
}

// GET /api/opportunities-products
router.get('/', (req: Request, res: Response) => {
    try {
        const db = getDb();
        const { whereString, params } = buildFilters(req);

        const sql = `
            SELECT 
                COALESCE(ppg.Name, pg.Name, 'Diğer') AS productName,
                MAX(ppg.Name) AS parentName,
                SUM(COALESCE(o.ExpectedRevenue_Value, o.Amount_Value, 0)) AS revenue,
                COUNT(o.Id) AS count
            FROM Opportunity o
            LEFT JOIN ProductGroup pg ON o.ProductGroupId = pg.Id
            LEFT JOIN ProductGroup ppg ON pg.ParentGroupId = ppg.Id
            ${whereString}
            GROUP BY COALESCE(ppg.Name, pg.Name, 'Diğer')
            ORDER BY revenue DESC
        `;

        const rows = db.query(sql, params) as any[];

        const result = rows.map(r => ({
            productName: r.productName,
            parentName: r.parentName || '', // Used for frontend optional display
            revenue: r.revenue,
            count: r.count,
            growth: 0 // Cannot determine safely without historical snapshots in this setup; keeping structure consistent for UI
        }));

        res.json({ value: result });
    } catch (error: any) {
        console.error('Error in opportunities products list:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
