import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

router.get('/', (req: Request, res: Response) => {
    const db = getDb();

    const top = parseInt(req.query.$top as string) || 100;
    const skip = parseInt(req.query.$skip as string) || 0;

    const rows = db.prepare(`
        SELECT q.*, a.Name as AccountName, p.PersonNameSurname as OwnerName
        FROM Quote q
        LEFT JOIN Account a ON q.AccountId = a.Id
        LEFT JOIN Person p ON q.ProposalOwnerId = p.Id
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
        customerName: row.AccountName || row.AccountId || 'Bilinmiyor',
        salesRepId: row.ProposalOwnerId,
        salesRepName: row.OwnerName || row.ProposalOwnerId || 'Unknown',
        product: row.ProductId || 'EnRoute',
        title: row.Name || row.Number || 'Teklif',
        amount: row.TotalAmountLocalCurrency_Amount || 0,
        status: row.Status === 6 ? 'Sözleşme' : (row.Status === 1 ? 'Approved' : 'Negotiation'),
        createdAt: row.FirstCreatedDate || row._SyncedAt,
        validUntil: row.ExpirationDate || row._SyncedAt,
        items: []
    }));

    return res.json({ value: mapped });
});

export default router;
