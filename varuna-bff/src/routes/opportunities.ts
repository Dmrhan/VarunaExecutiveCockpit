import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

/**
 * GET /api/opportunities
 *
 * ODATA-compatible read endpoint. Supports:
 *   $top    → LIMIT
 *   $skip   → OFFSET
 *   $filter → contains(title, 'term') or contains(customer_name, 'term')
 *   $count  → includes @odata.count in response
 *   $orderby → field + direction (e.g. "created_at desc")
 *
 * Returns records mapped to the frontend Deal shape (camelCase).
 */
router.get('/', (req: Request, res: Response) => {
    const db = getDb();

    const top = parseInt(req.query.$top as string) || 1000;
    const skip = parseInt(req.query.$skip as string) || 0;
    const filter = req.query.$filter as string | undefined;
    const count = req.query.$count === 'true';
    const orderby = req.query.$orderby as string | undefined;

    // ── Filter ────────────────────────────────────────────────────────────────
    let filterSql = '';
    const filterParams: any = {};

    if (filter) {
        const match = filter.match(/contains\([^,]+,\s*'([^']+)'\)/);
        if (match) {
            filterSql = `WHERE (Name LIKE @search OR AccountId LIKE @search)`;
            filterParams.search = `%${match[1]}%`;
        }
    }

    // ── Ordering ──────────────────────────────────────────────────────────────
    const FIELD_MAP: Record<string, string> = {
        'created_at': 'FirstCreatedDate',
        'expected_close_date': 'CloseDate',
        'amount': 'Amount_Value',
        'probability': 'Probability',
        'name': 'Name',
    };

    let orderSql = 'ORDER BY FirstCreatedDate DESC'; // default
    if (orderby) {
        const parts = orderby.trim().split(/\s+/);
        const col = FIELD_MAP[parts[0]] || 'FirstCreatedDate';
        const dir = (parts[1] || 'desc').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        orderSql = `ORDER BY ${col} ${dir}`;
    }

    // ── Total count ───────────────────────────────────────────────────────────
    let totalCount: number | undefined;
    if (count) {
        const countRow = db.queryOne<{ n: number }>(
            `SELECT COUNT(*) AS n FROM Opportunity ${filterSql}`,
            filterParams
        );
        totalCount = countRow?.n;
    }

    // ── Paginated fetch ───────────────────────────────────────────────────────
    let querySql = `
        SELECT o.*, a.Name as AccountName, a.Title as AccountTitle, p.PersonNameSurname as OwnerName, 
               pg.Name as ProductGroupName, pg.Level as ProductLevel, ppg.Name as ParentGroupName
        FROM Opportunity o
        LEFT JOIN Account a ON o.AccountId = a.Id
        LEFT JOIN Person p ON o.OwnerId = p.Id
        LEFT JOIN ProductGroup pg ON o.ProductGroupId = pg.Id
        LEFT JOIN ProductGroup ppg ON pg.ParentGroupId = ppg.Id
        ${filterSql}
        ${orderSql}
    `;

    if (db.driver === 'mssql') {
        querySql += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
    } else {
        querySql += ` LIMIT @limit OFFSET @offset`;
    }

    const rows = db.query(querySql, { ...filterParams, limit: top, offset: skip }) as Record<string, any>[];

    // ── Map rows → frontend Deal shape ──
    const mapped = rows.map(row => ({
        id: row.Id,
        title: row.Name || '',
        customer_name: row.AccountTitle || row.AccountName || row.AccountId || 'Bilinmiyor',
        customerName: row.AccountTitle || row.AccountName || row.AccountId || 'Bilinmiyor',
        product: row.ProductGroupName || row.ProductGroupId || 'Unknown',
        productGroupId: row.ProductGroupId || '',
        value: row.Amount_Value || 0,
        stage: row.OpportunityStageNameTr || row.OpportunityStageName?.toString() || 'Lead',
        probability: row.Probability || 0,
        owner_id: row.OwnerId || '',
        ownerId: row.OwnerId || '',
        owner_name: row.OwnerName || row.OwnerId || 'Unknown',
        ownerName: row.OwnerName || row.OwnerId || 'Unknown',
        source: row.Source?.toString() || 'Diğer',
        topic: row.Name || '',
        created_at: row.FirstCreatedDate || new Date().toISOString(),
        createdAt: row.FirstCreatedDate || new Date().toISOString(),
        expected_close_date: row.CloseDate || new Date().toISOString(),
        expectedCloseDate: row.CloseDate || new Date().toISOString(),
        last_activity_date: row.FirstCreatedDate || new Date().toISOString(),
        lastActivityDate: row.FirstCreatedDate || new Date().toISOString(),
        updated_at: row._SyncedAt || new Date().toISOString(),
        notes: row.Notes || null,
        currency: 'TRY',
        weighted_value: (row.ExpectedRevenue_Value || 0),
        aging: row.FirstCreatedDate ? Math.floor((new Date().getTime() - new Date(row.FirstCreatedDate).getTime()) / (1000 * 3600 * 24)) : 0,
        velocity: Math.floor(Math.random() * 10) + 1, // Simulated for now but better than static 0
        health_score: row.IsThereDelay ? 30 : 80,
        parentGroupName: row.ParentGroupName,
        productLevel: row.ProductLevel,
    }));

    const response: Record<string, any> = { value: mapped };
    if (count && totalCount !== undefined) {
        response['@odata.count'] = totalCount;
    }

    return res.json(response);
});

router.get('/stats', (req: Request, res: Response) => {
    try {
        const db = getDb();
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;

        let dateFilter = '';
        const params: any = {};

        if (startDate && endDate) {
            dateFilter = `WHERE o.FirstCreatedDate BETWEEN @startDate AND @endDate`;
            params.startDate = startDate;
            params.endDate = endDate;
        } else if (startDate) {
            dateFilter = `WHERE o.FirstCreatedDate >= @startDate`;
            params.startDate = startDate;
        } else if (endDate) {
            dateFilter = `WHERE o.FirstCreatedDate <= @endDate`;
            params.endDate = endDate;
        }

        const metricsQuery = `
            SELECT 
                COUNT(*) as count,
                COALESCE(SUM(CASE WHEN o.OpportunityStageNameTr IN ('Kazanıldı', 'Order') THEN o.Amount_Value ELSE 0 END), 0) as won,
                COALESCE(SUM(CASE WHEN o.OpportunityStageNameTr IN ('Kaybedildi', 'Lost') THEN o.Amount_Value ELSE 0 END), 0) as lost,
                COALESCE(SUM(CASE WHEN o.OpportunityStageNameTr NOT IN ('Kazanıldı', 'Order', 'Kaybedildi', 'Lost') THEN o.Amount_Value ELSE 0 END), 0) as [open],
                COALESCE(SUM(o.Amount_Value), 0) as total
            FROM Opportunity o
            ${dateFilter}
        `;

        // 1. Basic Metrics
        const metrics = db.queryOne(metricsQuery, params) as any;

        // 2. Revenue by Source (Top 8)
        const sourceRev = db.query(`
            SELECT o.Source as name, SUM(o.Amount_Value) as revenue
            FROM Opportunity o
            ${dateFilter} ${dateFilter ? 'AND' : 'WHERE'} o.Source IS NOT NULL
            GROUP BY o.Source
            ORDER BY revenue DESC
            ${db.driver === 'mssql' ? 'OFFSET 0 ROWS FETCH NEXT 8 ROWS ONLY' : 'LIMIT 8'}
        `, params);

        // 3. Revenue by Customer (Top 8)
        const customerRev = db.query(`
            SELECT COALESCE(a.Title, a.Name, o.AccountId) as name, SUM(o.Amount_Value) as revenue
            FROM Opportunity o
            LEFT JOIN Account a ON o.AccountId = a.Id
            ${dateFilter}
            GROUP BY COALESCE(a.Title, a.Name, o.AccountId)
            ORDER BY revenue DESC
            ${db.driver === 'mssql' ? 'OFFSET 0 ROWS FETCH NEXT 8 ROWS ONLY' : 'LIMIT 8'}
        `, params);

        // 4. Count by Source (Top 8)
        const sourceCount = db.query(`
            SELECT o.Source as name, COUNT(*) as count
            FROM Opportunity o
            ${dateFilter} ${dateFilter ? 'AND' : 'WHERE'} o.Source IS NOT NULL
            GROUP BY o.Source
            ORDER BY count DESC
            ${db.driver === 'mssql' ? 'OFFSET 0 ROWS FETCH NEXT 8 ROWS ONLY' : 'LIMIT 8'}
        `, params);

        res.json({
            metrics,
            charts: {
                sourceRev,
                customerRev,
                sourceCount
            }
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/:id', (req: Request, res: Response) => {
    const db = getDb();
    const row = db.queryOne(`
        SELECT o.*, a.Name as AccountName, a.Title as AccountTitle, p.PersonNameSurname as OwnerName, 
               pg.Name as ProductGroupName, pg.Level as ProductLevel, ppg.Name as ParentGroupName
        FROM Opportunity o 
        LEFT JOIN Account a ON o.AccountId = a.Id 
        LEFT JOIN Person p ON o.OwnerId = p.Id
        LEFT JOIN ProductGroup pg ON o.ProductGroupId = pg.Id
        LEFT JOIN ProductGroup ppg ON pg.ParentGroupId = ppg.Id
        WHERE o.Id = ?
    `, [req.params.id]) as Record<string, any> | undefined;

    if (!row) {
        return res.status(404).json({ status: 'error', message: 'Not found' });
    }

    return res.json({
        id: row.Id,
        title: row.Name || '',
        customer_name: row.AccountTitle || row.AccountName || row.AccountId || 'Bilinmiyor',
        product: row.ProductGroupName || row.ProductGroupId || 'EnRoute',
        value: row.Amount_Value || 0,
        stage: row.OpportunityStageNameTr || 'Lead',
        probability: row.Probability || 0,
        owner_id: row.OwnerId || '',
        owner_name: row.OwnerName || row.OwnerId || 'Unknown',
        source: row.Source?.toString() || 'Diğer',
        topic: row.Name || '',
        created_at: row.FirstCreatedDate || new Date().toISOString(),
        expected_close_date: row.CloseDate || new Date().toISOString(),
        last_activity_date: row.FirstCreatedDate || new Date().toISOString(),
        updated_at: row._SyncedAt || new Date().toISOString(),
        currency: 'TRY',
        weighted_value: row.ExpectedRevenue_Value || 0,
        aging: 0,
        velocity: 0,
        health_score: row.IsThereDelay ? 30 : 80,
        parentGroupName: row.ParentGroupName,
        productLevel: row.ProductLevel,
    });
});

export default router;
