import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { z } from 'zod';

const router = Router();

// Zod Schema representing the C# IInventoryAccountProduct model
const inventoryAccountProductSchema = z.object({
    Id: z.string(),
    AccountId: z.string(),
    StockId: z.string(),
    ContactId: z.string().nullable().optional(),

    StartDate: z.string().nullable().optional(),
    FinishDate: z.string().nullable().optional(),

    Domain: z.string().nullable().optional(),
    PosAccountNo: z.string().nullable().optional(),
    CardNo: z.string().nullable().optional(),

    Status: z.number().nullable().optional(),
    FinancialProductType: z.number().nullable().optional(),
    Amount: z.number().nullable().optional(),

    InvSerialId: z.string().nullable().optional(),
    InvInstalledDate: z.string().nullable().optional(),
    InvPurchaseDate: z.string(),

    InvOutOfWarehouseSerial: z.number().nullable().optional(),
    InvOutOfWarehouseSerialCode: z.string().nullable().optional(),
    IsPFActive: z.number().nullable().optional(),

    // IMoney Nested Structures
    Price: z.object({
        Amount: z.number().nullable().optional(),
        Currency: z.string().nullable().optional()
    }).nullable().optional(),
    Vat: z.object({
        Amount: z.number().nullable().optional(),
        Currency: z.string().nullable().optional()
    }).nullable().optional(),
    TotalListPrice: z.object({
        Amount: z.number().nullable().optional(),
        Currency: z.string().nullable().optional()
    }).nullable().optional(),
    TotalPackagePrice: z.object({
        Amount: z.number().nullable().optional(),
        Currency: z.string().nullable().optional()
    }).nullable().optional(),
    TotalPackageVATAmount: z.object({
        Amount: z.number().nullable().optional(),
        Currency: z.string().nullable().optional()
    }).nullable().optional(),

    // IAddress Nested Structure
    InvInstalledAddress: z.object({
        CountryCode: z.string().nullable().optional(),
        Subdivision1: z.string().nullable().optional(),
        Subdivision2: z.string().nullable().optional(),
        Subdivision3: z.string().nullable().optional(),
        Subdivision4: z.string().nullable().optional(),
        OpenAddress: z.string().nullable().optional()
    }).nullable().optional()
});

router.post('/', (req: Request, res: Response) => {
    try {
        const payload = inventoryAccountProductSchema.parse(req.body);
        const db = getDb();

        const upsertInventorySql = db.driver === 'mssql' ? `
            MERGE INTO InventoryAccountProduct AS target
            USING (SELECT @Id AS Id) AS source
            ON (target.Id = source.Id)
            WHEN MATCHED THEN
                UPDATE SET 
                    AccountId = @AccountId, StockId = @StockId, ContactId = @ContactId,
                    StartDate = @StartDate, FinishDate = @FinishDate, Domain = @Domain,
                    PosAccountNo = @PosAccountNo, CardNo = @CardNo, Status = @Status,
                    FinancialProductType = @FinancialProductType, Amount = @Amount,
                    InvSerialId = @InvSerialId, InvInstalledDate = @InvInstalledDate,
                    InvPurchaseDate = @InvPurchaseDate, InvOutOfWarehouseSerial = @InvOutOfWarehouseSerial,
                    InvOutOfWarehouseSerialCode = @InvOutOfWarehouseSerialCode, IsPFActive = @IsPFActive,
                    Price_Amount = @Price_Amount, Price_Currency = @Price_Currency,
                    Vat_Amount = @Vat_Amount, Vat_Currency = @Vat_Currency,
                    TotalListPrice_Amount = @TotalListPrice_Amount, TotalListPrice_Currency = @TotalListPrice_Currency,
                    TotalPackagePrice_Amount = @TotalPackagePrice_Amount, TotalPackagePrice_Currency = @TotalPackagePrice_Currency,
                    TotalPackageVATAmount_Amount = @TotalPackageVATAmount_Amount, TotalPackageVATAmount_Currency = @TotalPackageVATAmount_Currency,
                    InvInstalledAddress_CountryCode = @InvInstalledAddress_CountryCode, InvInstalledAddress_Subdivision1 = @InvInstalledAddress_Subdivision1,
                    InvInstalledAddress_Subdivision2 = @InvInstalledAddress_Subdivision2, InvInstalledAddress_Subdivision3 = @InvInstalledAddress_Subdivision3,
                    InvInstalledAddress_Subdivision4 = @InvInstalledAddress_Subdivision4, InvInstalledAddress_OpenAddress = @InvInstalledAddress_OpenAddress,
                    _SyncedAt = GETUTCDATE()
            WHEN NOT MATCHED THEN
                INSERT (
                    Id, AccountId, StockId, ContactId, StartDate, FinishDate, Domain, PosAccountNo, CardNo,
                    Status, FinancialProductType, Amount, InvSerialId, InvInstalledDate, InvPurchaseDate,
                    InvOutOfWarehouseSerial, InvOutOfWarehouseSerialCode, IsPFActive,
                    Price_Amount, Price_Currency,
                    Vat_Amount, Vat_Currency,
                    TotalListPrice_Amount, TotalListPrice_Currency,
                    TotalPackagePrice_Amount, TotalPackagePrice_Currency,
                    TotalPackageVATAmount_Amount, TotalPackageVATAmount_Currency,
                    InvInstalledAddress_CountryCode, InvInstalledAddress_Subdivision1, InvInstalledAddress_Subdivision2,
                    InvInstalledAddress_Subdivision3, InvInstalledAddress_Subdivision4, InvInstalledAddress_OpenAddress, _SyncedAt
                ) VALUES (
                    @Id, @AccountId, @StockId, @ContactId, @StartDate, @FinishDate, @Domain, @PosAccountNo, @CardNo,
                    @Status, @FinancialProductType, @Amount, @InvSerialId, @InvInstalledDate, @InvPurchaseDate,
                    @InvOutOfWarehouseSerial, @InvOutOfWarehouseSerialCode, @IsPFActive,
                    @Price_Amount, @Price_Currency,
                    @Vat_Amount, @Vat_Currency,
                    @TotalListPrice_Amount, @TotalListPrice_Currency,
                    @TotalPackagePrice_Amount, @TotalPackagePrice_Currency,
                    @TotalPackageVATAmount_Amount, @TotalPackageVATAmount_Currency,
                    @InvInstalledAddress_CountryCode, @InvInstalledAddress_Subdivision1, @InvInstalledAddress_Subdivision2,
                    @InvInstalledAddress_Subdivision3, @InvInstalledAddress_Subdivision4, @InvInstalledAddress_OpenAddress, GETUTCDATE()
                );
        ` : `
            INSERT INTO InventoryAccountProduct (
                Id, AccountId, StockId, ContactId, StartDate, FinishDate, Domain, PosAccountNo, CardNo,
                Status, FinancialProductType, Amount, InvSerialId, InvInstalledDate, InvPurchaseDate,
                InvOutOfWarehouseSerial, InvOutOfWarehouseSerialCode, IsPFActive,
                Price_Amount, Price_Currency,
                Vat_Amount, Vat_Currency,
                TotalListPrice_Amount, TotalListPrice_Currency,
                TotalPackagePrice_Amount, TotalPackagePrice_Currency,
                TotalPackageVATAmount_Amount, TotalPackageVATAmount_Currency,
                InvInstalledAddress_CountryCode, InvInstalledAddress_Subdivision1, InvInstalledAddress_Subdivision2,
                InvInstalledAddress_Subdivision3, InvInstalledAddress_Subdivision4, InvInstalledAddress_OpenAddress
            ) VALUES (
                @Id, @AccountId, @StockId, @ContactId, @StartDate, @FinishDate, @Domain, @PosAccountNo, @CardNo,
                @Status, @FinancialProductType, @Amount, @InvSerialId, @InvInstalledDate, @InvPurchaseDate,
                @InvOutOfWarehouseSerial, @InvOutOfWarehouseSerialCode, @IsPFActive,
                @Price_Amount, @Price_Currency,
                @Vat_Amount, @Vat_Currency,
                @TotalListPrice_Amount, @TotalListPrice_Currency,
                @TotalPackagePrice_Amount, @TotalPackagePrice_Currency,
                @TotalPackageVATAmount_Amount, @TotalPackageVATAmount_Currency,
                @InvInstalledAddress_CountryCode, @InvInstalledAddress_Subdivision1, @InvInstalledAddress_Subdivision2,
                @InvInstalledAddress_Subdivision3, @InvInstalledAddress_Subdivision4, @InvInstalledAddress_OpenAddress
            )
            ON CONFLICT(Id) DO UPDATE SET
                AccountId = excluded.AccountId, StockId = excluded.StockId, ContactId = excluded.ContactId,
                StartDate = excluded.StartDate, FinishDate = excluded.FinishDate, Domain = excluded.Domain,
                PosAccountNo = excluded.PosAccountNo, CardNo = excluded.CardNo, Status = excluded.Status,
                FinancialProductType = excluded.FinancialProductType, Amount = excluded.Amount,
                InvSerialId = excluded.InvSerialId, InvInstalledDate = excluded.InvInstalledDate,
                InvPurchaseDate = excluded.InvPurchaseDate, InvOutOfWarehouseSerial = excluded.InvOutOfWarehouseSerial,
                InvOutOfWarehouseSerialCode = excluded.InvOutOfWarehouseSerialCode, IsPFActive = excluded.IsPFActive,
                Price_Amount = excluded.Price_Amount, Price_Currency = excluded.Price_Currency,
                Vat_Amount = excluded.Vat_Amount, Vat_Currency = excluded.Vat_Currency,
                TotalListPrice_Amount = excluded.TotalListPrice_Amount, TotalListPrice_Currency = excluded.TotalListPrice_Currency,
                TotalPackagePrice_Amount = excluded.TotalPackagePrice_Amount, TotalPackagePrice_Currency = excluded.TotalPackagePrice_Currency,
                TotalPackageVATAmount_Amount = excluded.TotalPackageVATAmount_Amount, TotalPackageVATAmount_Currency = excluded.TotalPackageVATAmount_Currency,
                InvInstalledAddress_CountryCode = excluded.InvInstalledAddress_CountryCode, InvInstalledAddress_Subdivision1 = excluded.InvInstalledAddress_Subdivision1,
                InvInstalledAddress_Subdivision2 = excluded.InvInstalledAddress_Subdivision2, InvInstalledAddress_Subdivision3 = excluded.InvInstalledAddress_Subdivision3,
                InvInstalledAddress_Subdivision4 = excluded.InvInstalledAddress_Subdivision4, InvInstalledAddress_OpenAddress = excluded.InvInstalledAddress_OpenAddress,
                _SyncedAt = datetime('now')
        `;

        const wasInserted = db.transaction(() => {
            const result = db.execute(upsertInventorySql, {
                Id: payload.Id,
                AccountId: payload.AccountId,
                StockId: payload.StockId,
                ContactId: payload.ContactId ?? null,
                StartDate: payload.StartDate ?? null,
                FinishDate: payload.FinishDate ?? null,
                Domain: payload.Domain ?? null,
                PosAccountNo: payload.PosAccountNo ?? null,
                CardNo: payload.CardNo ?? null,
                Status: payload.Status ?? null,
                FinancialProductType: payload.FinancialProductType ?? null,
                Amount: payload.Amount ?? null,
                InvSerialId: payload.InvSerialId ?? null,
                InvInstalledDate: payload.InvInstalledDate ?? null,
                InvPurchaseDate: payload.InvPurchaseDate,
                InvOutOfWarehouseSerial: payload.InvOutOfWarehouseSerial ?? null,
                InvOutOfWarehouseSerialCode: payload.InvOutOfWarehouseSerialCode ?? null,
                IsPFActive: payload.IsPFActive ?? null,

                // Flattened IMoney
                Price_Amount: payload.Price?.Amount ?? null,
                Price_Currency: payload.Price?.Currency ?? null,
                Vat_Amount: payload.Vat?.Amount ?? null,
                Vat_Currency: payload.Vat?.Currency ?? null,
                TotalListPrice_Amount: payload.TotalListPrice?.Amount ?? null,
                TotalListPrice_Currency: payload.TotalListPrice?.Currency ?? null,
                TotalPackagePrice_Amount: payload.TotalPackagePrice?.Amount ?? null,
                TotalPackagePrice_Currency: payload.TotalPackagePrice?.Currency ?? null,
                TotalPackageVATAmount_Amount: payload.TotalPackageVATAmount?.Amount ?? null,
                TotalPackageVATAmount_Currency: payload.TotalPackageVATAmount?.Currency ?? null,

                // Flattened IAddress
                InvInstalledAddress_CountryCode: payload.InvInstalledAddress?.CountryCode ?? null,
                InvInstalledAddress_Subdivision1: payload.InvInstalledAddress?.Subdivision1 ?? null,
                InvInstalledAddress_Subdivision2: payload.InvInstalledAddress?.Subdivision2 ?? null,
                InvInstalledAddress_Subdivision3: payload.InvInstalledAddress?.Subdivision3 ?? null,
                InvInstalledAddress_Subdivision4: payload.InvInstalledAddress?.Subdivision4 ?? null,
                InvInstalledAddress_OpenAddress: payload.InvInstalledAddress?.OpenAddress ?? null,
            });

            return result.changes === 1;
        });


        res.json({
            status: 'ok',
            upserted: wasInserted,
            id: payload.Id,
            syncedAt: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('[InventoryAccountProduct Sync Error]', error);
        res.status(400).json({ status: 'error', message: error.message || 'Verification Failed' });
    }
});

export default router;
