import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { z } from 'zod';

const router = Router();

// Zod Schema representing the C# ICrmOrderProducts model with IMoney flattened logically
const crmOrderProductsSchema = z.object({
    Id: z.string(),
    CrmOrderId: z.string(),
    StockId: z.string(),
    Quantity: z.number(),
    DeliveryTime: z.string().nullable().optional(),
    TransactionDate: z.string(),
    LineDiscountRate: z.number().nullable().optional(),
    LineDiscountType: z.number().nullable().optional(),
    Tax: z.number(),
    ProfitRate: z.number().nullable().optional(),
    CurrencyRate: z.number().nullable().optional(),
    ComissionRate: z.number().nullable().optional(),
    StockUnitTypeIdentifier: z.string(),
    StockUnitType: z.string().nullable().optional(),
    Description: z.string().nullable().optional(),
    ItemNo: z.string().nullable().optional(),
    PYPSapId: z.string().nullable().optional(),
    StorageLocationSapId: z.string().nullable().optional(),
    ProductionLocationSapId: z.string().nullable().optional(),
    QuoteProductId: z.string().nullable().optional(),
    PFApplicaitonType: z.number().nullable().optional(),

    // IMoney Nested Structures
    LineDiscountAmount: z.object({
        Amount: z.number().nullable().optional(),
        Currency: z.string().nullable().optional()
    }).nullable().optional(),
    UnitPrice: z.object({
        Amount: z.number().nullable().optional(),
        Currency: z.string().nullable().optional()
    }).nullable().optional(),
    PurchasingPrice: z.object({
        Amount: z.number().nullable().optional(),
        Currency: z.string().nullable().optional()
    }).nullable().optional(),
    Total: z.object({
        Amount: z.number().nullable().optional(),
        Currency: z.string().nullable().optional()
    }).nullable().optional(),
    NetLineSubTotal: z.object({
        Amount: z.number().nullable().optional(),
        Currency: z.string().nullable().optional()
    }).nullable().optional(),
    TotalProfitAmountWithLocalCurrency: z.object({
        Amount: z.number().nullable().optional(),
        Currency: z.string().nullable().optional()
    }).nullable().optional(),
    UnitProfitAmountWithLocalCurrency: z.object({
        Amount: z.number().nullable().optional(),
        Currency: z.string().nullable().optional()
    }).nullable().optional(),
    NetLineTotalAmount: z.object({
        Amount: z.number().nullable().optional(),
        Currency: z.string().nullable().optional()
    }).nullable().optional(),
    NetLineTotalWithTax: z.object({
        Amount: z.number().nullable().optional(),
        Currency: z.string().nullable().optional()
    }).nullable().optional(),
    NetLineTotalWithTaxLocalCurrency: z.object({
        Amount: z.number().nullable().optional(),
        Currency: z.string().nullable().optional()
    }).nullable().optional(),
    NetLineSubTotalLocalCurrency: z.object({
        Amount: z.number().nullable().optional(),
        Currency: z.string().nullable().optional()
    }).nullable().optional(),
    NetLineTotalAmountLocalCurrency: z.object({
        Amount: z.number().nullable().optional(),
        Currency: z.string().nullable().optional()
    }).nullable().optional(),
    ProfitAfterSubtotalDiscountLocalCurrency: z.object({
        Amount: z.number().nullable().optional(),
        Currency: z.string().nullable().optional()
    }).nullable().optional()
});

router.post('/', (req: Request, res: Response) => {
    try {
        const payload = crmOrderProductsSchema.parse(req.body);
        const db = getDb();

        const upsertOrderProductSql = db.driver === 'mssql' ? `
            MERGE INTO CrmOrderProducts AS target
            USING (SELECT @Id AS Id) AS source
            ON (target.Id = source.Id)
            WHEN MATCHED THEN
                UPDATE SET 
                    CrmOrderId = @CrmOrderId, StockId = @StockId, Quantity = @Quantity,
                    DeliveryTime = @DeliveryTime, TransactionDate = @TransactionDate,
                    LineDiscountRate = @LineDiscountRate, LineDiscountType = @LineDiscountType,
                    Tax = @Tax, ProfitRate = @ProfitRate, CurrencyRate = @CurrencyRate,
                    ComissionRate = @ComissionRate, StockUnitTypeIdentifier = @StockUnitTypeIdentifier,
                    StockUnitType = @StockUnitType, Description = @Description, ItemNo = @ItemNo,
                    PYPSapId = @PYPSapId, StorageLocationSapId = @StorageLocationSapId,
                    ProductionLocationSapId = @ProductionLocationSapId, QuoteProductId = @QuoteProductId,
                    PFApplicaitonType = @PFApplicaitonType,
                    LineDiscountAmount_Amount = @LineDiscountAmount_Amount, LineDiscountAmount_Currency = @LineDiscountAmount_Currency,
                    UnitPrice_Amount = @UnitPrice_Amount, UnitPrice_Currency = @UnitPrice_Currency,
                    PurchasingPrice_Amount = @PurchasingPrice_Amount, PurchasingPrice_Currency = @PurchasingPrice_Currency,
                    Total_Amount = @Total_Amount, Total_Currency = @Total_Currency,
                    NetLineSubTotal_Amount = @NetLineSubTotal_Amount, NetLineSubTotal_Currency = @NetLineSubTotal_Currency,
                    TotalProfitAmountWithLocalCurrency_Amount = @TotalProfitAmountWithLocalCurrency_Amount, TotalProfitAmountWithLocalCurrency_Currency = @TotalProfitAmountWithLocalCurrency_Currency,
                    UnitProfitAmountWithLocalCurrency_Amount = @UnitProfitAmountWithLocalCurrency_Amount, UnitProfitAmountWithLocalCurrency_Currency = @UnitProfitAmountWithLocalCurrency_Currency,
                    NetLineTotalAmount_Amount = @NetLineTotalAmount_Amount, NetLineTotalAmount_Currency = @NetLineTotalAmount_Currency,
                    NetLineTotalWithTax_Amount = @NetLineTotalWithTax_Amount, NetLineTotalWithTax_Currency = @NetLineTotalWithTax_Currency,
                    NetLineTotalWithTaxLocalCurrency_Amount = @NetLineTotalWithTaxLocalCurrency_Amount, NetLineTotalWithTaxLocalCurrency_Currency = @NetLineTotalWithTaxLocalCurrency_Currency,
                    NetLineSubTotalLocalCurrency_Amount = @NetLineSubTotalLocalCurrency_Amount, NetLineSubTotalLocalCurrency_Currency = @NetLineSubTotalLocalCurrency_Currency,
                    NetLineTotalAmountLocalCurrency_Amount = @NetLineTotalAmountLocalCurrency_Amount, NetLineTotalAmountLocalCurrency_Currency = @NetLineTotalAmountLocalCurrency_Currency,
                    ProfitAfterSubtotalDiscountLocalCurrency_Amount = @ProfitAfterSubtotalDiscountLocalCurrency_Amount, ProfitAfterSubtotalDiscountLocalCurrency_Currency = @ProfitAfterSubtotalDiscountLocalCurrency_Currency,
                    _SyncedAt = GETUTCDATE()
            WHEN NOT MATCHED THEN
                INSERT (
                    Id, CrmOrderId, StockId, Quantity, DeliveryTime, TransactionDate, LineDiscountRate, LineDiscountType,
                    Tax, ProfitRate, CurrencyRate, ComissionRate, StockUnitTypeIdentifier, StockUnitType, Description, ItemNo,
                    PYPSapId, StorageLocationSapId, ProductionLocationSapId, QuoteProductId, PFApplicaitonType,
                    LineDiscountAmount_Amount, LineDiscountAmount_Currency,
                    UnitPrice_Amount, UnitPrice_Currency,
                    PurchasingPrice_Amount, PurchasingPrice_Currency,
                    Total_Amount, Total_Currency,
                    NetLineSubTotal_Amount, NetLineSubTotal_Currency,
                    TotalProfitAmountWithLocalCurrency_Amount, TotalProfitAmountWithLocalCurrency_Currency,
                    UnitProfitAmountWithLocalCurrency_Amount, UnitProfitAmountWithLocalCurrency_Currency,
                    NetLineTotalAmount_Amount, NetLineTotalAmount_Currency,
                    NetLineTotalWithTax_Amount, NetLineTotalWithTax_Currency,
                    NetLineTotalWithTaxLocalCurrency_Amount, NetLineTotalWithTaxLocalCurrency_Currency,
                    NetLineSubTotalLocalCurrency_Amount, NetLineSubTotalLocalCurrency_Currency,
                    NetLineTotalAmountLocalCurrency_Amount, NetLineTotalAmountLocalCurrency_Currency,
                    ProfitAfterSubtotalDiscountLocalCurrency_Amount, ProfitAfterSubtotalDiscountLocalCurrency_Currency, _SyncedAt
                ) VALUES (
                    @Id, @CrmOrderId, @StockId, @Quantity, @DeliveryTime, @TransactionDate, @LineDiscountRate, @LineDiscountType,
                    @Tax, @ProfitRate, @CurrencyRate, @ComissionRate, @StockUnitTypeIdentifier, @StockUnitType, @Description, @ItemNo,
                    @PYPSapId, @StorageLocationSapId, @ProductionLocationSapId, @QuoteProductId, @PFApplicaitonType,
                    @LineDiscountAmount_Amount, @LineDiscountAmount_Currency,
                    @UnitPrice_Amount, @UnitPrice_Currency,
                    @PurchasingPrice_Amount, @PurchasingPrice_Currency,
                    @Total_Amount, @Total_Currency,
                    @NetLineSubTotal_Amount, @NetLineSubTotal_Currency,
                    @TotalProfitAmountWithLocalCurrency_Amount, @TotalProfitAmountWithLocalCurrency_Currency,
                    @UnitProfitAmountWithLocalCurrency_Amount, @UnitProfitAmountWithLocalCurrency_Currency,
                    @NetLineTotalAmount_Amount, @NetLineTotalAmount_Currency,
                    @NetLineTotalWithTax_Amount, @NetLineTotalWithTax_Currency,
                    @NetLineTotalWithTaxLocalCurrency_Amount, @NetLineTotalWithTaxLocalCurrency_Currency,
                    @NetLineSubTotalLocalCurrency_Amount, @NetLineSubTotalLocalCurrency_Currency,
                    @NetLineTotalAmountLocalCurrency_Amount, @NetLineTotalAmountLocalCurrency_Currency,
                    @ProfitAfterSubtotalDiscountLocalCurrency_Amount, @ProfitAfterSubtotalDiscountLocalCurrency_Currency, GETUTCDATE()
                );
        ` : `
            INSERT INTO CrmOrderProducts (
                Id, CrmOrderId, StockId, Quantity, DeliveryTime, TransactionDate, LineDiscountRate, LineDiscountType,
                Tax, ProfitRate, CurrencyRate, ComissionRate, StockUnitTypeIdentifier, StockUnitType, Description, ItemNo,
                PYPSapId, StorageLocationSapId, ProductionLocationSapId, QuoteProductId, PFApplicaitonType,
                LineDiscountAmount_Amount, LineDiscountAmount_Currency,
                UnitPrice_Amount, UnitPrice_Currency,
                PurchasingPrice_Amount, PurchasingPrice_Currency,
                Total_Amount, Total_Currency,
                NetLineSubTotal_Amount, NetLineSubTotal_Currency,
                TotalProfitAmountWithLocalCurrency_Amount, TotalProfitAmountWithLocalCurrency_Currency,
                UnitProfitAmountWithLocalCurrency_Amount, UnitProfitAmountWithLocalCurrency_Currency,
                NetLineTotalAmount_Amount, NetLineTotalAmount_Currency,
                NetLineTotalWithTax_Amount, NetLineTotalWithTax_Currency,
                NetLineTotalWithTaxLocalCurrency_Amount, NetLineTotalWithTaxLocalCurrency_Currency,
                NetLineSubTotalLocalCurrency_Amount, NetLineSubTotalLocalCurrency_Currency,
                NetLineTotalAmountLocalCurrency_Amount, NetLineTotalAmountLocalCurrency_Currency,
                ProfitAfterSubtotalDiscountLocalCurrency_Amount, ProfitAfterSubtotalDiscountLocalCurrency_Currency
            ) VALUES (
                @Id, @CrmOrderId, @StockId, @Quantity, @DeliveryTime, @TransactionDate, @LineDiscountRate, @LineDiscountType,
                @Tax, @ProfitRate, @CurrencyRate, @ComissionRate, @StockUnitTypeIdentifier, @StockUnitType, @Description, @ItemNo,
                @PYPSapId, @StorageLocationSapId, @ProductionLocationSapId, @QuoteProductId, @PFApplicaitonType,
                @LineDiscountAmount_Amount, @LineDiscountAmount_Currency,
                @UnitPrice_Amount, @UnitPrice_Currency,
                @PurchasingPrice_Amount, @PurchasingPrice_Currency,
                @Total_Amount, @Total_Currency,
                @NetLineSubTotal_Amount, @NetLineSubTotal_Currency,
                @TotalProfitAmountWithLocalCurrency_Amount, @TotalProfitAmountWithLocalCurrency_Currency,
                @UnitProfitAmountWithLocalCurrency_Amount, @UnitProfitAmountWithLocalCurrency_Currency,
                @NetLineTotalAmount_Amount, @NetLineTotalAmount_Currency,
                @NetLineTotalWithTax_Amount, @NetLineTotalWithTax_Currency,
                @NetLineTotalWithTaxLocalCurrency_Amount, @NetLineTotalWithTaxLocalCurrency_Currency,
                @NetLineSubTotalLocalCurrency_Amount, @NetLineSubTotalLocalCurrency_Currency,
                @NetLineTotalAmountLocalCurrency_Amount, @NetLineTotalAmountLocalCurrency_Currency,
                @ProfitAfterSubtotalDiscountLocalCurrency_Amount, @ProfitAfterSubtotalDiscountLocalCurrency_Currency
            )
            ON CONFLICT(Id) DO UPDATE SET
                CrmOrderId = excluded.CrmOrderId, StockId = excluded.StockId, Quantity = excluded.Quantity,
                DeliveryTime = excluded.DeliveryTime, TransactionDate = excluded.TransactionDate,
                LineDiscountRate = excluded.LineDiscountRate, LineDiscountType = excluded.LineDiscountType,
                Tax = excluded.Tax, ProfitRate = excluded.ProfitRate, CurrencyRate = excluded.CurrencyRate,
                ComissionRate = excluded.ComissionRate, StockUnitTypeIdentifier = excluded.StockUnitTypeIdentifier,
                StockUnitType = excluded.StockUnitType, Description = excluded.Description, ItemNo = excluded.ItemNo,
                PYPSapId = excluded.PYPSapId, StorageLocationSapId = excluded.StorageLocationSapId,
                ProductionLocationSapId = excluded.ProductionLocationSapId, QuoteProductId = excluded.QuoteProductId,
                PFApplicaitonType = excluded.PFApplicaitonType,
                LineDiscountAmount_Amount = excluded.LineDiscountAmount_Amount, LineDiscountAmount_Currency = excluded.LineDiscountAmount_Currency,
                UnitPrice_Amount = excluded.UnitPrice_Amount, UnitPrice_Currency = excluded.UnitPrice_Currency,
                PurchasingPrice_Amount = excluded.PurchasingPrice_Amount, PurchasingPrice_Currency = excluded.PurchasingPrice_Currency,
                Total_Amount = excluded.Total_Amount, Total_Currency = excluded.Total_Currency,
                NetLineSubTotal_Amount = excluded.NetLineSubTotal_Amount, NetLineSubTotal_Currency = excluded.NetLineSubTotal_Currency,
                TotalProfitAmountWithLocalCurrency_Amount = excluded.TotalProfitAmountWithLocalCurrency_Amount, TotalProfitAmountWithLocalCurrency_Currency = excluded.TotalProfitAmountWithLocalCurrency_Currency,
                UnitProfitAmountWithLocalCurrency_Amount = excluded.UnitProfitAmountWithLocalCurrency_Amount, UnitProfitAmountWithLocalCurrency_Currency = excluded.UnitProfitAmountWithLocalCurrency_Currency,
                NetLineTotalAmount_Amount = excluded.NetLineTotalAmount_Amount, NetLineTotalAmount_Currency = excluded.NetLineTotalAmount_Currency,
                NetLineTotalWithTax_Amount = excluded.NetLineTotalWithTax_Amount, NetLineTotalWithTax_Currency = excluded.NetLineTotalWithTax_Currency,
                NetLineTotalWithTaxLocalCurrency_Amount = excluded.NetLineTotalWithTaxLocalCurrency_Amount, NetLineTotalWithTaxLocalCurrency_Currency = excluded.NetLineTotalWithTaxLocalCurrency_Currency,
                NetLineSubTotalLocalCurrency_Amount = excluded.NetLineSubTotalLocalCurrency_Amount, NetLineSubTotalLocalCurrency_Currency = excluded.NetLineSubTotalLocalCurrency_Currency,
                NetLineTotalAmountLocalCurrency_Amount = excluded.NetLineTotalAmountLocalCurrency_Amount, NetLineTotalAmountLocalCurrency_Currency = excluded.NetLineTotalAmountLocalCurrency_Currency,
                ProfitAfterSubtotalDiscountLocalCurrency_Amount = excluded.ProfitAfterSubtotalDiscountLocalCurrency_Amount, ProfitAfterSubtotalDiscountLocalCurrency_Currency = excluded.ProfitAfterSubtotalDiscountLocalCurrency_Currency,
                _SyncedAt = datetime('now')
        `;

        const wasInserted = db.transaction(() => {
            const result = db.execute(upsertOrderProductSql, {
                Id: payload.Id,
                CrmOrderId: payload.CrmOrderId,
                StockId: payload.StockId,
                Quantity: payload.Quantity,
                DeliveryTime: payload.DeliveryTime ?? null,
                TransactionDate: payload.TransactionDate,
                LineDiscountRate: payload.LineDiscountRate ?? null,
                LineDiscountType: payload.LineDiscountType ?? null,
                Tax: payload.Tax,
                ProfitRate: payload.ProfitRate ?? null,
                CurrencyRate: payload.CurrencyRate ?? null,
                ComissionRate: payload.ComissionRate ?? null,
                StockUnitTypeIdentifier: payload.StockUnitTypeIdentifier,
                StockUnitType: payload.StockUnitType ?? null,
                Description: payload.Description ?? null,
                ItemNo: payload.ItemNo ?? null,
                PYPSapId: payload.PYPSapId ?? null,
                StorageLocationSapId: payload.StorageLocationSapId ?? null,
                ProductionLocationSapId: payload.ProductionLocationSapId ?? null,
                QuoteProductId: payload.QuoteProductId ?? null,
                PFApplicaitonType: payload.PFApplicaitonType ?? null,

                // Flattened IMoney
                LineDiscountAmount_Amount: payload.LineDiscountAmount?.Amount ?? null,
                LineDiscountAmount_Currency: payload.LineDiscountAmount?.Currency ?? null,
                UnitPrice_Amount: payload.UnitPrice?.Amount ?? null,
                UnitPrice_Currency: payload.UnitPrice?.Currency ?? null,
                PurchasingPrice_Amount: payload.PurchasingPrice?.Amount ?? null,
                PurchasingPrice_Currency: payload.PurchasingPrice?.Currency ?? null,
                Total_Amount: payload.Total?.Amount ?? null,
                Total_Currency: payload.Total?.Currency ?? null,
                NetLineSubTotal_Amount: payload.NetLineSubTotal?.Amount ?? null,
                NetLineSubTotal_Currency: payload.NetLineSubTotal?.Currency ?? null,
                TotalProfitAmountWithLocalCurrency_Amount: payload.TotalProfitAmountWithLocalCurrency?.Amount ?? null,
                TotalProfitAmountWithLocalCurrency_Currency: payload.TotalProfitAmountWithLocalCurrency?.Currency ?? null,
                UnitProfitAmountWithLocalCurrency_Amount: payload.UnitProfitAmountWithLocalCurrency?.Amount ?? null,
                UnitProfitAmountWithLocalCurrency_Currency: payload.UnitProfitAmountWithLocalCurrency?.Currency ?? null,
                NetLineTotalAmount_Amount: payload.NetLineTotalAmount?.Amount ?? null,
                NetLineTotalAmount_Currency: payload.NetLineTotalAmount?.Currency ?? null,
                NetLineTotalWithTax_Amount: payload.NetLineTotalWithTax?.Amount ?? null,
                NetLineTotalWithTax_Currency: payload.NetLineTotalWithTax?.Currency ?? null,
                NetLineTotalWithTaxLocalCurrency_Amount: payload.NetLineTotalWithTaxLocalCurrency?.Amount ?? null,
                NetLineTotalWithTaxLocalCurrency_Currency: payload.NetLineTotalWithTaxLocalCurrency?.Currency ?? null,
                NetLineSubTotalLocalCurrency_Amount: payload.NetLineSubTotalLocalCurrency?.Amount ?? null,
                NetLineSubTotalLocalCurrency_Currency: payload.NetLineSubTotalLocalCurrency?.Currency ?? null,
                NetLineTotalAmountLocalCurrency_Amount: payload.NetLineTotalAmountLocalCurrency?.Amount ?? null,
                NetLineTotalAmountLocalCurrency_Currency: payload.NetLineTotalAmountLocalCurrency?.Currency ?? null,
                ProfitAfterSubtotalDiscountLocalCurrency_Amount: payload.ProfitAfterSubtotalDiscountLocalCurrency?.Amount ?? null,
                ProfitAfterSubtotalDiscountLocalCurrency_Currency: payload.ProfitAfterSubtotalDiscountLocalCurrency?.Currency ?? null,
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
        console.error('[CrmOrderProducts Sync Error]', error);
        res.status(400).json({ status: 'error', message: error.message || 'Verification Failed' });
    }
});

export default router;
