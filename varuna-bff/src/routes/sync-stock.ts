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

        const upsertStock = db.prepare(`
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
        `);

        const insertUnitType = db.prepare('INSERT INTO StockUnitTypes (StockId, UnitType, Quantity, Weight, Volume, RelatedUnitType, Barcode, IsTransactionUnit, TPOutReferenceCode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        const insertTax = db.prepare('INSERT INTO AdditionalTaxes (StockId, TaxId) VALUES (?, ?)');
        const insertFile = db.prepare('INSERT INTO StockFiles (StockId, FilePath, FileName, FileType) VALUES (?, ?, ?, ?)');
        // Mapping 'Companies' array to internal table 'Companies_Stock'
        const insertComp = db.prepare('INSERT INTO Companies_Stock (StockId, CompanyId) VALUES (?, ?)');

        const syncTransaction = db.transaction((data) => {
            const info = upsertStock.run({
                Id: data.Id,
                Code: data.Code,
                Name: data.Name,
                ShortName: data.ShortName,
                BaseUnitType: data.BaseUnitType,
                SerialTrackingEnabled: data.SerialTrackingEnabled ?? null,
                SerialCodeType: data.SerialCodeType ?? null,
                SalesVatValue: data.SalesVatValue,
                PurchaseVatValue: data.PurchaseVatValue,
                VatCalculationType: data.VatCalculationType ?? null,
                StockType: data.StockType ?? null,
                ParentStocktId: data.ParentStocktId ?? null,
                State: data.State ?? null,
                ProductGroupId: data.ProductGroupId ?? null,
                BrandId: data.BrandId ?? null,
                MinStockLevel: data.MinStockLevel ?? null,
                OrderLevel: data.OrderLevel ?? null,
                TargetLevel: data.TargetLevel ?? null,
                OrderTime: data.OrderTime ?? null,
                ReferenceCode: data.ReferenceCode ?? null,
                CompanyId: data.CompanyId ?? null,
                ProductType: data.ProductType ?? null,
                AccountingDetailCode: data.AccountingDetailCode ?? null,
                InvWillWarrantyBeFollowed: data.InvWillWarrantyBeFollowed ?? null,
                InvWarrantyPeriod: data.InvWarrantyPeriod ?? null,
                InvWarrantyPeriodType: data.InvWarrantyPeriodType ?? null,
                InvIsInstallationNecessary: data.InvIsInstallationNecessary ?? null,
                TPOutReferenceCode: data.TPOutReferenceCode ?? null,
                SAPOutReferenceCode: data.SAPOutReferenceCode ?? null
            });

            const isInsert = info.changes === 1;

            db.prepare('DELETE FROM StockUnitTypes WHERE StockId = ?').run(data.Id);
            db.prepare('DELETE FROM AdditionalTaxes WHERE StockId = ?').run(data.Id);
            db.prepare('DELETE FROM StockFiles WHERE StockId = ?').run(data.Id);
            db.prepare('DELETE FROM Companies_Stock WHERE StockId = ?').run(data.Id);

            data.StockUnitTypes?.forEach((d: any) => insertUnitType.run(data.Id, d.UnitType ?? null, d.Quantity ?? null, d.Weight ?? null, d.Volume ?? null, d.RelatedUnitType ?? null, d.Barcode ?? null, d.IsTransactionUnit ?? null, d.TPOutReferenceCode ?? null));
            data.AdditionalTaxes?.forEach((d: any) => insertTax.run(data.Id, d.TaxId ?? null));
            data.StockFiles?.forEach((d: any) => insertFile.run(data.Id, d.FilePath ?? null, d.FileName ?? null, d.FileType ?? null));
            data.Companies?.forEach((d: any) => insertComp.run(data.Id, d.CompanyId ?? null));

            return isInsert;
        });

        const wasInserted = syncTransaction(payload);

        res.json({
            status: 'ok',
            upserted: wasInserted,
            id: payload.Id,
            syncedAt: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('[Stock Sync Error]', error);
        res.status(400).json({ status: 'error', message: error.message || 'Verification Failed' });
    }
});

export default router;
