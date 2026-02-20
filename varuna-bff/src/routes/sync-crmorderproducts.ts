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

        const upsertOrderProduct = db.prepare(`
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
        `);

        // Run as a transaction
        const syncTransaction = db.transaction((data) => {
            const info = upsertOrderProduct.run({
                Id: data.Id,
                CrmOrderId: data.CrmOrderId,
                StockId: data.StockId,
                Quantity: data.Quantity,
                DeliveryTime: data.DeliveryTime ?? null,
                TransactionDate: data.TransactionDate,
                LineDiscountRate: data.LineDiscountRate ?? null,
                LineDiscountType: data.LineDiscountType ?? null,
                Tax: data.Tax,
                ProfitRate: data.ProfitRate ?? null,
                CurrencyRate: data.CurrencyRate ?? null,
                ComissionRate: data.ComissionRate ?? null,
                StockUnitTypeIdentifier: data.StockUnitTypeIdentifier,
                StockUnitType: data.StockUnitType ?? null,
                Description: data.Description ?? null,
                ItemNo: data.ItemNo ?? null,
                PYPSapId: data.PYPSapId ?? null,
                StorageLocationSapId: data.StorageLocationSapId ?? null,
                ProductionLocationSapId: data.ProductionLocationSapId ?? null,
                QuoteProductId: data.QuoteProductId ?? null,
                PFApplicaitonType: data.PFApplicaitonType ?? null,

                // Flattened IMoney
                LineDiscountAmount_Amount: data.LineDiscountAmount?.Amount ?? null,
                LineDiscountAmount_Currency: data.LineDiscountAmount?.Currency ?? null,
                UnitPrice_Amount: data.UnitPrice?.Amount ?? null,
                UnitPrice_Currency: data.UnitPrice?.Currency ?? null,
                PurchasingPrice_Amount: data.PurchasingPrice?.Amount ?? null,
                PurchasingPrice_Currency: data.PurchasingPrice?.Currency ?? null,
                Total_Amount: data.Total?.Amount ?? null,
                Total_Currency: data.Total?.Currency ?? null,
                NetLineSubTotal_Amount: data.NetLineSubTotal?.Amount ?? null,
                NetLineSubTotal_Currency: data.NetLineSubTotal?.Currency ?? null,
                TotalProfitAmountWithLocalCurrency_Amount: data.TotalProfitAmountWithLocalCurrency?.Amount ?? null,
                TotalProfitAmountWithLocalCurrency_Currency: data.TotalProfitAmountWithLocalCurrency?.Currency ?? null,
                UnitProfitAmountWithLocalCurrency_Amount: data.UnitProfitAmountWithLocalCurrency?.Amount ?? null,
                UnitProfitAmountWithLocalCurrency_Currency: data.UnitProfitAmountWithLocalCurrency?.Currency ?? null,
                NetLineTotalAmount_Amount: data.NetLineTotalAmount?.Amount ?? null,
                NetLineTotalAmount_Currency: data.NetLineTotalAmount?.Currency ?? null,
                NetLineTotalWithTax_Amount: data.NetLineTotalWithTax?.Amount ?? null,
                NetLineTotalWithTax_Currency: data.NetLineTotalWithTax?.Currency ?? null,
                NetLineTotalWithTaxLocalCurrency_Amount: data.NetLineTotalWithTaxLocalCurrency?.Amount ?? null,
                NetLineTotalWithTaxLocalCurrency_Currency: data.NetLineTotalWithTaxLocalCurrency?.Currency ?? null,
                NetLineSubTotalLocalCurrency_Amount: data.NetLineSubTotalLocalCurrency?.Amount ?? null,
                NetLineSubTotalLocalCurrency_Currency: data.NetLineSubTotalLocalCurrency?.Currency ?? null,
                NetLineTotalAmountLocalCurrency_Amount: data.NetLineTotalAmountLocalCurrency?.Amount ?? null,
                NetLineTotalAmountLocalCurrency_Currency: data.NetLineTotalAmountLocalCurrency?.Currency ?? null,
                ProfitAfterSubtotalDiscountLocalCurrency_Amount: data.ProfitAfterSubtotalDiscountLocalCurrency?.Amount ?? null,
                ProfitAfterSubtotalDiscountLocalCurrency_Currency: data.ProfitAfterSubtotalDiscountLocalCurrency?.Currency ?? null,
            });

            return info.changes === 1;
        });

        const wasInserted = syncTransaction(payload);

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
