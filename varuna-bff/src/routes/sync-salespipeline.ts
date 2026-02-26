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

        const upsertPipelineSql = db.driver === 'mssql' ? `
            MERGE INTO SalesPipeline AS target
            USING (SELECT @Id AS Id) AS source
            ON (target.Id = source.Id)
            WHEN MATCHED THEN
                UPDATE SET 
                    Name=@Name,
                    CompanyId=@CompanyId,
                    Status=@Status,
                    IsDefault=@IsDefault,
                    _SyncedAt=GETUTCDATE()
            WHEN NOT MATCHED THEN
                INSERT (Id, Name, CompanyId, Status, IsDefault, _SyncedAt)
                VALUES (@Id, @Name, @CompanyId, @Status, @IsDefault, GETUTCDATE());
        ` : `
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
        `;

        const wasInsertedResult = db.transaction(() => {
            // Main Insert
            const result = db.execute(upsertPipelineSql, {
                Id: payload.Id,
                Name: payload.Name ?? null,
                CompanyId: payload.CompanyId ?? null,
                Status: payload.Status ?? null,
                IsDefault: payload.IsDefault ?? null
            });

            // Replace Child Arrays atomically
            db.execute(`DELETE FROM SalesPipelineStages WHERE SalesPipelineId = @id`, { id: payload.Id });
            if (payload.SalesPipelineStages && payload.SalesPipelineStages.length > 0) {
                const insStagesSql = `INSERT INTO SalesPipelineStages (Id, SalesPipelineId, PipelineStageId, PipelineStageName) 
                                      VALUES (@Id, @SalesPipelineId, @PipelineStageId, @PipelineStageName)`;
                for (const row of payload.SalesPipelineStages) {
                    db.execute(insStagesSql, {
                        Id: row.Id,
                        SalesPipelineId: payload.Id,
                        PipelineStageId: row.PipelineStageId,
                        PipelineStageName: row.PipelineStageName
                    });
                }
            }

            return result.changes === 1;
        });

        res.json({
            status: 'ok',
            upserted: wasInsertedResult,
            id: payload.Id,
            syncedAt: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('[SalesPipeline Sync Error]', error);
        res.status(400).json({ status: 'error', message: error.message || 'Validation Failed' });
    }
});

export default router;
