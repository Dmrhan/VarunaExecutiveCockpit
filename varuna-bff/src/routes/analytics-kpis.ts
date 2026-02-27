/**
 * analytics-kpis.ts
 * GET /api/analytics/kpis
 *
 * Single endpoint returning all executive summary KPIs.
 * Every number here is computed from the same DB tables as the list endpoints,
 * so "Summary KPI === list total" is guaranteed.
 *
 * Standard query params: ownerId, accountId, from, to (all optional)
 */
import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

// Quote Status integers (must match seed-all.ts + analytics-quote.ts)
const Q_DRAFT = 0;
const Q_SENT = 1;
const Q_ACCEPTED = 2;
const Q_REJECTED = 3;
const Q_REVIEW = 4;
const Q_APPROVED = 5;
const Q_DENIED = 6;

// Opportunity DealStatus integers
const OPP_OPEN = 0;
const OPP_WON = 2;
const OPP_LOST = 3;

// Contract status
const CTR_ACTIVE = 2;

router.get('/', (req: Request, res: Response) => {
    try {
        const db = getDb();

        // ── Shared filter params ──────────────────────────────────────────────
        const whereClauses: string[] = [];
        const qWhere: string[] = [];
        const ordWhere: string[] = [];
        const ctrWhere: string[] = [];
        const params: Record<string, any> = {};

        if (req.query.ownerId) {
            whereClauses.push('OwnerId = @ownerId');
            qWhere.push('ProposalOwnerId = @ownerId');
            ordWhere.push('ProposalOwnerId = @ownerId');
            ctrWhere.push('SalesRepresentativeId = @ownerId');
            params.ownerId = req.query.ownerId;
        }
        if (req.query.accountId) {
            whereClauses.push('AccountId = @accountId');
            qWhere.push('AccountId = @accountId');
            ordWhere.push('AccountId = @accountId');
            ctrWhere.push('AccountId = @accountId');
            params.accountId = req.query.accountId;
        }
        if (req.query.from) {
            whereClauses.push('CloseDate >= @from');
            qWhere.push('FirstCreatedDate >= @from');
            ordWhere.push('CreateOrderDate >= @from');
            ctrWhere.push('StartDate >= @from');
            params.from = req.query.from;
        }
        if (req.query.to) {
            whereClauses.push('CloseDate <= @to');
            qWhere.push('FirstCreatedDate <= @to');
            ordWhere.push('CreateOrderDate <= @to');
            ctrWhere.push('StartDate <= @to');
            params.to = req.query.to;
        }

        const oppExtra = whereClauses.length ? 'AND ' + whereClauses.join(' AND ') : '';
        const quoteExtra = qWhere.length ? 'AND ' + qWhere.join(' AND ') : '';
        const ordExtra = ordWhere.length ? 'AND ' + ordWhere.join(' AND ') : '';
        const ctrExtra = ctrWhere.length ? 'AND ' + ctrWhere.join(' AND ') : '';

        // ── 1. Opportunities ──────────────────────────────────────────────────
        const oppRow = db.queryOne<{
            totalCount: number; totalAmount: number;
            wonCount: number; wonAmount: number;
            lostCount: number; lostAmount: number;
            openCount: number; openAmount: number;
        }>(`
            SELECT
                COUNT(*)                                                                   AS totalCount,
                COALESCE(SUM(Amount_Value), 0)                                             AS totalAmount,
                COALESCE(SUM(CASE WHEN DealStatus = ${OPP_WON}  THEN 1 ELSE 0 END), 0)   AS wonCount,
                COALESCE(SUM(CASE WHEN DealStatus = ${OPP_WON}  THEN Amount_Value ELSE 0 END), 0) AS wonAmount,
                COALESCE(SUM(CASE WHEN DealStatus = ${OPP_LOST} THEN 1 ELSE 0 END), 0)   AS lostCount,
                COALESCE(SUM(CASE WHEN DealStatus = ${OPP_LOST} THEN Amount_Value ELSE 0 END), 0) AS lostAmount,
                COALESCE(SUM(CASE WHEN DealStatus = ${OPP_OPEN} THEN 1 ELSE 0 END), 0)   AS openCount,
                COALESCE(SUM(CASE WHEN DealStatus = ${OPP_OPEN} THEN Amount_Value ELSE 0 END), 0) AS openAmount
            FROM Opportunity
            WHERE 1=1 ${oppExtra}
        `, params)!;

        // Weighted pipeline (open only)
        const weightedRow = db.queryOne<{ weighted: number }>(`
            SELECT COALESCE(SUM(Amount_Value * Probability / 100.0), 0) AS weighted
            FROM Opportunity
            WHERE DealStatus = ${OPP_OPEN} ${oppExtra}
        `, params)!;

        // ── 2. Quotes ─────────────────────────────────────────────────────────
        const qRow = db.queryOne<{
            totalCount: number; totalNet: number; totalVat: number;
            sentCount: number; sentNet: number;
            wonCount: number; wonNet: number; wonVat: number;
            lostCount: number; lostNet: number;
            openCount: number; openNet: number;
            draftCount: number;
        }>(`
            SELECT
                COUNT(*)                                                                                                  AS totalCount,
                COALESCE(SUM(TotalNetAmountLocalCurrency_Amount), 0)                                                      AS totalNet,
                COALESCE(SUM(TotalAmountWithTaxLocalCurrency_Amount), 0)                                                  AS totalVat,
                -- Sent+ (all except Draft)
                COALESCE(SUM(CASE WHEN Status != ${Q_DRAFT} THEN 1 ELSE 0 END), 0)                                       AS sentCount,
                COALESCE(SUM(CASE WHEN Status != ${Q_DRAFT} THEN TotalNetAmountLocalCurrency_Amount ELSE 0 END), 0)       AS sentNet,
                -- Won (Accepted + Approved)
                COALESCE(SUM(CASE WHEN Status IN (${Q_ACCEPTED},${Q_APPROVED}) THEN 1 ELSE 0 END), 0)                    AS wonCount,
                COALESCE(SUM(CASE WHEN Status IN (${Q_ACCEPTED},${Q_APPROVED}) THEN TotalNetAmountLocalCurrency_Amount ELSE 0 END), 0)  AS wonNet,
                COALESCE(SUM(CASE WHEN Status IN (${Q_ACCEPTED},${Q_APPROVED}) THEN TotalAmountWithTaxLocalCurrency_Amount ELSE 0 END), 0) AS wonVat,
                -- Lost (Rejected + Denied)
                COALESCE(SUM(CASE WHEN Status IN (${Q_REJECTED},${Q_DENIED})   THEN 1 ELSE 0 END), 0)                    AS lostCount,
                COALESCE(SUM(CASE WHEN Status IN (${Q_REJECTED},${Q_DENIED})   THEN TotalNetAmountLocalCurrency_Amount ELSE 0 END), 0)  AS lostNet,
                -- Open (Sent + Review)
                COALESCE(SUM(CASE WHEN Status IN (${Q_SENT},${Q_REVIEW})       THEN 1 ELSE 0 END), 0)                    AS openCount,
                COALESCE(SUM(CASE WHEN Status IN (${Q_SENT},${Q_REVIEW})       THEN TotalNetAmountLocalCurrency_Amount ELSE 0 END), 0)  AS openNet,
                -- Draft
                COALESCE(SUM(CASE WHEN Status = ${Q_DRAFT} THEN 1 ELSE 0 END), 0)                                        AS draftCount
            FROM Quote
            WHERE 1=1 ${quoteExtra}
        `, params)!;

        // Conversion rates
        const quoteToOppRate = oppRow.totalCount > 0
            ? (qRow.totalCount / oppRow.totalCount * 100)
            : 0;
        const wonQuoteRateByRevenue = qRow.sentNet > 0
            ? (qRow.wonNet / qRow.sentNet * 100)
            : 0;
        const wonQuoteRateByCount = qRow.sentCount > 0
            ? (qRow.wonCount / qRow.sentCount * 100)
            : 0;
        const proposalConversionRate = oppRow.totalAmount > 0
            ? (qRow.sentNet / oppRow.totalAmount * 100)
            : 0;

        // ── 3. Orders ─────────────────────────────────────────────────────────
        const ordRow = db.queryOne<{
            totalCount: number; totalNet: number; totalVat: number;
            openCount: number; openVat: number;
            invoicedCount: number; invoicedNet: number;
        }>(`
            SELECT
                COUNT(*)                                                                                          AS totalCount,
                COALESCE(SUM(TotalNetAmountLocalCurrency_Amount), 0)                                              AS totalNet,
                COALESCE(SUM(TotalAmountWithTaxLocalCurrency_Amount), 0)                                          AS totalVat,
                COALESCE(SUM(CASE WHEN Status = 0 THEN 1 ELSE 0 END), 0)                                         AS openCount,
                COALESCE(SUM(CASE WHEN Status = 0 THEN TotalAmountWithTaxLocalCurrency_Amount ELSE 0 END), 0)     AS openVat,
                COALESCE(SUM(CASE WHEN InvoiceDate IS NOT NULL THEN 1 ELSE 0 END), 0)                            AS invoicedCount,
                COALESCE(SUM(CASE WHEN InvoiceDate IS NOT NULL THEN TotalNetAmountLocalCurrency_Amount ELSE 0 END), 0) AS invoicedNet
            FROM CrmOrder
            WHERE 1=1 ${ordExtra}
        `, params)!;

        // ── 4. Contracts ─────────────────────────────────────────────────────
        const ctrRow = db.queryOne<{
            totalCount: number; totalAmount: number;
            activeCount: number; activeAmount: number;
        }>(`
            SELECT
                COUNT(*)                                                                                         AS totalCount,
                COALESCE(SUM(TotalAmountLocalCurrency_Amount), 0)                                                AS totalAmount,
                COALESCE(SUM(CASE WHEN ContractStatus = ${CTR_ACTIVE} THEN 1 ELSE 0 END), 0)                    AS activeCount,
                COALESCE(SUM(CASE WHEN ContractStatus = ${CTR_ACTIVE} THEN TotalAmountLocalCurrency_Amount ELSE 0 END), 0) AS activeAmount
            FROM Contract
            WHERE 1=1 ${ctrExtra}
        `, params)!;

        // ── 5. Collections (Payment Plans) ───────────────────────────────────
        const collRow = db.queryOne<{
            collectedCount: number; collectedAmount: number;
            pendingCount: number; pendingAmount: number;
        }>(`
            SELECT
                COALESCE(SUM(CASE WHEN cpp.HasBeenCollected = 1 THEN 1 ELSE 0 END), 0)                      AS collectedCount,
                COALESCE(SUM(CASE WHEN cpp.HasBeenCollected = 1 THEN cpp.Price_Amount ELSE 0 END), 0)        AS collectedAmount,
                COALESCE(SUM(CASE WHEN cpp.HasBeenCollected = 0 THEN 1 ELSE 0 END), 0)                      AS pendingCount,
                COALESCE(SUM(CASE WHEN cpp.HasBeenCollected = 0 THEN cpp.Price_Amount ELSE 0 END), 0)        AS pendingAmount
            FROM ContractPaymentPlans cpp
            INNER JOIN Contract c ON cpp.ContractId = c.Id
            WHERE 1=1 ${ctrExtra.replace(/StartDate/g, 'c.StartDate').replace(/AccountId/g, 'c.AccountId').replace(/SalesRepresentativeId/g, 'c.SalesRepresentativeId')}
        `, params)!;

        // ── Response ─────────────────────────────────────────────────────────
        return res.json({
            opportunities: {
                totalCount: oppRow.totalCount,
                totalAmount: oppRow.totalAmount,
                openCount: oppRow.openCount,
                openAmount: oppRow.openAmount,
                wonCount: oppRow.wonCount,
                wonAmount: oppRow.wonAmount,
                lostCount: oppRow.lostCount,
                lostAmount: oppRow.lostAmount,
                weightedPipeline: weightedRow.weighted,
            },
            quotes: {
                totalCount: qRow.totalCount,
                totalNet: qRow.totalNet,
                sentCount: qRow.sentCount,
                sentNet: qRow.sentNet,
                wonCount: qRow.wonCount,
                wonNet: qRow.wonNet,
                wonVat: qRow.wonVat,
                lostCount: qRow.lostCount,
                lostNet: qRow.lostNet,
                openCount: qRow.openCount,
                openNet: qRow.openNet,
                draftCount: qRow.draftCount,
                // Rates
                proposalConversionRate: Math.round(proposalConversionRate * 10) / 10,
                wonQuoteRateByRevenue: Math.round(wonQuoteRateByRevenue * 10) / 10,
                wonQuoteRateByCount: Math.round(wonQuoteRateByCount * 10) / 10,
                quoteToOppRate: Math.round(quoteToOppRate * 10) / 10,
            },
            orders: {
                totalCount: ordRow.totalCount,
                totalNet: ordRow.totalNet,
                totalVat: ordRow.totalVat,
                openCount: ordRow.openCount,
                openVat: ordRow.openVat,
                invoicedCount: ordRow.invoicedCount,
                invoicedNet: ordRow.invoicedNet,
            },
            contracts: {
                totalCount: ctrRow.totalCount,
                totalAmount: ctrRow.totalAmount,
                activeCount: ctrRow.activeCount,
                activeAmount: ctrRow.activeAmount,
            },
            collections: {
                collectedCount: collRow.collectedCount,
                collectedAmount: collRow.collectedAmount,
                pendingCount: collRow.pendingCount,
                pendingAmount: collRow.pendingAmount,
            },
            // Summary for executive funnel cards (ordered: Opp → Quote → Won → Order → Invoice)
            funnel: [
                {
                    label: 'Toplam Fırsat',
                    labelEn: 'Total Opportunities',
                    amount: oppRow.totalAmount,
                    count: oppRow.totalCount,
                    type: 'opportunity',
                },
                {
                    label: 'Teklif Gönderildi',
                    labelEn: 'Quotes Sent',
                    amount: qRow.sentNet,
                    count: qRow.sentCount,
                    type: 'quote_sent',
                    conversionRate: Math.round(proposalConversionRate * 10) / 10,
                    conversionRateCount: Math.round(quoteToOppRate * 10) / 10,
                },
                {
                    label: 'Kazanılan Teklifler',
                    labelEn: 'Won Quotes',
                    amount: qRow.wonNet,
                    count: qRow.wonCount,
                    type: 'quote_won',
                    conversionRate: Math.round(wonQuoteRateByRevenue * 10) / 10,
                    conversionRateCount: Math.round(wonQuoteRateByCount * 10) / 10,
                },
                {
                    label: 'Açık Siparişler',
                    labelEn: 'Open Orders',
                    amount: ordRow.openVat,
                    count: ordRow.openCount,
                    type: 'order_open',
                },
                {
                    label: 'Faturalandı',
                    labelEn: 'Invoiced',
                    amount: ordRow.invoicedNet,
                    count: ordRow.invoicedCount,
                    type: 'invoiced',
                },
            ],
        });

    } catch (err: any) {
        console.error('[/api/analytics/kpis]', err);
        return res.status(500).json({ error: err.message });
    }
});

export default router;
