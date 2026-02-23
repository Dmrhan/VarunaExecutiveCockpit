import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

// Helper to calculate targets and percentages
const calculatePerformanceMetrics = (row: any, monthlyTarget: number, yearlyTarget: number) => {
    if (!row) return {};
    const InvoiceYearlyGap = yearlyTarget - (row.YTDInvoiceAmount || 0);
    const CollectionRatio = row.TodayDueReceivable > 0 ? (row.TodayCollectedAmount / row.TodayDueReceivable) * 100 : 0;

    return {
        ...row,
        MonthlyContractTarget: monthlyTarget,
        MonthlyInvoiceTarget: Math.round(yearlyTarget / 12),
        YearlyInvoiceTarget: yearlyTarget,

        MonthlyContractAchievementRate: monthlyTarget > 0 ? ((row.MonthlyContractAmount || 0) / monthlyTarget) * 100 : 0,
        PipelineImpactMonthlyRate: monthlyTarget > 0 ? ((row.OpenContractPotentialAmount || 0) / monthlyTarget) * 100 : 0,
        PipelineImpactYearlyRate: yearlyTarget > 0 ? ((row.OpenContractPotentialAmount || 0) / yearlyTarget) * 100 : 0,

        RevenueGap: InvoiceYearlyGap,
        MonthlyAchievementRate: (yearlyTarget / 12) > 0 ? ((row.MonthlyInvoiceAmount || 0) / (yearlyTarget / 12)) * 100 : 0,
        YearlyAchievementRate: yearlyTarget > 0 ? ((row.YTDInvoiceAmount || 0) / yearlyTarget) * 100 : 0,

        CollectionRatio: CollectionRatio
    };
};

const executeMetricsQuery = (db: any, targetDateExpr: string, viewWhere: string, contractWhere: string, planWhere: string, params: any[]) => {
    const metricsQuery = `
        SELECT 
            (SELECT SUM(ContractCount) FROM vw_DailyPerformanceSummary WHERE DateKey >= date(${targetDateExpr}, '-7 days') AND DateKey <= date(${targetDateExpr}) AND ${viewWhere}) as WeeklyContractCount,
            (SELECT SUM(ContractAmount) FROM vw_DailyPerformanceSummary WHERE DateKey >= date(${targetDateExpr}, '-7 days') AND DateKey <= date(${targetDateExpr}) AND ${viewWhere}) as WeeklyContractAmount,
            (SELECT SUM(ContractCount) FROM vw_DailyPerformanceSummary WHERE strftime('%Y-%m', DateKey) = strftime('%Y-%m', ${targetDateExpr}) AND DateKey <= date(${targetDateExpr}) AND ${viewWhere}) as MonthlyContractCount,
            (SELECT SUM(ContractAmount) FROM vw_DailyPerformanceSummary WHERE strftime('%Y-%m', DateKey) = strftime('%Y-%m', ${targetDateExpr}) AND DateKey <= date(${targetDateExpr}) AND ${viewWhere}) as MonthlyContractAmount,
            
            (SELECT COUNT(*) FROM Contract WHERE ${contractWhere}) as OpenContractCount,
            (SELECT SUM(TotalAmountLocalCurrency_Amount) FROM Contract WHERE ${contractWhere}) as OpenContractPotentialAmount,
            
            (SELECT SUM(InvoiceCount) FROM vw_DailyPerformanceSummary WHERE DateKey = date(${targetDateExpr}) AND ${viewWhere}) as TodayInvoiceCount,
            (SELECT SUM(InvoiceAmount) FROM vw_DailyPerformanceSummary WHERE DateKey = date(${targetDateExpr}) AND ${viewWhere}) as TodayInvoiceAmount,
            (SELECT SUM(InvoiceCount) FROM vw_DailyPerformanceSummary WHERE DateKey >= date(${targetDateExpr}, '-7 days') AND DateKey <= date(${targetDateExpr}) AND ${viewWhere}) as WeeklyInvoiceCount,
            (SELECT SUM(InvoiceAmount) FROM vw_DailyPerformanceSummary WHERE DateKey >= date(${targetDateExpr}, '-7 days') AND DateKey <= date(${targetDateExpr}) AND ${viewWhere}) as WeeklyInvoiceAmount,
            (SELECT SUM(InvoiceCount) FROM vw_DailyPerformanceSummary WHERE strftime('%Y-%m', DateKey) = strftime('%Y-%m', ${targetDateExpr}) AND DateKey <= date(${targetDateExpr}) AND ${viewWhere}) as MonthlyInvoiceCount,
            (SELECT SUM(InvoiceAmount) FROM vw_DailyPerformanceSummary WHERE strftime('%Y-%m', DateKey) = strftime('%Y-%m', ${targetDateExpr}) AND DateKey <= date(${targetDateExpr}) AND ${viewWhere}) as MonthlyInvoiceAmount,
            (SELECT SUM(InvoiceAmount) FROM vw_DailyPerformanceSummary WHERE strftime('%Y', DateKey) = strftime('%Y', ${targetDateExpr}) AND DateKey <= date(${targetDateExpr}) AND ${viewWhere}) as YTDInvoiceAmount,
            
            (SELECT SUM(Price_Amount) FROM ContractPaymentPlans cp JOIN Contract c ON cp.ContractId = c.Id WHERE date(cp.PaymentDate) = date(${targetDateExpr}) AND ${planWhere}) as TodayDueReceivable,
            (SELECT SUM(CollectionAmount) FROM vw_DailyPerformanceSummary WHERE DateKey = date(${targetDateExpr}) AND ${viewWhere}) as TodayCollectedAmount,
            (SELECT SUM(Price_Amount) FROM ContractPaymentPlans cp JOIN Contract c ON cp.ContractId = c.Id WHERE cp.PaymentDate < date(${targetDateExpr}) AND cp.HasBeenCollected = 0 AND ${planWhere}) as OpenReceivableRisk
    `;
    const queryParams = [
        ...params, ...params, ...params, ...params, // Weekly/Monthly Contracts (4)
        ...params, ...params, // Open Contracts (2)
        ...params, ...params, ...params, ...params, ...params, ...params, ...params, // Invoices (7)
        ...params, ...params, ...params // Collections/Receivables (3)
    ]; // Total 16 parameter arrays
    return db.prepare(metricsQuery).get(queryParams) as any;
};

const fetchMetricsForDate = (db: any, asOfDate: string, monthlyTarget: number, yearlyTarget: number, viewWhere: string, contractWhere: string, planWhere: string, params: any[]) => {
    try {
        const targetDateExpr = asOfDate === 'now' ? "'now'" : `'${asOfDate}'`;
        const prevDateExpr = `date(${targetDateExpr}, '-1 days')`;

        const row = executeMetricsQuery(db, targetDateExpr, viewWhere, contractWhere, planWhere, params);
        const prevRow = executeMetricsQuery(db, prevDateExpr, viewWhere, contractWhere, planWhere, params);

        const safeRow = {
            WeeklyContractCount: row?.WeeklyContractCount || 0,
            WeeklyContractAmount: row?.WeeklyContractAmount || 0,
            MonthlyContractCount: row?.MonthlyContractCount || 0,
            MonthlyContractAmount: row?.MonthlyContractAmount || 0,
            OpenContractCount: row?.OpenContractCount || 0,
            OpenContractPotentialAmount: row?.OpenContractPotentialAmount || 0,
            TodayInvoiceCount: row?.TodayInvoiceCount || 0,
            TodayInvoiceAmount: row?.TodayInvoiceAmount || 0,
            WeeklyInvoiceCount: row?.WeeklyInvoiceCount || 0,
            WeeklyInvoiceAmount: row?.WeeklyInvoiceAmount || 0,
            MonthlyInvoiceCount: row?.MonthlyInvoiceCount || 0,
            MonthlyInvoiceAmount: row?.MonthlyInvoiceAmount || 0,
            YTDInvoiceAmount: row?.YTDInvoiceAmount || 0,
            TodayDueReceivable: row?.TodayDueReceivable || 0,
            TodayCollectedAmount: row?.TodayCollectedAmount || 0,
            OpenReceivableRisk: row?.OpenReceivableRisk || 0
        };

        const prevSafeRow = {
            WeeklyContractCount: prevRow?.WeeklyContractCount || 0,
            WeeklyContractAmount: prevRow?.WeeklyContractAmount || 0,
            MonthlyContractCount: prevRow?.MonthlyContractCount || 0,
            MonthlyContractAmount: prevRow?.MonthlyContractAmount || 0,
            OpenContractCount: prevRow?.OpenContractCount || 0,
            OpenContractPotentialAmount: prevRow?.OpenContractPotentialAmount || 0,
            TodayInvoiceCount: prevRow?.TodayInvoiceCount || 0,
            TodayInvoiceAmount: prevRow?.TodayInvoiceAmount || 0,
            WeeklyInvoiceCount: prevRow?.WeeklyInvoiceCount || 0,
            WeeklyInvoiceAmount: prevRow?.WeeklyInvoiceAmount || 0,
            MonthlyInvoiceCount: prevRow?.MonthlyInvoiceCount || 0,
            MonthlyInvoiceAmount: prevRow?.MonthlyInvoiceAmount || 0,
            YTDInvoiceAmount: prevRow?.YTDInvoiceAmount || 0,
            TodayDueReceivable: prevRow?.TodayDueReceivable || 0,
            TodayCollectedAmount: prevRow?.TodayCollectedAmount || 0,
            OpenReceivableRisk: prevRow?.OpenReceivableRisk || 0
        };

        const enriched = calculatePerformanceMetrics(safeRow, monthlyTarget, yearlyTarget);

        return {
            ...enriched,
            Deltas: {
                TodayInvoiceAmount: (safeRow.TodayInvoiceAmount || 0) - (prevSafeRow.TodayInvoiceAmount || 0),
                YTDInvoiceAmount: (safeRow.YTDInvoiceAmount || 0) - (prevSafeRow.YTDInvoiceAmount || 0),
                TodayCollectedAmount: (safeRow.TodayCollectedAmount || 0) - (prevSafeRow.TodayCollectedAmount || 0),
                TodayDueReceivable: (safeRow.TodayDueReceivable || 0) - (prevSafeRow.TodayDueReceivable || 0),
                WeeklyContractAmount: (safeRow.WeeklyContractAmount || 0) - (prevSafeRow.WeeklyContractAmount || 0),
                MonthlyContractAmount: (safeRow.MonthlyContractAmount || 0) - (prevSafeRow.MonthlyContractAmount || 0),
                WeeklyInvoiceAmount: (safeRow.WeeklyInvoiceAmount || 0) - (prevSafeRow.WeeklyInvoiceAmount || 0),
                MonthlyInvoiceAmount: (safeRow.MonthlyInvoiceAmount || 0) - (prevSafeRow.MonthlyInvoiceAmount || 0)
            }
        };
    } catch (e: any) {
        throw e;
    }
};

/**
 * GET /api/performance/daily
 * Daily metrics for Contract, Invoice and Collection sections
 */
router.get('/daily', (req: Request, res: Response) => {
    try {
        const db = getDb();
        const asOfDate = (req.query.asOfDate as string) || 'now';
        const companyId = req.query.companyId as string;
        const ownerId = req.query.ownerId as string;
        const monthlyTarget = parseFloat(req.query.monthlyTarget as string || '40000000');
        const yearlyTarget = parseFloat(req.query.yearlyTarget as string || '600000000');

        let params: any[] = [];
        let viewWhere = '1=1';
        let contractWhere = 'ContractStatus = 1';
        let planWhere = 'c.ContractStatus = 1';

        if (companyId) {
            viewWhere += ' AND CompanyId = ?';
            contractWhere += ' AND CompanyId = ?';
            planWhere += ' AND c.CompanyId = ?';
            params.push(companyId);
        }
        if (ownerId) {
            viewWhere += ' AND OwnerId = ?';
            contractWhere += ' AND SalesRepresentativeId = ?';
            planWhere += ' AND c.SalesRepresentativeId = ?';
            params.push(ownerId);
        }

        const data = fetchMetricsForDate(db, asOfDate, monthlyTarget, yearlyTarget, viewWhere, contractWhere, planWhere, params);
        res.json(data);

    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * GET /api/performance/burnup
 * Returns cumulative day-by-day totals for the current/selected month
 */
router.get('/burnup', (req: Request, res: Response) => {
    try {
        const db = getDb();
        const asOfDate = (req.query.asOfDate as string) || 'now';
        const companyId = req.query.companyId as string;
        const ownerId = req.query.ownerId as string;

        let whereClause = '1=1';
        let params: any[] = [];

        if (companyId) {
            whereClause += ' AND CompanyId = ?';
            params.push(companyId);
        }
        if (ownerId) {
            whereClause += ' AND OwnerId = ?';
            params.push(ownerId);
        }

        // We fetch daily summarized events from the start of the defined month up to the end of the month
        // Doing a running total in SQLite with a window function
        const query = `
            WITH MonthData AS (
                SELECT 
                    DateKey,
                    SUM(ContractAmount) as ContractAmount,
                    SUM(InvoiceAmount) as InvoiceAmount,
                    SUM(CollectionAmount) as CollectionAmount
                FROM vw_DailyPerformanceSummary
                WHERE strftime('%Y-%m', DateKey) = strftime('%Y-%m', date('${asOfDate}'))
                AND ${whereClause}
                GROUP BY DateKey
            )
            SELECT 
                DateKey as date,
                SUM(ContractAmount) OVER (ORDER BY DateKey ROWS UNBOUNDED PRECEDING) as cumulativeContract,
                SUM(InvoiceAmount) OVER (ORDER BY DateKey ROWS UNBOUNDED PRECEDING) as cumulativeInvoice,
                SUM(CollectionAmount) OVER (ORDER BY DateKey ROWS UNBOUNDED PRECEDING) as cumulativeCollection
            FROM MonthData
            ORDER BY DateKey ASC;
        `;

        const rows = db.prepare(query).all(params);
        res.json({ burnup: rows });

    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * TREND API HELPER
 * Retrieves trend data based on the requested view
 */
const getTrendData = (req: Request, res: Response, viewName: string) => {
    try {
        const db = getDb();
        const companyId = req.query.companyId as string;
        const ownerId = req.query.ownerId as string;
        // The frontend passes yearly/monthly targets to /daily, let's allow it in /monthly too 
        const monthlyTarget = parseFloat((req.query.monthlyTarget as string) || '40000000');
        // Let's use the current year as base
        const currentYear = new Date().getFullYear();

        let whereClause = '1=1';
        let params: any[] = [];

        if (companyId) {
            whereClause += ' AND CompanyId = ?';
            params.push(companyId);
        }
        if (ownerId) {
            whereClause += ' AND OwnerId = ?';
            params.push(ownerId);
        }

        const query = `
            SELECT 
                PeriodKey,
                COALESCE(SUM(ContractAmount), 0) as ContractAmount,
                COALESCE(SUM(InvoiceAmount), 0) as InvoiceAmount,
                COALESCE(SUM(CollectionAmount), 0) as CollectionAmount
            FROM ${viewName}
            WHERE ${whereClause} AND PeriodKey LIKE '${currentYear}-%'
            GROUP BY PeriodKey
            ORDER BY PeriodKey ASC
        `;

        const rows = db.prepare(query).all(params) as any[];

        // For monthly view, ensure we have 12 months of data
        let finalRows = rows;
        if (viewName === 'vw_MonthlyPerformanceSummary') {
            finalRows = [];
            const monthMap = new Map(rows.map(r => [r.PeriodKey, r]));

            for (let i = 1; i <= 12; i++) {
                const monthStr = i.toString().padStart(2, '0');
                const periodKey = `${currentYear}-${monthStr}`;

                if (monthMap.has(periodKey)) {
                    finalRows.push({
                        ...monthMap.get(periodKey),
                        TargetAmount: monthlyTarget
                    });
                } else {
                    finalRows.push({
                        PeriodKey: periodKey,
                        ContractAmount: 0,
                        InvoiceAmount: 0,
                        CollectionAmount: 0,
                        TargetAmount: monthlyTarget
                    });
                }
            }
        }

        res.json({ trends: finalRows });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};

router.get('/weekly', (req, res) => getTrendData(req, res, 'vw_WeeklyPerformanceSummary'));
router.get('/monthly', (req, res) => getTrendData(req, res, 'vw_MonthlyPerformanceSummary'));
router.get('/quarterly', (req, res) => getTrendData(req, res, 'vw_QuarterlyPerformanceSummary'));

export default router;
