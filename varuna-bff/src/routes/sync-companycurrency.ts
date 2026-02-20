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

        const upsertCurrency = db.prepare(`
            INSERT INTO CompanyCurrency (
                Id, CompanyId, CurrencyCode
            ) VALUES (
                @Id, @CompanyId, @CurrencyCode
            )
            ON CONFLICT(Id) DO UPDATE SET
                CompanyId=excluded.CompanyId,
                CurrencyCode=excluded.CurrencyCode,
                _SyncedAt=datetime('now')
        `);

        const upsertRate = db.prepare(`
            INSERT INTO CurrencyRates (
                Id, BaseCurrency, TargetCurrency, Rate, RateDate
            ) VALUES (
                @Id, @BaseCurrency, @TargetCurrency, @Rate, @RateDate
            )
            ON CONFLICT(Id) DO UPDATE SET
                BaseCurrency=excluded.BaseCurrency,
                TargetCurrency=excluded.TargetCurrency,
                Rate=excluded.Rate,
                RateDate=excluded.RateDate,
                _SyncedAt=datetime('now')
        `);

        const syncTransaction = db.transaction((data) => {
            let currencyCount = 0;
            let rateCount = 0;

            if (data.Currencies && data.Currencies.length > 0) {
                for (const curr of data.Currencies) {
                    upsertCurrency.run({
                        Id: curr.Id,
                        CompanyId: curr.CompanyId,
                        CurrencyCode: curr.CurrencyCode
                    });
                    currencyCount++;
                }
            }

            if (data.Rates && data.Rates.length > 0) {
                for (const rate of data.Rates) {
                    upsertRate.run({
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

        const syncResult = syncTransaction(payload);

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
