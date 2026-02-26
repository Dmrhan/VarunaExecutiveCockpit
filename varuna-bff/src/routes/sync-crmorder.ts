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

        const upsertOrderSql = db.driver === 'mssql' ? `
            MERGE INTO CrmOrder AS target
            USING (SELECT @Id AS Id) AS source
            ON (target.Id = source.Id)
            WHEN MATCHED THEN
                UPDATE SET 
                    QuoteId = @QuoteId, AccountId = @AccountId, ProposalOwnerId = @ProposalOwnerId,
                    WarehouseId = @WarehouseId, TeamId = @TeamId, TeamCreatedById = @TeamCreatedById,
                    CompanyId = @CompanyId, StockId = @StockId, SpecialCodeId = @SpecialCodeId,
                    DistributionChannelSapId = @DistributionChannelSapId, DivisionSapId = @DivisionSapId,
                    SalesDocumentTypeSapId = @SalesDocumentTypeSapId, SalesOrganizationSapId = @SalesOrganizationSapId,
                    SalesPaymentTermSapId = @SalesPaymentTermSapId, CrmSalesOfficeSapId = @CrmSalesOfficeSapId,
                    CurrencySapId = @CurrencySapId, SalesGroupSapId = @SalesGroupSapId, ContractId = @ContractId,
                    PaymentType = @PaymentType, PaymentTypeTime = @PaymentTypeTime, DeliveryType = @DeliveryType,
                    DeliveryTypeTime = @DeliveryTypeTime, SubTotalAlternativeCurrency = @SubTotalAlternativeCurrency,
                    SubTotalDiscountType = @SubTotalDiscountType, Status = @Status, IsVATExempt = @IsVATExempt,
                    IsEligibleForNetsisIntegration = @IsEligibleForNetsisIntegration, IsEligibleForSapIntegration = @IsEligibleForSapIntegration,
                    IsDeletedFromBackend = @IsDeletedFromBackend, ExpirationDate = @ExpirationDate,
                    DeliveryDate = @DeliveryDate, CreateOrderDate = @CreateOrderDate, PlannedInvoiceDate = @PlannedInvoiceDate,
                    InvoiceDate = @InvoiceDate, SubTotalDiscount = @SubTotalDiscount, DeliveryTime = @DeliveryTime,
                    PaymentTime = @PaymentTime, AlternativeCurrencyRate = @AlternativeCurrencyRate,
                    SubTotalDiscountAmount = @SubTotalDiscountAmount, TotalDiscountRate = @TotalDiscountRate,
                    NetSubTotalLocalCurrency_Amount = @NetSubTotalLocalCurrency_Amount, NetSubTotalLocalCurrency_Currency = @NetSubTotalLocalCurrency_Currency,
                    TotalNetAmountLocalCurrency_Amount = @TotalNetAmountLocalCurrency_Amount, TotalNetAmountLocalCurrency_Currency = @TotalNetAmountLocalCurrency_Currency,
                    TotalAmountWithTaxLocalCurrency_Amount = @TotalAmountWithTaxLocalCurrency_Amount, TotalAmountWithTaxLocalCurrency_Currency = @TotalAmountWithTaxLocalCurrency_Currency,
                    TotalProfitAmount_Amount = @TotalProfitAmount_Amount, TotalProfitAmount_Currency = @TotalProfitAmount_Currency,
                    NetSubTotalAlternativeCurrency_Amount = @NetSubTotalAlternativeCurrency_Amount, NetSubTotalAlternativeCurrency_Currency = @NetSubTotalAlternativeCurrency_Currency,
                    TotalNetAmountAlternativeCurrency_Amount = @TotalNetAmountAlternativeCurrency_Amount, TotalNetAmountAlternativeCurrency_Currency = @TotalNetAmountAlternativeCurrency_Currency,
                    TotalAmountWithTaxAlternativeCurrency_Amount = @TotalAmountWithTaxAlternativeCurrency_Amount, TotalAmountWithTaxAlternativeCurrency_Currency = @TotalAmountWithTaxAlternativeCurrency_Currency,
                    TotalProfitAmountAlternativeCurrency_Amount = @TotalProfitAmountAlternativeCurrency_Amount, TotalProfitAmountAlternativeCurrency_Currency = @TotalProfitAmountAlternativeCurrency_Currency,
                    ReferenceCode = @ReferenceCode, InRefCode = @InRefCode, CustomerOrderNumber = @CustomerOrderNumber,
                    TPOutReferenceCode = @TPOutReferenceCode, SAPOutReferenceCode = @SAPOutReferenceCode,
                    ItemNo = @ItemNo, CrmOrderNotes = @CrmOrderNotes, Name = @Name, SerialNumber = @SerialNumber,
                    _SyncedAt = GETUTCDATE()
            WHEN NOT MATCHED THEN
                INSERT (
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
                    ReferenceCode, InRefCode, CustomerOrderNumber, TPOutReferenceCode, SAPOutReferenceCode, ItemNo, CrmOrderNotes, Name, SerialNumber, _SyncedAt
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
                    @ReferenceCode, @InRefCode, @CustomerOrderNumber, @TPOutReferenceCode, @SAPOutReferenceCode, @ItemNo, @CrmOrderNotes, @Name, @SerialNumber, GETUTCDATE()
                );
        ` : `
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
        `;

        const wasInserted = db.transaction(() => {
            const result = db.execute(upsertOrderSql, {
                Id: payload.Id,
                QuoteId: payload.QuoteId ?? null,
                AccountId: payload.AccountId ?? null,
                ProposalOwnerId: payload.ProposalOwnerId ?? null,
                WarehouseId: payload.WarehouseId ?? null,
                TeamId: payload.TeamId ?? null,
                TeamCreatedById: payload.TeamCreatedById ?? null,
                CompanyId: payload.CompanyId ?? null,
                StockId: payload.StockId ?? null,
                SpecialCodeId: payload.SpecialCodeId ?? null,
                DistributionChannelSapId: payload.DistributionChannelSapId ?? null,
                DivisionSapId: payload.DivisionSapId ?? null,
                SalesDocumentTypeSapId: payload.SalesDocumentTypeSapId ?? null,
                SalesOrganizationSapId: payload.SalesOrganizationSapId ?? null,
                SalesPaymentTermSapId: payload.SalesPaymentTermSapId ?? null,
                CrmSalesOfficeSapId: payload.CrmSalesOfficeSapId ?? null,
                CurrencySapId: payload.CurrencySapId ?? null,
                SalesGroupSapId: payload.SalesGroupSapId ?? null,
                ContractId: payload.ContractId ?? null,
                PaymentType: payload.PaymentType ?? null,
                PaymentTypeTime: payload.PaymentTypeTime ?? null,
                DeliveryType: payload.DeliveryType ?? null,
                DeliveryTypeTime: payload.DeliveryTypeTime ?? null,
                SubTotalAlternativeCurrency: payload.SubTotalAlternativeCurrency ?? null,
                SubTotalDiscountType: payload.SubTotalDiscountType ?? null,
                Status: payload.Status ?? null,
                IsVATExempt: payload.IsVATExempt ?? null,
                IsEligibleForNetsisIntegration: payload.IsEligibleForNetsisIntegration ?? null,
                IsEligibleForSapIntegration: payload.IsEligibleForSapIntegration ?? null,
                IsDeletedFromBackend: payload.IsDeletedFromBackend ?? null,
                ExpirationDate: payload.ExpirationDate ?? null,
                DeliveryDate: payload.DeliveryDate ?? null,
                CreateOrderDate: payload.CreateOrderDate ?? null,
                PlannedInvoiceDate: payload.PlannedInvoiceDate ?? null,
                InvoiceDate: payload.InvoiceDate ?? null,
                SubTotalDiscount: payload.SubTotalDiscount ?? null,
                DeliveryTime: payload.DeliveryTime ?? null,
                PaymentTime: payload.PaymentTime ?? null,
                AlternativeCurrencyRate: payload.AlternativeCurrencyRate ?? null,
                SubTotalDiscountAmount: payload.SubTotalDiscountAmount ?? null,
                TotalDiscountRate: payload.TotalDiscountRate ?? null,

                // Flattened IMoney
                NetSubTotalLocalCurrency_Amount: payload.NetSubTotalLocalCurrency?.Amount ?? null,
                NetSubTotalLocalCurrency_Currency: payload.NetSubTotalLocalCurrency?.Currency ?? null,
                TotalNetAmountLocalCurrency_Amount: payload.TotalNetAmountLocalCurrency?.Amount ?? null,
                TotalNetAmountLocalCurrency_Currency: payload.TotalNetAmountLocalCurrency?.Currency ?? null,
                TotalAmountWithTaxLocalCurrency_Amount: payload.TotalAmountWithTaxLocalCurrency?.Amount ?? null,
                TotalAmountWithTaxLocalCurrency_Currency: payload.TotalAmountWithTaxLocalCurrency?.Currency ?? null,
                TotalProfitAmount_Amount: payload.TotalProfitAmount?.Amount ?? null,
                TotalProfitAmount_Currency: payload.TotalProfitAmount?.Currency ?? null,
                NetSubTotalAlternativeCurrency_Amount: payload.NetSubTotalAlternativeCurrency?.Amount ?? null,
                NetSubTotalAlternativeCurrency_Currency: payload.NetSubTotalAlternativeCurrency?.Currency ?? null,
                TotalNetAmountAlternativeCurrency_Amount: payload.TotalNetAmountAlternativeCurrency?.Amount ?? null,
                TotalNetAmountAlternativeCurrency_Currency: payload.TotalNetAmountAlternativeCurrency?.Currency ?? null,
                TotalAmountWithTaxAlternativeCurrency_Amount: payload.TotalAmountWithTaxAlternativeCurrency?.Amount ?? null,
                TotalAmountWithTaxAlternativeCurrency_Currency: payload.TotalAmountWithTaxAlternativeCurrency?.Currency ?? null,
                TotalProfitAmountAlternativeCurrency_Amount: payload.TotalProfitAmountAlternativeCurrency?.Amount ?? null,
                TotalProfitAmountAlternativeCurrency_Currency: payload.TotalProfitAmountAlternativeCurrency?.Currency ?? null,

                ReferenceCode: payload.ReferenceCode ?? null,
                InRefCode: payload.InRefCode ?? null,
                CustomerOrderNumber: payload.CustomerOrderNumber ?? null,
                TPOutReferenceCode: payload.TPOutReferenceCode ?? null,
                SAPOutReferenceCode: payload.SAPOutReferenceCode ?? null,
                ItemNo: payload.ItemNo ?? null,
                CrmOrderNotes: payload.CrmOrderNotes ?? null,
                Name: payload.Name ?? null,
                SerialNumber: payload.SerialNumber ?? null
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
        console.error('[CrmOrder Sync Error]', error);
        res.status(400).json({ status: 'error', message: error.message || 'Verification Failed' });
    }
});

export default router;
