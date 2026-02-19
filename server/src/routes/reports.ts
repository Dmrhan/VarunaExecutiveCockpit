
import { Router, Request, Response } from 'express';
import { getDb } from '../database/db';

const router = Router();

// GET /api/reports/forecast
// Returns aggregated forecast data by month
router.get('/forecast', async (req: Request, res: Response) => {
    try {
        const db = await getDb();
        const year = req.query.year || new Date().getFullYear();

        // Simulated ODATA Aggregation:
        // $apply=groupby((OwnerId, Stage), aggregate(Amount with sum as Total))
        // SQLite doesn't support ODATA params, so we implement the logic directly here.

        const query = `
            SELECT 
                strftime('%Y-%m', expected_close_date) as month,
                SUM(value) as totalValue,
                SUM(weighted_value) as weightedValue,
                COUNT(id) as dealCount
            FROM opportunities
            WHERE strftime('%Y', expected_close_date) = ?
            GROUP BY month
            ORDER BY month ASC
        `;

        const results = await db.all(query, [year.toString()]);
        res.json(results);

    } catch (error) {
        console.error('Error fetching forecast report:', error);
        res.status(500).json({ error: 'Failed to fetch forecast report' });
    }
});

// GET /api/reports/slippage
// Returns slippage metrics (simulated as we don't have full history table yet)
router.get('/slippage', async (req: Request, res: Response) => {
    try {
        // In a real scenario, this would query opportunity_history
        // For now, we'll return a mock structure as defined in the spec, 
        // or perhaps derive some info from current opportunities if possible.
        // Let's implement a placeholder that matches the spec's intent.

        const slippageReport = {
            totalSlippedDeals: 12,
            averageSlippageDays: 45,
            slippedDeals: [
                { id: 'deal-1', title: 'Acme Corp Deal', originalDate: '2025-01-01', newDate: '2025-03-01', daysSlipped: 59 },
                { id: 'deal-2', title: 'Globex Contract', originalDate: '2025-02-15', newDate: '2025-04-01', daysSlipped: 45 }
            ]
        };

        res.json(slippageReport);

    } catch (error) {
        console.error('Error fetching slippage report:', error);
        res.status(500).json({ error: 'Failed to fetch slippage report' });
    }
});

// GET /api/reports/pipeline-health
router.get('/pipeline-health', async (req: Request, res: Response) => {
    try {
        const db = await getDb();

        // Count & Sum by Stage
        const query = `
            SELECT 
                stage,
                COUNT(id) as count,
                SUM(value) as totalValue
            FROM opportunities
            GROUP BY stage
        `;

        const results = await db.all(query);
        res.json(results);

    } catch (error) {
        console.error('Error fetching pipeline health:', error);
        res.status(500).json({ error: 'Failed to fetch pipeline health' });
    }
});

export default router;
