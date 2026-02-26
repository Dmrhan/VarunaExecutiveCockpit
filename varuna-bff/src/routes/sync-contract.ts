import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { z } from 'zod';

const router = Router();

// Define Zod Schema for Contract request validation
const moneySchema = z.object({
    Amount: z.number(),
    Currency: z.string()
});

const contractSchema = z.object({
    Id: z.string(),
    ContractNo: z.string().nullable().optional(),
    ContractName: z.string().nullable().optional(),
    AccountId: z.string(),
    SalesRepresentativeId: z.string(),
    ContractType: z.number().nullable().optional(),
    ContractStatus: z.number().nullable().optional(),
    StartDate: z.string(),
    FinishDate: z.string(),
    RenewalDate: z.string().nullable().optional(),
    IsAutoExtending: z.number().int().min(0).max(1).nullable().optional(),
    InvoiceDueDate: z.number().nullable().optional(),

    TotalAmount: moneySchema.nullable().optional(),
    TotalAmountLocalCurrency: moneySchema.nullable().optional(),

    StampTaxRate: z.number().nullable().optional(),
    StampTaxAmount: z.number().nullable().optional(),

    IsLateInterestApply: z.number().int().min(0).max(1).nullable().optional(),
    LateInterestContractYear: z.number().nullable().optional(),

    InvoiceNumber: z.number().nullable().optional(),
    InvoiceStatusId: z.string().nullable().optional(),
    CompanyId: z.string().nullable().optional(),
    ContractUrl: z.string().nullable().optional(),
    ProductId: z.string().nullable().optional(),

    RemainingBalance: moneySchema.nullable().optional(),
    SigningDate: z.string().nullable().optional(),

    // Child Collections
    ContractPaymentPlans: z.array(z.object({
        Id: z.string(),
        ContractId: z.string(),
        Price: moneySchema.nullable().optional(),
        TotalRate: z.number().nullable().optional(),
        HasBeenCollected: z.number().int().min(0).max(1).nullable().optional(),
        PaymentDate: z.string(),
        Name: z.string().nullable().optional()
    })).nullable().optional(),

    ContractLisances: z.array(z.object({
        Id: z.string(),
        ContractId: z.string(),
        LisanceId: z.string()
    })).nullable().optional()
});

router.post('/', (req: Request, res: Response) => {
    try {
        const payload = contractSchema.parse(req.body);
        const db = getDb();

        const upsertContractSql = db.driver === 'mssql' ? `
            MERGE INTO Contract AS target
            USING (SELECT @Id AS Id) AS source
            ON (target.Id = source.Id)
            WHEN MATCHED THEN
                UPDATE SET 
                    ContractNo=@ContractNo, ContractName=@ContractName, AccountId=@AccountId, 
                    SalesRepresentativeId=@SalesRepresentativeId, ContractType=@ContractType, 
                    ContractStatus=@ContractStatus, StartDate=@StartDate, FinishDate=@FinishDate, 
                    RenewalDate=@RenewalDate, IsAutoExtending=@IsAutoExtending, 
                    InvoiceDueDate=@InvoiceDueDate, TotalAmount_Amount=@TotalAmount_Amount, 
                    TotalAmount_Currency=@TotalAmount_Currency, TotalAmountLocalCurrency_Amount=@TotalAmountLocalCurrency_Amount, 
                    TotalAmountLocalCurrency_Currency=@TotalAmountLocalCurrency_Currency, 
                    StampTaxRate=@StampTaxRate, StampTaxAmount=@StampTaxAmount, 
                    IsLateInterestApply=@IsLateInterestApply, LateInterestContractYear=@LateInterestContractYear, 
                    InvoiceNumber=@InvoiceNumber, InvoiceStatusId=@InvoiceStatusId, 
                    CompanyId=@CompanyId, ContractUrl=@ContractUrl, ProductId=@ProductId, 
                    RemainingBalance_Amount=@RemainingBalance_Amount, RemainingBalance_Currency=@RemainingBalance_Currency, 
                    SigningDate=@SigningDate, _SyncedAt=GETUTCDATE()
            WHEN NOT MATCHED THEN
                INSERT (
                    Id, ContractNo, ContractName, AccountId, SalesRepresentativeId, 
                    ContractType, ContractStatus, StartDate, FinishDate, RenewalDate, 
                    IsAutoExtending, InvoiceDueDate, TotalAmount_Amount, TotalAmount_Currency, 
                    TotalAmountLocalCurrency_Amount, TotalAmountLocalCurrency_Currency, 
                    StampTaxRate, StampTaxAmount, IsLateInterestApply, LateInterestContractYear, 
                    InvoiceNumber, InvoiceStatusId, CompanyId, ContractUrl, ProductId, 
                    RemainingBalance_Amount, RemainingBalance_Currency, SigningDate, _SyncedAt
                ) VALUES (
                    @Id, @ContractNo, @ContractName, @AccountId, @SalesRepresentativeId, 
                    @ContractType, @ContractStatus, @StartDate, @FinishDate, @RenewalDate, 
                    @IsAutoExtending, @InvoiceDueDate, @TotalAmount_Amount, @TotalAmount_Currency, 
                    @TotalAmountLocalCurrency_Amount, @TotalAmountLocalCurrency_Currency, 
                    @StampTaxRate, @StampTaxAmount, @IsLateInterestApply, @LateInterestContractYear, 
                    @InvoiceNumber, @InvoiceStatusId, @CompanyId, @ContractUrl, @ProductId, 
                    @RemainingBalance_Amount, @RemainingBalance_Currency, @SigningDate, GETUTCDATE()
                );
        ` : `
            INSERT INTO Contract (
                Id, ContractNo, ContractName, AccountId, SalesRepresentativeId, 
                ContractType, ContractStatus, StartDate, FinishDate, RenewalDate, 
                IsAutoExtending, InvoiceDueDate, TotalAmount_Amount, TotalAmount_Currency, 
                TotalAmountLocalCurrency_Amount, TotalAmountLocalCurrency_Currency, 
                StampTaxRate, StampTaxAmount, IsLateInterestApply, LateInterestContractYear, 
                InvoiceNumber, InvoiceStatusId, CompanyId, ContractUrl, ProductId, 
                RemainingBalance_Amount, RemainingBalance_Currency, SigningDate
            ) VALUES (
                @Id, @ContractNo, @ContractName, @AccountId, @SalesRepresentativeId, 
                @ContractType, @ContractStatus, @StartDate, @FinishDate, @RenewalDate, 
                @IsAutoExtending, @InvoiceDueDate, @TotalAmount_Amount, @TotalAmount_Currency, 
                @TotalAmountLocalCurrency_Amount, @TotalAmountLocalCurrency_Currency, 
                @StampTaxRate, @StampTaxAmount, @IsLateInterestApply, @LateInterestContractYear, 
                @InvoiceNumber, @InvoiceStatusId, @CompanyId, @ContractUrl, @ProductId, 
                @RemainingBalance_Amount, @RemainingBalance_Currency, @SigningDate
            )
            ON CONFLICT(Id) DO UPDATE SET
                ContractNo=excluded.ContractNo, ContractName=excluded.ContractName, 
                AccountId=excluded.AccountId, SalesRepresentativeId=excluded.SalesRepresentativeId, 
                ContractType=excluded.ContractType, ContractStatus=excluded.ContractStatus, 
                StartDate=excluded.StartDate, FinishDate=excluded.FinishDate, RenewalDate=excluded.RenewalDate, 
                IsAutoExtending=excluded.IsAutoExtending, InvoiceDueDate=excluded.InvoiceDueDate, 
                TotalAmount_Amount=excluded.TotalAmount_Amount, TotalAmount_Currency=excluded.TotalAmount_Currency, 
                TotalAmountLocalCurrency_Amount=excluded.TotalAmountLocalCurrency_Amount, TotalAmountLocalCurrency_Currency=excluded.TotalAmountLocalCurrency_Currency, 
                StampTaxRate=excluded.StampTaxRate, StampTaxAmount=excluded.StampTaxAmount, 
                IsLateInterestApply=excluded.IsLateInterestApply, LateInterestContractYear=excluded.LateInterestContractYear, 
                InvoiceNumber=excluded.InvoiceNumber, InvoiceStatusId=excluded.InvoiceStatusId, 
                CompanyId=excluded.CompanyId, ContractUrl=excluded.ContractUrl, ProductId=excluded.ProductId, 
                RemainingBalance_Amount=excluded.RemainingBalance_Amount, RemainingBalance_Currency=excluded.RemainingBalance_Currency, 
                SigningDate=excluded.SigningDate, _SyncedAt=datetime('now')
        `;

        const wasInsertedResult = db.transaction(() => {
            // Main Insert
            const result = db.execute(upsertContractSql, {
                Id: payload.Id,
                ContractNo: payload.ContractNo ?? null,
                ContractName: payload.ContractName ?? null,
                AccountId: payload.AccountId,
                SalesRepresentativeId: payload.SalesRepresentativeId,
                ContractType: payload.ContractType ?? null,
                ContractStatus: payload.ContractStatus ?? null,
                StartDate: payload.StartDate,
                FinishDate: payload.FinishDate,
                RenewalDate: payload.RenewalDate ?? null,
                IsAutoExtending: payload.IsAutoExtending ?? null,
                InvoiceDueDate: payload.InvoiceDueDate ?? null,

                TotalAmount_Amount: payload.TotalAmount?.Amount ?? null,
                TotalAmount_Currency: payload.TotalAmount?.Currency ?? null,
                TotalAmountLocalCurrency_Amount: payload.TotalAmountLocalCurrency?.Amount ?? null,
                TotalAmountLocalCurrency_Currency: payload.TotalAmountLocalCurrency?.Currency ?? null,

                StampTaxRate: payload.StampTaxRate ?? null,
                StampTaxAmount: payload.StampTaxAmount ?? null,
                IsLateInterestApply: payload.IsLateInterestApply ?? null,
                LateInterestContractYear: payload.LateInterestContractYear ?? null,

                InvoiceNumber: payload.InvoiceNumber ?? null,
                InvoiceStatusId: payload.InvoiceStatusId ?? null,
                CompanyId: payload.CompanyId ?? null,
                ContractUrl: payload.ContractUrl ?? null,
                ProductId: payload.ProductId ?? null,

                RemainingBalance_Amount: payload.RemainingBalance?.Amount ?? null,
                RemainingBalance_Currency: payload.RemainingBalance?.Currency ?? null,
                SigningDate: payload.SigningDate ?? null
            });

            // Replace Child Arrays atomically
            db.execute(`DELETE FROM ContractPaymentPlans WHERE ContractId = @id`, { id: payload.Id });
            if (payload.ContractPaymentPlans && payload.ContractPaymentPlans.length > 0) {
                const insPaymentPlanSql = `INSERT INTO ContractPaymentPlans (Id, ContractId, Price_Amount, Price_Currency, TotalRate, HasBeenCollected, PaymentDate, Name) 
                                           VALUES (@Id, @ContractId, @Price_Amount, @Price_Currency, @TotalRate, @HasBeenCollected, @PaymentDate, @Name)`;
                for (const row of payload.ContractPaymentPlans) {
                    db.execute(insPaymentPlanSql, {
                        Id: row.Id,
                        ContractId: payload.Id,
                        Price_Amount: row.Price?.Amount ?? null,
                        Price_Currency: row.Price?.Currency ?? null,
                        TotalRate: row.TotalRate ?? null,
                        HasBeenCollected: row.HasBeenCollected ?? null,
                        PaymentDate: row.PaymentDate,
                        Name: row.Name ?? null
                    });
                }
            }

            db.execute(`DELETE FROM ContractLisances WHERE ContractId = @id`, { id: payload.Id });
            if (payload.ContractLisances && payload.ContractLisances.length > 0) {
                const insLisancesSql = `INSERT INTO ContractLisances (Id, ContractId, LisanceId) VALUES (@Id, @ContractId, @LisanceId)`;
                for (const row of payload.ContractLisances) {
                    db.execute(insLisancesSql, { Id: row.Id, ContractId: payload.Id, LisanceId: row.LisanceId });
                }
            }

            return result.changes === 1;
        });

        res.json({
            status: 'ok',
            upserted: wasInsertedResult,
            id: payload.Id,
            syncedAt: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('[Contract Sync Error]', error);
        res.status(400).json({ status: 'error', message: error.message || 'Validation Failed' });
    }
});

export default router;
