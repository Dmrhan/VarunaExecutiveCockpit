
import { Router, Request, Response } from 'express';
import { getDb } from '../database/db';

const router = Router();

// GET /api/opportunities
router.get('/', async (req: Request, res: Response) => {
    try {
        const db = await getDb();
        const opportunities = await db.all('SELECT * FROM opportunities ORDER BY created_at DESC');
        res.json(opportunities);
    } catch (error) {
        console.error('Error fetching opportunities:', error);
        res.status(500).json({ error: 'Failed to fetch opportunities' });
    }
});

// GET /api/opportunities/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const db = await getDb();
        const opportunity = await db.get('SELECT * FROM opportunities WHERE id = ?', [req.params.id]);

        if (!opportunity) {
            return res.status(404).json({ error: 'Opportunity not found' });
        }

        res.json(opportunity);
    } catch (error) {
        console.error('Error fetching opportunity:', error);
        res.status(500).json({ error: 'Failed to fetch opportunity' });
    }
});

// POST /api/opportunities
router.post('/', async (req: Request, res: Response) => {
    try {
        const db = await getDb();
        const {
            title, customer_name, product, value, stage, probability, owner_id,
            source, topic, expected_close_date, currency, notes
        } = req.body;

        // Simple validation
        if (!title || !customer_name || !product || !value || !stage || !owner_id) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const id = `deal-${Date.now()}`;
        const createdAt = new Date().toISOString();
        const updatedAt = createdAt;
        const lastActivityDate = createdAt;
        const weightedValue = Math.round(value * (probability / 100));

        // Default values for new deal
        const aging = 0;
        const velocity = 0;
        const healthScore = 100;

        await db.run(
            `INSERT INTO opportunities (
            id, title, customer_name, product, value, stage, probability, owner_id, 
            source, topic, expected_close_date, last_activity_date, created_at, updated_at,
            currency, weighted_value, aging, velocity, health_score, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id, title, customer_name, product, value, stage, probability, owner_id,
                source, topic, expected_close_date, lastActivityDate, createdAt, updatedAt,
                currency || 'TRY', weightedValue, aging, velocity, healthScore, notes
            ]
        );

        const newOpportunity = await db.get('SELECT * FROM opportunities WHERE id = ?', [id]);
        res.status(201).json(newOpportunity);

    } catch (error) {
        console.error('Error creating opportunity:', error);
        res.status(500).json({ error: 'Failed to create opportunity' });
    }
});

// PUT /api/opportunities/:id
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const db = await getDb();
        const { id } = req.params;
        const updates = req.body;

        // Filter out fields that shouldn't be updated directly or handle specific logic if needed
        // For simplicity, we'll allow updating provided fields and set updated_at

        const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'created_at');
        if (fields.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        const setClause = fields.map(key => `${key} = ?`).join(', ');
        const values = fields.map(key => updates[key]);

        // Add updated_at
        const updatedAt = new Date().toISOString();

        await db.run(
            `UPDATE opportunities SET ${setClause}, updated_at = ? WHERE id = ?`,
            [...values, updatedAt, id]
        );

        const updatedOpportunity = await db.get('SELECT * FROM opportunities WHERE id = ?', [id]);

        if (!updatedOpportunity) {
            return res.status(404).json({ error: 'Opportunity not found' });
        }

        res.json(updatedOpportunity);

    } catch (error) {
        console.error('Error updating opportunity:', error);
        res.status(500).json({ error: 'Failed to update opportunity' });
    }
});

// DELETE /api/opportunities/:id
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const db = await getDb();
        const { id } = req.params;

        const result = await db.run('DELETE FROM opportunities WHERE id = ?', [id]);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Opportunity not found' });
        }

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting opportunity:', error);
        res.status(500).json({ error: 'Failed to delete opportunity' });
    }
});

export default router;
