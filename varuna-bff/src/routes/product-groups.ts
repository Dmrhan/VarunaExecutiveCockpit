import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

/**
 * GET /api/product-groups
 * Returns all product groups from the database.
 */
router.get('/', (_req: Request, res: Response) => {
    try {
        const db = getDb();
        const rows = db.query(`
            SELECT Id, Code, Name, ShortName, Status, ParentGroupId, Level
            FROM ProductGroup
            WHERE Status = 1
            ORDER BY Name ASC
        `);
        res.json(rows);
    } catch (e: any) {
        console.error('[API:ProductGroup] Error fetching product groups:', e);
        res.status(500).json({ status: 'error', message: e.message });
    }
});

export default router;
