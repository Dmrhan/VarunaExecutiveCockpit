import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

router.get('/', (req: Request, res: Response) => {
    const db = getDb();

    const top = parseInt(req.query.$top as string) || 100;
    const skip = parseInt(req.query.$skip as string) || 0;

    let querySql = `
        SELECT o.*, a.Name as AccountName 
        FROM CrmOrder o
        LEFT JOIN Account a ON o.CompanyId = a.Id
        ORDER BY o.InvoiceDate DESC
    `;

    if (db.driver === 'mssql') {
        querySql += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
    } else {
        querySql += ` LIMIT @limit OFFSET @offset`;
    }

    const rows = db.query(querySql, { limit: top, offset: skip }) as Record<string, any>[];

    const mapped = rows.map(row => ({
        id: row.Id,
        quoteId: row.QuoteId || '',
        customerName: row.AccountName || row.CompanyId || '',
        product: row.ProductGroupId || 'EnRoute',
        title: row.OrderNo || 'Sipariş',
        amount: row.TotalNetAmountLocalCurrency_Amount || 0,
        status: row.Status === 1 ? 'Open' : 'Closed',
        createdAt: row.InvoiceDate,
        deliveryDate: row.InvoiceDate,
        salesRepId: row.ProposalOwnerId || ''
    }));

    return res.json({ value: mapped });
});

export default router;
