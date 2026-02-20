import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

// ============================================================================
// Company Analytics - Tenant KPIs, Revenue Segmentation, Governance
// ============================================================================
router.get('/', (_req: Request, res: Response) => {
    try {
        const db = getDb();

        // Base Company List with Security Masking (Excluding Passwords & DB Users)
        const companies = db.prepare(`
            SELECT 
                Id, Name, OrderNo, ValidForAllUserGroups, Email, 
                IntegrationGrantType, IntegrationBranchCode, IntegrationDbName, 
                IntegrationDbType, IntegrationPath, IntegrationType, 
                SalesOrganizationSapId, _SyncedAt
            FROM Company
            ORDER BY OrderNo ASC
        `).all() as any[];

        // Enhance with Child Collections
        const getPipelines = db.prepare(`SELECT PipelineId FROM CompanyPipelines WHERE CompanyId = ?`);
        const getUserGroups = db.prepare(`SELECT UserGroupId, UserGroupName FROM CompanyUserGroups WHERE CompanyId = ?`);

        for (const company of companies) {
            company.Pipelines = getPipelines.all(company.Id);
            company.UserGroups = getUserGroups.all(company.Id);
        }

        // 1. Revenue by Company
        const revenueByCompany = db.prepare(`
            SELECT c.Id as CompanyId, c.Name as CompanyName, SUM(o.TotalNetAmountLocalCurrency_Amount) as TotalRevenue
            FROM Company c
            JOIN CrmOrder o ON c.Id = o.CompanyId
            WHERE o.Status != 5 AND o.IsDeletedFromBackend = 0
            GROUP BY c.Id, c.Name
            ORDER BY TotalRevenue DESC
        `).all();

        // 2. Installed Base by Company
        const installedBaseByCompany = db.prepare(`
            SELECT c.Name as CompanyName, COUNT(i.Id) as InstalledBaseCount, SUM(i.TotalPackagePrice_Amount) as InstalledRevenue
            FROM Company c
            JOIN AccountCompanies ac ON c.Id = ac.CompanyId
            JOIN Account a ON ac.AccountId = a.Id
            JOIN InventoryAccountProduct i ON a.Id = i.AccountId
            WHERE i.Status = 1
            GROUP BY c.Id, c.Name
            ORDER BY InstalledRevenue DESC
        `).all();

        // 3. Active Pipelines per Company
        const activePipelinesPerCompany = db.prepare(`
            SELECT c.Name, COUNT(p.Id) as PipelineCount
            FROM Company c
            LEFT JOIN CompanyPipelines p ON c.Id = p.CompanyId
            GROUP BY c.Id, c.Name
        `).all();

        // 4. User Group Distribution
        const userGroupDistribution = db.prepare(`
            SELECT c.Name, COUNT(u.Id) as UserGroupCount
            FROM Company c
            LEFT JOIN CompanyUserGroups u ON c.Id = u.CompanyId
            GROUP BY c.Id, c.Name
        `).all();

        // 5. Integration Type Distribution
        const integrationTypeDistribution = db.prepare(`
            SELECT IntegrationType, COUNT(*) as CompanyCount
            FROM Company
            WHERE IntegrationType IS NOT NULL
            GROUP BY IntegrationType
        `).all();

        // 6. SAP Organization Mapping
        const sapOrganizationMapping = db.prepare(`
            SELECT SalesOrganizationSapId, COUNT(*) as CompanyCount
            FROM Company
            WHERE SalesOrganizationSapId IS NOT NULL
            GROUP BY SalesOrganizationSapId
        `).all();

        res.json({
            companies,
            analytics: {
                revenueByCompany,
                installedBaseByCompany,
                activePipelinesPerCompany,
                userGroupDistribution,
                integrationTypeDistribution,
                sapOrganizationMapping
            }
        });

    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
