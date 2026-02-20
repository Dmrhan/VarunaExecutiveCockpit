import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { z } from 'zod';

const router = Router();

// Zod Schema representing the C# ICrmOrder model with IMoney flattened logically
const crmOrderSchema = z.object({
    Id: z.string(),
    QuoteId: z.string().nullable().optional(),
    AccountId: z.string().nullable().optional(),
    ProposalOwnerId: z.string().nullable().optional(),
    WarehouseId: z.string().nullable().optional(),
    TeamId: z.string().nullable().optional(),
    TeamCreatedById: z.string().nullable().optional(),
    CompanyId: z.string().nullable().optional(),
    StockId: z.string().nullable().optional(),
    SpecialCodeId: z.string().nullable().optional(),
    DistributionChannelSapId: z.string().nullable().optional(),
    DivisionSapId: z.string().nullable().optional(),
    SalesDocumentTypeSapId: z.string().nullable().optional(),
    SalesOrganizationSapId: z.string().nullable().optional(),
    SalesPaymentTermSapId: z.string().nullable().optional(),
    CrmSalesOfficeSapId: z.string().nullable().optional(),
    CurrencySapId: z.string().nullable().optional(),
    SalesGroupSapId: z.string().nullable().optional(),
    ContractId: z.string().nullable().optional(),
    PaymentType: z.number().nullable().optional(),
    PaymentTypeTime: z.number().nullable().optional(),
    DeliveryType: z.number().nullable().optional(),
    DeliveryTypeTime: z.number().nullable().optional(),
    SubTotalAlternativeCurrency: z.number().nullable().optional(),
    SubTotalDiscountType: z.number().nullable().optional(),
    Status: z.number().nullable().optional(),
    IsVATExempt: z.number().nullable().optional(),
    IsEligibleForNetsisIntegration: z.number().nullable().optional(),
    IsEligibleForSapIntegration: z.number().nullable().optional(),
    IsDeletedFromBackend: z.number().nullable().optional(),
    ExpirationDate: z.string().nullable().optional(),
    DeliveryDate: z.string().nullable().optional(),
    CreateOrderDate: z.string().nullable().optional(),
    PlannedInvoiceDate: z.string().nullable().optional(),
    InvoiceDate: z.string().nullable().optional(),
    SubTotalDiscount: z.number().nullable().optional(),
    DeliveryTime: z.number().nullable().optional(),
    PaymentTime: z.number().nullable().optional(),
    AlternativeCurrencyRate: z.number().nullable().optional(),
    SubTotalDiscountAmount: z.number().nullable().optional(),
    TotalDiscountRate: z.number().nullable().optional(),

    // IMoney Nested Structures
    NetSubTotalLocalCurrency: z.object({
        Amount: z.number().nullable().optional(),
        Currency: z.string().nullable().optional()
    }).nullable().optional(),
    TotalNetAmountLocalCurrency: z.object({
        Amount: z.number().nullable().optional(),
        Currency: z.string().nullable().optional()
    }).nullable().optional(),
    TotalAmountWithTaxLocalCurrency: z.object({
        Amount: z.number().nullable().optional(),
        Currency: z.string().nullable().optional()
    }).nullable().optional(),
    TotalProfitAmount: z.object({
        Amount: z.number().nullable().optional(),
        Currency: z.string().nullable().optional()
    }).nullable().optional(),
    NetSubTotalAlternativeCurrency: z.object({
        Amount: z.number().nullable().optional(),
        Currency: z.string().nullable().optional()
    }).nullable().optional(),
    TotalNetAmountAlternativeCurrency: z.object({
        Amount: z.number().nullable().optional(),
        Currency: z.string().nullable().optional()
    }).nullable().optional(),
    TotalAmountWithTaxAlternativeCurrency: z.object({
        Amount: z.number().nullable().optional(),
        Currency: z.string().nullable().optional()
    }).nullable().optional(),
    TotalProfitAmountAlternativeCurrency: z.object({
        Amount: z.number().nullable().optional(),
        Currency: z.string().nullable().optional()
    }).nullable().optional(),

    ReferenceCode: z.string().nullable().optional(),
    InRefCode: z.string().nullable().optional(),
    CustomerOrderNumber: z.string().nullable().optional(),
    TPOutReferenceCode: z.string().nullable().optional(),
    SAPOutReferenceCode: z.string().nullable().optional(),
    ItemNo: z.string().nullable().optional(),
    CrmOrderNotes: z.string().nullable().optional(),
    Name: z.string().nullable().optional(),
    SerialNumber: z.string().nullable().optional()
});

router.post('/', (req: Request, res: Response) => {
    try {
        const payload = crmOrderSchema.parse(req.body);
        const db = getDb();

        const upsertOrder = db.prepare(`
            INSERT INTO CrmOrder (
                Id, QuoteId, AccountId, ProposalOwnerId, WarehouseId, TeamId, TeamCreatedById, CompanyId, StockId,
                SpecialCodeId, DistributionChannelSapId, DivisionSapId, SalesDocumentTypeSapId, SalesOrganizationSapId,
                SalesPaymentTermSapId, CrmSalesOfficeSapId, CurrencySapId, SalesGroupSapId, ContractId,
                PaymentType, PaymentTypeTime, DeliveryType, DeliveryTypeTime, SubTotalAlternativeCurrency, SubTotalDiscountType,
                Status, IsVATExempt, IsEligibleForNetsisIntegration, IsEligibleForSapIntegration, IsDeletedFromBackend,
                ExpirationDate, DeliveryDate, CreateOrderDate, PlannedInvoiceDate, InvoiceDate,
                SubTotalDiscount, DeliveryTime, PaymentTime, AlternativeCurrencyRate, SubTotalDiscountAmount, TotalDiscountRate,
                NetSubTotalLocalCurrency_Amount, NetSubTotalLocalCurrency_Currency,
                TotalNetAmountLocalCurrency_Amount, TotalNetAmountLocalCurrency_Currency,
                TotalAmountWithTaxLocalCurrency_Amount, TotalAmountWithTaxLocalCurrency_Currency,
                TotalProfitAmount_Amount, TotalProfitAmount_Currency,
                NetSubTotalAlternativeCurrency_Amount, NetSubTotalAlternativeCurrency_Currency,
                TotalNetAmountAlternativeCurrency_Amount, TotalNetAmountAlternativeCurrency_Currency,
                TotalAmountWithTaxAlternativeCurrency_Amount, TotalAmountWithTaxAlternativeCurrency_Currency,
                TotalProfitAmountAlternativeCurrency_Amount, TotalProfitAmountAlternativeCurrency_Currency,
                ReferenceCode, InRefCode, CustomerOrderNumber, TPOutReferenceCode, SAPOutReferenceCode, ItemNo, CrmOrderNotes, Name, SerialNumber
            ) VALUES (
                @Id, @QuoteId, @AccountId, @ProposalOwnerId, @WarehouseId, @TeamId, @TeamCreatedById, @CompanyId, @StockId,
                @SpecialCodeId, @DistributionChannelSapId, @DivisionSapId, @SalesDocumentTypeSapId, @SalesOrganizationSapId,
                @SalesPaymentTermSapId, @CrmSalesOfficeSapId, @CurrencySapId, @SalesGroupSapId, @ContractId,
                @PaymentType, @PaymentTypeTime, @DeliveryType, @DeliveryTypeTime, @SubTotalAlternativeCurrency, @SubTotalDiscountType,
                @Status, @IsVATExempt, @IsEligibleForNetsisIntegration, @IsEligibleForSapIntegration, @IsDeletedFromBackend,
                @ExpirationDate, @DeliveryDate, @CreateOrderDate, @PlannedInvoiceDate, @InvoiceDate,
                @SubTotalDiscount, @DeliveryTime, @PaymentTime, @AlternativeCurrencyRate, @SubTotalDiscountAmount, @TotalDiscountRate,
                @NetSubTotalLocalCurrency_Amount, @NetSubTotalLocalCurrency_Currency,
                @TotalNetAmountLocalCurrency_Amount, @TotalNetAmountLocalCurrency_Currency,
                @TotalAmountWithTaxLocalCurrency_Amount, @TotalAmountWithTaxLocalCurrency_Currency,
                @TotalProfitAmount_Amount, @TotalProfitAmount_Currency,
                @NetSubTotalAlternativeCurrency_Amount, @NetSubTotalAlternativeCurrency_Currency,
                @TotalNetAmountAlternativeCurrency_Amount, @TotalNetAmountAlternativeCurrency_Currency,
                @TotalAmountWithTaxAlternativeCurrency_Amount, @TotalAmountWithTaxAlternativeCurrency_Currency,
                @TotalProfitAmountAlternativeCurrency_Amount, @TotalProfitAmountAlternativeCurrency_Currency,
                @ReferenceCode, @InRefCode, @CustomerOrderNumber, @TPOutReferenceCode, @SAPOutReferenceCode, @ItemNo, @CrmOrderNotes, @Name, @SerialNumber
            )
            ON CONFLICT(Id) DO UPDATE SET
                QuoteId = excluded.QuoteId, AccountId = excluded.AccountId, ProposalOwnerId = excluded.ProposalOwnerId,
                WarehouseId = excluded.WarehouseId, TeamId = excluded.TeamId, TeamCreatedById = excluded.TeamCreatedById,
                CompanyId = excluded.CompanyId, StockId = excluded.StockId, SpecialCodeId = excluded.SpecialCodeId,
                DistributionChannelSapId = excluded.DistributionChannelSapId, DivisionSapId = excluded.DivisionSapId,
                SalesDocumentTypeSapId = excluded.SalesDocumentTypeSapId, SalesOrganizationSapId = excluded.SalesOrganizationSapId,
                SalesPaymentTermSapId = excluded.SalesPaymentTermSapId, CrmSalesOfficeSapId = excluded.CrmSalesOfficeSapId,
                CurrencySapId = excluded.CurrencySapId, SalesGroupSapId = excluded.SalesGroupSapId, ContractId = excluded.ContractId,
                PaymentType = excluded.PaymentType, PaymentTypeTime = excluded.PaymentTypeTime, DeliveryType = excluded.DeliveryType,
                DeliveryTypeTime = excluded.DeliveryTypeTime, SubTotalAlternativeCurrency = excluded.SubTotalAlternativeCurrency,
                SubTotalDiscountType = excluded.SubTotalDiscountType, Status = excluded.Status, IsVATExempt = excluded.IsVATExempt,
                IsEligibleForNetsisIntegration = excluded.IsEligibleForNetsisIntegration, IsEligibleForSapIntegration = excluded.IsEligibleForSapIntegration,
                IsDeletedFromBackend = excluded.IsDeletedFromBackend, ExpirationDate = excluded.ExpirationDate,
                DeliveryDate = excluded.DeliveryDate, CreateOrderDate = excluded.CreateOrderDate, PlannedInvoiceDate = excluded.PlannedInvoiceDate,
                InvoiceDate = excluded.InvoiceDate, SubTotalDiscount = excluded.SubTotalDiscount, DeliveryTime = excluded.DeliveryTime,
                PaymentTime = excluded.PaymentTime, AlternativeCurrencyRate = excluded.AlternativeCurrencyRate,
                SubTotalDiscountAmount = excluded.SubTotalDiscountAmount, TotalDiscountRate = excluded.TotalDiscountRate,
                NetSubTotalLocalCurrency_Amount = excluded.NetSubTotalLocalCurrency_Amount, NetSubTotalLocalCurrency_Currency = excluded.NetSubTotalLocalCurrency_Currency,
                TotalNetAmountLocalCurrency_Amount = excluded.TotalNetAmountLocalCurrency_Amount, TotalNetAmountLocalCurrency_Currency = excluded.TotalNetAmountLocalCurrency_Currency,
                TotalAmountWithTaxLocalCurrency_Amount = excluded.TotalAmountWithTaxLocalCurrency_Amount, TotalAmountWithTaxLocalCurrency_Currency = excluded.TotalAmountWithTaxLocalCurrency_Currency,
                TotalProfitAmount_Amount = excluded.TotalProfitAmount_Amount, TotalProfitAmount_Currency = excluded.TotalProfitAmount_Currency,
                NetSubTotalAlternativeCurrency_Amount = excluded.NetSubTotalAlternativeCurrency_Amount, NetSubTotalAlternativeCurrency_Currency = excluded.NetSubTotalAlternativeCurrency_Currency,
                TotalNetAmountAlternativeCurrency_Amount = excluded.TotalNetAmountAlternativeCurrency_Amount, TotalNetAmountAlternativeCurrency_Currency = excluded.TotalNetAmountAlternativeCurrency_Currency,
                TotalAmountWithTaxAlternativeCurrency_Amount = excluded.TotalAmountWithTaxAlternativeCurrency_Amount, TotalAmountWithTaxAlternativeCurrency_Currency = excluded.TotalAmountWithTaxAlternativeCurrency_Currency,
                TotalProfitAmountAlternativeCurrency_Amount = excluded.TotalProfitAmountAlternativeCurrency_Amount, TotalProfitAmountAlternativeCurrency_Currency = excluded.TotalProfitAmountAlternativeCurrency_Currency,
                ReferenceCode = excluded.ReferenceCode, InRefCode = excluded.InRefCode, CustomerOrderNumber = excluded.CustomerOrderNumber,
                TPOutReferenceCode = excluded.TPOutReferenceCode, SAPOutReferenceCode = excluded.SAPOutReferenceCode,
                ItemNo = excluded.ItemNo, CrmOrderNotes = excluded.CrmOrderNotes, Name = excluded.Name, SerialNumber = excluded.SerialNumber,
                _SyncedAt = datetime('now')
        `);

        // Run as a transaction
        const syncTransaction = db.transaction((data) => {
            const info = upsertOrder.run({
                Id: data.Id,
                QuoteId: data.QuoteId ?? null,
                AccountId: data.AccountId ?? null,
                ProposalOwnerId: data.ProposalOwnerId ?? null,
                WarehouseId: data.WarehouseId ?? null,
                TeamId: data.TeamId ?? null,
                TeamCreatedById: data.TeamCreatedById ?? null,
                CompanyId: data.CompanyId ?? null,
                StockId: data.StockId ?? null,
                SpecialCodeId: data.SpecialCodeId ?? null,
                DistributionChannelSapId: data.DistributionChannelSapId ?? null,
                DivisionSapId: data.DivisionSapId ?? null,
                SalesDocumentTypeSapId: data.SalesDocumentTypeSapId ?? null,
                SalesOrganizationSapId: data.SalesOrganizationSapId ?? null,
                SalesPaymentTermSapId: data.SalesPaymentTermSapId ?? null,
                CrmSalesOfficeSapId: data.CrmSalesOfficeSapId ?? null,
                CurrencySapId: data.CurrencySapId ?? null,
                SalesGroupSapId: data.SalesGroupSapId ?? null,
                ContractId: data.ContractId ?? null,
                PaymentType: data.PaymentType ?? null,
                PaymentTypeTime: data.PaymentTypeTime ?? null,
                DeliveryType: data.DeliveryType ?? null,
                DeliveryTypeTime: data.DeliveryTypeTime ?? null,
                SubTotalAlternativeCurrency: data.SubTotalAlternativeCurrency ?? null,
                SubTotalDiscountType: data.SubTotalDiscountType ?? null,
                Status: data.Status ?? null,
                IsVATExempt: data.IsVATExempt ?? null,
                IsEligibleForNetsisIntegration: data.IsEligibleForNetsisIntegration ?? null,
                IsEligibleForSapIntegration: data.IsEligibleForSapIntegration ?? null,
                IsDeletedFromBackend: data.IsDeletedFromBackend ?? null,
                ExpirationDate: data.ExpirationDate ?? null,
                DeliveryDate: data.DeliveryDate ?? null,
                CreateOrderDate: data.CreateOrderDate ?? null,
                PlannedInvoiceDate: data.PlannedInvoiceDate ?? null,
                InvoiceDate: data.InvoiceDate ?? null,
                SubTotalDiscount: data.SubTotalDiscount ?? null,
                DeliveryTime: data.DeliveryTime ?? null,
                PaymentTime: data.PaymentTime ?? null,
                AlternativeCurrencyRate: data.AlternativeCurrencyRate ?? null,
                SubTotalDiscountAmount: data.SubTotalDiscountAmount ?? null,
                TotalDiscountRate: data.TotalDiscountRate ?? null,

                // Flattened IMoney
                NetSubTotalLocalCurrency_Amount: data.NetSubTotalLocalCurrency?.Amount ?? null,
                NetSubTotalLocalCurrency_Currency: data.NetSubTotalLocalCurrency?.Currency ?? null,
                TotalNetAmountLocalCurrency_Amount: data.TotalNetAmountLocalCurrency?.Amount ?? null,
                TotalNetAmountLocalCurrency_Currency: data.TotalNetAmountLocalCurrency?.Currency ?? null,
                TotalAmountWithTaxLocalCurrency_Amount: data.TotalAmountWithTaxLocalCurrency?.Amount ?? null,
                TotalAmountWithTaxLocalCurrency_Currency: data.TotalAmountWithTaxLocalCurrency?.Currency ?? null,
                TotalProfitAmount_Amount: data.TotalProfitAmount?.Amount ?? null,
                TotalProfitAmount_Currency: data.TotalProfitAmount?.Currency ?? null,
                NetSubTotalAlternativeCurrency_Amount: data.NetSubTotalAlternativeCurrency?.Amount ?? null,
                NetSubTotalAlternativeCurrency_Currency: data.NetSubTotalAlternativeCurrency?.Currency ?? null,
                TotalNetAmountAlternativeCurrency_Amount: data.TotalNetAmountAlternativeCurrency?.Amount ?? null,
                TotalNetAmountAlternativeCurrency_Currency: data.TotalNetAmountAlternativeCurrency?.Currency ?? null,
                TotalAmountWithTaxAlternativeCurrency_Amount: data.TotalAmountWithTaxAlternativeCurrency?.Amount ?? null,
                TotalAmountWithTaxAlternativeCurrency_Currency: data.TotalAmountWithTaxAlternativeCurrency?.Currency ?? null,
                TotalProfitAmountAlternativeCurrency_Amount: data.TotalProfitAmountAlternativeCurrency?.Amount ?? null,
                TotalProfitAmountAlternativeCurrency_Currency: data.TotalProfitAmountAlternativeCurrency?.Currency ?? null,

                ReferenceCode: data.ReferenceCode ?? null,
                InRefCode: data.InRefCode ?? null,
                CustomerOrderNumber: data.CustomerOrderNumber ?? null,
                TPOutReferenceCode: data.TPOutReferenceCode ?? null,
                SAPOutReferenceCode: data.SAPOutReferenceCode ?? null,
                ItemNo: data.ItemNo ?? null,
                CrmOrderNotes: data.CrmOrderNotes ?? null,
                Name: data.Name ?? null,
                SerialNumber: data.SerialNumber ?? null
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
        console.error('[CrmOrder Sync Error]', error);
        res.status(400).json({ status: 'error', message: error.message || 'Verification Failed' });
    }
});

export default router;
