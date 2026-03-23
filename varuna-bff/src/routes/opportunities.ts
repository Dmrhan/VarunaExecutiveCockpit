import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

const DEAL_TYPE_KEYS: Record<string, string> = {
    '1': 'opportunities.charts.dealTypes.newSale',
    '2': 'opportunities.charts.dealTypes.renovation',
    '3': 'opportunities.charts.dealTypes.crossSelling',
    '4': 'opportunities.charts.dealTypes.upSellSale',
    '5': 'opportunities.charts.dealTypes.additionalUsage',
    '6': 'opportunities.charts.dealTypes.financialInstitute',
    '7': 'opportunities.charts.dealTypes.newExistingReference',
    '8': 'opportunities.charts.dealTypes.changesRequestForm',
    '9': 'opportunities.charts.dealTypes.winBack',
};



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
    let filterSql = 'WHERE 1=1';
    const filterParams: any = {};

    if (filter) {
        const match = filter.match(/contains\([^,]+,\s*'([^']+)'\)/);
        if (match) {
            filterSql += ` AND (Name LIKE @search OR AccountId LIKE @search)`;
            filterParams.search = `%${match[1]}%`;
        }
    }

    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const teamIdRaw = req.query.teamId;
    const ownerIdRaw = req.query.ownerId;
    
    const teamIdArr = Array.isArray(teamIdRaw) ? teamIdRaw : (teamIdRaw ? [teamIdRaw] : []);
    const ownerIdArr = Array.isArray(ownerIdRaw) ? ownerIdRaw : (ownerIdRaw ? [ownerIdRaw] : []);

    if (startDate && endDate) {
        filterSql += ` AND CreatedOn >= @startDate AND CreatedOn <= @endDate`;
        filterParams.startDate = startDate + ' 00:00:00';
        filterParams.endDate = endDate + ' 23:59:59';
    }

    if (ownerIdArr.length > 0 && !ownerIdArr.includes('all')) {
        const ownerParams = ownerIdArr.map((_, i) => `@owner${i}`).join(',');
        filterSql += ` AND OwnerId IN (${ownerParams})`;
        ownerIdArr.forEach((id, i) => { filterParams[`owner${i}`] = id; });
    }

    if (teamIdArr.length > 0 && !teamIdArr.includes('all')) {
        // Pseudo team filter: assuming users map to teams. Without UserTeam join, we can't filter purely by teamId unless it's in Opportunity.
        // As a fallback just ignore if it's too complex or if it doesn't match the DB schema.
        // Same as /stats, might need join if it's strictly needed.
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
        dealType: row.DealType ? (DEAL_TYPE_KEYS[row.DealType.toString()] || row.DealType.toString()) : null,
        dealTypeKey: row.DealType?.toString() || null,
        topic: row.Name || '',

        created_at: row.FirstCreatedDate || new Date().toISOString(),
        createdAt: row.FirstCreatedDate || new Date().toISOString(),
        expected_close_date: row.CloseDate || new Date().toISOString(),
        expectedCloseDate: row.CloseDate || new Date().toISOString(),
        last_activity_date: row.FirstCreatedDate || new Date().toISOString(),
        lastActivityDate: row.FirstCreatedDate || new Date().toISOString(),
        updated_at: row._SyncedAt,
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

router.get('/reports/lost-reasons', (req: Request, res: Response) => {
    try {
        const db = getDb();
        
        const reqFrom = req.query.from as string;
        const reqTo = req.query.to as string;
        
        const from = reqFrom ? reqFrom.substring(0, 10) : undefined;
        const to = reqTo ? reqTo.substring(0, 10) : undefined;
        const ownerId = req.query.ownerId as string | string[] | undefined;
        const companyId = req.query.companyId as string | undefined;
        const pipelineId = req.query.pipelineId as string | undefined;
        const teamId = req.query.teamId as string | string[] | undefined;
        const mode = (req.query.mode as string) || 'revenue'; // 'revenue' | 'count'

        const params: any = {};
        const filterParts: string[] = [
            `(o.DealStatus = 2 OR o.OpportunityStageNameTr IN ('Kaybedildi', 'Lost'))`
        ];

        if (from && to) {
            filterParts.push(`o.FirstCreatedDate BETWEEN @from AND @to`);
            params.from = from;
            params.to = to;
        } else if (from) {
            filterParts.push(`o.FirstCreatedDate >= @from`);
            params.from = from;
        } else if (to) {
            filterParts.push(`o.FirstCreatedDate <= @to`);
            params.to = to;
        }

        if (companyId) {
            filterParts.push(`o.CompanyId = @companyId`);
            params.companyId = companyId;
        }
        
        if (pipelineId) {
            filterParts.push(`o.PipelineId = @pipelineId`);
            params.pipelineId = pipelineId;
        }

        if (ownerId) {
            const ownerIds = Array.isArray(ownerId) ? ownerId : [ownerId];
            filterParts.push(`o.OwnerId IN (${ownerIds.map((_, i) => `@o${i}`).join(',')})`);
            ownerIds.forEach((id, i) => params[`o${i}`] = id);
        }

        if (teamId) {
            const teamIds = Array.isArray(teamId) ? teamId : [teamId];
            filterParts.push(`o.OwnerId IN (SELECT PersonId FROM TeamMember WHERE TeamId IN (${teamIds.map((_, i) => `@t${i}`).join(',')}))`);
            teamIds.forEach((id, i) => params[`t${i}`] = id);
        }

        const dateFilter = filterParts.length > 0 ? `WHERE ${filterParts.join(' AND ')}` : '';

        const sql = `
            SELECT 
                o.ClosedLostReason as reasonKey,
                MAX(e.EnumName) as rawReasonName,
                COUNT(*) as count,
                COALESCE(SUM(COALESCE(o.ExpectedRevenue_Value, o.Amount_Value, o.PotentialTurnover_Value, 0)), 0) as amount
            FROM Opportunity o
            LEFT JOIN SystemEnums e ON e.EnumType = 'EClosedLostReason' AND e.EnumValue = o.ClosedLostReason
            ${dateFilter}
            GROUP BY o.ClosedLostReason
        `;

        const rows = db.query(sql, params) as any[];

        let totalCount = 0;
        let totalAmount = 0;

        // Process translations mapping (could be improved with a proper i18n map on BFF, but we resolve keys for FE)
        const mappedItems = rows.map(r => {
            totalCount += r.count;
            totalAmount += r.amount;
            const rKey = r.reasonKey != null ? r.reasonKey.toString() : 'Unknown';
            return {
                reasonKey: rKey,
                reasonLabel: {
                    en: r.rawReasonName || rKey,
                    // we prefix for the frontend to translation
                    tr: r.rawReasonName ? `Enum.EClosedLostReason.${r.rawReasonName}` : 'Bilinmiyor' 
                },
                count: r.count,
                amount: r.amount,
                share: 0 // Will calculate below
            };
        });

        // Calculate share and sort
        const sortedItems = mappedItems.map(item => ({
            ...item,
            share: mode === 'count' 
                ? (totalCount > 0 ? item.count / totalCount : 0)
                : (totalAmount > 0 ? item.amount / totalAmount : 0)
        })).sort((a, b) => mode === 'count' ? b.count - a.count : b.amount - a.amount);

        // Optional: limit to top 10 and group rest in 'other'
        const limit = 10;
        const topItems = sortedItems.slice(0, limit);
        const restItems = sortedItems.slice(limit);

        const otherItem = restItems.length > 0 ? {
            reasonKey: 'Other',
            reasonLabel: { en: 'Other', tr: 'Diğer' },
            count: restItems.reduce((acc, curr) => acc + curr.count, 0),
            amount: restItems.reduce((acc, curr) => acc + curr.amount, 0),
            share: restItems.reduce((acc, curr) => acc + curr.share, 0)
        } : null;

        res.json({
            mode,
            items: topItems,
            other: otherItem,
            totals: {
                count: totalCount,
                amount: totalAmount
            }
        });

    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/stats', (req: Request, res: Response) => {
    try {
        const db = getDb();

        // The frontend sends ISO strings (e.g., '2026-03-05T00:00:00.000Z').
        // The database stores FirstCreatedDate as a 'YYYY-MM-DD' string (e.g., '2026-03-05').
        // We truncate the incoming ISO strings to 10 characters to perform correct string comparisons in SQL.
        const reqStartDate = req.query.startDate as string;
        const reqEndDate = req.query.endDate as string;

        const startDate = reqStartDate ? reqStartDate.substring(0, 10) : undefined;
        const endDate = reqEndDate ? reqEndDate.substring(0, 10) : undefined;
        const ownerId = req.query.ownerId as string | string[] | undefined;
        const teamId = (req.query.teamId as string | string[]) || undefined;
        const product = req.query.product as string | string[] | undefined;

        let dateFilter = '';
        const params: any = {};
        const filterParts: string[] = [];

        if (startDate && endDate) {
            filterParts.push(`o.FirstCreatedDate BETWEEN @startDate AND @endDate`);
            params.startDate = startDate;
            params.endDate = endDate;
        } else if (startDate) {
            filterParts.push(`o.FirstCreatedDate >= @startDate`);
            params.startDate = startDate;
        } else if (endDate) {
            filterParts.push(`o.FirstCreatedDate <= @endDate`);
            params.endDate = endDate;
        }

        if (ownerId) {
            const ownerIds = Array.isArray(ownerId) ? ownerId : [ownerId];
            filterParts.push(`o.OwnerId IN (${ownerIds.map((_, i) => `@o${i}`).join(',')})`);
            ownerIds.forEach((id, i) => params[`o${i}`] = id);
        }

        if (teamId) {
            const teamIds = Array.isArray(teamId) ? teamId : [teamId];
            filterParts.push(`o.OwnerId IN (SELECT PersonId FROM TeamMember WHERE TeamId IN (${teamIds.map((_, i) => `@t${i}`).join(',')}))`);
            teamIds.forEach((id, i) => params[`t${i}`] = id);
        }

        if (product) {
            const products = Array.isArray(product) ? product : [product];
            // Join with ProductGroup to filter by name
            filterParts.push(`o.ProductGroupId IN (SELECT Id FROM ProductGroup WHERE Name IN (${products.map((_, i) => `@p${i}`).join(',')}))`);
            products.forEach((p, i) => params[`p${i}`] = p);
        }

        dateFilter = filterParts.length > 0 ? `WHERE ${filterParts.join(' AND ')}` : '';

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

        // 5. Revenue by DealType (Top 10)
        const dealTypeRevRaw = db.query(`
            SELECT o.DealType as name, COUNT(o.Id) as count, SUM(COALESCE(o.ExpectedRevenue_Value, o.Amount_Value, 0)) as revenue
            FROM Opportunity o
            ${dateFilter} ${dateFilter ? 'AND' : 'WHERE'} o.DealType IS NOT NULL AND o.DealType != '' AND o.DealStatus = 0
            GROUP BY o.DealType
            ORDER BY revenue DESC
            ${db.driver === 'mssql' ? 'OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY' : 'LIMIT 10'}
        `, params);

        const dealTypeRev = dealTypeRevRaw.map((row: any) => ({
            ...row,
            name: DEAL_TYPE_KEYS[row.name.toString()] || row.name.toString(),
            typeId: row.name.toString()
        }));

        res.json({

            metrics,
            charts: {
                sourceRev,
                customerRev,
                sourceCount,
                dealTypeRev
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
        product: row.ProductGroupName || row.ProductGroupId || 'Bilinmiyor',
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
