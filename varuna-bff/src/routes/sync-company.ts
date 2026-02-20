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

        const upsertCompany = db.prepare(`
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
        `);

        // Prepare statements for child collections
        const deleteCompanyPipelines = db.prepare(`DELETE FROM CompanyPipelines WHERE CompanyId = ?`);
        const insertCompanyPipeline = db.prepare(`
            INSERT INTO CompanyPipelines (Id, CompanyId, PipelineId) 
            VALUES (@Id, @CompanyId, @PipelineId)
        `);

        const deleteCompanyUserGroups = db.prepare(`DELETE FROM CompanyUserGroups WHERE CompanyId = ?`);
        const insertCompanyUserGroup = db.prepare(`
            INSERT INTO CompanyUserGroups (Id, CompanyId, UserGroupId, UserGroupName) 
            VALUES (@Id, @CompanyId, @UserGroupId, @UserGroupName)
        `);

        // Run as a transaction
        const syncTransaction = db.transaction((data) => {
            // 1. Upsert main Company record
            const info = upsertCompany.run({
                Id: data.Id,
                Name: data.Name,
                OrderNo: data.OrderNo,
                ValidForAllUserGroups: data.ValidForAllUserGroups,
                Email: data.Email ?? null,
                IntegrationUsername: data.IntegrationUsername ?? null,
                IntegrationPassword: data.IntegrationPassword ?? null,
                IntegrationGrantType: data.IntegrationGrantType ?? null,
                IntegrationBranchCode: data.IntegrationBranchCode ?? null,
                IntegrationDbName: data.IntegrationDbName ?? null,
                IntegrationDbUser: data.IntegrationDbUser ?? null,
                IntegrationDbType: data.IntegrationDbType ?? null,
                IntegrationDbPassword: data.IntegrationDbPassword ?? null,
                IntegrationPath: data.IntegrationPath ?? null,
                IntegrationType: data.IntegrationType ?? null,
                SalesOrganizationSapId: data.SalesOrganizationSapId ?? null
            });

            // 2. Replace Pipelines atomically
            deleteCompanyPipelines.run(data.Id);
            if (data.CompanyPipelines && data.CompanyPipelines.length > 0) {
                for (const pipeline of data.CompanyPipelines) {
                    insertCompanyPipeline.run({
                        Id: pipeline.Id,
                        CompanyId: data.Id,
                        PipelineId: pipeline.PipelineId
                    });
                }
            }

            // 3. Replace User Groups atomically
            deleteCompanyUserGroups.run(data.Id);
            if (data.CompanyUserGroups && data.CompanyUserGroups.length > 0) {
                for (const ug of data.CompanyUserGroups) {
                    insertCompanyUserGroup.run({
                        Id: ug.Id,
                        CompanyId: data.Id,
                        UserGroupId: ug.UserGroupId,
                        UserGroupName: ug.UserGroupName
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
        console.error('[Company Sync Error]', error);
        res.status(400).json({ status: 'error', message: error.message || 'Verification Failed' });
    }
});

export default router;
