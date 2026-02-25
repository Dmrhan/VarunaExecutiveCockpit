import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

router.get('/', (req: Request, res: Response) => {
    const db = getDb();

    const top = parseInt(req.query.$top as string) || 100;
    const skip = parseInt(req.query.$skip as string) || 0;

    const rows = db.prepare(`
        SELECT q.*, a.Name as AccountName 
        FROM Quote q
        LEFT JOIN Account a ON q.AccountId = a.Id
        ORDER BY q._SyncedAt DESC
        LIMIT ? OFFSET ?
    `).all(top, skip) as Record<string, any>[];

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
