import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { z } from 'zod';

const router = Router();

// Define Zod Schema for Company Currency & FX Rates Sync
// Note: As specified, CompanyCurrencies might be synchronized in bulk
const companyCurrencySyncSchema = z.object({
    SyncBatchId: z.string().optional(),

    Currencies: z.array(z.object({
        Id: z.string(),
        CompanyId: z.string(),
        CurrencyCode: z.number()
    })).optional(),

    Rates: z.array(z.object({
        Id: z.string(),
        BaseCurrency: z.number(),
        TargetCurrency: z.number(),
        Rate: z.number(),
        RateDate: z.string() // ISO 8601 Date
    })).optional()
});

router.post('/', (req: Request, res: Response) => {
    try {
        const payload = companyCurrencySyncSchema.parse(req.body);
        const db = getDb();

        const upsertCurrencySql = db.driver === 'mssql' ? `
            MERGE INTO CompanyCurrency AS target
            USING (SELECT @Id AS Id) AS source
            ON (target.Id = source.Id)
            WHEN MATCHED THEN
                UPDATE SET CompanyId=@CompanyId, CurrencyCode=@CurrencyCode, _SyncedAt=GETUTCDATE()
            WHEN NOT MATCHED THEN
                INSERT (Id, CompanyId, CurrencyCode, _SyncedAt) VALUES (@Id, @CompanyId, @CurrencyCode, GETUTCDATE());
        ` : `
            INSERT INTO CompanyCurrency (Id, CompanyId, CurrencyCode) VALUES (@Id, @CompanyId, @CurrencyCode)
            ON CONFLICT(Id) DO UPDATE SET CompanyId=excluded.CompanyId, CurrencyCode=excluded.CurrencyCode, _SyncedAt=datetime('now')
        `;

        const upsertRateSql = db.driver === 'mssql' ? `
            MERGE INTO CurrencyRates AS target
            USING (SELECT @Id AS Id) AS source
            ON (target.Id = source.Id)
            WHEN MATCHED THEN
                UPDATE SET BaseCurrency=@BaseCurrency, TargetCurrency=@TargetCurrency, Rate=@Rate, RateDate=@RateDate, _SyncedAt=GETUTCDATE()
            WHEN NOT MATCHED THEN
                INSERT (Id, BaseCurrency, TargetCurrency, Rate, RateDate, _SyncedAt) VALUES (@Id, @BaseCurrency, @TargetCurrency, @Rate, @RateDate, GETUTCDATE());
        ` : `
            INSERT INTO CurrencyRates (Id, BaseCurrency, TargetCurrency, Rate, RateDate) VALUES (@Id, @BaseCurrency, @TargetCurrency, @Rate, @RateDate)
            ON CONFLICT(Id) DO UPDATE SET BaseCurrency=excluded.BaseCurrency, TargetCurrency=excluded.TargetCurrency, Rate=excluded.Rate, RateDate=excluded.RateDate, _SyncedAt=datetime('now')
        `;

        const syncResult = db.transaction(() => {
            let currencyCount = 0;
            let rateCount = 0;

            if (payload.Currencies && payload.Currencies.length > 0) {
                for (const curr of payload.Currencies) {
                    db.execute(upsertCurrencySql, {
                        Id: curr.Id,
                        CompanyId: curr.CompanyId,
                        CurrencyCode: curr.CurrencyCode
                    });
                    currencyCount++;
                }
            }

            if (payload.Rates && payload.Rates.length > 0) {
                for (const rate of payload.Rates) {
                    db.execute(upsertRateSql, {
                        Id: rate.Id,
                        BaseCurrency: rate.BaseCurrency,
                        TargetCurrency: rate.TargetCurrency,
                        Rate: rate.Rate,
                        RateDate: rate.RateDate
                    });
                    rateCount++;
                }
            }

            return { currencyCount, rateCount };
        });


        res.json({
            status: 'ok',
            upserted: true,
            batchId: payload.SyncBatchId || 'anonymous',
            currenciesSynced: syncResult.currencyCount,
            ratesSynced: syncResult.rateCount,
            syncedAt: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('[CompanyCurrency Sync Error]', error);
        res.status(400).json({ status: 'error', message: error.message || 'Validation Failed' });
    }
});

export default router;
