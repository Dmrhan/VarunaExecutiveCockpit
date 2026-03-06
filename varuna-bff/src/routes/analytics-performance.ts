import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

// ============================================================================
// Performance Analytics - Daily Cockpit, Monthly Trend, Burnup
// ============================================================================

router.get('/daily', (req: Request, res: Response) => {
    try {
        const db = getDb();
        const asOfDate = (req.query.asOfDate as string) || new Date().toISOString().split('T')[0];
        const companyId = req.query.companyId as string | undefined;
        const ownerId = req.query.ownerId as string | undefined;
        const monthlyTarget = Number(req.query.monthlyTarget) || 0;
        const yearlyTarget = Number(req.query.yearlyTarget) || 0;

        const asOf = asOfDate;
        const monthStart = asOfDate.substring(0, 7) + '-01';
        const yearStart = asOfDate.substring(0, 4) + '-01-01';
        const weekStart = (() => {
            const d = new Date(asOfDate);
            const day = d.getDay();
            const diff = (day === 0 ? -6 : 1 - day);
            d.setDate(d.getDate() + diff);
            return d.toISOString().split('T')[0];
        })();
        const yesterday = (() => {
            const d = new Date(asOfDate);
            d.setDate(d.getDate() - 1);
            return d.toISOString().split('T')[0];
        })();

        let ownerWhere = '';
        const params: any[] = [];
        if (ownerId) {
            ownerWhere = ' AND SalesRepresentativeId = ?';
            params.push(ownerId);
        }
        let companyWhere = '';
        if (companyId) {
            companyWhere = ' AND CompanyId = ?';
            params.push(companyId);
        }

        let orderOwner = '';
        const orderParams: any[] = [];
        if (ownerId) {
            orderOwner = ' AND ProposalOwnerId = ?';
            orderParams.push(ownerId);
        }
        if (req.query.teamId) {
            const teamIds = String(req.query.teamId).split(',');
            const placeholders = teamIds.map(() => '?').join(',');
            orderOwner += ` AND ProposalOwnerId IN (SELECT PersonId FROM TeamMember WHERE TeamId IN (${placeholders}))`;
            orderParams.push(...teamIds);

            // Also apply to ownerWhere for contracts
            ownerWhere += ` AND SalesRepresentativeId IN (SELECT PersonId FROM TeamMember WHERE TeamId IN (${placeholders}))`;
            params.push(...teamIds);
        }

        let orderCompany = '';
        if (companyId) {
            orderCompany = ' AND CompanyId = ?';
            orderParams.push(companyId);
        }

        // Contract queries
        const weeklyContractRow = db.queryOne(`SELECT COUNT(*) as cnt, COALESCE(SUM(TotalAmountLocalCurrency_Amount),0) as amt FROM Contract WHERE SigningDate >= ? AND SigningDate <= ? ${ownerWhere} ${companyWhere}`, [weekStart, asOf, ...params]) as { cnt: number; amt: number };
        const monthlyContractRow = db.queryOne(`SELECT COUNT(*) as cnt, COALESCE(SUM(TotalAmountLocalCurrency_Amount),0) as amt FROM Contract WHERE SigningDate >= ? AND SigningDate <= ? ${ownerWhere} ${companyWhere}`, [monthStart, asOf, ...params]) as { cnt: number; amt: number };
        const prevMonthlyContractRow = db.queryOne(`SELECT COALESCE(SUM(TotalAmountLocalCurrency_Amount),0) as amt FROM Contract WHERE SigningDate >= ? AND SigningDate <= ? ${ownerWhere} ${companyWhere}`, [monthStart, yesterday, ...params]) as { amt: number };
        const prevWeeklyContractRow = db.queryOne(`SELECT COALESCE(SUM(TotalAmountLocalCurrency_Amount),0) as amt FROM Contract WHERE SigningDate >= ? AND SigningDate <= ? ${ownerWhere} ${companyWhere}`, [weekStart, yesterday, ...params]) as { amt: number };
        const openContractRow = db.queryOne(`SELECT COUNT(*) as cnt, COALESCE(SUM(TotalAmountLocalCurrency_Amount),0) as amt FROM Contract WHERE ContractStatus = 2 ${ownerWhere} ${companyWhere}`, params) as { cnt: number; amt: number };

        const MonthlyContractTarget = monthlyTarget;
        const MonthlyContractAchievementRate = MonthlyContractTarget > 0 ? (monthlyContractRow.amt / MonthlyContractTarget) * 100 : 0;
        const PipelineImpactMonthlyRate = MonthlyContractTarget > 0 ? ((monthlyContractRow.amt + openContractRow.amt) / MonthlyContractTarget) * 100 : 0;
        const PipelineImpactYearlyRate = yearlyTarget > 0 ? ((monthlyContractRow.amt + openContractRow.amt) / yearlyTarget) * 100 : 0;

        // Invoice queries
        const activeOrderCond = `Status != 5 AND COALESCE(IsDeletedFromBackend, 0) = 0`;
        const todayInvoiceRow = db.queryOne(`SELECT COUNT(*) as cnt, COALESCE(SUM(TotalNetAmountLocalCurrency_Amount),0) as amt FROM CrmOrder WHERE ${activeOrderCond} AND InvoiceDate = ? ${orderOwner} ${orderCompany}`, [asOf, ...orderParams]) as { cnt: number; amt: number };
        const prevTodayInvoiceRow = db.queryOne(`SELECT COALESCE(SUM(TotalNetAmountLocalCurrency_Amount),0) as amt FROM CrmOrder WHERE ${activeOrderCond} AND InvoiceDate = ? ${orderOwner} ${orderCompany}`, [yesterday, ...orderParams]) as { amt: number };
        const weeklyInvoiceRow = db.queryOne(`SELECT COUNT(*) as cnt, COALESCE(SUM(TotalNetAmountLocalCurrency_Amount),0) as amt FROM CrmOrder WHERE ${activeOrderCond} AND InvoiceDate >= ? AND InvoiceDate <= ? ${orderOwner} ${orderCompany}`, [weekStart, asOf, ...orderParams]) as { cnt: number; amt: number };
        const prevWeeklyInvoiceRow = db.queryOne(`SELECT COALESCE(SUM(TotalNetAmountLocalCurrency_Amount),0) as amt FROM CrmOrder WHERE ${activeOrderCond} AND InvoiceDate >= ? AND InvoiceDate <= ? ${orderOwner} ${orderCompany}`, [weekStart, yesterday, ...orderParams]) as { amt: number };
        const monthlyInvoiceRow = db.queryOne(`SELECT COUNT(*) as cnt, COALESCE(SUM(TotalNetAmountLocalCurrency_Amount),0) as amt FROM CrmOrder WHERE ${activeOrderCond} AND InvoiceDate >= ? AND InvoiceDate <= ? ${orderOwner} ${orderCompany}`, [monthStart, asOf, ...orderParams]) as { cnt: number; amt: number };
        const prevMonthlyInvoiceRow = db.queryOne(`SELECT COALESCE(SUM(TotalNetAmountLocalCurrency_Amount),0) as amt FROM CrmOrder WHERE ${activeOrderCond} AND InvoiceDate >= ? AND InvoiceDate <= ? ${orderOwner} ${orderCompany}`, [monthStart, yesterday, ...orderParams]) as { amt: number };
        const ytdInvoiceRow = db.queryOne(`SELECT COALESCE(SUM(TotalNetAmountLocalCurrency_Amount),0) as amt FROM CrmOrder WHERE ${activeOrderCond} AND InvoiceDate >= ? AND InvoiceDate <= ? ${orderOwner} ${orderCompany}`, [yearStart, asOf, ...orderParams]) as { amt: number };
        const prevYtdInvoiceRow = db.queryOne(`SELECT COALESCE(SUM(TotalNetAmountLocalCurrency_Amount),0) as amt FROM CrmOrder WHERE ${activeOrderCond} AND InvoiceDate >= ? AND InvoiceDate <= ? ${orderOwner} ${orderCompany}`, [yearStart, yesterday, ...orderParams]) as { amt: number };

        const MonthlyInvoiceTarget = monthlyTarget;
        const YearlyInvoiceTarget = yearlyTarget;
        const MonthlyAchievementRate = MonthlyInvoiceTarget > 0 ? (monthlyInvoiceRow.amt / MonthlyInvoiceTarget) * 100 : 0;
        const YearlyAchievementRate = YearlyInvoiceTarget > 0 ? (ytdInvoiceRow.amt / YearlyInvoiceTarget) * 100 : 0;
        const RevenueGap = Math.max(0, YearlyInvoiceTarget - ytdInvoiceRow.amt);

        // Collection queries
        let contractJoin = ' INNER JOIN Contract c ON cpp.ContractId = c.Id';
        const joinParams: any[] = [];
        if (ownerId) {
            contractJoin += ' AND c.SalesRepresentativeId = ?';
            joinParams.push(ownerId);
        }
        if (req.query.teamId) {
            const teamIds = String(req.query.teamId).split(',');
            const placeholders = teamIds.map(() => '?').join(',');
            contractJoin += ` AND c.SalesRepresentativeId IN (SELECT PersonId FROM TeamMember WHERE TeamId IN (${placeholders}))`;
            joinParams.push(...teamIds);
        }

        if (companyId) {
            contractJoin += ' AND c.CompanyId = ?';
            joinParams.push(companyId);
        }

        const todayDueRow = db.queryOne(`SELECT COALESCE(SUM(cpp.Price_Amount),0) as amt FROM ContractPaymentPlans cpp ${contractJoin} WHERE cpp.PaymentDate = ?`, [...joinParams, asOf]) as { amt: number };
        const prevTodayDueRow = db.queryOne(`SELECT COALESCE(SUM(cpp.Price_Amount),0) as amt FROM ContractPaymentPlans cpp ${contractJoin} WHERE cpp.PaymentDate = ?`, [...joinParams, yesterday]) as { amt: number };
        const todayCollectedRow = db.queryOne(`SELECT COALESCE(SUM(cpp.Price_Amount),0) as amt FROM ContractPaymentPlans cpp ${contractJoin} WHERE cpp.HasBeenCollected = 1 AND cpp.PaymentDate = ?`, [...joinParams, asOf]) as { amt: number };
        const prevTodayCollectedRow = db.queryOne(`SELECT COALESCE(SUM(cpp.Price_Amount),0) as amt FROM ContractPaymentPlans cpp ${contractJoin} WHERE cpp.HasBeenCollected = 1 AND cpp.PaymentDate = ?`, [...joinParams, yesterday]) as { amt: number };
        const collectionTotals = db.queryOne(`SELECT COALESCE(SUM(cpp.Price_Amount),0) as total, COALESCE(SUM(CASE WHEN cpp.HasBeenCollected=1 THEN cpp.Price_Amount ELSE 0 END),0) as collected FROM ContractPaymentPlans cpp ${contractJoin}`, joinParams) as { total: number; collected: number };
        const CollectionRatio = collectionTotals.total > 0 ? (collectionTotals.collected / collectionTotals.total) * 100 : 0;
        const openReceivableRiskRow = db.queryOne(`SELECT COALESCE(SUM(cpp.Price_Amount),0) as amt FROM ContractPaymentPlans cpp ${contractJoin} WHERE cpp.HasBeenCollected = 0 AND cpp.PaymentDate < ?`, [...joinParams, asOf]) as { amt: number };

        res.json({
            WeeklyContractCount: weeklyContractRow.cnt, WeeklyContractAmount: weeklyContractRow.amt,
            MonthlyContractCount: monthlyContractRow.cnt, MonthlyContractAmount: monthlyContractRow.amt,
            OpenContractCount: openContractRow.cnt, OpenContractPotentialAmount: openContractRow.amt,
            MonthlyContractTarget, MonthlyContractAchievementRate, PipelineImpactMonthlyRate, PipelineImpactYearlyRate,
            TodayInvoiceCount: todayInvoiceRow.cnt, TodayInvoiceAmount: todayInvoiceRow.amt,
            WeeklyInvoiceCount: weeklyInvoiceRow.cnt, WeeklyInvoiceAmount: weeklyInvoiceRow.amt,
            MonthlyInvoiceCount: monthlyInvoiceRow.cnt, MonthlyInvoiceAmount: monthlyInvoiceRow.amt,
            YTDInvoiceAmount: ytdInvoiceRow.amt,
            MonthlyInvoiceTarget, YearlyInvoiceTarget, MonthlyAchievementRate, YearlyAchievementRate, RevenueGap,
            TodayDueReceivable: todayDueRow.amt, TodayCollectedAmount: todayCollectedRow.amt,
            OpenReceivableRisk: openReceivableRiskRow.amt, CollectionRatio,
            Deltas: {
                TodayInvoiceAmount: todayInvoiceRow.amt - prevTodayInvoiceRow.amt,
                YTDInvoiceAmount: ytdInvoiceRow.amt - prevYtdInvoiceRow.amt,
                TodayCollectedAmount: todayCollectedRow.amt - prevTodayCollectedRow.amt,
                TodayDueReceivable: todayDueRow.amt - prevTodayDueRow.amt,
                WeeklyContractAmount: weeklyContractRow.amt - prevWeeklyContractRow.amt,
                MonthlyContractAmount: monthlyContractRow.amt - prevMonthlyContractRow.amt,
                WeeklyInvoiceAmount: weeklyInvoiceRow.amt - prevWeeklyInvoiceRow.amt,
                MonthlyInvoiceAmount: monthlyInvoiceRow.amt - prevMonthlyInvoiceRow.amt,
            }
        });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/monthly', (req: Request, res: Response) => {
    try {
        const db = getDb();
        const ownerId = req.query.ownerId as string | undefined;
        const companyId = req.query.companyId as string | undefined;

        let ownerWhere = '';
        const params: any[] = [];
        if (ownerId) {
            ownerWhere = ' AND SalesRepresentativeId = ?';
            params.push(ownerId);
        }
        let companyWhere = '';
        if (companyId) {
            companyWhere = ' AND CompanyId = ?';
            params.push(companyId);
        }

        let orderOwner = '';
        const orderParams: any[] = [];
        if (ownerId) {
            orderOwner = ' AND ProposalOwnerId = ?';
            orderParams.push(ownerId);
        }
        if (req.query.teamId) {
            const teamIds = String(req.query.teamId).split(',');
            const placeholders = teamIds.map(() => '?').join(',');

            ownerWhere += ` AND SalesRepresentativeId IN (SELECT PersonId FROM TeamMember WHERE TeamId IN (${placeholders}))`;
            params.push(...teamIds);

            orderOwner += ` AND ProposalOwnerId IN (SELECT PersonId FROM TeamMember WHERE TeamId IN (${placeholders}))`;
            orderParams.push(...teamIds);
        }

        let orderCompany = '';
        if (companyId) {
            orderCompany = ' AND CompanyId = ?';
            orderParams.push(companyId);
        }

        const dateSubstr = db.driver === 'mssql' ? 'LEFT(SigningDate, 7)' : 'substr(SigningDate, 1, 7)';
        const invDateSubstr = db.driver === 'mssql' ? 'LEFT(InvoiceDate, 7)' : 'substr(InvoiceDate, 1, 7)';
        const payDateSubstr = db.driver === 'mssql' ? 'LEFT(cpp.PaymentDate, 7)' : 'substr(cpp.PaymentDate, 1, 7)';
        const twelveMonthsAgo = db.driver === 'mssql' ? 'DATEADD(month, -12, GETUTCDATE())' : "date('now', '-12 months')";

        const contractTrends = db.query(`SELECT ${dateSubstr} as PeriodKey, COALESCE(SUM(TotalAmountLocalCurrency_Amount), 0) as ContractAmount FROM Contract WHERE SigningDate IS NOT NULL AND SigningDate >= ${twelveMonthsAgo} ${ownerWhere} ${companyWhere} GROUP BY ${dateSubstr} ORDER BY PeriodKey ASC`, params) as { PeriodKey: string; ContractAmount: number }[];
        const invoiceTrends = db.query(`SELECT ${invDateSubstr} as PeriodKey, COALESCE(SUM(TotalNetAmountLocalCurrency_Amount), 0) as InvoiceAmount FROM CrmOrder WHERE Status != 5 AND COALESCE(IsDeletedFromBackend, 0) = 0 AND InvoiceDate IS NOT NULL AND InvoiceDate >= ${twelveMonthsAgo} ${orderOwner} ${orderCompany} GROUP BY ${invDateSubstr} ORDER BY PeriodKey ASC`, orderParams) as { PeriodKey: string; InvoiceAmount: number }[];

        let contractJoin = ' INNER JOIN Contract c ON cpp.ContractId = c.Id';
        const joinParams: any[] = [];
        if (ownerId) {
            contractJoin += ' AND c.SalesRepresentativeId = ?';
            joinParams.push(ownerId);
        }
        if (req.query.teamId) {
            const teamIds = String(req.query.teamId).split(',');
            const placeholders = teamIds.map(() => '?').join(',');
            contractJoin += ` AND c.SalesRepresentativeId IN (SELECT PersonId FROM TeamMember WHERE TeamId IN (${placeholders}))`;
            joinParams.push(...teamIds);
        }
        if (companyId) {
            contractJoin += ' AND c.CompanyId = ?';
            joinParams.push(companyId);
        }

        const collectionTrends = db.query(`SELECT ${payDateSubstr} as PeriodKey, COALESCE(SUM(cpp.Price_Amount), 0) as CollectionAmount FROM ContractPaymentPlans cpp ${contractJoin} WHERE cpp.HasBeenCollected = 1 AND cpp.PaymentDate IS NOT NULL AND cpp.PaymentDate >= ${twelveMonthsAgo} GROUP BY ${payDateSubstr} ORDER BY PeriodKey ASC`, joinParams) as { PeriodKey: string; CollectionAmount: number }[];

        const periodMap: Record<string, { PeriodKey: string; ContractAmount: number; InvoiceAmount: number; CollectionAmount: number }> = {};
        for (const row of contractTrends) { periodMap[row.PeriodKey] = periodMap[row.PeriodKey] || { PeriodKey: row.PeriodKey, ContractAmount: 0, InvoiceAmount: 0, CollectionAmount: 0 }; periodMap[row.PeriodKey].ContractAmount = row.ContractAmount; }
        for (const row of invoiceTrends) { periodMap[row.PeriodKey] = periodMap[row.PeriodKey] || { PeriodKey: row.PeriodKey, ContractAmount: 0, InvoiceAmount: 0, CollectionAmount: 0 }; periodMap[row.PeriodKey].InvoiceAmount = row.InvoiceAmount; }
        for (const row of collectionTrends) { periodMap[row.PeriodKey] = periodMap[row.PeriodKey] || { PeriodKey: row.PeriodKey, ContractAmount: 0, InvoiceAmount: 0, CollectionAmount: 0 }; periodMap[row.PeriodKey].CollectionAmount = row.CollectionAmount; }

        res.json({ trends: Object.values(periodMap).sort((a, b) => a.PeriodKey.localeCompare(b.PeriodKey)) });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/burnup', (req: Request, res: Response) => {
    try {
        const db = getDb();
        const asOfDate = (req.query.asOfDate as string) || new Date().toISOString().split('T')[0];
        const ownerId = req.query.ownerId as string | undefined;
        const companyId = req.query.companyId as string | undefined;
        const monthStart = asOfDate.substring(0, 7) + '-01';

        let ownerWhere = '';
        const params: any[] = [];
        if (ownerId) {
            ownerWhere = ' AND SalesRepresentativeId = ?';
            params.push(ownerId);
        }
        let companyWhere = '';
        if (companyId) {
            companyWhere = ' AND CompanyId = ?';
            params.push(companyId);
        }

        let orderOwner = '';
        const orderParams: any[] = [];
        if (ownerId) {
            orderOwner = ' AND ProposalOwnerId = ?';
            orderParams.push(ownerId);
        }
        if (req.query.teamId) {
            const teamIds = String(req.query.teamId).split(',');
            const placeholders = teamIds.map(() => '?').join(',');

            ownerWhere += ` AND SalesRepresentativeId IN (SELECT PersonId FROM TeamMember WHERE TeamId IN (${placeholders}))`;
            params.push(...teamIds);

            orderOwner += ` AND ProposalOwnerId IN (SELECT PersonId FROM TeamMember WHERE TeamId IN (${placeholders}))`;
            orderParams.push(...teamIds);
        }
        let orderCompany = '';
        if (companyId) {
            orderCompany = ' AND CompanyId = ?';
            orderParams.push(companyId);
        }

        const dateSubstr = db.driver === 'mssql' ? 'LEFT(SigningDate, 10)' : 'substr(SigningDate, 1, 10)';
        const invDateSubstr = db.driver === 'mssql' ? 'LEFT(InvoiceDate, 10)' : 'substr(InvoiceDate, 1, 10)';

        const contractDaily = db.query(`SELECT ${dateSubstr} as date, COALESCE(SUM(TotalAmountLocalCurrency_Amount), 0) as amt FROM Contract WHERE SigningDate >= ? AND SigningDate <= ? ${ownerWhere} ${companyWhere} GROUP BY ${dateSubstr} ORDER BY date ASC`, [monthStart, asOfDate, ...params]) as { date: string; amt: number }[];
        const invoiceDaily = db.query(`SELECT ${invDateSubstr} as date, COALESCE(SUM(TotalNetAmountLocalCurrency_Amount), 0) as amt FROM CrmOrder WHERE Status != 5 AND COALESCE(IsDeletedFromBackend, 0) = 0 AND InvoiceDate >= ? AND InvoiceDate <= ? ${orderOwner} ${orderCompany} GROUP BY ${invDateSubstr} ORDER BY date ASC`, [monthStart, asOfDate, ...orderParams]) as { date: string; amt: number }[];

        const dayMap: Record<string, { date: string; contractAmt: number; invoiceAmt: number }> = {};
        const startD = new Date(monthStart);
        const endD = new Date(asOfDate);
        for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
            const key = d.toISOString().split('T')[0];
            dayMap[key] = { date: key, contractAmt: 0, invoiceAmt: 0 };
        }
        for (const row of contractDaily) { if (dayMap[row.date]) dayMap[row.date].contractAmt = row.amt; }
        for (const row of invoiceDaily) { if (dayMap[row.date]) dayMap[row.date].invoiceAmt = row.amt; }

        let cumContract = 0; let cumInvoice = 0;
        const burnup = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date)).map(day => {
            cumContract += day.contractAmt; cumInvoice += day.invoiceAmt;
            return { date: day.date, cumulativeContract: cumContract, cumulativeInvoice: cumInvoice, cumulativeCollection: 0 };
        });

        res.json({ burnup });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
