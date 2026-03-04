/**
 * quotes.ts
 * GET /api/quotes
 * Quotes joined with Account → customer name, Opportunity → product name.
 * Status integers mapped to Turkish labels (matches seed-all.ts v2).
 */
import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

// Quote Status map (matches seed-all.ts v2 + ExecutiveDashboardPageV2 filter expectations)
const Q_STATUS_LABEL: Record<number, string> = {
    0: 'Draft',        // Taslak  — dashboard filtresi 'Draft'
    1: 'NeedsReview',  // Değerlendirme Gerekiyor
    2: 'InReview',     // Değerlendirmeye Alındı
    3: 'Approved',     // Onaylandı
    4: 'Rejected',     // Reddedildi
    5: 'Sent',         // Gönderildi (Aktif) — dashboard filtresi 'Sent'
    6: 'Accepted',     // Kabul Edildi
    7: 'Cancelled',    // İptal Edildi
    8: 'Lost',         // Kaybedildi
    9: 'Partial',      // Kısmen Siparişleşti
};

const Q_STATUS_TR: Record<number, string> = {
    0: 'Taslak',
    1: 'Değerlendirme Gerekiyor',
    2: 'Değerlendirmeye Alındı',
    3: 'Onaylandı',
    4: 'Reddedildi',
    5: 'Gönderildi (Aktif)',
    6: 'Kabul Edildi',
    7: 'İptal Edildi',
    8: 'Kaybedildi',
    9: 'Kısmen Siparişleşti',
};


router.get('/', (req: Request, res: Response) => {
    const db = getDb();

    const top = parseInt(req.query.$top as string) || 500;
    const skip = parseInt(req.query.$skip as string) || 0;

    let querySql = `
        SELECT
            q.*,
            a.Name              AS AccountName,
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
            customerName: row.AccountName || row.AccountId || 'Bilinmiyor',
            salesRepId: row.ProposalOwnerId || '',
            salesRepName: row.OwnerName || row.ProposalOwnerId || 'Unknown',
            product: productName,
            productGroupId,
            title: row.Name || row.Number || 'Teklif',
            amount,
            netAmount: row.TotalNetAmountLocalCurrency_Amount || 0,
            currency: 'TRY',
            status: Q_STATUS_LABEL[statusCode] ?? 'Unknown',
            statusTr: Q_STATUS_TR[statusCode] ?? String(statusCode),
            statusCode,
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
