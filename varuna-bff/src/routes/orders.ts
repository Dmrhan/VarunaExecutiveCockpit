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

    const top = parseInt(req.query.$top as string) || 5000;
    const skip = parseInt(req.query.$skip as string) || 0;

    // Subqueries: SQLite uses GROUP_CONCAT and LIMIT, MSSQL uses STRING_AGG and TOP
    const productNamesSub = db.driver === 'mssql'
        ? `(SELECT STRING_AGG(Name, ', ') FROM (SELECT TOP 3 s.Name FROM CrmOrderProducts cop2 LEFT JOIN Stock s ON cop2.StockId = s.Id WHERE cop2.CrmOrderId = o.Id) AS sub)`
        : `(SELECT GROUP_CONCAT(s.Name, ', ') FROM CrmOrderProducts cop2 LEFT JOIN Stock s ON cop2.StockId = s.Id WHERE cop2.CrmOrderId = o.Id LIMIT 3)`;

    const primaryStockSub = db.driver === 'mssql'
        ? `(SELECT TOP 1 cop2.StockId FROM CrmOrderProducts cop2 WHERE cop2.CrmOrderId = o.Id)`
        : `(SELECT cop2.StockId FROM CrmOrderProducts cop2 WHERE cop2.CrmOrderId = o.Id LIMIT 1)`;

    // Join Account by AccountId (not CompanyId), Person for owner
    let querySql = `
        SELECT
            o.*,
            a.Name              AS AccountName,
            a.Title             AS AccountTitle,
            p.PersonNameSurname AS OwnerName,
            op.ProductGroupId   AS OppProductGroupId,
            pg.Name             AS ProductGroupName,
            ppg.Name            AS ParentGroupName,
            ${productNamesSub} AS ProductNames,
            ${primaryStockSub} AS PrimaryStockId
        FROM CrmOrder o
        LEFT JOIN Account     a  ON o.AccountId      = a.Id
        LEFT JOIN Person      p  ON o.ProposalOwnerId = p.Id
        LEFT JOIN Quote       q  ON o.QuoteId         = q.Id
        LEFT JOIN Opportunity op ON q.OpportunityId   = op.Id
        LEFT JOIN ProductGroup pg ON op.ProductGroupId = pg.Id
        LEFT JOIN ProductGroup ppg ON pg.ParentGroupId = ppg.Id
        ORDER BY o.CreateOrderDate DESC
    `;

    const queryParams: any = { limit: top, offset: skip };
    if (db.driver === 'mssql') {
        // MSSQL can be picky about parameters in OFFSET/FETCH.
        // Since we parsed them as Int, we can safely inject them to avoid RequestError.
        querySql += ` OFFSET ${skip} ROWS FETCH NEXT ${top} ROWS ONLY`;
    } else {
        querySql += ` LIMIT @limit OFFSET @offset`;
    }

    const rows = db.query(querySql, queryParams) as Record<string, any>[];

    const mapped = rows.map(row => {
        const statusCode: number = row.Status ?? 0;
        // Derive product from: order products list → opp product group → fallback
        const productGroupId: string = row.OppProductGroupId || '';
        const primaryStockName = row.PrimaryStockId ? (STOCK_ID_TO_NAME[row.PrimaryStockId] || '') : '';
        const productName = row.ParentGroupName
            || row.ProductGroupName
            || primaryStockName
            || PRODUCT_GROUP_NAMES[productGroupId]
            || 'EnRoute';

        // Amount: VAT-included total
        const amount = row.TotalNetAmountLocalCurrency_Amount || 0;

        // Customer name: from the Account join on AccountId
        const customerName = row.AccountTitle || row.AccountName || row.AccountId || 'Bilinmiyor';

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
            createdAt: row.CreateOrderDate,
            invoiceDate: row.InvoiceDate || null,
            deliveryDate: row.DeliveryDate || null,
            parentGroupName: row.ParentGroupName,
            productLevel: row.ProductLevel,
        };
    });

    return res.json({ value: mapped, '@odata.count': mapped.length });
});

export default router;
