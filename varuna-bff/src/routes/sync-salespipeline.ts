import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { z } from 'zod';

const router = Router();

// Define Zod Schema for SalesPipeline request validation
const salesPipelineSchema = z.object({
    Id: z.string(),
    Name: z.string().nullable().optional(),
    CompanyId: z.string().nullable().optional(),
    Status: z.number().nullable().optional(),
    IsDefault: z.number().int().min(0).max(1).nullable().optional(),

    // Child Array
    SalesPipelineStages: z.array(z.object({
        Id: z.string(),
        SalesPipelineId: z.string(),
        PipelineStageId: z.string(),
        PipelineStageName: z.number()
    })).nullable().optional()
});

router.post('/', (req: Request, res: Response) => {
    try {
        const payload = salesPipelineSchema.parse(req.body);
        const db = getDb();

        const upsertPipeline = db.prepare(`
            INSERT INTO SalesPipeline (
                Id, Name, CompanyId, Status, IsDefault
            ) VALUES (
                @Id, @Name, @CompanyId, @Status, @IsDefault
            )
            ON CONFLICT(Id) DO UPDATE SET
                Name=excluded.Name,
                CompanyId=excluded.CompanyId,
                Status=excluded.Status,
                IsDefault=excluded.IsDefault,
                _SyncedAt=datetime('now')
        `);

        // Child Prepares
        const delStages = db.prepare(`DELETE FROM SalesPipelineStages WHERE SalesPipelineId = ?`);
        const insStages = db.prepare(`
            INSERT INTO SalesPipelineStages (Id, SalesPipelineId, PipelineStageId, PipelineStageName) 
            VALUES (@Id, @SalesPipelineId, @PipelineStageId, @PipelineStageName)
        `);

        const syncTransaction = db.transaction((data) => {
            // Main Insert
            const info = upsertPipeline.run({
                Id: data.Id,
                Name: data.Name ?? null,
                CompanyId: data.CompanyId ?? null,
                Status: data.Status ?? null,
                IsDefault: data.IsDefault ?? null
            });

            // Replace Child Arrays atomically
            delStages.run(data.Id);
            if (data.SalesPipelineStages && data.SalesPipelineStages.length > 0) {
                for (const row of data.SalesPipelineStages) {
                    insStages.run({
                        Id: row.Id,
                        SalesPipelineId: data.Id,
                        PipelineStageId: row.PipelineStageId,
                        PipelineStageName: row.PipelineStageName
                    });
                }
            }

            return info.changes === 1;
        });

        const wasInserted = syncTransaction(payload);

        res.json({
            status: 'ok',
            upserted: wasInserted,
            id: payload.Id,
            syncedAt: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('[SalesPipeline Sync Error]', error);
        res.status(400).json({ status: 'error', message: error.message || 'Validation Failed' });
    }
});

export default router;
