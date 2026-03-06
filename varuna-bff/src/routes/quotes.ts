/**
 * quotes.ts
 * GET /api/quotes
 * Quotes joined with Account → customer name, Opportunity → product name.
 * Status integers mapped to Turkish labels (matches seed-all.ts v2).
 */
import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

// Quote Status map (matches EQuoteStatus enum)
const Q_STATUS_LABEL: Record<number, string> = {
    1: 'Draft',            // Taslak
    2: 'NeedsReview',      // Değerlendirme Gerekiyor
    3: 'InReview',         // Değerlendirmeye Alındı
    4: 'Approved',         // Onaylandı
    5: 'Reject',           // Reddedildi
    6: 'Presented',        // Gönderildi (Aktif)
    7: 'Accepted',         // Kabul Edildi
    8: 'Denied',           // İptal Edildi
    9: 'Closed',           // Kaybedildi
    10: 'PartiallyOrdered' // Kısmen Siparişleşti
};

const Q_STATUS_TR: Record<number, string> = {
    1: 'Taslak',
    2: 'Değerlendirme Gerekiyor',
    3: 'Değerlendirmeye Alındı',
    4: 'Onaylandı',
    5: 'Reddedildi',
    6: 'Gönderildi (Aktif)',
    7: 'Kabul Edildi',
    8: 'İptal Edildi.',
    9: 'Kaybedildi',
    10: 'Kısmen Siparişleşti'
};


router.get('/', (req: Request, res: Response) => {
    const db = getDb();

    const top = parseInt(req.query.$top as string) || 50000;
    const skip = parseInt(req.query.$skip as string) || 0;

    let querySql = `
        SELECT
            q.*,
            a.Name              AS AccountName,
            a.Title             AS AccountTitle,
            p.PersonNameSurname AS OwnerName,
            o.ProductGroupId    AS OppProductGroupId,
            pg.Name             AS ProductGroupName,
            pg.Level            AS ProductLevel,
            ppg.Name            AS ParentGroupName
        FROM Quote q
        LEFT JOIN Account      a ON q.AccountId       = a.Id
        LEFT JOIN Person      p ON q.ProposalOwnerId  = p.Id
        LEFT JOIN Opportunity o ON q.OpportunityId    = o.Id
        LEFT JOIN ProductGroup pg ON o.ProductGroupId = pg.Id
        LEFT JOIN ProductGroup ppg ON pg.ParentGroupId = ppg.Id
        ORDER BY q.FirstCreatedDate DESC
    `;

    if (db.driver === 'mssql') {
        querySql += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
    } else {
        querySql += ` LIMIT @limit OFFSET @offset`;
    }

    const rows = db.query(querySql, { limit: top, offset: skip }) as Record<string, any>[];

    const mapped = rows.map(row => {
        const statusCode: number = row.Status ?? 0;
        const productGroupId: string = row.OppProductGroupId || '';
        const productName = row.ProductGroupName || productGroupId || 'EnRoute';
        // Amount: use VAT-included figure (same as what was seeded)
        const amount = row.TotalAmountWithTaxLocalCurrency_Amount || row.TotalNetAmountLocalCurrency_Amount || 0;

        return {
            id: row.Id,
            number: row.Number || '',
            dealId: row.OpportunityId || '',
            customerName: row.AccountTitle || row.AccountName || row.AccountId || 'Bilinmiyor',
            salesRepId: row.ProposalOwnerId || '',
            salesRepName: row.OwnerName || row.ProposalOwnerId || 'Unknown',
            product: productName,
            productGroupId,
            title: row.Name || row.Number || 'Teklif',
            amount,
            netAmount: row.TotalNetAmountLocalCurrency_Amount || 0,
            currency: 'TRY',
            status: String(statusCode),
            statusLabel: Q_STATUS_LABEL[statusCode] ?? String(statusCode),
            statusTr: Q_STATUS_TR[statusCode] ?? String(statusCode),
            statusCode: String(statusCode),
            createdAt: row.FirstCreatedDate || row._SyncedAt,
            validUntil: row.ExpirationDate || '',
            serviceStart: row.ServiceStartDate || '',
            serviceEnd: row.ServiceFinishDate || '',
            discount: row.SubTotalDiscount || 0,
            parentGroupName: row.ParentGroupName,
            productLevel: row.ProductLevel,
            items: [],
        };
    });

    return res.json({ value: mapped, '@odata.count': mapped.length });
});

export default router;
