import express from 'express';
import cors from 'cors';
import { getDb } from './db/database';
import syncRouter from './routes/sync';
import analyticsRouter from './routes/analytics';
import opportunitiesRouter from './routes/opportunities';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/opportunity', syncRouter);
app.use('/api/opportunities', opportunitiesRouter);
app.use('/api/analytics', analyticsRouter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    const db = getDb();
    const tableCount = (db.prepare(
        "SELECT COUNT(*) as n FROM sqlite_master WHERE type='table'"
    ).get() as { n: number }).n;

    res.json({
        status: 'ok',
        tables: tableCount,
        timestamp: new Date().toISOString(),
    });
});

// ─── 404 fallback ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ status: 'error', message: 'Route not found' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
// Initialize DB (applies schema) before accepting requests
getDb();

app.listen(PORT, () => {
    console.log(`[BFF] Varuna Intelligence BFF running on port ${PORT}`);
    console.log(`[BFF] Health: http://localhost:${PORT}/api/health`);
    console.log(`[BFF] Sync:   POST http://localhost:${PORT}/api/opportunity/sync`);
    console.log(`[BFF] Stats:  GET  http://localhost:${PORT}/api/analytics/pipeline`);
});

export default app;
