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
const STATIC_USERS = [
    // Univera Satış
    { id: 'u1', name: 'Ali Yılmaz', role: 'manager', department: 'Univera Satış' },
    { id: 'u4', name: 'Zeynep Çelik', role: 'manager', department: 'Univera Satış' },
    { id: 'u5', name: 'Mülkiye Akoğaner', role: 'sales_rep', department: 'Univera Satış' },
    { id: 'u6', name: 'Begüm Hayta', role: 'sales_rep', department: 'Univera Satış' },
    { id: 'u7', name: 'Semih Balaban', role: 'sales_rep', department: 'Univera Satış' },
    { id: 'u8', name: 'Nigar Uygun', role: 'sales_rep', department: 'Univera Satış' },
    // EnRoute PY
    { id: 'u2', name: 'Ayşe Demir', role: 'sales_rep', department: 'EnRoute PY' },
    { id: 'u11', name: 'Kemal Aydın', role: 'sales_rep', department: 'EnRoute PY' },
    // Quest PY
    { id: 'u10', name: 'Eren Oral', role: 'sales_rep', department: 'Quest PY' },
    { id: 'u12', name: 'Deniz Korkmaz', role: 'sales_rep', department: 'Quest PY' },
    // Stokbar PY
    { id: 'u9', name: 'Gülçin Erçebi', role: 'sales_rep', department: 'Stokbar PY' },
    { id: 'u13', name: 'Hasan Polat', role: 'sales_rep', department: 'Stokbar PY' },
    // İş Ortakları
    { id: 'u3', name: 'Mehmet Kaya', role: 'sales_rep', department: 'İş Ortakları' },
    { id: 'u14', name: 'Selin Arslan', role: 'sales_rep', department: 'İş Ortakları' },
];

// Map seed Person IDs to team names
// Person IDs are 'prs-001' … 'prs-008' (8 reps seeded in seed-all.ts)
const PERSON_TEAM_MAP: Record<string, string> = {
    'prs-001': 'Univera Satış',
    'prs-002': 'Univera Satış',
    'prs-003': 'EnRoute PY',
    'prs-004': 'Quest PY',
    'prs-005': 'Stokbar PY',
    'prs-006': 'Stokbar PY',
    'prs-007': 'İş Ortakları',
    'prs-008': 'İş Ortakları',
};

router.get('/', (_req: Request, res: Response) => {
    try {
        const db = getDb();
        const rows = db.query(`
            SELECT Id, PersonNameSurname as Name, Email, Title
            FROM Person
            WHERE Status = 1
        `) as Record<string, any>[];

        // Map DB persons — attach team from map
        const dbUsers = rows.map(row => ({
            id: row.Id,
            name: row.Name || row.Id,
            avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(row.Name || row.Id)}`,
            role: 'sales_rep' as const,
            department: PERSON_TEAM_MAP[row.Id] || row.Title || 'Univera Satış',
        }));

        // Merge: static list first (canonical), then any DB persons not already covered
        const staticIds = new Set(STATIC_USERS.map(u => u.id));
        const dbPersonIds = new Set(dbUsers.map(u => u.id));

        const result = [
            // Static users (with proper team assignments + avatar URLs)
            ...STATIC_USERS.map(u => ({
                ...u,
                avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(u.name)}`,
            })),
            // DB seed persons not already in static list
            ...dbUsers.filter(u => !staticIds.has(u.id)),
        ];

        res.json(result);
    } catch (e: any) {
        // Fallback: static list only
        res.json(STATIC_USERS.map(u => ({
            ...u,
            avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(u.name)}`,
        })));
    }
});

export default router;
