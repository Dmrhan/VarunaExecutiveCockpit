import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { z } from 'zod';

const router = Router();

// Zod Schema representing the C# ICompany model + its child collections
const companySchema = z.object({
    Id: z.string(),
    Name: z.string(),
    OrderNo: z.number(),
    ValidForAllUserGroups: z.number(),
    Email: z.string().nullable().optional(),

    // Integration Details
    IntegrationUsername: z.string().nullable().optional(),
    IntegrationPassword: z.string().nullable().optional(),
    IntegrationGrantType: z.string().nullable().optional(),
    IntegrationBranchCode: z.number().nullable().optional(),
    IntegrationDbName: z.string().nullable().optional(),
    IntegrationDbUser: z.string().nullable().optional(),
    IntegrationDbType: z.number().nullable().optional(),
    IntegrationDbPassword: z.string().nullable().optional(),
    IntegrationPath: z.string().nullable().optional(),
    IntegrationType: z.number().nullable().optional(),

    SalesOrganizationSapId: z.string().nullable().optional(),

    // Child Collections
    CompanyPipelines: z.array(z.object({
        Id: z.string(),
        CompanyId: z.string(),
        PipelineId: z.string()
    })).nullable().optional(),

    CompanyUserGroups: z.array(z.object({
        Id: z.string(),
        CompanyId: z.string(),
        UserGroupId: z.string(),
        UserGroupName: z.string()
    })).nullable().optional()
});

router.post('/', (req: Request, res: Response) => {
    try {
        const payload = companySchema.parse(req.body);
        const db = getDb();

        const upsertCompanySql = db.driver === 'mssql' ? `
            MERGE INTO Company AS target
            USING (SELECT @Id AS Id) AS source
            ON (target.Id = source.Id)
            WHEN MATCHED THEN
                UPDATE SET 
                    Name = @Name, OrderNo = @OrderNo, ValidForAllUserGroups = @ValidForAllUserGroups,
                    Email = @Email, IntegrationUsername = @IntegrationUsername,
                    IntegrationPassword = @IntegrationPassword, IntegrationGrantType = @IntegrationGrantType,
                    IntegrationBranchCode = @IntegrationBranchCode, IntegrationDbName = @IntegrationDbName,
                    IntegrationDbUser = @IntegrationDbUser, IntegrationDbType = @IntegrationDbType,
                    IntegrationDbPassword = @IntegrationDbPassword, IntegrationPath = @IntegrationPath,
                    IntegrationType = @IntegrationType, SalesOrganizationSapId = @SalesOrganizationSapId,
                    _SyncedAt = GETUTCDATE()
            WHEN NOT MATCHED THEN
                INSERT (
                    Id, Name, OrderNo, ValidForAllUserGroups, Email,
                    IntegrationUsername, IntegrationPassword, IntegrationGrantType,
                    IntegrationBranchCode, IntegrationDbName, IntegrationDbUser,
                    IntegrationDbType, IntegrationDbPassword, IntegrationPath,
                    IntegrationType, SalesOrganizationSapId, _SyncedAt
                ) VALUES (
                    @Id, @Name, @OrderNo, @ValidForAllUserGroups, @Email,
                    @IntegrationUsername, @IntegrationPassword, @IntegrationGrantType,
                    @IntegrationBranchCode, @IntegrationDbName, @IntegrationDbUser,
                    @IntegrationDbType, @IntegrationDbPassword, @IntegrationPath,
                    @IntegrationType, @SalesOrganizationSapId, GETUTCDATE()
                );
        ` : `
            INSERT INTO Company (
                Id, Name, OrderNo, ValidForAllUserGroups, Email,
                IntegrationUsername, IntegrationPassword, IntegrationGrantType,
                IntegrationBranchCode, IntegrationDbName, IntegrationDbUser,
                IntegrationDbType, IntegrationDbPassword, IntegrationPath,
                IntegrationType, SalesOrganizationSapId
            ) VALUES (
                @Id, @Name, @OrderNo, @ValidForAllUserGroups, @Email,
                @IntegrationUsername, @IntegrationPassword, @IntegrationGrantType,
                @IntegrationBranchCode, @IntegrationDbName, @IntegrationDbUser,
                @IntegrationDbType, @IntegrationDbPassword, @IntegrationPath,
                @IntegrationType, @SalesOrganizationSapId
            )
            ON CONFLICT(Id) DO UPDATE SET
                Name = excluded.Name, OrderNo = excluded.OrderNo, ValidForAllUserGroups = excluded.ValidForAllUserGroups,
                Email = excluded.Email, IntegrationUsername = excluded.IntegrationUsername,
                IntegrationPassword = excluded.IntegrationPassword, IntegrationGrantType = excluded.IntegrationGrantType,
                IntegrationBranchCode = excluded.IntegrationBranchCode, IntegrationDbName = excluded.IntegrationDbName,
                IntegrationDbUser = excluded.IntegrationDbUser, IntegrationDbType = excluded.IntegrationDbType,
                IntegrationDbPassword = excluded.IntegrationDbPassword, IntegrationPath = excluded.IntegrationPath,
                IntegrationType = excluded.IntegrationType, SalesOrganizationSapId = excluded.SalesOrganizationSapId,
                _SyncedAt = datetime('now')
        `;

        const wasInserted = db.transaction(() => {
            // 1. Upsert main Company record
            const result = db.execute(upsertCompanySql, {
                Id: payload.Id,
                Name: payload.Name,
                OrderNo: payload.OrderNo,
                ValidForAllUserGroups: payload.ValidForAllUserGroups,
                Email: payload.Email ?? null,
                IntegrationUsername: payload.IntegrationUsername ?? null,
                IntegrationPassword: payload.IntegrationPassword ?? null,
                IntegrationGrantType: payload.IntegrationGrantType ?? null,
                IntegrationBranchCode: payload.IntegrationBranchCode ?? null,
                IntegrationDbName: payload.IntegrationDbName ?? null,
                IntegrationDbUser: payload.IntegrationDbUser ?? null,
                IntegrationDbType: payload.IntegrationDbType ?? null,
                IntegrationDbPassword: payload.IntegrationDbPassword ?? null,
                IntegrationPath: payload.IntegrationPath ?? null,
                IntegrationType: payload.IntegrationType ?? null,
                SalesOrganizationSapId: payload.SalesOrganizationSapId ?? null
            });

            // 2. Replace Pipelines atomically
            db.execute(`DELETE FROM CompanyPipelines WHERE CompanyId = @id`, { id: payload.Id });
            if (payload.CompanyPipelines && payload.CompanyPipelines.length > 0) {
                const insertPipeSql = `INSERT INTO CompanyPipelines (Id, CompanyId, PipelineId) VALUES (@Id, @CompanyId, @PipelineId)`;
                for (const pipeline of payload.CompanyPipelines) {
                    db.execute(insertPipeSql, {
                        Id: pipeline.Id,
                        CompanyId: payload.Id,
                        PipelineId: pipeline.PipelineId
                    });
                }
            }

            // 3. Replace User Groups atomically
            db.execute(`DELETE FROM CompanyUserGroups WHERE CompanyId = @id`, { id: payload.Id });
            if (payload.CompanyUserGroups && payload.CompanyUserGroups.length > 0) {
                const insertUgSql = `INSERT INTO CompanyUserGroups (Id, CompanyId, UserGroupId, UserGroupName) VALUES (@Id, @CompanyId, @UserGroupId, @UserGroupName)`;
                for (const ug of payload.CompanyUserGroups) {
                    db.execute(insertUgSql, {
                        Id: ug.Id,
                        CompanyId: payload.Id,
                        UserGroupId: ug.UserGroupId,
                        UserGroupName: ug.UserGroupName
                    });
                }
            }

            return result.changes === 1;
        });


        res.json({
            status: 'ok',
            upserted: wasInserted,
            id: payload.Id,
            syncedAt: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('[Company Sync Error]', error);
        res.status(400).json({ status: 'error', message: error.message || 'Verification Failed' });
    }
});

export default router;
