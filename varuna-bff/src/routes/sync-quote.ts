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
    CreatedOn: z.string().nullable().optional(),

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

        const binding = {
            Id: payload.Id,
            OpportunityId: payload.OpportunityId ?? null,
            RevisionId: payload.RevisionId ?? null,
            Number: payload.Number,
            Name: payload.Name,
            ExpirationDate: payload.ExpirationDate,
            SubTotalDiscount: payload.SubTotalDiscount ?? null,
            WarehouseId: payload.WarehouseId ?? null,
            ProposalOwnerId: payload.ProposalOwnerId,
            PaymentType: payload.PaymentType,
            PaymentTypeTime: payload.PaymentTypeTime ?? null,
            Status: payload.Status,
            AddressIdentifier: payload.AddressIdentifier ?? null,
            DeliveryType: payload.DeliveryType ?? null,
            DeliveryTime: payload.DeliveryTime ?? null,
            DeliveryDate: payload.DeliveryDate ?? null,
            CustomerOrderNumber: payload.CustomerOrderNumber ?? null,
            PaymentTime: payload.PaymentTime ?? null,
            DeliveryTypeTime: payload.DeliveryTypeTime ?? null,
            PersonId: payload.PersonId ?? null,
            SpecialCodeId: payload.SpecialCodeId ?? null,
            AccountId: payload.AccountId,
            Description: payload.Description ?? null,
            RevNo: payload.RevNo ?? null,

            NetSubTotalLocalCurrency_Amount: payload.NetSubTotalLocalCurrency?.Amount ?? null,
            NetSubTotalLocalCurrency_Currency: payload.NetSubTotalLocalCurrency?.Currency ?? null,
            TotalNetAmountLocalCurrency_Amount: payload.TotalNetAmountLocalCurrency?.Amount ?? null,
            TotalNetAmountLocalCurrency_Currency: payload.TotalNetAmountLocalCurrency?.Currency ?? null,
            TotalAmountWithTaxLocalCurrency_Amount: payload.TotalAmountWithTaxLocalCurrency?.Amount ?? null,
            TotalAmountWithTaxLocalCurrency_Currency: payload.TotalAmountWithTaxLocalCurrency?.Currency ?? null,
            TotalProfitAmount_Amount: payload.TotalProfitAmount?.Amount ?? null,
            TotalProfitAmount_Currency: payload.TotalProfitAmount?.Currency ?? null,

            RevStatus: payload.RevStatus ?? null,
            SubTotalAlternativeCurrency: payload.SubTotalAlternativeCurrency ?? null,
            AlternativeCurrencyRate: payload.AlternativeCurrencyRate ?? null,

            NetSubTotalAlternativeCurrency_Amount: payload.NetSubTotalAlternativeCurrency?.Amount ?? null,
            NetSubTotalAlternativeCurrency_Currency: payload.NetSubTotalAlternativeCurrency?.Currency ?? null,
            TotalNetAmountAlternativeCurrency_Amount: payload.TotalNetAmountAlternativeCurrency?.Amount ?? null,
            TotalNetAmountAlternativeCurrency_Currency: payload.TotalNetAmountAlternativeCurrency?.Currency ?? null,
            TotalAmountWithTaxAlternativeCurrency_Amount: payload.TotalAmountWithTaxAlternativeCurrency?.Amount ?? null,
            TotalAmountWithTaxAlternativeCurrency_Currency: payload.TotalAmountWithTaxAlternativeCurrency?.Currency ?? null,
            TotalProfitAmountAlternativeCurrency_Amount: payload.TotalProfitAmountAlternativeCurrency?.Amount ?? null,
            TotalProfitAmountAlternativeCurrency_Currency: payload.TotalProfitAmountAlternativeCurrency?.Currency ?? null,

            IsVATExempt: payload.IsVATExempt ?? null,
            TermsAndConditions: payload.TermsAndConditions ?? null,
            ProductsAndServices: payload.ProductsAndServices ?? null,
            ServiceStartDate: payload.ServiceStartDate ?? null,
            ServiceFinishDate: payload.ServiceFinishDate ?? null,
            ReferenceCode: payload.ReferenceCode ?? null,
            TransferWithForeignCurrency: payload.TransferWithForeignCurrency ?? null,
            ContactId: payload.ContactId ?? null,
            FirstCreatedDate: payload.FirstCreatedDate ?? null,
            FirstCreatedByName: payload.FirstCreatedByName ?? null,
            TeamId: payload.TeamId ?? null,
            TeamCreatedById: payload.TeamCreatedById ?? null,
            SubTotalDiscountType: payload.SubTotalDiscountType ?? null,
            SubTotalDiscountAmount: payload.SubTotalDiscountAmount ?? null,
            InRefCode: payload.InRefCode ?? null,
            CompanyId: payload.CompanyId ?? null,
            QuoteApprovalProcessStatus: payload.QuoteApprovalProcessStatus ?? null,
            TotalDiscountRate: payload.TotalDiscountRate ?? null,
            FirstReleaseDate: payload.FirstReleaseDate ?? null,
            RevisedDate: payload.RevisedDate ?? null,
            CRMRevNo: payload.CRMRevNo ?? null,
            PublicationSource: payload.PublicationSource ?? null,
            TermsAndConditions2: payload.TermsAndConditions2 ?? null,
            ProductsAndServices2: payload.ProductsAndServices2 ?? null,
            StockId: payload.StockId ?? null,
            ItemNo: payload.ItemNo ?? null,
            QuoteType: payload.QuoteType ?? null,
            CrmOrderId: payload.CrmOrderId ?? null,
            OrderWillBeCreate: payload.OrderWillBeCreate ?? null,
            OrderOwnerWillBeChanged: payload.OrderOwnerWillBeChanged ?? null,
            TPOutReferenceCode: payload.TPOutReferenceCode ?? null,
            CreatedOn: payload.CreatedOn ?? payload.FirstCreatedDate ?? null
        };

        const existing = db.queryOne('SELECT Id FROM Quote WHERE Id = ?', [payload.Id]);
        const isInsert = !existing;

        let upsertSql: string;
        if (db.driver === 'mssql') {
            upsertSql = `
                MERGE INTO Quote AS target
                USING (SELECT @Id AS Id) AS source
                ON (target.Id = source.Id)
                WHEN MATCHED THEN
                    UPDATE SET
                        OpportunityId=@OpportunityId, RevisionId=@RevisionId, [Number]=@Number,
                        [Name]=@Name, ExpirationDate=@ExpirationDate, SubTotalDiscount=@SubTotalDiscount,
                        WarehouseId=@WarehouseId, ProposalOwnerId=@ProposalOwnerId, PaymentType=@PaymentType,
                        PaymentTypeTime=@PaymentTypeTime, [Status]=@Status, AddressIdentifier=@AddressIdentifier,
                        DeliveryType=@DeliveryType, DeliveryTime=@DeliveryTime, DeliveryDate=@DeliveryDate,
                        CustomerOrderNumber=@CustomerOrderNumber, PaymentTime=@PaymentTime, DeliveryTypeTime=@DeliveryTypeTime,
                        PersonId=@PersonId, SpecialCodeId=@SpecialCodeId, AccountId=@AccountId,
                        Description=@Description, RevNo=@RevNo,
                        NetSubTotalLocalCurrency_Amount=@NetSubTotalLocalCurrency_Amount, NetSubTotalLocalCurrency_Currency=@NetSubTotalLocalCurrency_Currency,
                        TotalNetAmountLocalCurrency_Amount=@TotalNetAmountLocalCurrency_Amount, TotalNetAmountLocalCurrency_Currency=@TotalNetAmountLocalCurrency_Currency,
                        TotalAmountWithTaxLocalCurrency_Amount=@TotalAmountWithTaxLocalCurrency_Amount, TotalAmountWithTaxLocalCurrency_Currency=@TotalAmountWithTaxLocalCurrency_Currency,
                        TotalProfitAmount_Amount=@TotalProfitAmount_Amount, TotalProfitAmount_Currency=@TotalProfitAmount_Currency,
                        RevStatus=@RevStatus, SubTotalAlternativeCurrency=@SubTotalAlternativeCurrency, AlternativeCurrencyRate=@AlternativeCurrencyRate,
                        NetSubTotalAlternativeCurrency_Amount=@NetSubTotalAlternativeCurrency_Amount, NetSubTotalAlternativeCurrency_Currency=@NetSubTotalAlternativeCurrency_Currency,
                        TotalNetAmountAlternativeCurrency_Amount=@TotalNetAmountAlternativeCurrency_Amount, TotalNetAmountAlternativeCurrency_Currency=@TotalNetAmountAlternativeCurrency_Currency,
                        TotalAmountWithTaxAlternativeCurrency_Amount=@TotalAmountWithTaxAlternativeCurrency_Amount, TotalAmountWithTaxAlternativeCurrency_Currency=@TotalAmountWithTaxAlternativeCurrency_Currency,
                        TotalProfitAmountAlternativeCurrency_Amount=@TotalProfitAmountAlternativeCurrency_Amount, TotalProfitAmountAlternativeCurrency_Currency=@TotalProfitAmountAlternativeCurrency_Currency,
                        IsVATExempt=@IsVATExempt, TermsAndConditions=@TermsAndConditions, ProductsAndServices=@ProductsAndServices,
                        ServiceStartDate=@ServiceStartDate, ServiceFinishDate=@ServiceFinishDate, ReferenceCode=@ReferenceCode,
                        TransferWithForeignCurrency=@TransferWithForeignCurrency, ContactId=@ContactId, FirstCreatedDate=@FirstCreatedDate,
                        FirstCreatedByName=@FirstCreatedByName, TeamId=@TeamId, TeamCreatedById=@TeamCreatedById,
                        SubTotalDiscountType=@SubTotalDiscountType, SubTotalDiscountAmount=@SubTotalDiscountAmount,
                        InRefCode=@InRefCode, CompanyId=@CompanyId, QuoteApprovalProcessStatus=@QuoteApprovalProcessStatus,
                        TotalDiscountRate=@TotalDiscountRate, FirstReleaseDate=@FirstReleaseDate, RevisedDate=@RevisedDate,
                        CRMRevNo=@CRMRevNo, PublicationSource=@PublicationSource, TermsAndConditions2=@TermsAndConditions2,
                        ProductsAndServices2=@ProductsAndServices2, StockId=@StockId, ItemNo=@ItemNo,
                        QuoteType=@QuoteType, CrmOrderId=@CrmOrderId, OrderWillBeCreate=@OrderWillBeCreate,
                        OrderOwnerWillBeChanged=@OrderOwnerWillBeChanged, TPOutReferenceCode=@TPOutReferenceCode,
                        CreatedOn=@CreatedOn,
                        _SyncedAt=GETUTCDATE()
                WHEN NOT MATCHED THEN
                    INSERT (
                        Id, OpportunityId, RevisionId, [Number], [Name], ExpirationDate, SubTotalDiscount, 
                        WarehouseId, ProposalOwnerId, PaymentType, PaymentTypeTime, [Status], AddressIdentifier, 
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
                        QuoteType, CrmOrderId, OrderWillBeCreate, OrderOwnerWillBeChanged, 
                        TPOutReferenceCode, CreatedOn, _SyncedAt
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
                        @CrmOrderId, @OrderWillBeCreate, @OrderOwnerWillBeChanged, @TPOutReferenceCode, GETUTCDATE()
                    );
            `;
        } else {
            upsertSql = `
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
                    CrmOrderId, OrderWillBeCreate, OrderOwnerWillBeChanged, TPOutReferenceCode, CreatedOn, _SyncedAt
                ) VALUES (
                    :Id, :OpportunityId, :RevisionId, :Number, :Name, :ExpirationDate, :SubTotalDiscount, 
                    :WarehouseId, :ProposalOwnerId, :PaymentType, :PaymentTypeTime, :Status, :AddressIdentifier, 
                    :DeliveryType, :DeliveryTime, :DeliveryDate, :CustomerOrderNumber, :PaymentTime, :DeliveryTypeTime, 
                    :PersonId, :SpecialCodeId, :AccountId, :Description, :RevNo, 
                    :NetSubTotalLocalCurrency_Amount, :NetSubTotalLocalCurrency_Currency,
                    :TotalNetAmountLocalCurrency_Amount, :TotalNetAmountLocalCurrency_Currency,
                    :TotalAmountWithTaxLocalCurrency_Amount, :TotalAmountWithTaxLocalCurrency_Currency,
                    :TotalProfitAmount_Amount, :TotalProfitAmount_Currency,
                    :RevStatus, :SubTotalAlternativeCurrency, :AlternativeCurrencyRate,
                    :NetSubTotalAlternativeCurrency_Amount, :NetSubTotalAlternativeCurrency_Currency,
                    :TotalNetAmountAlternativeCurrency_Amount, :TotalNetAmountAlternativeCurrency_Currency,
                    :TotalAmountWithTaxAlternativeCurrency_Amount, :TotalAmountWithTaxAlternativeCurrency_Currency,
                    :TotalProfitAmountAlternativeCurrency_Amount, :TotalProfitAmountAlternativeCurrency_Currency,
                    :IsVATExempt, :TermsAndConditions, :ProductsAndServices, :ServiceStartDate, :ServiceFinishDate, 
                    :ReferenceCode, :TransferWithForeignCurrency, :ContactId, :FirstCreatedDate, :FirstCreatedByName, 
                    :TeamId, :TeamCreatedById, :SubTotalDiscountType, :SubTotalDiscountAmount, :InRefCode, :CompanyId, 
                    :QuoteApprovalProcessStatus, :TotalDiscountRate, :FirstReleaseDate, :RevisedDate, :CRMRevNo, 
                    :PublicationSource, :TermsAndConditions2, :ProductsAndServices2, :StockId, :ItemNo, :QuoteType, 
                    :CrmOrderId, :OrderWillBeCreate, :OrderOwnerWillBeChanged, :TPOutReferenceCode, :CreatedOn, datetime('now')
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
                    OrderWillBeCreate=excluded.OrderWillBeCreate,
                    OrderOwnerWillBeChanged=excluded.OrderOwnerWillBeChanged, TPOutReferenceCode=excluded.TPOutReferenceCode,
                    CreatedOn=excluded.CreatedOn,
                    _SyncedAt=datetime('now')
            `;
        }

        db.transaction(() => {
            db.execute(upsertSql, binding);

            db.execute('DELETE FROM QuoteOrderDetails WHERE QuoteId = ?', [payload.Id]);
            payload.QuoteOrderDetails?.forEach((row: any) => {
                db.execute('INSERT INTO QuoteOrderDetails (Id, QuoteId, CrmOrderId) VALUES (?, ?, ?)', [row.Id, payload.Id, row.CrmOrderId]);
            });

            db.execute('DELETE FROM QuoteDynamicFields WHERE QuoteId = ?', [payload.Id]);
            payload.QuoteDynamicFields?.forEach((row: any) => {
                db.execute('INSERT INTO QuoteDynamicFields (Id, QuoteId, FieldName, FieldValue) VALUES (?, ?, ?, ?)', [row.Id, payload.Id, row.FieldName, row.FieldValue ?? null]);
            });
        });

        res.json({
            status: 'ok',
            upserted: isInsert,
            id: payload.Id,
            syncedAt: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('[Quote Sync Error]', error);
        res.status(400).json({ status: 'error', message: error.message || 'Validation Failed' });
    }
});

export default router;
