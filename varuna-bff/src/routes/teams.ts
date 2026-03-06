import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

// GET /api/teams
router.get('/', (req: Request, res: Response) => {
    try {
        const db = getDb();
        const teams = db.query('SELECT * FROM TeamDefinition WHERE Status = 1 ORDER BY Definition ASC');
        res.json({ value: teams });
    } catch (error) {
        console.error('Failed to fetch teams', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/teams/members?ids=id1,id2
router.get('/members', (req: Request, res: Response) => {
    try {
        const db = getDb();
        const ids = req.query.ids as string;
        if (!ids) return res.json({ value: [] });

        const teamIds = ids.split(',');
        const placeholders = teamIds.map((_, i) => `@id${i}`).join(',');
        const params: any = {};
        teamIds.forEach((id, i) => params[`id${i}`] = id);

        const members = db.query(`
            SELECT tm.*, p.PersonNameSurname as PersonName
            FROM TeamMember tm
            JOIN Person p ON tm.PersonId = p.Id
            WHERE tm.TeamId IN (${placeholders})
        `, params);
        res.json({ value: members });
    } catch (error) {
        console.error('Failed to fetch team members', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/teams/:id/members
router.get('/:id/members', (req: Request, res: Response) => {
    try {
        const db = getDb();
        const members = db.query(`
            SELECT tm.*, p.PersonNameSurname as PersonName
            FROM TeamMember tm
            JOIN Person p ON tm.PersonId = p.Id
            WHERE tm.TeamId = @teamId
        `, { teamId: req.params.id });
        res.json({ value: members });
    } catch (error) {
        console.error('Failed to fetch team members', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
