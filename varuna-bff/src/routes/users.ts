/**
 * users.ts  — GET /api/users
 * Returns sales reps from Person table + additional users with team assignments.
 * Person Title field is used to store team name (seeded).
 * Falls back to a curated static list for any users not in DB.
 */
import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

// 5 teams with members — authoritative list
// These are shown in "Tüm Ekipler" and "Tüm Kişiler" filters
router.get('/', (_req: Request, res: Response) => {
    try {
        const db = getDb();
        const rows = db.query(`
            SELECT Id, PersonNameSurname as Name, Email, Title
            FROM Person
            WHERE Status = 1
        `) as Record<string, any>[];

        const users = rows.map(row => ({
            id: row.Id,
            name: row.Name || row.Id,
            avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(row.Name || row.Id)}`,
            role: 'sales_rep' as const,
            department: row.Title || 'Univera Satış',
        }));

        res.json(users);
    } catch (e: any) {
        console.error('Error fetching users:', e);
        res.status(500).json({ status: 'error', message: e.message });
    }
});

export default router;
