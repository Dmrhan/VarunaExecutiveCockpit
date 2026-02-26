import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { z } from 'zod';

const router = Router();

// Zod Schema representing the C# IStock model
const stockSchema = z.object({
    Id: z.string(),
    Code: z.string(),
    Name: z.string(),
    ShortName: z.string(),
    BaseUnitType: z.string(),
    SerialTrackingEnabled: z.number().nullable().optional(),
    SerialCodeType: z.number().nullable().optional(),
    SalesVatValue: z.number(),
    PurchaseVatValue: z.number(),
    VatCalculationType: z.number().nullable().optional(),
    StockType: z.number().nullable().optional(),
    ParentStocktId: z.string().nullable().optional(),
    State: z.number().nullable().optional(),
    ProductGroupId: z.string().nullable().optional(),
    BrandId: z.string().nullable().optional(),
    MinStockLevel: z.number().nullable().optional(),
    OrderLevel: z.number().nullable().optional(),
    TargetLevel: z.number().nullable().optional(),
    OrderTime: z.number().nullable().optional(),
    ReferenceCode: z.string().nullable().optional(),
    CompanyId: z.string().nullable().optional(),
    ProductType: z.number().nullable().optional(),
    AccountingDetailCode: z.string().nullable().optional(),
    InvWillWarrantyBeFollowed: z.number().nullable().optional(),
    InvWarrantyPeriod: z.number().nullable().optional(),
    InvWarrantyPeriodType: z.number().nullable().optional(),
    InvIsInstallationNecessary: z.number().nullable().optional(),
    TPOutReferenceCode: z.string().nullable().optional(),
    SAPOutReferenceCode: z.string().nullable().optional(),

    // Detail collections
    StockUnitTypes: z.array(z.object({
        UnitType: z.string().nullable().optional(),
        Quantity: z.number().nullable().optional(),
        Weight: z.number().nullable().optional(),
        Volume: z.number().nullable().optional(),
        RelatedUnitType: z.string().nullable().optional(),
        Barcode: z.string().nullable().optional(),
        IsTransactionUnit: z.number().nullable().optional(),
        TPOutReferenceCode: z.string().nullable().optional()
    })).nullable().optional(),

    AdditionalTaxes: z.array(z.object({
        TaxId: z.string().nullable().optional()
    })).nullable().optional(),

    StockFiles: z.array(z.object({
        FilePath: z.string().nullable().optional(),
        FileName: z.string().nullable().optional(),
        FileType: z.string().nullable().optional()
    })).nullable().optional(),

    Companies: z.array(z.object({
        CompanyId: z.string().nullable().optional()
    })).nullable().optional()
});

router.post('/', (req: Request, res: Response) => {
    try {
        const payload = stockSchema.parse(req.body);
        const db = getDb();

        const upsertStockSql = db.driver === 'mssql' ? `
            MERGE INTO Stock AS target
            USING (SELECT @Id AS Id) AS source
            ON (target.Id = source.Id)
            WHEN MATCHED THEN
                UPDATE SET 
                    Code = @Code, Name = @Name, ShortName = @ShortName, BaseUnitType = @BaseUnitType,
                    SerialTrackingEnabled = @SerialTrackingEnabled, SerialCodeType = @SerialCodeType,
                    SalesVatValue = @SalesVatValue, PurchaseVatValue = @PurchaseVatValue,
                    VatCalculationType = @VatCalculationType, StockType = @StockType,
                    ParentStocktId = @ParentStocktId, State = @State, ProductGroupId = @ProductGroupId,
                    BrandId = @BrandId, MinStockLevel = @MinStockLevel, OrderLevel = @OrderLevel,
                    TargetLevel = @TargetLevel, OrderTime = @OrderTime, ReferenceCode = @ReferenceCode,
                    CompanyId = @CompanyId, ProductType = @ProductType, AccountingDetailCode = @AccountingDetailCode,
                    InvWillWarrantyBeFollowed = @InvWillWarrantyBeFollowed, InvWarrantyPeriod = @InvWarrantyPeriod,
                    InvWarrantyPeriodType = @InvWarrantyPeriodType, InvIsInstallationNecessary = @InvIsInstallationNecessary,
                    TPOutReferenceCode = @TPOutReferenceCode, SAPOutReferenceCode = @SAPOutReferenceCode,
                    _SyncedAt = GETUTCDATE()
            WHEN NOT MATCHED THEN
                INSERT (
                    Id, Code, Name, ShortName, BaseUnitType, SerialTrackingEnabled, SerialCodeType,
                    SalesVatValue, PurchaseVatValue, VatCalculationType, StockType, ParentStocktId, State,
                    ProductGroupId, BrandId, MinStockLevel, OrderLevel, TargetLevel, OrderTime, ReferenceCode,
                    CompanyId, ProductType, AccountingDetailCode, InvWillWarrantyBeFollowed, InvWarrantyPeriod,
                    InvWarrantyPeriodType, InvIsInstallationNecessary, TPOutReferenceCode, SAPOutReferenceCode, _SyncedAt
                ) VALUES (
                    @Id, @Code, @Name, @ShortName, @BaseUnitType, @SerialTrackingEnabled, @SerialCodeType,
                    @SalesVatValue, @PurchaseVatValue, @VatCalculationType, @StockType, @ParentStocktId, @State,
                    @ProductGroupId, @BrandId, @MinStockLevel, @OrderLevel, @TargetLevel, @OrderTime, @ReferenceCode,
                    @CompanyId, @ProductType, @AccountingDetailCode, @InvWillWarrantyBeFollowed, @InvWarrantyPeriod,
                    @InvWarrantyPeriodType, @InvIsInstallationNecessary, @TPOutReferenceCode, @SAPOutReferenceCode, GETUTCDATE()
                );
        ` : `
            INSERT INTO Stock (
                Id, Code, Name, ShortName, BaseUnitType, SerialTrackingEnabled, SerialCodeType,
                SalesVatValue, PurchaseVatValue, VatCalculationType, StockType, ParentStocktId, State,
                ProductGroupId, BrandId, MinStockLevel, OrderLevel, TargetLevel, OrderTime, ReferenceCode,
                CompanyId, ProductType, AccountingDetailCode, InvWillWarrantyBeFollowed, InvWarrantyPeriod,
                InvWarrantyPeriodType, InvIsInstallationNecessary, TPOutReferenceCode, SAPOutReferenceCode
            ) VALUES (
                @Id, @Code, @Name, @ShortName, @BaseUnitType, @SerialTrackingEnabled, @SerialCodeType,
                @SalesVatValue, @PurchaseVatValue, @VatCalculationType, @StockType, @ParentStocktId, @State,
                @ProductGroupId, @BrandId, @MinStockLevel, @OrderLevel, @TargetLevel, @OrderTime, @ReferenceCode,
                @CompanyId, @ProductType, @AccountingDetailCode, @InvWillWarrantyBeFollowed, @InvWarrantyPeriod,
                @InvWarrantyPeriodType, @InvIsInstallationNecessary, @TPOutReferenceCode, @SAPOutReferenceCode
            )
            ON CONFLICT(Id) DO UPDATE SET
                Code = excluded.Code, Name = excluded.Name, ShortName = excluded.ShortName, BaseUnitType = excluded.BaseUnitType,
                SerialTrackingEnabled = excluded.SerialTrackingEnabled, SerialCodeType = excluded.SerialCodeType,
                SalesVatValue = excluded.SalesVatValue, PurchaseVatValue = excluded.PurchaseVatValue,
                VatCalculationType = excluded.VatCalculationType, StockType = excluded.StockType,
                ParentStocktId = excluded.ParentStocktId, State = excluded.State, ProductGroupId = excluded.ProductGroupId,
                BrandId = excluded.BrandId, MinStockLevel = excluded.MinStockLevel, OrderLevel = excluded.OrderLevel,
                TargetLevel = excluded.TargetLevel, OrderTime = excluded.OrderTime, ReferenceCode = excluded.ReferenceCode,
                CompanyId = excluded.CompanyId, ProductType = excluded.ProductType, AccountingDetailCode = excluded.AccountingDetailCode,
                InvWillWarrantyBeFollowed = excluded.InvWillWarrantyBeFollowed, InvWarrantyPeriod = excluded.InvWarrantyPeriod,
                InvWarrantyPeriodType = excluded.InvWarrantyPeriodType, InvIsInstallationNecessary = excluded.InvIsInstallationNecessary,
                TPOutReferenceCode = excluded.TPOutReferenceCode, SAPOutReferenceCode = excluded.SAPOutReferenceCode,
                _SyncedAt = datetime('now')
        `;

        const wasInsertedResult = db.transaction(() => {
            const result = db.execute(upsertStockSql, {
                Id: payload.Id,
                Code: payload.Code,
                Name: payload.Name,
                ShortName: payload.ShortName,
                BaseUnitType: payload.BaseUnitType,
                SerialTrackingEnabled: payload.SerialTrackingEnabled ?? null,
                SerialCodeType: payload.SerialCodeType ?? null,
                SalesVatValue: payload.SalesVatValue,
                PurchaseVatValue: payload.PurchaseVatValue,
                VatCalculationType: payload.VatCalculationType ?? null,
                StockType: payload.StockType ?? null,
                ParentStocktId: payload.ParentStocktId ?? null,
                State: payload.State ?? null,
                ProductGroupId: payload.ProductGroupId ?? null,
                BrandId: payload.BrandId ?? null,
                MinStockLevel: payload.MinStockLevel ?? null,
                OrderLevel: payload.OrderLevel ?? null,
                TargetLevel: payload.TargetLevel ?? null,
                OrderTime: payload.OrderTime ?? null,
                ReferenceCode: payload.ReferenceCode ?? null,
                CompanyId: payload.CompanyId ?? null,
                ProductType: payload.ProductType ?? null,
                AccountingDetailCode: payload.AccountingDetailCode ?? null,
                InvWillWarrantyBeFollowed: payload.InvWillWarrantyBeFollowed ?? null,
                InvWarrantyPeriod: payload.InvWarrantyPeriod ?? null,
                InvWarrantyPeriodType: payload.InvWarrantyPeriodType ?? null,
                InvIsInstallationNecessary: payload.InvIsInstallationNecessary ?? null,
                TPOutReferenceCode: payload.TPOutReferenceCode ?? null,
                SAPOutReferenceCode: payload.SAPOutReferenceCode ?? null
            });

            const isInsert = result.changes === 1;

            db.execute('DELETE FROM StockUnitTypes WHERE StockId = @id', { id: payload.Id });
            db.execute('DELETE FROM AdditionalTaxes WHERE StockId = @id', { id: payload.Id });
            db.execute('DELETE FROM StockFiles WHERE StockId = @id', { id: payload.Id });
            db.execute('DELETE FROM Companies_Stock WHERE StockId = @id', { id: payload.Id });

            payload.StockUnitTypes?.forEach((d: any) => {
                db.execute('INSERT INTO StockUnitTypes (StockId, UnitType, Quantity, Weight, Volume, RelatedUnitType, Barcode, IsTransactionUnit, TPOutReferenceCode) VALUES (@StockId, @UnitType, @Quantity, @Weight, @Volume, @RelatedUnitType, @Barcode, @IsTransactionUnit, @TPOutReferenceCode)', {
                    StockId: payload.Id,
                    UnitType: d.UnitType ?? null,
                    Quantity: d.Quantity ?? null,
                    Weight: d.Weight ?? null,
                    Volume: d.Volume ?? null,
                    RelatedUnitType: d.RelatedUnitType ?? null,
                    Barcode: d.Barcode ?? null,
                    IsTransactionUnit: d.IsTransactionUnit ?? null,
                    TPOutReferenceCode: d.TPOutReferenceCode ?? null
                });
            });

            payload.AdditionalTaxes?.forEach((d: any) => {
                db.execute('INSERT INTO AdditionalTaxes (StockId, TaxId) VALUES (@StockId, @TaxId)', {
                    StockId: payload.Id,
                    TaxId: d.TaxId ?? null
                });
            });

            payload.StockFiles?.forEach((d: any) => {
                db.execute('INSERT INTO StockFiles (StockId, FilePath, FileName, FileType) VALUES (@StockId, @FilePath, @FileName, @FileType)', {
                    StockId: payload.Id,
                    FilePath: d.FilePath ?? null,
                    FileName: d.FileName ?? null,
                    FileType: d.FileType ?? null
                });
            });

            payload.Companies?.forEach((d: any) => {
                db.execute('INSERT INTO Companies_Stock (StockId, CompanyId) VALUES (@StockId, @CompanyId)', {
                    StockId: payload.Id,
                    CompanyId: d.CompanyId ?? null
                });
            });

            return isInsert;
        });

        res.json({
            status: 'ok',
            upserted: wasInsertedResult,
            id: payload.Id,
            syncedAt: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('[Stock Sync Error]', error);
        res.status(400).json({ status: 'error', message: error.message || 'Verification Failed' });
    }
});

export default router;
