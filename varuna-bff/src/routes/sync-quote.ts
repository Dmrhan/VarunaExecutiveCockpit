import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { z } from 'zod';

const router = Router();

// Define Zod Schema for Quote request validation
const moneySchema = z.object({
    Amount: z.number(),
    Currency: z.string()
});

const quoteSchema = z.object({
    Id: z.string(),
    OpportunityId: z.string().nullable().optional(),
    RevisionId: z.string().nullable().optional(),
    Number: z.string(),
    Name: z.string(),
    ExpirationDate: z.string(),
    SubTotalDiscount: z.number().nullable().optional(),
    WarehouseId: z.string().nullable().optional(),
    ProposalOwnerId: z.string(),
    PaymentType: z.number(),
    PaymentTypeTime: z.number().nullable().optional(),
    Status: z.number(),
    AddressIdentifier: z.string().nullable().optional(),
    DeliveryType: z.number().nullable().optional(),
    DeliveryTime: z.number().nullable().optional(),
    DeliveryDate: z.string().nullable().optional(),
    CustomerOrderNumber: z.string().nullable().optional(),
    PaymentTime: z.number().nullable().optional(),
    DeliveryTypeTime: z.number().nullable().optional(),
    PersonId: z.string().nullable().optional(),
    SpecialCodeId: z.string().nullable().optional(),
    AccountId: z.string(),
    Description: z.string().nullable().optional(),
    RevNo: z.number().nullable().optional(),

    NetSubTotalLocalCurrency: moneySchema.nullable().optional(),
    TotalNetAmountLocalCurrency: moneySchema.nullable().optional(),
    TotalAmountWithTaxLocalCurrency: moneySchema.nullable().optional(),
    TotalProfitAmount: moneySchema.nullable().optional(),

    RevStatus: z.number().nullable().optional(),
    SubTotalAlternativeCurrency: z.number().nullable().optional(),
    AlternativeCurrencyRate: z.number().nullable().optional(),

    NetSubTotalAlternativeCurrency: moneySchema.nullable().optional(),
    TotalNetAmountAlternativeCurrency: moneySchema.nullable().optional(),
    TotalAmountWithTaxAlternativeCurrency: moneySchema.nullable().optional(),
    TotalProfitAmountAlternativeCurrency: moneySchema.nullable().optional(),

    IsVATExempt: z.number().int().min(0).max(1).nullable().optional(),
    TermsAndConditions: z.string().nullable().optional(),
    ProductsAndServices: z.string().nullable().optional(),
    ServiceStartDate: z.string().nullable().optional(),
    ServiceFinishDate: z.string().nullable().optional(),
    ReferenceCode: z.string().nullable().optional(),
    TransferWithForeignCurrency: z.number().int().min(0).max(1).nullable().optional(),
    ContactId: z.string().nullable().optional(),
    FirstCreatedDate: z.string().nullable().optional(),
    FirstCreatedByName: z.string().nullable().optional(),
    TeamId: z.string().nullable().optional(),
    TeamCreatedById: z.string().nullable().optional(),
    SubTotalDiscountType: z.number().nullable().optional(),
    SubTotalDiscountAmount: z.number().nullable().optional(),
    InRefCode: z.string().nullable().optional(),
    CompanyId: z.string().nullable().optional(),
    QuoteApprovalProcessStatus: z.number().nullable().optional(),
    TotalDiscountRate: z.number().nullable().optional(),
    FirstReleaseDate: z.string().nullable().optional(),
    RevisedDate: z.string().nullable().optional(),
    CRMRevNo: z.number().nullable().optional(),
    PublicationSource: z.string().nullable().optional(),
    TermsAndConditions2: z.string().nullable().optional(),
    ProductsAndServices2: z.string().nullable().optional(),
    StockId: z.string().nullable().optional(),
    ItemNo: z.string().nullable().optional(),
    QuoteType: z.number().nullable().optional(),
    CrmOrderId: z.string().nullable().optional(),
    OrderWillBeCreate: z.number().int().min(0).max(1).nullable().optional(),
    OrderOwnerWillBeChanged: z.number().int().min(0).max(1).nullable().optional(),
    TPOutReferenceCode: z.string().nullable().optional(),

    // Deep Arrays
    QuoteOrderDetails: z.array(z.object({
        Id: z.string(),
        QuoteId: z.string(),
        CrmOrderId: z.string()
    })).nullable().optional(),

    QuoteDynamicFields: z.array(z.object({
        Id: z.string(),
        QuoteId: z.string(),
        FieldName: z.string(),
        FieldValue: z.string().nullable().optional()
    })).nullable().optional()
});

router.post('/', (req: Request, res: Response) => {
    try {
        const payload = quoteSchema.parse(req.body);
        const db = getDb();

        const upsertQuote = db.prepare(`
            INSERT INTO Quote (
                Id, OpportunityId, RevisionId, Number, Name, ExpirationDate, SubTotalDiscount, 
                WarehouseId, ProposalOwnerId, PaymentType, PaymentTypeTime, Status, AddressIdentifier, 
                DeliveryType, DeliveryTime, DeliveryDate, CustomerOrderNumber, PaymentTime, DeliveryTypeTime, 
                PersonId, SpecialCodeId, AccountId, Description, RevNo, 
                NetSubTotalLocalCurrency_Amount, NetSubTotalLocalCurrency_Currency,
                TotalNetAmountLocalCurrency_Amount, TotalNetAmountLocalCurrency_Currency,
                TotalAmountWithTaxLocalCurrency_Amount, TotalAmountWithTaxLocalCurrency_Currency,
                TotalProfitAmount_Amount, TotalProfitAmount_Currency,
                RevStatus, SubTotalAlternativeCurrency, AlternativeCurrencyRate,
                NetSubTotalAlternativeCurrency_Amount, NetSubTotalAlternativeCurrency_Currency,
                TotalNetAmountAlternativeCurrency_Amount, TotalNetAmountAlternativeCurrency_Currency,
                TotalAmountWithTaxAlternativeCurrency_Amount, TotalAmountWithTaxAlternativeCurrency_Currency,
                TotalProfitAmountAlternativeCurrency_Amount, TotalProfitAmountAlternativeCurrency_Currency,
                IsVATExempt, TermsAndConditions, ProductsAndServices, ServiceStartDate, ServiceFinishDate, 
                ReferenceCode, TransferWithForeignCurrency, ContactId, FirstCreatedDate, FirstCreatedByName, 
                TeamId, TeamCreatedById, SubTotalDiscountType, SubTotalDiscountAmount, InRefCode, CompanyId, 
                QuoteApprovalProcessStatus, TotalDiscountRate, FirstReleaseDate, RevisedDate, CRMRevNo, 
                PublicationSource, TermsAndConditions2, ProductsAndServices2, StockId, ItemNo, QuoteType, 
                CrmOrderId, OrderWillBeCreate, OrderOwnerWillBeChanged, TPOutReferenceCode
            ) VALUES (
                @Id, @OpportunityId, @RevisionId, @Number, @Name, @ExpirationDate, @SubTotalDiscount, 
                @WarehouseId, @ProposalOwnerId, @PaymentType, @PaymentTypeTime, @Status, @AddressIdentifier, 
                @DeliveryType, @DeliveryTime, @DeliveryDate, @CustomerOrderNumber, @PaymentTime, @DeliveryTypeTime, 
                @PersonId, @SpecialCodeId, @AccountId, @Description, @RevNo, 
                @NetSubTotalLocalCurrency_Amount, @NetSubTotalLocalCurrency_Currency,
                @TotalNetAmountLocalCurrency_Amount, @TotalNetAmountLocalCurrency_Currency,
                @TotalAmountWithTaxLocalCurrency_Amount, @TotalAmountWithTaxLocalCurrency_Currency,
                @TotalProfitAmount_Amount, @TotalProfitAmount_Currency,
                @RevStatus, @SubTotalAlternativeCurrency, @AlternativeCurrencyRate,
                @NetSubTotalAlternativeCurrency_Amount, @NetSubTotalAlternativeCurrency_Currency,
                @TotalNetAmountAlternativeCurrency_Amount, @TotalNetAmountAlternativeCurrency_Currency,
                @TotalAmountWithTaxAlternativeCurrency_Amount, @TotalAmountWithTaxAlternativeCurrency_Currency,
                @TotalProfitAmountAlternativeCurrency_Amount, @TotalProfitAmountAlternativeCurrency_Currency,
                @IsVATExempt, @TermsAndConditions, @ProductsAndServices, @ServiceStartDate, @ServiceFinishDate, 
                @ReferenceCode, @TransferWithForeignCurrency, @ContactId, @FirstCreatedDate, @FirstCreatedByName, 
                @TeamId, @TeamCreatedById, @SubTotalDiscountType, @SubTotalDiscountAmount, @InRefCode, @CompanyId, 
                @QuoteApprovalProcessStatus, @TotalDiscountRate, @FirstReleaseDate, @RevisedDate, @CRMRevNo, 
                @PublicationSource, @TermsAndConditions2, @ProductsAndServices2, @StockId, @ItemNo, @QuoteType, 
                @CrmOrderId, @OrderWillBeCreate, @OrderOwnerWillBeChanged, @TPOutReferenceCode
            )
            ON CONFLICT(Id) DO UPDATE SET
                OpportunityId=excluded.OpportunityId, RevisionId=excluded.RevisionId, Number=excluded.Number,
                Name=excluded.Name, ExpirationDate=excluded.ExpirationDate, SubTotalDiscount=excluded.SubTotalDiscount,
                WarehouseId=excluded.WarehouseId, ProposalOwnerId=excluded.ProposalOwnerId, PaymentType=excluded.PaymentType,
                PaymentTypeTime=excluded.PaymentTypeTime, Status=excluded.Status, AddressIdentifier=excluded.AddressIdentifier,
                DeliveryType=excluded.DeliveryType, DeliveryTime=excluded.DeliveryTime, DeliveryDate=excluded.DeliveryDate,
                CustomerOrderNumber=excluded.CustomerOrderNumber, PaymentTime=excluded.PaymentTime, DeliveryTypeTime=excluded.DeliveryTypeTime,
                PersonId=excluded.PersonId, SpecialCodeId=excluded.SpecialCodeId, AccountId=excluded.AccountId,
                Description=excluded.Description, RevNo=excluded.RevNo,
                NetSubTotalLocalCurrency_Amount=excluded.NetSubTotalLocalCurrency_Amount, NetSubTotalLocalCurrency_Currency=excluded.NetSubTotalLocalCurrency_Currency,
                TotalNetAmountLocalCurrency_Amount=excluded.TotalNetAmountLocalCurrency_Amount, TotalNetAmountLocalCurrency_Currency=excluded.TotalNetAmountLocalCurrency_Currency,
                TotalAmountWithTaxLocalCurrency_Amount=excluded.TotalAmountWithTaxLocalCurrency_Amount, TotalAmountWithTaxLocalCurrency_Currency=excluded.TotalAmountWithTaxLocalCurrency_Currency,
                TotalProfitAmount_Amount=excluded.TotalProfitAmount_Amount, TotalProfitAmount_Currency=excluded.TotalProfitAmount_Currency,
                RevStatus=excluded.RevStatus, SubTotalAlternativeCurrency=excluded.SubTotalAlternativeCurrency, AlternativeCurrencyRate=excluded.AlternativeCurrencyRate,
                NetSubTotalAlternativeCurrency_Amount=excluded.NetSubTotalAlternativeCurrency_Amount, NetSubTotalAlternativeCurrency_Currency=excluded.NetSubTotalAlternativeCurrency_Currency,
                TotalNetAmountAlternativeCurrency_Amount=excluded.TotalNetAmountAlternativeCurrency_Amount, TotalNetAmountAlternativeCurrency_Currency=excluded.TotalNetAmountAlternativeCurrency_Currency,
                TotalAmountWithTaxAlternativeCurrency_Amount=excluded.TotalAmountWithTaxAlternativeCurrency_Amount, TotalAmountWithTaxAlternativeCurrency_Currency=excluded.TotalAmountWithTaxAlternativeCurrency_Currency,
                TotalProfitAmountAlternativeCurrency_Amount=excluded.TotalProfitAmountAlternativeCurrency_Amount, TotalProfitAmountAlternativeCurrency_Currency=excluded.TotalProfitAmountAlternativeCurrency_Currency,
                IsVATExempt=excluded.IsVATExempt, TermsAndConditions=excluded.TermsAndConditions, ProductsAndServices=excluded.ProductsAndServices,
                ServiceStartDate=excluded.ServiceStartDate, ServiceFinishDate=excluded.ServiceFinishDate, ReferenceCode=excluded.ReferenceCode,
                TransferWithForeignCurrency=excluded.TransferWithForeignCurrency, ContactId=excluded.ContactId, FirstCreatedDate=excluded.FirstCreatedDate,
                FirstCreatedByName=excluded.FirstCreatedByName, TeamId=excluded.TeamId, TeamCreatedById=excluded.TeamCreatedById,
                SubTotalDiscountType=excluded.SubTotalDiscountType, SubTotalDiscountAmount=excluded.SubTotalDiscountAmount,
                InRefCode=excluded.InRefCode, CompanyId=excluded.CompanyId, QuoteApprovalProcessStatus=excluded.QuoteApprovalProcessStatus,
                TotalDiscountRate=excluded.TotalDiscountRate, FirstReleaseDate=excluded.FirstReleaseDate, RevisedDate=excluded.RevisedDate,
                CRMRevNo=excluded.CRMRevNo, PublicationSource=excluded.PublicationSource, TermsAndConditions2=excluded.TermsAndConditions2,
                ProductsAndServices2=excluded.ProductsAndServices2, StockId=excluded.StockId, ItemNo=excluded.ItemNo,
                QuoteType=excluded.QuoteType, CrmOrderId=excluded.CrmOrderId, OrderWillBeCreate=excluded.OrderWillBeCreate,
                OrderOwnerWillBeChanged=excluded.OrderOwnerWillBeChanged, TPOutReferenceCode=excluded.TPOutReferenceCode,
                _SyncedAt=datetime('now')
        `);

        // Child Prepares
        const delOrderDetails = db.prepare(`DELETE FROM QuoteOrderDetails WHERE QuoteId = ?`);
        const insOrderDetails = db.prepare(`INSERT INTO QuoteOrderDetails (Id, QuoteId, CrmOrderId) VALUES (@Id, @QuoteId, @CrmOrderId)`);

        const delDynamicFields = db.prepare(`DELETE FROM QuoteDynamicFields WHERE QuoteId = ?`);
        const insDynamicFields = db.prepare(`INSERT INTO QuoteDynamicFields (Id, QuoteId, FieldName, FieldValue) VALUES (@Id, @QuoteId, @FieldName, @FieldValue)`);

        const syncTransaction = db.transaction((data) => {
            // Main Insert
            const info = upsertQuote.run({
                Id: data.Id,
                OpportunityId: data.OpportunityId ?? null,
                RevisionId: data.RevisionId ?? null,
                Number: data.Number,
                Name: data.Name,
                ExpirationDate: data.ExpirationDate,
                SubTotalDiscount: data.SubTotalDiscount ?? null,
                WarehouseId: data.WarehouseId ?? null,
                ProposalOwnerId: data.ProposalOwnerId,
                PaymentType: data.PaymentType,
                PaymentTypeTime: data.PaymentTypeTime ?? null,
                Status: data.Status,
                AddressIdentifier: data.AddressIdentifier ?? null,
                DeliveryType: data.DeliveryType ?? null,
                DeliveryTime: data.DeliveryTime ?? null,
                DeliveryDate: data.DeliveryDate ?? null,
                CustomerOrderNumber: data.CustomerOrderNumber ?? null,
                PaymentTime: data.PaymentTime ?? null,
                DeliveryTypeTime: data.DeliveryTypeTime ?? null,
                PersonId: data.PersonId ?? null,
                SpecialCodeId: data.SpecialCodeId ?? null,
                AccountId: data.AccountId,
                Description: data.Description ?? null,
                RevNo: data.RevNo ?? null,

                NetSubTotalLocalCurrency_Amount: data.NetSubTotalLocalCurrency?.Amount ?? null,
                NetSubTotalLocalCurrency_Currency: data.NetSubTotalLocalCurrency?.Currency ?? null,
                TotalNetAmountLocalCurrency_Amount: data.TotalNetAmountLocalCurrency?.Amount ?? null,
                TotalNetAmountLocalCurrency_Currency: data.TotalNetAmountLocalCurrency?.Currency ?? null,
                TotalAmountWithTaxLocalCurrency_Amount: data.TotalAmountWithTaxLocalCurrency?.Amount ?? null,
                TotalAmountWithTaxLocalCurrency_Currency: data.TotalAmountWithTaxLocalCurrency?.Currency ?? null,
                TotalProfitAmount_Amount: data.TotalProfitAmount?.Amount ?? null,
                TotalProfitAmount_Currency: data.TotalProfitAmount?.Currency ?? null,

                RevStatus: data.RevStatus ?? null,
                SubTotalAlternativeCurrency: data.SubTotalAlternativeCurrency ?? null,
                AlternativeCurrencyRate: data.AlternativeCurrencyRate ?? null,

                NetSubTotalAlternativeCurrency_Amount: data.NetSubTotalAlternativeCurrency?.Amount ?? null,
                NetSubTotalAlternativeCurrency_Currency: data.NetSubTotalAlternativeCurrency?.Currency ?? null,
                TotalNetAmountAlternativeCurrency_Amount: data.TotalNetAmountAlternativeCurrency?.Amount ?? null,
                TotalNetAmountAlternativeCurrency_Currency: data.TotalNetAmountAlternativeCurrency?.Currency ?? null,
                TotalAmountWithTaxAlternativeCurrency_Amount: data.TotalAmountWithTaxAlternativeCurrency?.Amount ?? null,
                TotalAmountWithTaxAlternativeCurrency_Currency: data.TotalAmountWithTaxAlternativeCurrency?.Currency ?? null,
                TotalProfitAmountAlternativeCurrency_Amount: data.TotalProfitAmountAlternativeCurrency?.Amount ?? null,
                TotalProfitAmountAlternativeCurrency_Currency: data.TotalProfitAmountAlternativeCurrency?.Currency ?? null,

                IsVATExempt: data.IsVATExempt ?? null,
                TermsAndConditions: data.TermsAndConditions ?? null,
                ProductsAndServices: data.ProductsAndServices ?? null,
                ServiceStartDate: data.ServiceStartDate ?? null,
                ServiceFinishDate: data.ServiceFinishDate ?? null,
                ReferenceCode: data.ReferenceCode ?? null,
                TransferWithForeignCurrency: data.TransferWithForeignCurrency ?? null,
                ContactId: data.ContactId ?? null,
                FirstCreatedDate: data.FirstCreatedDate ?? null,
                FirstCreatedByName: data.FirstCreatedByName ?? null,
                TeamId: data.TeamId ?? null,
                TeamCreatedById: data.TeamCreatedById ?? null,
                SubTotalDiscountType: data.SubTotalDiscountType ?? null,
                SubTotalDiscountAmount: data.SubTotalDiscountAmount ?? null,
                InRefCode: data.InRefCode ?? null,
                CompanyId: data.CompanyId ?? null,
                QuoteApprovalProcessStatus: data.QuoteApprovalProcessStatus ?? null,
                TotalDiscountRate: data.TotalDiscountRate ?? null,
                FirstReleaseDate: data.FirstReleaseDate ?? null,
                RevisedDate: data.RevisedDate ?? null,
                CRMRevNo: data.CRMRevNo ?? null,
                PublicationSource: data.PublicationSource ?? null,
                TermsAndConditions2: data.TermsAndConditions2 ?? null,
                ProductsAndServices2: data.ProductsAndServices2 ?? null,
                StockId: data.StockId ?? null,
                ItemNo: data.ItemNo ?? null,
                QuoteType: data.QuoteType ?? null,
                CrmOrderId: data.CrmOrderId ?? null,
                OrderWillBeCreate: data.OrderWillBeCreate ?? null,
                OrderOwnerWillBeChanged: data.OrderOwnerWillBeChanged ?? null,
                TPOutReferenceCode: data.TPOutReferenceCode ?? null
            });

            // Replace Child Arrays
            delOrderDetails.run(data.Id);
            if (data.QuoteOrderDetails && data.QuoteOrderDetails.length > 0) {
                for (const row of data.QuoteOrderDetails) {
                    insOrderDetails.run({ Id: row.Id, QuoteId: data.Id, CrmOrderId: row.CrmOrderId });
                }
            }

            delDynamicFields.run(data.Id);
            if (data.QuoteDynamicFields && data.QuoteDynamicFields.length > 0) {
                for (const row of data.QuoteDynamicFields) {
                    insDynamicFields.run({ Id: row.Id, QuoteId: data.Id, FieldName: row.FieldName, FieldValue: row.FieldValue ?? null });
                }
            }

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
        console.error('[Quote Sync Error]', error);
        res.status(400).json({ status: 'error', message: error.message || 'Validation Failed' });
    }
});

export default router;
