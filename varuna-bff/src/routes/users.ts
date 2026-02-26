import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

/**
 * GET /api/users
 * Returns a list of all people (users/sales reps) from the database mapped to the frontend User shape.
 */
router.get('/', (_req: Request, res: Response) => {
    try {
        const db = getDb();
        const rows = db.prepare(`
            SELECT Id, PersonNameSurname as Name, Email, RoleId, CompanyId
            FROM Person
            WHERE Status = 1
        `).all() as Record<string, any>[];

        const mapped = rows.map(row => ({
            id: row.Id,
            name: row.Name || row.Id,
            avatar: `https://i.pravatar.cc/150?u=${row.Id}`,
            role: row.RoleId === 'manager' ? 'manager' : 'sales_rep',
            department: row.CompanyId || 'Univera Satış'
        }));

        res.json(mapped);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
