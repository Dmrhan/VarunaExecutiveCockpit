import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

router.get('/', (req: Request, res: Response) => {
    const db = getDb();

    const top = parseInt(req.query.$top as string) || 100;
    const skip = parseInt(req.query.$skip as string) || 0;

    let querySql = `
        SELECT q.*, a.Name as AccountName 
        FROM Quote q
        LEFT JOIN Account a ON q.AccountId = a.Id
        ORDER BY q._SyncedAt DESC
    `;

    if (db.driver === 'mssql') {
        querySql += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
    } else {
        querySql += ` LIMIT @limit OFFSET @offset`;
    }

    const rows = db.query(querySql, { limit: top, offset: skip }) as Record<string, any>[];

    const mapped = rows.map(row => ({
        id: row.Id,
        dealId: row.OpportunityId || '',
        customerName: row.AccountName || row.AccountId || '',
        product: row.ProductId || 'EnRoute',
        title: row.Topic || 'Teklif',
        amount: row.TotalAmountLocalCurrency_Amount || 0,
        status: row.StatusCode === 1 ? 'Draft' : 'Sent',
        createdAt: row._SyncedAt,
        validUntil: row._SyncedAt,
        items: []
    }));

    return res.json({ value: mapped });
});

export default router;
