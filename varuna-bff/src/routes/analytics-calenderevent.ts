import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

// ============================================================================
// CalenderEvent Analytics - Rep Productivity & Activity Fact Table
// ============================================================================
router.get('/', (_req: Request, res: Response) => {
    try {
        const db = getDb();

        // 1. Activity Count by Owner
        // 1. Activity Count by Owner
        const activityCountByOwner = db.query(`
            SELECT c.OwnerId, p.PersonNameSurname as FullName, COUNT(*) as ActivityCount
            FROM CalenderEvent c
            LEFT JOIN Person p ON c.OwnerId = p.Id
            GROUP BY c.OwnerId, p.PersonNameSurname
            ORDER BY ActivityCount DESC
        `);

        // 2. Activity Count by Type
        const activityCountByType = db.query(`
            SELECT Type, TypeTr, COUNT(*) as TypeCount
            FROM CalenderEvent
            GROUP BY Type, TypeTr
            ORDER BY TypeCount DESC
        `);

        // 3. Meetings per Account
        const meetingsPerAccount = db.query(`
            SELECT c.AccountId, a.Name, COUNT(*) as MeetingCount
            FROM CalenderEvent c
            LEFT JOIN Account a ON c.AccountId = a.Id
            WHERE c.Type = 1 -- Assuming 1 is 'Meeting'
            GROUP BY c.AccountId, a.Name
            ORDER BY MeetingCount DESC
            ${db.driver === 'mssql' ? 'OFFSET 0 ROWS FETCH NEXT 100 ROWS ONLY' : 'LIMIT 100'}
        `);

        // 4. New Account Activities
        const newAccountActivitiesCount = (db.queryOne(`
            SELECT COUNT(*) as n FROM CalenderEvent WHERE IsNewAccount = 1
        `) as { n: number }).n || 0;

        // 5. Activity Completion Rate
        let completionRate = 0;
        const totalActivities = (db.queryOne(`SELECT COUNT(*) as n FROM CalenderEvent`) as { n: number }).n || 0;
        if (totalActivities > 0) {
            const completedActivities = (db.queryOne(`SELECT COUNT(*) as n FROM CalenderEvent WHERE Status = 2`) as { n: number }).n || 0; // Assuming 2 is Completed
            completionRate = completedActivities / totalActivities;
        }

        // 6. Activity Duration (Average Minutes) per Type
        const durationExpr = db.driver === 'mssql'
            ? 'AVG(CAST(DATEDIFF(minute, StartDate, FinishDate) AS FLOAT))'
            : 'AVG((julianday(FinishDate) - julianday(StartDate)) * 24 * 60)';

        const avgDurationPerType = db.query(`
            SELECT 
                TypeTr, 
                ${durationExpr} as AvgDurationMinutes
            FROM CalenderEvent
            WHERE FinishDate IS NOT NULL AND StartDate IS NOT NULL
            GROUP BY TypeTr
        `);

        // 7. Rep Productivity Density (Activities per Month)
        const dateSubstr = db.driver === 'mssql' ? 'LEFT(c.StartDate, 7)' : 'substr(c.StartDate, 1, 7)';
        const realType = db.driver === 'mssql' ? 'FLOAT' : 'REAL';

        const productivityDensity = db.query(`
            SELECT 
                c.OwnerId,
                p.PersonNameSurname as FullName,
                ${dateSubstr} as ActivityMonth,
                COUNT(c.Id) as MonthlyActivityCount,
                SUM(CASE WHEN c.Status = 2 THEN 1 ELSE 0 END) as CompletedActivities,
                CAST(SUM(CASE WHEN c.Status = 2 THEN 1 ELSE 0 END) AS ${realType}) / NULLIF(COUNT(c.Id), 0) as CompletionRate
            FROM CalenderEvent c
            LEFT JOIN Person p ON c.OwnerId = p.Id
            WHERE c.StartDate IS NOT NULL
            GROUP BY c.OwnerId, p.PersonNameSurname, ${dateSubstr}
            ORDER BY p.PersonNameSurname, ActivityMonth DESC
        `);

        // 8. Repeat vs Unique Activity Mix
        const repeatUniqueMix = db.query(`
            SELECT 
                CASE WHEN IsRepeat = 1 THEN 'Repeat' ELSE 'Unique' END as ActivityNature,
                COUNT(*) as Count
            FROM CalenderEvent
            GROUP BY IsRepeat
        `);

        // 9. Meeting to Revenue Correlation
        const meetingRevenueCorrelation = db.query(`
            SELECT 
                a.Id as AccountId,
                a.Name as AccountName,
                COUNT(DISTINCT c.Id) as TotalMeetings,
                COALESCE(SUM(o.TotalNetAmountLocalCurrency_Amount), 0) as TotalRevenue,
                COALESCE(SUM(o.TotalNetAmountLocalCurrency_Amount), 0) / NULLIF(COUNT(DISTINCT c.Id), 0) as RevenuePerActivity
            FROM Account a
            LEFT JOIN CalenderEvent c ON a.Id = c.AccountId AND c.Type = 1
            LEFT JOIN CrmOrder o ON a.Id = o.AccountId AND o.Status != 5 AND o.IsDeletedFromBackend = 0
            GROUP BY a.Id, a.Name
            HAVING COUNT(DISTINCT c.Id) > 0
            ORDER BY TotalRevenue DESC, TotalMeetings DESC
            ${db.driver === 'mssql' ? 'OFFSET 0 ROWS FETCH NEXT 50 ROWS ONLY' : 'LIMIT 50'}
        `);

        res.json({
            totals: {
                totalActivities,
                newAccountActivitiesCount,
                completionRate
            },
            analytics: {
                activityCountByOwner,
                activityCountByType,
                meetingsPerAccount,
                avgDurationPerType,
                productivityDensity,
                repeatUniqueMix,
                meetingRevenueCorrelation
            }
        });

    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
