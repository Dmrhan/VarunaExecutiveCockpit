/**
 * orders.ts
 * GET /api/orders
 * CrmOrder joined with Account (by AccountId), Person (owner), and CrmOrderProducts (product names).
 */
import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

// Status: 0=Open, 1=Closed, 2=Canceled
const STATUS_LABEL: Record<number, string> = {
    0: 'Open',
    1: 'Closed',
    2: 'Canceled',
};

// Product group → display name (same as quotes.ts)
const PRODUCT_GROUP_NAMES: Record<string, string> = {
    'PG-ENR': 'EnRoute',
    'PG-QST': 'Quest',
    'PG-STB': 'Stokbar',
    'PG-SVC': 'ServiceCore',
    'PG-VRN': 'Varuna',
    'PG-HST': 'Hosting',
    'PG-UDX': 'Unidox',
};

const STOCK_ID_TO_NAME: Record<string, string> = {
    'STK-ENROUTE': 'EnRoute',
    'STK-QUEST': 'Quest',
    'STK-STOKBAR': 'Stokbar',
    'STK-SVCCORE': 'ServiceCore',
    'STK-VARUNA': 'Varuna',
    'STK-HOSTING': 'Hosting',
    'STK-UNIDOX': 'Unidox',
};

router.get('/', (req: Request, res: Response) => {
    const db = getDb();

    const top = parseInt(req.query.$top as string) || 500;
    const skip = parseInt(req.query.$skip as string) || 0;

    // Join Account by AccountId (not CompanyId), Person for owner
    let querySql = `
        SELECT
            o.*,
            a.Name              AS AccountName,
            p.PersonNameSurname AS OwnerName,
            op.ProductGroupId   AS OppProductGroupId,
            (
                SELECT GROUP_CONCAT(s.Name, ', ')
                FROM CrmOrderProducts cop2
                LEFT JOIN Stock s ON cop2.StockId = s.Id
                WHERE cop2.CrmOrderId = o.Id
                LIMIT 3
            ) AS ProductNames,
            (
                SELECT cop2.StockId
                FROM CrmOrderProducts cop2
                WHERE cop2.CrmOrderId = o.Id
                LIMIT 1
            ) AS PrimaryStockId
        FROM CrmOrder o
        LEFT JOIN Account     a  ON o.AccountId      = a.Id
        LEFT JOIN Person      p  ON o.ProposalOwnerId = p.Id
        LEFT JOIN Quote       q  ON o.QuoteId         = q.Id
        LEFT JOIN Opportunity op ON q.OpportunityId   = op.Id
        ORDER BY o.CreateOrderDate DESC
    `;

    if (db.driver === 'mssql') {
        querySql += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
    } else {
        querySql += ` LIMIT @limit OFFSET @offset`;
    }

    const rows = db.query(querySql, { limit: top, offset: skip }) as Record<string, any>[];

    const mapped = rows.map(row => {
        const statusCode: number = row.Status ?? 0;
        // Derive product from: order products list → opp product group → fallback
        const productGroupId: string = row.OppProductGroupId || '';
        const primaryStockName = row.PrimaryStockId ? (STOCK_ID_TO_NAME[row.PrimaryStockId] || '') : '';
        const productName = primaryStockName
            || PRODUCT_GROUP_NAMES[productGroupId]
            || 'EnRoute';

        // Amount: VAT-included total
        const amount = row.TotalAmountWithTaxLocalCurrency_Amount || row.TotalNetAmountLocalCurrency_Amount || 0;

        // Customer name: from the Account join on AccountId
        const customerName = row.AccountName || row.AccountId || 'Bilinmiyor';

        // Order name: use Name field (we seed it as "Müşteri – Ürün Siparişi")
        const title = row.Name || `Sipariş #${row.Id}`;

        return {
            id: row.Id,
            quoteId: row.QuoteId || '',
            customerName,
            salesRepId: row.ProposalOwnerId || '',
            salesRepName: row.OwnerName || row.ProposalOwnerId || 'Unknown',
            product: productName,
            productNames: row.ProductNames || productName,
            title,
            amount,
            netAmount: row.TotalNetAmountLocalCurrency_Amount || 0,
            currency: 'TRY',
            status: STATUS_LABEL[statusCode] ?? 'Open',
            statusCode,
            isInvoiced: !!row.InvoiceDate,
            createdAt: row.CreateOrderDate || row._SyncedAt,
            invoiceDate: row.InvoiceDate || null,
            deliveryDate: row.DeliveryDate || null,
        };
    });

    return res.json({ value: mapped, '@odata.count': mapped.length });
});

export default router;
