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

    const top = parseInt(req.query.$top as string) || 100;
    const skip = parseInt(req.query.$skip as string) || 0;
    const filter = req.query.$filter as string | undefined;
    const count = req.query.$count === 'true';
    const orderby = req.query.$orderby as string | undefined;

    // ── Filter ────────────────────────────────────────────────────────────────
    // Only support: contains(title, 'term') or contains(customer_name, 'term')
    let filterSql = '';
    const filterParams: any = {};

    if (filter) {
        // Match: contains(title, 'term') or contains(customer_name, 'term')
        const match = filter.match(/contains\([^,]+,\s*'([^']+)'\)/);
        if (match) {
            filterSql = `WHERE (Name LIKE @search OR AccountId LIKE @search)`;
            filterParams.search = `%${match[1]}%`;
        }
    }

    // ── Ordering ──────────────────────────────────────────────────────────────
    // Map frontend snake_case field names to SQLite column names
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
        const countRow = db.prepare(
            `SELECT COUNT(*) AS n FROM Opportunity ${filterSql}`
        ).get(filterParams) as { n: number };
        totalCount = countRow.n;
    }

    // ── Paginated fetch ───────────────────────────────────────────────────────
    const rows = db.prepare(`
        SELECT * FROM Opportunity
        ${filterSql}
        ${orderSql}
        LIMIT @limit OFFSET @offset
    `).all({ ...filterParams, limit: top, offset: skip }) as Record<string, any>[];

    // ── Map SQLite rows → frontend Deal shape (snake_case expected by mapToDeal) ──
    const mapped = rows.map(row => ({
        id: row.Id,
        title: row.Name || '',
        customer_name: row.AccountId || '',   // Using AccountId as customer identifier
        product: row.ProductGroupId || 'EnRoute',
        value: row.Amount_Value || 0,
        stage: row.OpportunityStageNameTr || row.OpportunityStageName?.toString() || 'Lead',
        probability: row.Probability || 0,
        owner_id: row.OwnerId || '',
        source: row.Source?.toString() || 'Diğer',
        topic: row.Name || '',
        created_at: row.FirstCreatedDate || new Date().toISOString(),
        expected_close_date: row.CloseDate || new Date().toISOString(),
        last_activity_date: row.FirstCreatedDate || new Date().toISOString(),
        updated_at: row._SyncedAt || new Date().toISOString(),
        notes: null,
        currency: 'TRY',
        weighted_value: (row.ExpectedRevenue_Value || 0),
        aging: 0,
        velocity: 0,
        health_score: row.IsThereDelay ? 30 : 80,
    }));

    // ── Response ──────────────────────────────────────────────────────────────
    const response: Record<string, any> = { value: mapped };
    if (count && totalCount !== undefined) {
        response['@odata.count'] = totalCount;
    }

    return res.json(response);
});

/**
 * GET /api/opportunities/:id
 */
router.get('/:id', (req: Request, res: Response) => {
    const db = getDb();
    const row = db.prepare('SELECT * FROM Opportunity WHERE Id = ?').get(req.params.id) as Record<string, any> | undefined;

    if (!row) {
        return res.status(404).json({ status: 'error', message: 'Not found' });
    }

    return res.json({
        id: row.Id,
        title: row.Name || '',
        customer_name: row.AccountId || '',
        product: row.ProductGroupId || 'EnRoute',
        value: row.Amount_Value || 0,
        stage: row.OpportunityStageNameTr || 'Lead',
        probability: row.Probability || 0,
        owner_id: row.OwnerId || '',
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
    });
});

export default router;
