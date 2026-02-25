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

        const ownerWhere = ownerId ? ` AND SalesRepresentativeId = '${ownerId}'` : '';
        const companyWhere = companyId ? ` AND CompanyId = '${companyId}'` : '';
        const orderOwner = ownerId ? ` AND ProposalOwnerId = '${ownerId}'` : '';
        const orderCompany = companyId ? ` AND co.CompanyId = '${companyId}'` : '';

        // Contract queries
        const weeklyContractRow = db.prepare(`SELECT COUNT(*) as cnt, COALESCE(SUM(TotalAmountLocalCurrency_Amount),0) as amt FROM Contract WHERE SigningDate >= ? AND SigningDate <= ? ${ownerWhere} ${companyWhere}`).get(weekStart, asOf) as { cnt: number; amt: number };
        const monthlyContractRow = db.prepare(`SELECT COUNT(*) as cnt, COALESCE(SUM(TotalAmountLocalCurrency_Amount),0) as amt FROM Contract WHERE SigningDate >= ? AND SigningDate <= ? ${ownerWhere} ${companyWhere}`).get(monthStart, asOf) as { cnt: number; amt: number };
        const prevMonthlyContractRow = db.prepare(`SELECT COALESCE(SUM(TotalAmountLocalCurrency_Amount),0) as amt FROM Contract WHERE SigningDate >= ? AND SigningDate <= ? ${ownerWhere} ${companyWhere}`).get(monthStart, yesterday) as { amt: number };
        const prevWeeklyContractRow = db.prepare(`SELECT COALESCE(SUM(TotalAmountLocalCurrency_Amount),0) as amt FROM Contract WHERE SigningDate >= ? AND SigningDate <= ? ${ownerWhere} ${companyWhere}`).get(weekStart, yesterday) as { amt: number };
        const openContractRow = db.prepare(`SELECT COUNT(*) as cnt, COALESCE(SUM(TotalAmountLocalCurrency_Amount),0) as amt FROM Contract WHERE ContractStatus = 2 ${ownerWhere} ${companyWhere}`).get() as { cnt: number; amt: number };

        const MonthlyContractTarget = monthlyTarget;
        const MonthlyContractAchievementRate = MonthlyContractTarget > 0 ? (monthlyContractRow.amt / MonthlyContractTarget) * 100 : 0;
        const PipelineImpactMonthlyRate = MonthlyContractTarget > 0 ? ((monthlyContractRow.amt + openContractRow.amt) / MonthlyContractTarget) * 100 : 0;
        const PipelineImpactYearlyRate = yearlyTarget > 0 ? ((monthlyContractRow.amt + openContractRow.amt) / yearlyTarget) * 100 : 0;

        // Invoice queries
        const activeOrderCond = `Status != 5 AND IsDeletedFromBackend = 0`;
        const todayInvoiceRow = db.prepare(`SELECT COUNT(*) as cnt, COALESCE(SUM(TotalNetAmountLocalCurrency_Amount),0) as amt FROM CrmOrder WHERE ${activeOrderCond} AND InvoiceDate = ? ${orderOwner} ${orderCompany}`).get(asOf) as { cnt: number; amt: number };
        const prevTodayInvoiceRow = db.prepare(`SELECT COALESCE(SUM(TotalNetAmountLocalCurrency_Amount),0) as amt FROM CrmOrder WHERE ${activeOrderCond} AND InvoiceDate = ? ${orderOwner} ${orderCompany}`).get(yesterday) as { amt: number };
        const weeklyInvoiceRow = db.prepare(`SELECT COUNT(*) as cnt, COALESCE(SUM(TotalNetAmountLocalCurrency_Amount),0) as amt FROM CrmOrder WHERE ${activeOrderCond} AND InvoiceDate >= ? AND InvoiceDate <= ? ${orderOwner} ${orderCompany}`).get(weekStart, asOf) as { cnt: number; amt: number };
        const prevWeeklyInvoiceRow = db.prepare(`SELECT COALESCE(SUM(TotalNetAmountLocalCurrency_Amount),0) as amt FROM CrmOrder WHERE ${activeOrderCond} AND InvoiceDate >= ? AND InvoiceDate <= ? ${orderOwner} ${orderCompany}`).get(weekStart, yesterday) as { amt: number };
        const monthlyInvoiceRow = db.prepare(`SELECT COUNT(*) as cnt, COALESCE(SUM(TotalNetAmountLocalCurrency_Amount),0) as amt FROM CrmOrder WHERE ${activeOrderCond} AND InvoiceDate >= ? AND InvoiceDate <= ? ${orderOwner} ${orderCompany}`).get(monthStart, asOf) as { cnt: number; amt: number };
        const prevMonthlyInvoiceRow = db.prepare(`SELECT COALESCE(SUM(TotalNetAmountLocalCurrency_Amount),0) as amt FROM CrmOrder WHERE ${activeOrderCond} AND InvoiceDate >= ? AND InvoiceDate <= ? ${orderOwner} ${orderCompany}`).get(monthStart, yesterday) as { amt: number };
        const ytdInvoiceRow = db.prepare(`SELECT COALESCE(SUM(TotalNetAmountLocalCurrency_Amount),0) as amt FROM CrmOrder WHERE ${activeOrderCond} AND InvoiceDate >= ? AND InvoiceDate <= ? ${orderOwner} ${orderCompany}`).get(yearStart, asOf) as { amt: number };
        const prevYtdInvoiceRow = db.prepare(`SELECT COALESCE(SUM(TotalNetAmountLocalCurrency_Amount),0) as amt FROM CrmOrder WHERE ${activeOrderCond} AND InvoiceDate >= ? AND InvoiceDate <= ? ${orderOwner} ${orderCompany}`).get(yearStart, yesterday) as { amt: number };

        const MonthlyInvoiceTarget = monthlyTarget;
        const YearlyInvoiceTarget = yearlyTarget;
        const MonthlyAchievementRate = MonthlyInvoiceTarget > 0 ? (monthlyInvoiceRow.amt / MonthlyInvoiceTarget) * 100 : 0;
        const YearlyAchievementRate = YearlyInvoiceTarget > 0 ? (ytdInvoiceRow.amt / YearlyInvoiceTarget) * 100 : 0;
        const RevenueGap = Math.max(0, YearlyInvoiceTarget - ytdInvoiceRow.amt);

        // Collection queries
        const contractOwnerJoin = ownerId ? ` INNER JOIN Contract c ON cpp.ContractId = c.Id AND c.SalesRepresentativeId = '${ownerId}'` : '';
        const contractCompanyJoin = companyId ? (ownerId ? ` AND c.CompanyId = '${companyId}'` : ` INNER JOIN Contract c ON cpp.ContractId = c.Id AND c.CompanyId = '${companyId}'`) : '';
        const todayDueRow = db.prepare(`SELECT COALESCE(SUM(cpp.Price_Amount),0) as amt FROM ContractPaymentPlans cpp ${contractOwnerJoin} ${contractCompanyJoin} WHERE cpp.PaymentDate = ?`).get(asOf) as { amt: number };
        const prevTodayDueRow = db.prepare(`SELECT COALESCE(SUM(cpp.Price_Amount),0) as amt FROM ContractPaymentPlans cpp ${contractOwnerJoin} ${contractCompanyJoin} WHERE cpp.PaymentDate = ?`).get(yesterday) as { amt: number };
        const todayCollectedRow = db.prepare(`SELECT COALESCE(SUM(cpp.Price_Amount),0) as amt FROM ContractPaymentPlans cpp ${contractOwnerJoin} ${contractCompanyJoin} WHERE cpp.HasBeenCollected = 1 AND cpp.PaymentDate = ?`).get(asOf) as { amt: number };
        const prevTodayCollectedRow = db.prepare(`SELECT COALESCE(SUM(cpp.Price_Amount),0) as amt FROM ContractPaymentPlans cpp ${contractOwnerJoin} ${contractCompanyJoin} WHERE cpp.HasBeenCollected = 1 AND cpp.PaymentDate = ?`).get(yesterday) as { amt: number };
        const collectionTotals = db.prepare(`SELECT COALESCE(SUM(cpp.Price_Amount),0) as total, COALESCE(SUM(CASE WHEN cpp.HasBeenCollected=1 THEN cpp.Price_Amount ELSE 0 END),0) as collected FROM ContractPaymentPlans cpp ${contractOwnerJoin} ${contractCompanyJoin}`).get() as { total: number; collected: number };
        const CollectionRatio = collectionTotals.total > 0 ? (collectionTotals.collected / collectionTotals.total) * 100 : 0;
        const openReceivableRiskRow = db.prepare(`SELECT COALESCE(SUM(cpp.Price_Amount),0) as amt FROM ContractPaymentPlans cpp ${contractOwnerJoin} ${contractCompanyJoin} WHERE cpp.HasBeenCollected = 0 AND cpp.PaymentDate < ?`).get(asOf) as { amt: number };

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
        const ownerWhere = ownerId ? ` AND SalesRepresentativeId = '${ownerId}'` : '';
        const companyWhere = companyId ? ` AND CompanyId = '${companyId}'` : '';
        const orderOwner = ownerId ? ` AND ProposalOwnerId = '${ownerId}'` : '';
        const orderCompany = companyId ? ` AND CompanyId = '${companyId}'` : '';

        const contractTrends = db.prepare(`SELECT substr(SigningDate, 1, 7) as PeriodKey, COALESCE(SUM(TotalAmountLocalCurrency_Amount), 0) as ContractAmount FROM Contract WHERE SigningDate IS NOT NULL AND SigningDate >= date('now', '-12 months') ${ownerWhere} ${companyWhere} GROUP BY PeriodKey ORDER BY PeriodKey ASC`).all() as { PeriodKey: string; ContractAmount: number }[];
        const invoiceTrends = db.prepare(`SELECT substr(InvoiceDate, 1, 7) as PeriodKey, COALESCE(SUM(TotalNetAmountLocalCurrency_Amount), 0) as InvoiceAmount FROM CrmOrder WHERE Status != 5 AND IsDeletedFromBackend = 0 AND InvoiceDate IS NOT NULL AND InvoiceDate >= date('now', '-12 months') ${orderOwner} ${orderCompany} GROUP BY PeriodKey ORDER BY PeriodKey ASC`).all() as { PeriodKey: string; InvoiceAmount: number }[];

        const contractOwnerJoin = ownerId ? ` INNER JOIN Contract c ON cpp.ContractId = c.Id AND c.SalesRepresentativeId = '${ownerId}'` : '';
        const contractCompanyJoin2 = companyId ? (ownerId ? ` AND c.CompanyId = '${companyId}'` : ` INNER JOIN Contract c ON cpp.ContractId = c.Id AND c.CompanyId = '${companyId}'`) : '';
        const collectionTrends = db.prepare(`SELECT substr(cpp.PaymentDate, 1, 7) as PeriodKey, COALESCE(SUM(cpp.Price_Amount), 0) as CollectionAmount FROM ContractPaymentPlans cpp ${contractOwnerJoin} ${contractCompanyJoin2} WHERE cpp.HasBeenCollected = 1 AND cpp.PaymentDate IS NOT NULL AND cpp.PaymentDate >= date('now', '-12 months') GROUP BY PeriodKey ORDER BY PeriodKey ASC`).all() as { PeriodKey: string; CollectionAmount: number }[];

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
        const ownerWhere = ownerId ? ` AND SalesRepresentativeId = '${ownerId}'` : '';
        const companyWhere = companyId ? ` AND CompanyId = '${companyId}'` : '';
        const orderOwner = ownerId ? ` AND ProposalOwnerId = '${ownerId}'` : '';
        const orderCompany = companyId ? ` AND CompanyId = '${companyId}'` : '';

        const contractDaily = db.prepare(`SELECT substr(SigningDate, 1, 10) as date, COALESCE(SUM(TotalAmountLocalCurrency_Amount), 0) as amt FROM Contract WHERE SigningDate >= ? AND SigningDate <= ? ${ownerWhere} ${companyWhere} GROUP BY date ORDER BY date ASC`).all(monthStart, asOfDate) as { date: string; amt: number }[];
        const invoiceDaily = db.prepare(`SELECT substr(InvoiceDate, 1, 10) as date, COALESCE(SUM(TotalNetAmountLocalCurrency_Amount), 0) as amt FROM CrmOrder WHERE Status != 5 AND IsDeletedFromBackend = 0 AND InvoiceDate >= ? AND InvoiceDate <= ? ${orderOwner} ${orderCompany} GROUP BY date ORDER BY date ASC`).all(monthStart, asOfDate) as { date: string; amt: number }[];

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
