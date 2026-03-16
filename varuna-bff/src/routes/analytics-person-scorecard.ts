import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

// ============================================================================
// Person 360 Scorecard Analytics - Aggregates the whole pipeline for a person
// Route: GET /api/analytics/person-scorecard
// Query Params: personId, companyId, from, to, asOf
// ============================================================================
router.get('/', (req: Request, res: Response) => {
    try {
        const db = getDb();
        const { personId, companyId, from, to, asOf } = req.query;

        if (!personId) {
            return res.status(400).json({ error: 'personId is required' });
        }

        // As-Of date logic: default to today if not provided
        const asOfDate = asOf ? String(asOf) : new Date().toISOString().split('T')[0];

        let baseFilter = '';
        let baseParams: any[] = [];

        // Shared date filtering snippet
        const getDateFilter = (dateCol: string) => {
            let sql = ` AND ${dateCol} <= ?`;
            let prm = [asOfDate];
            if (from) { sql += ` AND ${dateCol} >= ?`; prm.push(String(from)); }
            if (to) { sql += ` AND ${dateCol} <= ?`; prm.push(String(to)); }
            return { sql, prm };
        };

        const oppDates = getDateFilter('FirstCreatedDate');
        // Quote dates built directly where needed to add table prefix.
        const orderDates = getDateFilter('CreateOrderDate');
        const contractDates = getDateFilter('StartDate');
        const calDates = getDateFilter('StartDate');

        // COMPANY FILTER
        let companyFilterSql = '';
        let companyPrm: any[] = [];
        if (companyId) {
            companyFilterSql = ` AND CompanyId = ?`;
            companyPrm.push(String(companyId));
        }

        // 1. KPI & Funnel Metrics ------------------------------

        // Opportunity
        const oppQuery = `
            SELECT 
                COUNT(Id) as count, 
                COALESCE(SUM(Amount_Value), 0) as amount,
                SUM(CASE WHEN DealStatus = 0 THEN 1 ELSE 0 END) as openCount,
                COALESCE(SUM(CASE WHEN DealStatus = 0 THEN Amount_Value ELSE 0 END), 0) as openAmount
            FROM Opportunity 
            WHERE OwnerId = ? ${companyFilterSql} ${oppDates.sql}
        `;
        const oppRes = db.queryOne<{ count: number, amount: number, openCount: number, openAmount: number }>(
            oppQuery, [personId, ...companyPrm, ...oppDates.prm]
        ) || { count: 0, amount: 0, openCount: 0, openAmount: 0 };

        // Quote
        const quoteDates = getDateFilter('q.FirstCreatedDate');
        const quoteQuery = `
            SELECT 
                COUNT(q.Id) as count, 
                COALESCE(SUM(q.TotalNetAmountLocalCurrency_Amount), 0) as amount,
                SUM(CASE WHEN q.Status = 1 AND (o.Status IS NULL OR o.Status != 3) THEN 1 ELSE 0 END) as wonCount,
                COALESCE(SUM(CASE WHEN q.Status = 1 AND (o.Status IS NULL OR o.Status != 3) THEN q.TotalNetAmountLocalCurrency_Amount ELSE 0 END), 0) as wonAmount
            FROM Quote q
            LEFT JOIN CrmOrder o ON q.Id = o.QuoteId
            WHERE q.ProposalOwnerId = ? ${companyFilterSql.replace('CompanyId', 'q.CompanyId')} ${quoteDates.sql} AND q.Status != 5
        `;
        const quoteRes = db.queryOne<{ count: number, amount: number, wonCount: number, wonAmount: number }>(
            quoteQuery, [personId, ...companyPrm, ...quoteDates.prm]
        ) || { count: 0, amount: 0, wonCount: 0, wonAmount: 0 };

        // Order
        const orderQuery = `
            SELECT 
                COUNT(Id) as count, 
                COALESCE(SUM(TotalNetAmountLocalCurrency_Amount), 0) as amount,
                SUM(CASE WHEN Status != 3 AND InvoiceDate IS NULL THEN 1 ELSE 0 END) as openCount, 
                COALESCE(SUM(CASE WHEN Status != 3 AND InvoiceDate IS NULL THEN TotalNetAmountLocalCurrency_Amount ELSE 0 END), 0) as openAmount,
                SUM(CASE WHEN InvoiceDate IS NOT NULL THEN 1 ELSE 0 END) as invoiceCount,
                COALESCE(SUM(CASE WHEN InvoiceDate IS NOT NULL THEN TotalNetAmountLocalCurrency_Amount ELSE 0 END), 0) as invoiceAmount
            FROM CrmOrder 
            WHERE ProposalOwnerId = ? ${companyFilterSql} ${orderDates.sql}
        `;
        const orderRes = db.queryOne<{ count: number, amount: number, openCount: number, openAmount: number, invoiceCount: number, invoiceAmount: number }>(
            orderQuery, [personId, ...companyPrm, ...orderDates.prm]
        ) || { count: 0, amount: 0, openCount: 0, openAmount: 0, invoiceCount: 0, invoiceAmount: 0 };

        // Contract
        const contractQuery = `
            SELECT 
                COUNT(Id) as count, 
                COALESCE(SUM(TotalAmountLocalCurrency_Amount), 0) as amount
            FROM Contract 
            WHERE SalesRepresentativeId = ? ${companyFilterSql} ${contractDates.sql}
        `;
        const contractRes = db.queryOne<{ count: number, amount: number }>(
            contractQuery, [personId, ...companyPrm, ...contractDates.prm]
        ) || { count: 0, amount: 0 };

        // Collection (ContractPaymentPlans)
        const collectionQuery = `
            SELECT 
                COUNT(cp.Id) as count, 
                COALESCE(SUM(cp.Price_Amount), 0) as amount,
                SUM(CASE WHEN cp.HasBeenCollected = 1 THEN 1 ELSE 0 END) as collectedCount,
                COALESCE(SUM(CASE WHEN cp.HasBeenCollected = 1 THEN cp.Price_Amount ELSE 0 END), 0) as collectedAmount
            FROM ContractPaymentPlans cp
            INNER JOIN Contract c ON cp.ContractId = c.Id
            WHERE c.SalesRepresentativeId = ? ${companyFilterSql} AND cp.PaymentDate <= ?
        `;
        const collectionPrm = [personId, ...companyPrm, asOfDate];
        const collectionRes = db.queryOne<{ count: number, amount: number, collectedCount: number, collectedAmount: number }>(
            collectionQuery, collectionPrm
        ) || { count: 0, amount: 0, collectedCount: 0, collectedAmount: 0 };

        // 2. Trend Monitor Data (Monthly)
        const trendData = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(asOfDate);
            d.setMonth(d.getMonth() - i);
            const mLabel = d.toLocaleString('default', { month: 'short' });
            const y = d.getFullYear();
            const eom = new Date(y, d.getMonth() + 1, 0).toISOString().split('T')[0];

            let tContract = { amount: 0 };
            let tInvoice = { amount: 0 };
            let tCollection = { amount: 0 };

            try {
                const cRow = db.queryOne<{ amount: number }>(`
                    SELECT COALESCE(SUM(TotalAmountLocalCurrency_Amount), 0) as amount
                    FROM Contract WHERE SalesRepresentativeId = ? AND StartDate <= ?
                `, [personId, eom]);
                if (cRow) tContract.amount = cRow.amount;

                const iRow = db.queryOne<{ amount: number }>(`
                    SELECT COALESCE(SUM(TotalNetAmountLocalCurrency_Amount), 0) as amount
                    FROM CrmOrder WHERE ProposalOwnerId = ? AND InvoiceDate <= ? AND Status != 3
                `, [personId, eom]);
                if (iRow) tInvoice.amount = iRow.amount;

                const colRow = db.queryOne<{ amount: number }>(`
                    SELECT COALESCE(SUM(cp.Price_Amount), 0) as amount
                    FROM ContractPaymentPlans cp
                    INNER JOIN Contract c ON cp.ContractId = c.Id
                    WHERE c.SalesRepresentativeId = ? AND cp.PaymentDate <= ? AND cp.HasBeenCollected = 1
                `, [personId, eom]);
                if (colRow) tCollection.amount = colRow.amount;
            } catch (ex) { }

            trendData.push({
                name: `${mLabel} ${y}`,
                contractRevenue: tContract.amount,
                invoiceRevenue: tInvoice.amount,
                collectionRevenue: tCollection.amount,
                target: Math.max(tContract.amount, 10000000) * 1.2
            });
        }

        // 3. Contract Workload (Account & Status)
        // 4. Contracts by Account
        const contractsByAccount = db.query(`
            SELECT 
                c.AccountId, 
                COALESCE(a.Title, a.Name, c.AccountId) as accountName,
                COUNT(c.Id) as contractCount, 
                COALESCE(SUM(c.TotalAmountLocalCurrency_Amount), 0) as contractAmount
            FROM Contract c
            LEFT JOIN Account a ON c.AccountId = a.Id
            WHERE c.SalesRepresentativeId = ? ${companyFilterSql} ${contractDates.sql}
            GROUP BY c.AccountId, a.Title, a.Name
            ORDER BY contractAmount DESC
            ${db.driver === 'mssql' ? 'OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY' : 'LIMIT 10'}
        `, [personId, ...companyPrm, ...contractDates.prm]);

        const statusCase = `
            CASE c.ContractStatus
                WHEN 0 THEN 'Hazırlık Aşamasında'
                WHEN 1 THEN 'Satışta - Bilgi Bekliyor'
                WHEN 2 THEN 'Fiyat Müzakerede'
                WHEN 3 THEN 'Metin Müzakerede'
                WHEN 4 THEN 'Univera İmzasında'
                WHEN 5 THEN 'Müşteri İmzasında'
                WHEN 6 THEN 'Süresi Dolmadı'
                WHEN 7 THEN 'Bakıma Devir Olmadı'
                WHEN 8 THEN 'Arşivlendi'
                WHEN 9 THEN 'Fesih / İptal'
                WHEN 10 THEN 'Yenilendi / Süresi Doldu'
                ELSE 'Bilinmeyen (' ${db.driver === 'mssql' ? '+' : '||'} CAST(c.ContractStatus AS VARCHAR) ${db.driver === 'mssql' ? '+' : '||'} ')'
            END
                    `;

        const contractsByStatus = db.query(`
            SELECT 
                ${statusCase} as statusLabel,
                CAST(c.ContractStatus AS INT) as statusCode,
                COUNT(c.Id) as count,
                COALESCE(SUM(c.TotalAmountLocalCurrency_Amount), 0) as amount
            FROM Contract c
            WHERE c.SalesRepresentativeId = ? ${companyFilterSql} ${contractDates.sql}
            GROUP BY c.ContractStatus
            ORDER BY amount DESC
                `, [personId, ...companyPrm, ...contractDates.prm]);

        // 4. Last Meetings / Events
        const lastEvents = db.query(`
            SELECT 
                c.Id as id,
                c.Subject as subject,
                c.Type as typeId,
                a.Name as accountName,
                c.StartDate as date
            FROM CalenderEvent c
            LEFT JOIN Account a ON c.AccountId = a.Id
            WHERE c.OwnerId = ? ${calDates.sql}
            ORDER BY c.StartDate DESC
            ${db.driver === 'mssql' ? 'OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY' : 'LIMIT 10'}
                `, [personId, ...calDates.prm]);

        // 5. Team Rank calculation
        let teamRank = { rank: 1, totalMembers: 1, teamId: null as string | null, metric: 'YTD Won Quote' };
        try {
            const personRow = db.queryOne<{ TeamId: string }>(`SELECT TeamId FROM Person WHERE Id = ? `, [personId]);
            if (personRow && personRow.TeamId) {
                teamRank.teamId = personRow.TeamId;
                const teamMembers = db.query<{ id: string, amount: number }>(`
                    SELECT p.Id as id, COALESCE(SUM(
                        CASE WHEN q.Status = 1 AND (o.Status IS NULL OR o.Status != 3)
                        THEN q.TotalNetAmountLocalCurrency_Amount ELSE 0 END
                    ), 0) as amount
                    FROM Person p
            LEFT JOIN Quote q ON p.Id = q.ProposalOwnerId
            LEFT JOIN CrmOrder o ON q.Id = o.QuoteId
                    WHERE p.TeamId = ?
                GROUP BY p.Id
                    ORDER BY amount DESC
                `, [personRow.TeamId]);

                teamRank.totalMembers = teamMembers.length;
                const rankIndex = teamMembers.findIndex((m: any) => m.id === personId);
                if (rankIndex >= 0) {
                    teamRank.rank = rankIndex + 1;
                    if (teamMembers.length > 0 && rankIndex > 0) {
                        (teamRank as any).differenceToTop = teamMembers[0].amount - teamMembers[rankIndex].amount;
                    } else {
                        (teamRank as any).differenceToTop = 0;
                    }
                }
            }
        } catch (e) { }

        // 6. Opportunities by expected close month
        const opportunitiesByCloseMonth = db.query(`
            SELECT 
                ${db.driver === 'mssql' ? "FORMAT(o.CloseDate, 'yyyy-MM')" : "strftime('%Y-%m', o.CloseDate)"} as monthKey,
                COALESCE(SUM(o.ExpectedRevenue_Value), 0) as expectedRevenue,
                COUNT(o.Id) as count
            FROM Opportunity o
            WHERE o.OwnerId = ? AND (o.OpportunityStageNameTr NOT IN ('Kazanıldı', 'Order', 'Kaybedildi', 'Lost')) AND o.CloseDate IS NOT NULL ${companyFilterSql.replace('CompanyId', 'o.CompanyId')} ${oppDates.sql.replace('FirstCreatedDate', 'o.FirstCreatedDate')}
            GROUP BY ${db.driver === 'mssql' ? "FORMAT(o.CloseDate, 'yyyy-MM')" : "strftime('%Y-%m', o.CloseDate)"}
            ORDER BY monthKey ASC
        `, [personId, ...companyPrm, ...oppDates.prm]);

        // Post-process the months to readable formats if needed, or send as is
        const formattedOpportunitiesChart = opportunitiesByCloseMonth
            .filter((row: any) => row.monthKey)
            .map((row: any) => {
                const parts = row.monthKey.split('-');
                const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
                const monthName = dateObj.toLocaleString('tr-TR', { month: 'short' });
                return {
                    name: `${monthName} ${parts[0]}`,
                    monthKey: row.monthKey,
                    expectedRevenue: row.expectedRevenue,
                    count: row.count
                };
            });

        const openOpportunitiesList = db.query(`
            SELECT 
                o.Id as id,
                o.Name as name,
                a.Name as accountName,
                COALESCE(o.ExpectedRevenue_Value, 0) as expectedRevenue,
                ${db.driver === 'mssql' ? "FORMAT(o.CloseDate, 'yyyy-MM')" : "strftime('%Y-%m', o.CloseDate)"} as monthKey,
                o.CloseDate as expectedCloseDate,
                o.DealStatus as dealStatus,
                o.OpportunityStageNameTr as stageName
            FROM Opportunity o
            LEFT JOIN Account a ON o.AccountId = a.Id
            WHERE o.OwnerId = ? AND (o.OpportunityStageNameTr NOT IN ('Kazanıldı', 'Order', 'Kaybedildi', 'Lost')) AND o.CloseDate IS NOT NULL ${companyFilterSql.replace('CompanyId', 'o.CompanyId')} ${oppDates.sql.replace('FirstCreatedDate', 'o.FirstCreatedDate')}
            ORDER BY o.CloseDate ASC
        `, [personId, ...companyPrm, ...oppDates.prm]);

        // --- Build response object ---
        const responseData = {
            kpis: {
                openOpportunity: { amount: oppRes.openAmount, count: oppRes.openCount },
                quoteSent: { amount: quoteRes.amount, count: quoteRes.count },
                quoteWon: { amount: quoteRes.wonAmount, count: quoteRes.wonCount },
                quoteWinRate: quoteRes.amount > 0 ? (quoteRes.wonAmount / quoteRes.amount) : 0,
                openOrder: { amount: orderRes.openAmount, count: orderRes.openCount },
                contract: { amount: contractRes.amount, count: contractRes.count },
                ytdInvoice: { amount: orderRes.invoiceAmount, count: orderRes.invoiceCount },
                ytdCollection: { amount: collectionRes.collectedAmount, count: collectionRes.collectedCount, collectedAmount: collectionRes.collectedAmount, pendingAmount: collectionRes.amount - collectionRes.collectedAmount }
            },
            funnel: [
                { id: 'opportunity', label: 'Opportunity', amount: oppRes.amount, count: oppRes.count },
                { id: 'quote', label: 'Quote', amount: quoteRes.amount, count: quoteRes.count },
                { id: 'won_quote', label: 'Won Quote', amount: quoteRes.wonAmount, count: quoteRes.wonCount },
                { id: 'order', label: 'Order', amount: orderRes.amount, count: orderRes.count },
                { id: 'contract', label: 'Contract', amount: contractRes.amount, count: contractRes.count },
                { id: 'invoice', label: 'Invoice', amount: orderRes.invoiceAmount, count: orderRes.invoiceCount },
                { id: 'collection', label: 'Collection', amount: collectionRes.collectedAmount, count: collectionRes.collectedCount }
            ],
            trend: trendData,
            contractsByAccount,
            contractsByStatus,
            lastEvents,
            teamRank,
            opportunitiesByCloseMonth: formattedOpportunitiesChart,
            openOpportunitiesList
        };

        res.json(responseData);

    } catch (e: any) {
        console.error('Person Scorecard error:', e);
        res.status(500).json({ error: e.message });
    }
});

export default router;
