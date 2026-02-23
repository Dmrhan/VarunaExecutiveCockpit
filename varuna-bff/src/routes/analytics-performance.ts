import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { D } from '../db/dialect';

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

/**
 * Build the big metrics query using dialect helpers so it works on both SQLite and MSSQL.
 * targetDateParam: the date string to use as the as-of cutoff.
 */
const buildMetricsQuery = (
    targetDate: string,
    viewWhere: string,
    contractWhere: string,
    planWhere: string
) => {
    // Dialect-aware date expressions
    const todayExpr = D.driver === 'mssql' ? `CAST('${targetDate}' AS DATE)` : `date('${targetDate}')`;
    const weekAgoExpr = D.driver === 'mssql'
        ? `DATEADD(day, -7, CAST('${targetDate}' AS DATE))`
        : `date('${targetDate}', '-7 days')`;
    const ymExpr = (col: string) => D.yearMonth(col);
    const ymTarget = D.driver === 'mssql'
        ? `FORMAT(CAST('${targetDate}' AS DATE), 'yyyy-MM')`
        : `strftime('%Y-%m', '${targetDate}')`;
    const yTarget = D.driver === 'mssql'
        ? `FORMAT(CAST('${targetDate}' AS DATE), 'yyyy')`
        : `strftime('%Y', '${targetDate}')`;

    return `
        SELECT 
            (SELECT SUM(ContractCount)  FROM vw_DailyPerformanceSummary WHERE DateKey >= ${weekAgoExpr} AND DateKey <= ${todayExpr} AND ${viewWhere}) as WeeklyContractCount,
            (SELECT SUM(ContractAmount) FROM vw_DailyPerformanceSummary WHERE DateKey >= ${weekAgoExpr} AND DateKey <= ${todayExpr} AND ${viewWhere}) as WeeklyContractAmount,
            (SELECT SUM(ContractCount)  FROM vw_DailyPerformanceSummary WHERE ${ymExpr('DateKey')} = ${ymTarget} AND DateKey <= ${todayExpr} AND ${viewWhere}) as MonthlyContractCount,
            (SELECT SUM(ContractAmount) FROM vw_DailyPerformanceSummary WHERE ${ymExpr('DateKey')} = ${ymTarget} AND DateKey <= ${todayExpr} AND ${viewWhere}) as MonthlyContractAmount,
            
            (SELECT COUNT(*) FROM Contract WHERE ${contractWhere}) as OpenContractCount,
            (SELECT SUM(TotalAmountLocalCurrency_Amount) FROM Contract WHERE ${contractWhere}) as OpenContractPotentialAmount,
            
            (SELECT SUM(InvoiceCount)  FROM vw_DailyPerformanceSummary WHERE DateKey = ${todayExpr} AND ${viewWhere}) as TodayInvoiceCount,
            (SELECT SUM(InvoiceAmount) FROM vw_DailyPerformanceSummary WHERE DateKey = ${todayExpr} AND ${viewWhere}) as TodayInvoiceAmount,
            (SELECT SUM(InvoiceCount)  FROM vw_DailyPerformanceSummary WHERE DateKey >= ${weekAgoExpr} AND DateKey <= ${todayExpr} AND ${viewWhere}) as WeeklyInvoiceCount,
            (SELECT SUM(InvoiceAmount) FROM vw_DailyPerformanceSummary WHERE DateKey >= ${weekAgoExpr} AND DateKey <= ${todayExpr} AND ${viewWhere}) as WeeklyInvoiceAmount,
            (SELECT SUM(InvoiceCount)  FROM vw_DailyPerformanceSummary WHERE ${ymExpr('DateKey')} = ${ymTarget} AND DateKey <= ${todayExpr} AND ${viewWhere}) as MonthlyInvoiceCount,
            (SELECT SUM(InvoiceAmount) FROM vw_DailyPerformanceSummary WHERE ${ymExpr('DateKey')} = ${ymTarget} AND DateKey <= ${todayExpr} AND ${viewWhere}) as MonthlyInvoiceAmount,
            (SELECT SUM(InvoiceAmount) FROM vw_DailyPerformanceSummary WHERE ${D.year('DateKey')} = ${yTarget} AND DateKey <= ${todayExpr} AND ${viewWhere}) as YTDInvoiceAmount,
            
            (SELECT SUM(cp.Price_Amount) FROM ContractPaymentPlans cp JOIN Contract c ON cp.ContractId = c.Id WHERE ${D.toDate('cp.PaymentDate')} = ${todayExpr} AND ${planWhere}) as TodayDueReceivable,
            (SELECT SUM(CollectionAmount) FROM vw_DailyPerformanceSummary WHERE DateKey = ${todayExpr} AND ${viewWhere}) as TodayCollectedAmount,
            (SELECT SUM(cp.Price_Amount) FROM ContractPaymentPlans cp JOIN Contract c ON cp.ContractId = c.Id WHERE ${D.toDate('cp.PaymentDate')} < ${todayExpr} AND cp.HasBeenCollected = 0 AND ${planWhere}) as OpenReceivableRisk
    `;
};

const fetchMetricsForDate = (
    db: any,
    asOfDate: string,
    monthlyTarget: number,
    yearlyTarget: number,
    viewWhere: string,
    contractWhere: string,
    planWhere: string,
    params: any[]
) => {
    const targetDate = asOfDate === 'now' ? new Date().toISOString().slice(0, 10) : asOfDate;
    const prevDate = new Date(new Date(targetDate).getTime() - 86400000).toISOString().slice(0, 10);

    // Params are baked into the date expressions; WHERE filters use positional params
    const metricsQuery = buildMetricsQuery(targetDate, viewWhere, contractWhere, planWhere);
    const prevQuery = buildMetricsQuery(prevDate, viewWhere, contractWhere, planWhere);

    // Each query has 16 sub-selects that each repeat the params
    const paramCount = params.length;
    const paramRepeats = 16; // 4 weekly+monthly contract + 2 open contract + 7 invoice + 3 collection
    const allParams = Array(paramRepeats).fill(params).flat();

    const row = db.queryOne(metricsQuery, allParams);
    const prevRow = db.queryOne(prevQuery, allParams);

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
};

/**
 * GET /api/performance/daily
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
 */
router.get('/burnup', (req: Request, res: Response) => {
    try {
        const db = getDb();
        const asOfDate = (req.query.asOfDate as string) || 'now';
        const targetDate = asOfDate === 'now' ? new Date().toISOString().slice(0, 10) : asOfDate;
        const companyId = req.query.companyId as string;
        const ownerId = req.query.ownerId as string;

        let whereClause = '1=1';
        let params: any[] = [];

        if (companyId) { whereClause += ' AND CompanyId = ?'; params.push(companyId); }
        if (ownerId) { whereClause += ' AND OwnerId = ?'; params.push(ownerId); }

        const ymTarget = D.driver === 'mssql'
            ? `FORMAT(CAST('${targetDate}' AS DATE), 'yyyy-MM')`
            : `strftime('%Y-%m', '${targetDate}')`;

        const query = `
            WITH MonthData AS (
                SELECT 
                    DateKey,
                    SUM(ContractAmount)  as ContractAmount,
                    SUM(InvoiceAmount)   as InvoiceAmount,
                    SUM(CollectionAmount) as CollectionAmount
                FROM vw_DailyPerformanceSummary
                WHERE ${D.yearMonth('DateKey')} = ${ymTarget}
                AND ${whereClause}
                GROUP BY DateKey
            )
            SELECT 
                DateKey as date,
                SUM(ContractAmount)   OVER (ORDER BY DateKey ROWS UNBOUNDED PRECEDING) as cumulativeContract,
                SUM(InvoiceAmount)    OVER (ORDER BY DateKey ROWS UNBOUNDED PRECEDING) as cumulativeInvoice,
                SUM(CollectionAmount) OVER (ORDER BY DateKey ROWS UNBOUNDED PRECEDING) as cumulativeCollection
            FROM MonthData
            ORDER BY DateKey ASC
        `;

        const rows = db.query(query, params);
        res.json({ burnup: rows });

    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * Shared trend helper — queryable from /weekly, /monthly, /quarterly
 */
const getTrendData = (req: Request, res: Response, viewName: string) => {
    try {
        const db = getDb();
        const companyId = req.query.companyId as string;
        const ownerId = req.query.ownerId as string;
        const monthlyTarget = parseFloat((req.query.monthlyTarget as string) || '40000000');
        const currentYear = new Date().getFullYear();

        let whereClause = '1=1';
        let params: any[] = [];

        if (companyId) { whereClause += ' AND CompanyId = ?'; params.push(companyId); }
        if (ownerId) { whereClause += ' AND OwnerId = ?'; params.push(ownerId); }

        const yearFilter = D.driver === 'mssql'
            ? `LEFT(PeriodKey, 4) = '${currentYear}'`
            : `PeriodKey LIKE '${currentYear}-%'`;

        const query = `
            SELECT 
                PeriodKey,
                COALESCE(SUM(ContractAmount),   0) as ContractAmount,
                COALESCE(SUM(InvoiceAmount),    0) as InvoiceAmount,
                COALESCE(SUM(CollectionAmount), 0) as CollectionAmount
            FROM ${viewName}
            WHERE ${whereClause} AND ${yearFilter}
            GROUP BY PeriodKey
            ORDER BY PeriodKey ASC
        `;

        const rows = db.query(query, params) as any[];

        // Pad to 12 months for monthly view
        let finalRows = rows;
        if (viewName === 'vw_MonthlyPerformanceSummary') {
            finalRows = [];
            const monthMap = new Map(rows.map(r => [r.PeriodKey, r]));
            for (let i = 1; i <= 12; i++) {
                const periodKey = `${currentYear}-${i.toString().padStart(2, '0')}`;
                finalRows.push(monthMap.has(periodKey)
                    ? { ...monthMap.get(periodKey), TargetAmount: monthlyTarget }
                    : { PeriodKey: periodKey, ContractAmount: 0, InvoiceAmount: 0, CollectionAmount: 0, TargetAmount: monthlyTarget }
                );
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
