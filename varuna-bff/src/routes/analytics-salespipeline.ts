import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

// ============================================================================
// SalesPipeline Analytics - Dimension Table for Funnel Velocity & Health
// ============================================================================
router.get('/', (_req: Request, res: Response) => {
    try {
        const db = getDb();

        // 1. Pipeline Stage Distribution (How many stages each pipeline has configured)
        const pipelineStages = db.prepare(`
            SELECT 
                p.Id as PipelineId,
                p.Name as PipelineName,
                p.IsDefault,
                COUNT(s.Id) as StageCount
            FROM SalesPipeline p
            LEFT JOIN SalesPipelineStages s ON p.Id = s.SalesPipelineId
            WHERE p.Status = 1
            GROUP BY p.Id, p.Name, p.IsDefault
            ORDER BY p.IsDefault DESC, StageCount DESC
        `).all() as { PipelineId: string, IsDefault: number }[];

        // 2. Stage Conversion Rates
        // Simulating the structure mapping Opportunity to SalesPipelineStages based on plan.
        const stageConversions = db.prepare(`
            SELECT 
                p.Name as PipelineName,
                s.PipelineStageName,
                COUNT(o.Id) as OpportunitiesInStage,
                SUM(CASE WHEN o.DealStatus = 1 THEN 1 ELSE 0 END) as WonFromStage,
                COALESCE(CAST(SUM(CASE WHEN o.DealStatus = 1 THEN 1 ELSE 0 END) AS REAL) / NULLIF(COUNT(o.Id), 0), 0) as WinRateFromStage
            FROM SalesPipelineStages s
            INNER JOIN SalesPipeline p ON s.SalesPipelineId = p.Id
            LEFT JOIN Opportunity o ON s.PipelineStageId = o.OpportunityStageId
            WHERE p.Status = 1
            GROUP BY p.Name, s.PipelineStageName
            ORDER BY p.Name, s.PipelineStageName ASC
        `).all();

        // 3. Stage Duration (Average days spent in stage for Open ops)
        const stageDuration = db.prepare(`
            SELECT 
                p.Name as PipelineName,
                s.PipelineStageName,
                COALESCE(AVG(julianday('now') - julianday(o.FirstCreatedDate)), 0) as AvgDaysInCurrentStage
            FROM SalesPipelineStages s
            INNER JOIN SalesPipeline p ON s.SalesPipelineId = p.Id
            LEFT JOIN Opportunity o ON s.PipelineStageId = o.OpportunityStageId
            WHERE p.Status = 1 AND o.DealStatus = 0 -- 0 = Open
            GROUP BY p.Name, s.PipelineStageName
            ORDER BY p.Name, s.PipelineStageName ASC
        `).all();

        // 4. Pipeline Health Score (Weighted score 0-100)
        const pipelineHealth = db.prepare(`
            SELECT 
                p.Id,
                p.Name as PipelineName,
                COUNT(o.Id) as TotalActiveOps,
                COALESCE(SUM(o.ExpectedRevenue_Value), 0) as TotalExpectedRevLocal,
                -- Derived Health Score Formula:
                -- Cap at 100 limit. Gives points based on number of active ops and volume of predicted revenue stages mapped.
                MIN(100, (COUNT(o.Id) * 5) + (SUM(CASE WHEN o.OpportunityStageId IS NOT NULL THEN 1 ELSE 0 END) * 10)) as HealthScore
            FROM SalesPipeline p
            LEFT JOIN Opportunity o ON p.Id = o.PipelineId
            WHERE p.Status = 1 AND o.DealStatus = 0 -- Active pipeline, open ops
            GROUP BY p.Id, p.Name
            ORDER BY HealthScore DESC
        `).all();

        // 5. Revenue by Stage (Funnel Prediction)
        const revenueByStage = db.prepare(`
            SELECT 
                p.Name as PipelineName,
                s.PipelineStageName,
                COUNT(o.Id) as OpportunityCount,
                COALESCE(SUM(o.ExpectedRevenue_Value), 0) as PipelineValueLocal
            FROM SalesPipeline p
            INNER JOIN SalesPipelineStages s ON p.Id = s.SalesPipelineId
            LEFT JOIN Opportunity o ON s.PipelineStageId = o.OpportunityStageId AND o.DealStatus = 0
            WHERE p.Status = 1
            GROUP BY p.Id, p.Name, s.PipelineStageName
            ORDER BY p.Name, s.PipelineStageName ASC
        `).all();

        res.json({
            metrics: {
                totalActivePipelines: pipelineStages.length,
                defaultPipelineId: pipelineStages.find(p => p.IsDefault === 1)?.PipelineId || null
            },
            analytics: {
                pipelineStages,
                stageConversions,
                stageDuration,
                pipelineHealth,
                revenueByStage
            }
        });

    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
