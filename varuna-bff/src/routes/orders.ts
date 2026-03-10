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

router.get('/', (req: Request, res: Response) => {
    const db = getDb();

    const top = parseInt(req.query.$top as string) || 5000;
    const skip = parseInt(req.query.$skip as string) || 0;

    // Subquery: first order line item's stock name list (for display)
    const productNamesSub = db.driver === 'mssql'
        ? `(SELECT STRING_AGG(Name, ', ') FROM (SELECT TOP 3 s2.Name FROM CrmOrderProducts cop2 LEFT JOIN Stock s2 ON cop2.StockId = s2.Id WHERE cop2.CrmOrderId = o.Id) AS sub)`
        : `(SELECT GROUP_CONCAT(s2.Name, ', ') FROM CrmOrderProducts cop2 LEFT JOIN Stock s2 ON cop2.StockId = s2.Id WHERE cop2.CrmOrderId = o.Id LIMIT 3)`;

    // Subquery: parent product group name from first order line item
    // CrmOrderProducts → Stock → ProductGroup (child) → ProductGroup (parent)
    const stockProductGroupSub = db.driver === 'mssql'
        ? `(SELECT TOP 1 COALESCE(tpg.Name, spg.Name)
             FROM CrmOrderProducts cop2
             LEFT JOIN Stock s2      ON cop2.StockId = s2.Id
             LEFT JOIN ProductGroup spg ON s2.ProductGroupId = spg.Id
             LEFT JOIN ProductGroup tpg ON spg.ParentGroupId = tpg.Id
             WHERE cop2.CrmOrderId = o.Id)`
        : `(SELECT COALESCE(tpg.Name, spg.Name)
             FROM CrmOrderProducts cop2
             LEFT JOIN Stock s2      ON cop2.StockId = s2.Id
             LEFT JOIN ProductGroup spg ON s2.ProductGroupId = spg.Id
             LEFT JOIN ProductGroup tpg ON spg.ParentGroupId = tpg.Id
             WHERE cop2.CrmOrderId = o.Id
             LIMIT 1)`;

    let querySql = `
        SELECT
            o.*,
            a.Name              AS AccountName,
            a.Title             AS AccountTitle,
            p.PersonNameSurname AS OwnerName,
            ${productNamesSub}     AS ProductNames,
            ${stockProductGroupSub} AS StockProductGroupName
        FROM CrmOrder o
        LEFT JOIN Account a ON o.AccountId      = a.Id
        LEFT JOIN Person  p ON o.ProposalOwnerId = p.Id
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
        // Product group: derived from CrmOrderProducts → Stock → ProductGroup → ParentProductGroup
        // StockProductGroupName is COALESCE(parent group name, child group name) from the first order line
        const productName = row.StockProductGroupName || 'Bilinmiyor';

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
