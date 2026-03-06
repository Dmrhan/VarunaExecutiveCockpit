import express from 'express';
import cors from 'cors';
import { getDb } from './db/database';
import syncRouter from './routes/sync';
import analyticsRouter from './routes/analytics';
import opportunitiesRouter from './routes/opportunities';
import syncPersonRouter from './routes/sync-person';
import analyticsPersonRouter from './routes/analytics-person';
import analyticsPersonScorecardRouter from './routes/analytics-person-scorecard';
import syncAccountRouter from './routes/sync-account';
import analyticsAccountRouter from './routes/analytics-account';
import syncStockRouter from './routes/sync-stock';
import analyticsStockRouter from './routes/analytics-stock';
import syncContactsRouter from './routes/sync-contacts';
import analyticsContactsRouter from './routes/analytics-contacts';
import syncCrmOrderRouter from './routes/sync-crmorder';
import analyticsCrmOrderRouter from './routes/analytics-crmorder';
import syncCrmOrderProductsRouter from './routes/sync-crmorderproducts';
import analyticsCrmOrderProductsRouter from './routes/analytics-crmorderproducts';
import syncInventoryAccountProductRouter from './routes/sync-inventoryaccountproduct';
import analyticsInventoryAccountProductRouter from './routes/analytics-inventoryaccountproduct';
import syncCompanyRouter from './routes/sync-company';
import analyticsCompanyRouter from './routes/analytics-company';
import syncCalenderEventRouter from './routes/sync-calenderevent';
import analyticsCalenderEventRouter from './routes/analytics-calenderevent';
import syncQuoteRouter from './routes/sync-quote';
import analyticsQuoteRouter from './routes/analytics-quote';
import syncContractRouter from './routes/sync-contract';
import analyticsContractRouter from './routes/analytics-contract';
import salesPerformanceRouter from './routes/analytics-sales-performance';
import syncSalesPipelineRouter from './routes/sync-salespipeline';
import analyticsSalesPipelineRouter from './routes/analytics-salespipeline';
import syncCompanyCurrencyRouter from './routes/sync-companycurrency';
import analyticsCompanyCurrencyRouter from './routes/analytics-companycurrency';
import analyticsPerformanceRouter from './routes/analytics-performance';
import analyticsKpisRouter from './routes/analytics-kpis';
import contractsRouter from './routes/contracts';
import quotesRouter from './routes/quotes';
import ordersRouter from './routes/orders';
import usersRouter from './routes/users';
import activitiesRouter from './routes/activities';
import productGroupsRouter from './routes/product-groups';
import teamsRouter from './routes/teams';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/opportunity', syncRouter);
app.use('/api/opportunities', opportunitiesRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/person/sync', syncPersonRouter);
app.use('/api/analytics/person', analyticsPersonRouter);
app.use('/api/analytics/person-scorecard', analyticsPersonScorecardRouter);
app.use('/api/account/sync', syncAccountRouter);
app.use('/api/analytics/account', analyticsAccountRouter);
app.use('/api/stock/sync', syncStockRouter);
app.use('/api/analytics/stock', analyticsStockRouter);
app.use('/api/contacts/sync', syncContactsRouter);
app.use('/api/analytics/contacts', analyticsContactsRouter);
app.use('/api/crmorder/sync', syncCrmOrderRouter);
app.use('/api/analytics/crmorder', analyticsCrmOrderRouter);
app.use('/api/crmorderproducts/sync', syncCrmOrderProductsRouter);
app.use('/api/analytics/crmorderproducts', analyticsCrmOrderProductsRouter);
app.use('/api/inventoryaccountproduct/sync', syncInventoryAccountProductRouter);
app.use('/api/analytics/inventoryaccountproduct', analyticsInventoryAccountProductRouter);
app.use('/api/company/sync', syncCompanyRouter);
app.use('/api/analytics/company', analyticsCompanyRouter);
app.use('/api/calenderevent/sync', syncCalenderEventRouter);
app.use('/api/analytics/calenderevent', analyticsCalenderEventRouter);
app.use('/api/quote/sync', syncQuoteRouter);
app.use('/api/analytics/quote', analyticsQuoteRouter);
app.use('/api/contract/sync', syncContractRouter);
app.use('/api/analytics/contract', analyticsContractRouter);
app.use('/api/analytics/sales-performance', salesPerformanceRouter);
app.use('/api/salespipeline/sync', syncSalesPipelineRouter);
app.use('/api/analytics/salespipeline', analyticsSalesPipelineRouter);
app.use('/api/companycurrency/sync', syncCompanyCurrencyRouter);
app.use('/api/analytics/companycurrency', analyticsCompanyCurrencyRouter);
app.use('/api/performance', analyticsPerformanceRouter);
app.use('/api/analytics/kpis', analyticsKpisRouter);
app.use('/api/contracts', contractsRouter);
app.use('/api/quotes', quotesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/users', usersRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/product-groups', productGroupsRouter);
app.use('/api/teams', teamsRouter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    const db = getDb();
    const sql = db.driver === 'mssql'
        ? "SELECT COUNT(*) as n FROM sys.objects WHERE type='U'"
        : "SELECT COUNT(*) as n FROM sqlite_master WHERE type='table'";

    const row = db.queryOne<{ n: number }>(sql);

    res.json({
        status: 'ok',
        driver: db.driver,
        tables: row?.n ?? 0,
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
