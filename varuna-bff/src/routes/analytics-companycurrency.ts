import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

// ============================================================================
// CompanyCurrency Analytics
// ============================================================================
router.get('/', (_req: Request, res: Response) => {
    try {
        const db = getDb();

        // 1. Supported Currencies Per Company & Multi-Currency Detection
        const concatExpr = db.driver === 'mssql' ? 'STRING_AGG(cc.CurrencyCode, \',\')' : 'GROUP_CONCAT(cc.CurrencyCode)';
        const supportedCurrenciesPerCompany = db.query(`
            SELECT 
                c.Id as CompanyId,
                c.Name as CompanyName,
                COUNT(cc.Id) as SupportedCurrencyCount,
                ${concatExpr} as SupportedCurrencies
            FROM Company c
            LEFT JOIN CompanyCurrency cc ON c.Id = cc.CompanyId
            WHERE c.Name IS NOT NULL
            GROUP BY c.Id, c.Name
            ORDER BY SupportedCurrencyCount DESC
        `);

        const multiCurrencyCompaniesCount = supportedCurrenciesPerCompany.filter((row: any) => row.SupportedCurrencyCount > 1).length;

        // 2. Currency Distribution Global
        const currencyDistribution = db.query(`
            SELECT 
                CurrencyCode,
                COUNT(*) as NumberOfCompaniesSupporting
            FROM CompanyCurrency
            GROUP BY CurrencyCode
            ORDER BY NumberOfCompaniesSupporting DESC
        `);

        // 3. Multi-Company Revenue Consolidated
        const daysExpr = db.driver === 'mssql'
            ? 'DATEDIFF(day, cnt.StartDate, cnt.FinishDate)'
            : '(julianday(cnt.FinishDate) - julianday(cnt.StartDate))';

        const multiCompanyRevenue = db.query(`
            SELECT 
                cmp.Name as CompanyName,
                cmp.Id as CompanyId,
                -- Active Contacts ARR (Assuming month = 30 days)
                COALESCE(SUM(cnt.TotalAmountLocalCurrency_Amount / MAX(1, (${daysExpr} / 30)) * 12), 0) as TotalARR_Local,
                -- Open Pipeline
                COALESCE((SELECT SUM(TotalNetAmountLocalCurrency_Amount) FROM Quote WHERE CompanyId = cmp.Id AND Status != 5), 0) as OpenPipeline_Local
            FROM Company cmp
            LEFT JOIN Contract cnt ON cmp.Id = cnt.CompanyId AND cnt.ContractStatus = 1
            WHERE cmp.Name IS NOT NULL
            GROUP BY cmp.Id, cmp.Name
            ORDER BY TotalARR_Local DESC
        `);

        res.json({
            metrics: {
                totalCompaniesScanned: supportedCurrenciesPerCompany.length,
                multiCurrencyCompaniesCount
            },
            analytics: {
                supportedCurrenciesPerCompany,
                currencyDistribution,
                multiCompanyRevenue
            }
        });

    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
