import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

// ============================================================================
// Quote Analytics - Pre-Revenue Fact Table
// ============================================================================
router.get('/', (_req: Request, res: Response) => {
    try {
        const db = getDb();

        // 1. Quote Volume (overall)
        const totalQuotes = (db.prepare(`
            SELECT COUNT(*) as n FROM Quote WHERE Status != 5
        `).get() as { n: number }).n || 0;

        // 2. Total Quote Value (Pipeline Value)
        const totalPipelineValue = (db.prepare(`
            SELECT COALESCE(SUM(TotalNetAmountLocalCurrency_Amount), 0) as n FROM Quote WHERE Status != 5
        `).get() as { n: number }).n || 0;

        // 3. Quote Win Rate (Approved vs total active)
        let winRate = 0;
        if (totalQuotes > 0) {
            const wonQuotes = (db.prepare(`
                SELECT COUNT(*) as n FROM Quote WHERE Status = 1 -- Assuming 1 is won/approved
            `).get() as { n: number }).n || 0;
            winRate = wonQuotes / totalQuotes;
        }

        // 4. Revision Frequency
        const avgRevisions = (db.prepare(`
            SELECT COALESCE(AVG(RevNo), 0) as n FROM Quote WHERE Status != 5
        `).get() as { n: number }).n || 0;

        // 5. Quote to Order Conversion Rate
        let conversionRate = 0;
        if (totalQuotes > 0) {
            const convertedQuotes = (db.prepare(`
                SELECT COUNT(*) as n FROM Quote WHERE CrmOrderId IS NOT NULL AND Status != 5
            `).get() as { n: number }).n || 0;
            conversionRate = convertedQuotes / totalQuotes;
        }

        // 6. Overall Profit Margin
        const marginData = db.prepare(`
            SELECT 
                SUM(TotalNetAmountLocalCurrency_Amount) as Revenue,
                SUM(TotalProfitAmount_Amount) as Profit
            FROM Quote
            WHERE Status = 1
        `).get() as { Revenue: number, Profit: number };

        let overallProfitMargin = 0;
        if (marginData && marginData.Revenue > 0) {
            overallProfitMargin = marginData.Profit / marginData.Revenue;
        }

        // 7. Team Performance Matrix
        const teamPerformance = db.prepare(`
            SELECT 
                TeamId,
                COUNT(Id) as QuoteCount,
                COALESCE(SUM(TotalNetAmountLocalCurrency_Amount), 0) as TotalPipelineValue,
                COALESCE(AVG(TotalDiscountRate), 0) as AverageDiscountRequested
            FROM Quote
            WHERE TeamId IS NOT NULL AND Status != 5
            GROUP BY TeamId
            ORDER BY TotalPipelineValue DESC
        `).all();

        // 8. Rep Quoting Efficiency (Quotes generated per rep)
        const repPerformance = db.prepare(`
            SELECT 
                q.ProposalOwnerId,
                p.PersonNameSurname as FullName,
                COUNT(q.Id) as QuoteCount,
                COALESCE(SUM(q.TotalNetAmountLocalCurrency_Amount), 0) as SoldValue
            FROM Quote q
            LEFT JOIN Person p ON q.ProposalOwnerId = p.Id
            WHERE q.Status != 5
            GROUP BY q.ProposalOwnerId, p.PersonNameSurname
            ORDER BY SoldValue DESC, QuoteCount DESC
            LIMIT 50
        `).all();

        // 9. Quote Aging (Average days open)
        const agingData = db.prepare(`
            SELECT 
                COALESCE(AVG(julianday(ExpirationDate) - julianday(FirstCreatedDate)), 0) as AvgDaysToExpiration
            FROM Quote
            WHERE ExpirationDate IS NOT NULL AND FirstCreatedDate IS NOT NULL AND Status != 5
        `).get() as { AvgDaysToExpiration: number };

        res.json({
            metrics: {
                totalQuotes,
                totalPipelineValue,
                winRate,
                avgRevisions,
                conversionRate,
                overallProfitMargin,
                avgDaysToExpiration: agingData.AvgDaysToExpiration
            },
            analytics: {
                teamPerformance,
                repPerformance
            }
        });

    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
