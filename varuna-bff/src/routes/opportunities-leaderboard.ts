import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

function buildFilters(req: Request) {
    const whereClauses = ['o.DealStatus = 0']; // "0" represents Open status in DealStatus enum
    const params: any = {};

    if (req.query.companyId) {
        whereClauses.push('o.CompanyId = @companyId');
        params.companyId = req.query.companyId;
    }

    if (req.query.from) {
        whereClauses.push('o.FirstCreatedDate >= @from');
        params.from = req.query.from;
    }

    if (req.query.to) {
        whereClauses.push('o.FirstCreatedDate <= @to');
        params.to = req.query.to;
    }
    
    // asOfDate bounds creation date logic
    if (req.query.asOfDate) {
        whereClauses.push('o.FirstCreatedDate <= @asOfDate');
        params.asOfDate = req.query.asOfDate;
    }

    if (req.query.ownerId) {
        const ownerIds = String(req.query.ownerId).split(',');
        const placeholders = ownerIds.map((_, i) => `@ownerId${i}`).join(',');
        whereClauses.push(`o.OwnerId IN (${placeholders})`);
        ownerIds.forEach((id, i) => params[`ownerId${i}`] = id);
    }

    if (req.query.teamId) {
        const teamIds = String(req.query.teamId).split(',');
        const placeholders = teamIds.map((_, i) => `@teamId${i}`).join(',');
        whereClauses.push(`o.OwnerId IN (SELECT PersonId FROM TeamMember WHERE TeamId IN (${placeholders}))`);
        teamIds.forEach((id, i) => params[`teamId${i}`] = id);
    }

    if (req.query.product) {
        const products = String(req.query.product).split(',');
        const placeholders = products.map((_, i) => `@product${i}`).join(',');
        whereClauses.push(`o.ProductGroupId IN (SELECT Id FROM ProductGroup WHERE Name IN (${placeholders}))`);
        products.forEach((p, i) => params[`product${i}`] = p);
    }

    return { whereString: 'WHERE ' + whereClauses.join(' AND '), params };
}

// 1) List Endpoint
router.get('/', (req: Request, res: Response) => {
    try {
        const db = getDb();
        const { whereString, params } = buildFilters(req);

        // Calculate potential value: ExpectedRevenue_Value fallback to Amount_Value
        const sql = `
            SELECT 
                per.Id AS ownerId,
                COALESCE(per.Name, '') || ' ' || COALESCE(per.SurName, '') AS ownerName,
                SUM(COALESCE(o.ExpectedRevenue_Value, o.Amount_Value, 0)) AS potentialAmount,
                COUNT(o.Id) AS opportunityCount
            FROM Opportunity o
            INNER JOIN Person per ON o.OwnerId = per.Id
            ${whereString}
            GROUP BY per.Id, per.Name, per.SurName
            ORDER BY potentialAmount DESC
        `;

        const rows = db.query(sql, params) as any[];

        // Calculate share%
        const totalPotential = rows.reduce((sum, r) => sum + (r.potentialAmount || 0), 0);
        
        const result = rows.map(r => ({
            ownerId: r.ownerId,
            ownerName: r.ownerName.trim() || r.ownerId,
            potentialAmount: r.potentialAmount,
            opportunityCount: r.opportunityCount,
            sharePct: totalPotential > 0 ? (r.potentialAmount / totalPotential) * 100 : 0
        }));

        res.json({ value: result });
    } catch (error: any) {
        console.error('Error in opportunities leaderboard list:', error);
        res.status(500).json({ error: error.message });
    }
});

// 2) Detail Endpoint
router.get('/:ownerId/details', (req: Request, res: Response) => {
    try {
        const db = getDb();
        
        // Use identical filter logic, but explicitly add the owner filter to limit purely to this user
        req.query.ownerId = req.params.ownerId;
        const { whereString, params } = buildFilters(req);

        const asOfDateRaw = req.query.asOfDate ? String(req.query.asOfDate) : "now";

        const baseSelectSql = `
            SELECT 
                o.Id,
                o.Name,
                o.AccountId,
                a.Name AS AccountName,
                a.Title AS AccountTitle,
                o.OpportunityStageNameTr as Stage,
                o.OpportunityStageName as StageCode,
                o.DealType,
                o.OpportunityStageId,
                COALESCE(o.ExpectedRevenue_Value, o.Amount_Value, 0) as potentialAmount,
                o.FirstCreatedDate,
                o.Probability,
                CAST(julianday('${asOfDateRaw === "now" ? "now" : asOfDateRaw}') - julianday(o.FirstCreatedDate) AS INT) as AgeDays
            FROM Opportunity o
            LEFT JOIN Account a ON o.AccountId = a.Id
            ${whereString}
        `;

        const ops = db.query(baseSelectSql, params) as any[];

        // Calculate Summary
        let count = 0;
        let sumPotential = 0;
        const accountSums: Record<string, { accountId: string, accountName: string, amount: number, count: number }> = {};
        const stageSums: Record<string, { key: string, label: string, amount: number, count: number }> = {};
        const typeSums: Record<string, { key: string, label: string, amount: number, count: number }> = {};
        const agingBuckets = {
            '0-7': { bucket: '0-7', label: '0-7 Gün', amount: 0, count: 0, fromDay: 0, toDay: 7 },
            '8-14': { bucket: '8-14', label: '8-14 Gün', amount: 0, count: 0, fromDay: 8, toDay: 14 },
            '15-30': { bucket: '15-30', label: '15-30 Gün', amount: 0, count: 0, fromDay: 15, toDay: 30 },
            '31-60': { bucket: '31-60', label: '31-60 Gün', amount: 0, count: 0, fromDay: 31, toDay: 60 },
            '60+': { bucket: '60+', label: '60+ Gün', amount: 0, count: 0, fromDay: 61, toDay: 9999 }
        };
        const riskyData: any[] = [];

        for (const op of ops) {
            count++;
            sumPotential += op.potentialAmount;

            // byAccount
            const accId = op.AccountId || 'unknown';
            const accName = op.AccountTitle || op.AccountName || 'Bilinmeyen Müşteri';
            if (!accountSums[accId]) accountSums[accId] = { accountId: accId, accountName: accName, amount: 0, count: 0 };
            accountSums[accId].amount += op.potentialAmount;
            accountSums[accId].count += 1;

            // byStage
            const stageLabel = op.Stage || op.StageCode || 'Lead';
            if (!stageSums[stageLabel]) stageSums[stageLabel] = { key: stageLabel, label: stageLabel, amount: 0, count: 0 };
            stageSums[stageLabel].amount += op.potentialAmount;
            stageSums[stageLabel].count += 1;

            // byType
            const typeKey = (op.DealType != null) ? String(op.DealType) : 'Other';
            if (!typeSums[typeKey]) typeSums[typeKey] = { key: typeKey, label: typeKey, amount: 0, count: 0 };
            typeSums[typeKey].amount += op.potentialAmount;
            typeSums[typeKey].count += 1;

            // Aging
            const age = op.AgeDays || 0;
            if (age <= 7) { agingBuckets['0-7'].amount += op.potentialAmount; agingBuckets['0-7'].count += 1; }
            else if (age <= 14) { agingBuckets['8-14'].amount += op.potentialAmount; agingBuckets['8-14'].count += 1; }
            else if (age <= 30) { agingBuckets['15-30'].amount += op.potentialAmount; agingBuckets['15-30'].count += 1; }
            else if (age <= 60) { agingBuckets['31-60'].amount += op.potentialAmount; agingBuckets['31-60'].count += 1; }
            else { agingBuckets['60+'].amount += op.potentialAmount; agingBuckets['60+'].count += 1; }

            // Risky rule: > 30 days old OR Probability < 20 (assuming 20%)
            const prob = op.Probability || 0;
            if (age > 30 || prob < 20) {
                riskyData.push({
                    opportunityId: op.Id,
                    name: op.Name || '',
                    accountName: accName,
                    stageLabel: stageLabel,
                    ageDays: age,
                    potentialAmount: op.potentialAmount,
                    probability: prob
                });
            }
        }

        const byAccountList = Object.values(accountSums).sort((a, b) => b.amount - a.amount);
        
        riskyData.sort((a, b) => b.potentialAmount - a.potentialAmount); // High potential risk first

        const result = {
            summary: {
                count,
                sumPotential,
                top3Accounts: byAccountList.slice(0, 3)
            },
            byStage: Object.values(stageSums).sort((a, b) => b.amount - a.amount),
            byAccountTop10: byAccountList.slice(0, 10),
            byType: Object.values(typeSums).sort((a, b) => b.amount - a.amount),
            byAgingBuckets: Object.values(agingBuckets),
            riskyTop10: riskyData.slice(0, 10)
        };

        res.json({ value: result });
    } catch (error: any) {
        console.error('Error in opportunities leaderboard details:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
