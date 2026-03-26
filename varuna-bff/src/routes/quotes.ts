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


// ─── Turkish month abbreviations ─────────────────────────────────────────────
const TR_MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

// ─── GET /trend ───────────────────────────────────────────────────────────────
router.get('/trend', (req: Request, res: Response) => {
    const db = getDb();
    const granularity = (['daily', 'weekly', 'monthly'].includes(req.query.granularity as string)
        ? req.query.granularity as string
        : 'monthly');

    const whereClauses: string[] = [];
    const params: Record<string, any> = {};

    if (req.query.from) {
        whereClauses.push('q.CreatedOn >= @from');
        params.from = req.query.from;
    }
    if (req.query.to) {
        whereClauses.push('q.CreatedOn <= @to');
        params.to = req.query.to;
    }
    if (req.query.product) {
        const products = String(req.query.product).split(',');
        const placeholders = products.map((_, i) => `@prod${i}`).join(',');
        whereClauses.push(
            `(q.OpportunityId IS NOT NULL AND q.OpportunityId IN (` +
            `  SELECT o.Id FROM Opportunity o` +
            `  LEFT JOIN ProductGroup pg  ON o.ProductGroupId = pg.Id` +
            `  LEFT JOIN ProductGroup ppg ON pg.ParentGroupId = ppg.Id` +
            `  WHERE COALESCE(ppg.Name, pg.Name) IN (${placeholders})` +
            `))`
        );
        products.forEach((p, i) => params[`prod${i}`] = p);
    }
    if (req.query.teamId) {
        const teamIds = String(req.query.teamId).split(',');
        const placeholders = teamIds.map((_, i) => `@teamId${i}`).join(',');
        whereClauses.push(`q.ProposalOwnerId IN (SELECT PersonId FROM TeamMember WHERE TeamId IN (${placeholders}))`);
        teamIds.forEach((id, i) => params[`teamId${i}`] = id);
    }

    const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    // Date-group expression — differs by driver & granularity
    let groupExpr: string;
    if (db.driver === 'mssql') {
        switch (granularity) {
            case 'daily':
                groupExpr = "CONVERT(varchar(10), CAST(q.CreatedOn AS date), 120)";
                break;
            case 'weekly':
                groupExpr = "CAST(YEAR(q.CreatedOn) AS varchar(4)) + '-W' + RIGHT('0' + CAST(DATEPART(iso_week, q.CreatedOn) AS varchar(2)), 2)";
                break;
            default: // monthly
                groupExpr = "FORMAT(q.CreatedOn, 'yyyy-MM')";
        }
    } else {
        // SQLite
        switch (granularity) {
            case 'daily':   groupExpr = "strftime('%Y-%m-%d', q.CreatedOn)"; break;
            case 'weekly':  groupExpr = "strftime('%Y-W%W',   q.CreatedOn)"; break;
            default:        groupExpr = "strftime('%Y-%m',    q.CreatedOn)"; break;
        }
    }

    const amountCol = "COALESCE(q.TotalNetAmountLocalCurrency_Amount, q.TotalAmountWithTaxLocalCurrency_Amount, 0)";

    const sql = `
        SELECT
            ${groupExpr} AS period,
            SUM(CASE WHEN q.Status IN (4, 7, 10) THEN 1 ELSE 0 END)                                   AS won,
            SUM(CASE WHEN q.Status IN (5, 8, 9)  THEN 1 ELSE 0 END)                                   AS lost,
            SUM(CASE WHEN q.Status IN (1, 2, 3, 6) THEN 1 ELSE 0 END)                                 AS open,
            SUM(CASE WHEN q.Status IN (4, 7, 10)   THEN ${amountCol} ELSE 0 END)                      AS wonAmount,
            SUM(CASE WHEN q.Status IN (5, 8, 9)    THEN ${amountCol} ELSE 0 END)                      AS lostAmount,
            SUM(CASE WHEN q.Status IN (1, 2, 3, 6) THEN ${amountCol} ELSE 0 END)                      AS openAmount
        FROM Quote q
        ${whereStr}
        GROUP BY ${groupExpr}
        ORDER BY period ASC
    `;

    try {
        const rows = db.query(sql, params) as Record<string, any>[];

        const result = rows.map(row => {
            const period: string = String(row.period || '');
            let label = period;

            if (granularity === 'monthly' && period.length === 7) {
                const [year, month] = period.split('-');
                label = `${TR_MONTHS[parseInt(month, 10) - 1]}'${year.slice(2)}`;
            } else if (granularity === 'daily' && period.length === 10) {
                const parts = period.split('-');
                label = `${parseInt(parts[2], 10)} ${TR_MONTHS[parseInt(parts[1], 10) - 1]}`;
            } else if (granularity === 'weekly') {
                const wPart = period.includes('-W') ? period.split('-W')[1] : period.split('-')[1] || period;
                label = `Hf${String(wPart).padStart(2, '0')}`;
            }

            return {
                label,
                won:        Number(row.won)        || 0,
                lost:       Number(row.lost)       || 0,
                open:       Number(row.open)       || 0,
                wonAmount:  Number(row.wonAmount)  || 0,
                lostAmount: Number(row.lostAmount) || 0,
                openAmount: Number(row.openAmount) || 0,
            };
        });

        return res.json({ value: result });
    } catch (err) {
        console.error('[quotes/trend] Error:', err);
        return res.status(500).json({ error: 'Failed to compute trend data' });
    }
});

// ─── GET / ────────────────────────────────────────────────────────────────────
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
        LEFT JOIN Account      a   ON q.AccountId       = a.Id
        LEFT JOIN Person       p   ON q.ProposalOwnerId = p.Id
        LEFT JOIN Opportunity  o   ON q.OpportunityId   = o.Id
        LEFT JOIN ProductGroup pg  ON o.ProductGroupId  = pg.Id
        LEFT JOIN ProductGroup ppg ON pg.ParentGroupId  = ppg.Id
        ORDER BY q.CreatedOn DESC
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
        const productName = row.ParentGroupName || row.ProductGroupName || productGroupId || 'Unknown';
        // "Net Toplam Tutar" in Varuna UI = TotalNetAmountLocalCurrency_Amount on the Quote header
        const amount = row.TotalNetAmountLocalCurrency_Amount || row.TotalAmountWithTaxLocalCurrency_Amount || 0;

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
            netAmount: amount,
            currency: 'TRY',
            status: String(statusCode),
            statusLabel: Q_STATUS_LABEL[statusCode] ?? String(statusCode),
            statusTr: Q_STATUS_TR[statusCode] ?? String(statusCode),
            statusCode: String(statusCode),
            createdAt: row.CreatedOn || row.FirstCreatedDate,
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
