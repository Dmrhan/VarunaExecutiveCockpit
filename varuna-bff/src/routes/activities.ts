import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

/**
 * GET /api/activities
 * Returns a list of all calendar events mapped to the frontend Activity shape.
 */
router.get('/', (_req: Request, res: Response) => {
    try {
        const db = getDb();

        const query = `
            SELECT 
                e.Id as id,
                e.AccountId as accountId,
                e.LeadId as leadId,
                e.OwnerId as userId,
                e.TypeTr as type,
                e.StartDate as date,
                e.FinishDate as endDate,
                e.Subject as subject,
                e.Description as notes,
                e.Status as status,
                p.PersonNameSurname as userName,
                a.Name as accountName,
                a.Title as accountTitle
            FROM CalenderEvent e
            LEFT JOIN Person p ON e.OwnerId = p.Id
            LEFT JOIN Account a ON e.AccountId = a.Id
            ORDER BY e.StartDate DESC
        `;

        const rows = db.query(query) as any[];

        const mapped = rows.map(row => ({
            id: row.id,
            dealId: null, // CalenderEvent doesn't have a direct OpportunityId in schema, but may be linked via Account/Lead
            userId: row.userId,
            userName: row.userName || row.userId,
            type: row.type?.toLowerCase() || 'other',
            date: row.date,
            dueDate: row.endDate,
            completedAt: row.status === 2 ? row.date : null, // Assuming 2 is 'Completed'
            subject: row.subject,
            notes: row.notes,
            status: row.status === 2 ? 'completed' : (new Date(row.date) < new Date() ? 'overdue' : 'pending'),
            customerName: row.accountTitle || row.accountName || 'Bilinmiyor'
        }));

        res.json(mapped);
    } catch (e: any) {
        console.error('Error fetching activities:', e);
        res.status(500).json({ error: e.message });
    }
});

export default router;
