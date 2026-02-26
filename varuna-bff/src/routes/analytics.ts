import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

// ─── Enum constants ────────────────────────────────────────────────────────────
// TODO: Replace these placeholders with confirmed C# enum integer values.
// Until confirmed, these defaults are reasonable guesses based on common CRM patterns.
// DealStatus: ASSUMPTION — 2 = Won, 3 = Lost
// WonLostType: ASSUMPTION — 1 = Won, 2 = Lost
const DEAL_STATUS_WON = 2;
const DEAL_STATUS_LOST = 3;
const WON_LOST_TYPE_WON = 1;
const WON_LOST_TYPE_LOST = 2;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getOptionalFilter(req: Request): { whereClauses: string[]; params: Record<string, string> } {
    const whereClauses: string[] = [];
    const params: Record<string, string> = {};

    if (req.query.ownerId) {
        whereClauses.push('OwnerId = @ownerId');
        params.ownerId = req.query.ownerId as string;
    }
    if (req.query.accountId) {
        whereClauses.push('AccountId = @accountId');
        params.accountId = req.query.accountId as string;
    }
    if (req.query.from) {
        whereClauses.push('CloseDate >= @from');
        params.from = req.query.from as string;
    }
    if (req.query.to) {
        whereClauses.push('CloseDate <= @to');
        params.to = req.query.to as string;
    }
    return { whereClauses, params };
}

function buildWhere(clauses: string[]): string {
    return clauses.length > 0 ? 'AND ' + clauses.join(' AND ') : '';
}

// ─── GET /api/analytics/pipeline ─────────────────────────────────────────────
router.get('/pipeline', (req: Request, res: Response) => {
    const db = getDb();
    const { whereClauses, params } = getOptionalFilter(req);
    const extraWhere = buildWhere(whereClauses);

    const pipeline = db.queryOne(`
        SELECT
            COALESCE(SUM(ExpectedRevenue_Value), 0)                              AS openPipelineValue,
            COALESCE(SUM(ExpectedRevenue_Value * Probability / 100.0), 0)        AS weightedPipeline,
            COALESCE(SUM(PotentialTurnover_Value), 0)                            AS potentialRevenueImpact
        FROM Opportunity
        WHERE (DealStatus IS NULL OR DealStatus NOT IN (${DEAL_STATUS_WON}, ${DEAL_STATUS_LOST}))
        ${extraWhere}
    `, params) as Record<string, number>;

    const startOfMonth = db.driver === 'mssql'
        ? 'DATEFROMPARTS(YEAR(GETUTCDATE()), MONTH(GETUTCDATE()), 1)'
        : "date('now', 'start of month')";
    const startOfNextMonth = db.driver === 'mssql'
        ? 'DATEADD(month, 1, DATEFROMPARTS(YEAR(GETUTCDATE()), MONTH(GETUTCDATE()), 1))'
        : "date('now', 'start of month', '+1 month')";

    const closing = db.queryOne(`
        SELECT
            COUNT(*)                                AS count,
            COALESCE(SUM(ExpectedRevenue_Value), 0) AS totalValue
        FROM Opportunity
        WHERE (DealStatus IS NULL OR DealStatus NOT IN (${DEAL_STATUS_WON}, ${DEAL_STATUS_LOST}))
          AND CloseDate >= ${startOfMonth}
          AND CloseDate <  ${startOfNextMonth}
        ${extraWhere}
    `, params) as { count: number; totalValue: number };

    return res.json({
        openPipelineValue: pipeline.openPipelineValue,
        weightedPipeline: pipeline.weightedPipeline,
        potentialRevenueImpact: pipeline.potentialRevenueImpact,
        closingThisMonth: {
            count: closing.count,
            totalValue: closing.totalValue,
        },
    });
});

// ─── GET /api/analytics/funnel/monthly ───────────────────────────────────────
router.get('/funnel/monthly', (req: Request, res: Response) => {
    const db = getDb();
    const { whereClauses, params } = getOptionalFilter(req);
    const extraWhere = buildWhere(whereClauses);

    const monthFormat = db.driver === 'mssql' ? "FORMAT(CloseDate, 'yyyy-MM')" : "strftime('%Y-%m', CloseDate)";

    const wonRows = db.query(`
        SELECT
            ${monthFormat}                          AS month,
            COALESCE(SUM(ExpectedRevenue_Value), 0) AS revenue
        FROM Opportunity
        WHERE WonLostType = ${WON_LOST_TYPE_WON}
        ${extraWhere}
        GROUP BY ${monthFormat}
        ORDER BY month
    `, params);

    const lostRows = db.query(`
        SELECT
            ${monthFormat}                          AS month,
            COALESCE(SUM(ExpectedRevenue_Value), 0) AS revenue
        FROM Opportunity
        WHERE WonLostType = ${WON_LOST_TYPE_LOST}
        ${extraWhere}
        GROUP BY ${monthFormat}
        ORDER BY month
    `, params);

    return res.json({ won: wonRows, lost: lostRows });
});

// ─── GET /api/analytics/funnel/weekly ────────────────────────────────────────
router.get('/funnel/weekly', (req: Request, res: Response) => {
    const db = getDb();
    const { whereClauses, params } = getOptionalFilter(req);
    const extraWhere = buildWhere(whereClauses);

    const weekFormat = db.driver === 'mssql'
        ? "CONCAT(YEAR(CloseDate), '-W', FORMAT(DATEPART(ISO_WEEK, CloseDate), '00'))"
        : "strftime('%Y-W%W', CloseDate)";

    const rows = db.query(`
        SELECT
            ${weekFormat}                           AS week,
            COALESCE(SUM(ExpectedRevenue_Value), 0) AS revenue,
            COUNT(*)                                AS count
        FROM Opportunity
        WHERE CloseDate IS NOT NULL
        ${extraWhere}
        GROUP BY ${weekFormat}
        ORDER BY week
    `, params);

    return res.json({ weekly: rows });
});

// ─── GET /api/analytics/funnel/quarterly ─────────────────────────────────────
router.get('/funnel/quarterly', (req: Request, res: Response) => {
    const db = getDb();
    const { whereClauses, params } = getOptionalFilter(req);
    const extraWhere = buildWhere(whereClauses);

    const yearExpr = db.driver === 'mssql' ? "YEAR(CloseDate)" : "strftime('%Y', CloseDate)";
    const quarterExpr = db.driver === 'mssql' ? "DATEPART(QUARTER, CloseDate)" : "(CAST(strftime('%m', CloseDate) AS INTEGER) - 1) / 3 + 1";

    const rows = db.query(`
        SELECT
            ${yearExpr}                                                           AS year,
            ${quarterExpr}                                                        AS quarter,
            COALESCE(SUM(ExpectedRevenue_Value), 0)                              AS revenue,
            COALESCE(SUM(ExpectedRevenue_Value * Probability / 100.0), 0)        AS weightedRevenue,
            COUNT(*)                                                              AS count
        FROM Opportunity
        WHERE CloseDate IS NOT NULL
        ${extraWhere}
        GROUP BY ${yearExpr}, ${quarterExpr}
        ORDER BY year, quarter
    `, params);

    return res.json({ quarterly: rows });
});

// ─── GET /api/analytics/distribution/probability ─────────────────────────────
router.get('/distribution/probability', (req: Request, res: Response) => {
    const db = getDb();
    const { whereClauses, params } = getOptionalFilter(req);
    const extraWhere = buildWhere(whereClauses);

    const rows = db.query(`
        SELECT
            ProbabilityBand,
            COUNT(*)                                AS count,
            COALESCE(SUM(ExpectedRevenue_Value), 0) AS value
        FROM Opportunity
        WHERE ProbabilityBand IS NOT NULL
        ${extraWhere}
        GROUP BY ProbabilityBand
        ORDER BY ProbabilityBand
    `, params);

    return res.json({ distribution: rows });
});

// ─── GET /api/analytics/owners ───────────────────────────────────────────────
router.get('/owners', (req: Request, res: Response) => {
    const db = getDb();
    const { whereClauses, params } = getOptionalFilter(req);
    const extraWhere = buildWhere(whereClauses);

    const rows = db.query(`
        SELECT
            OwnerId,
            COUNT(*)                                                          AS totalDeals,
            COALESCE(SUM(ExpectedRevenue_Value), 0)                           AS pipelineValue,
            COALESCE(SUM(ExpectedRevenue_Value * Probability / 100.0), 0)     AS weightedValue,
            COALESCE(SUM(CASE WHEN WonLostType = ${WON_LOST_TYPE_WON}
                              THEN ExpectedRevenue_Value ELSE 0 END), 0)      AS wonValue,
            COALESCE(SUM(CASE WHEN WonLostType = ${WON_LOST_TYPE_LOST}
                              THEN ExpectedRevenue_Value ELSE 0 END), 0)      AS lostValue
        FROM Opportunity
        WHERE OwnerId IS NOT NULL
        ${extraWhere}
        GROUP BY OwnerId
        ORDER BY pipelineValue DESC
    `, params);

    return res.json({ owners: rows });
});

export default router;
