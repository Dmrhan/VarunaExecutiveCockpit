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

        const upsertContract = db.prepare(`
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
        `);

        // Child Prepares
        const delPaymentPlans = db.prepare(`DELETE FROM ContractPaymentPlans WHERE ContractId = ?`);
        const insPaymentPlans = db.prepare(`
            INSERT INTO ContractPaymentPlans (Id, ContractId, Price_Amount, Price_Currency, TotalRate, HasBeenCollected, PaymentDate, Name) 
            VALUES (@Id, @ContractId, @Price_Amount, @Price_Currency, @TotalRate, @HasBeenCollected, @PaymentDate, @Name)
        `);

        const delLisances = db.prepare(`DELETE FROM ContractLisances WHERE ContractId = ?`);
        const insLisances = db.prepare(`INSERT INTO ContractLisances (Id, ContractId, LisanceId) VALUES (@Id, @ContractId, @LisanceId)`);

        const syncTransaction = db.transaction((data) => {
            // Main Insert
            const info = upsertContract.run({
                Id: data.Id,
                ContractNo: data.ContractNo ?? null,
                ContractName: data.ContractName ?? null,
                AccountId: data.AccountId,
                SalesRepresentativeId: data.SalesRepresentativeId,
                ContractType: data.ContractType ?? null,
                ContractStatus: data.ContractStatus ?? null,
                StartDate: data.StartDate,
                FinishDate: data.FinishDate,
                RenewalDate: data.RenewalDate ?? null,
                IsAutoExtending: data.IsAutoExtending ?? null,
                InvoiceDueDate: data.InvoiceDueDate ?? null,

                TotalAmount_Amount: data.TotalAmount?.Amount ?? null,
                TotalAmount_Currency: data.TotalAmount?.Currency ?? null,
                TotalAmountLocalCurrency_Amount: data.TotalAmountLocalCurrency?.Amount ?? null,
                TotalAmountLocalCurrency_Currency: data.TotalAmountLocalCurrency?.Currency ?? null,

                StampTaxRate: data.StampTaxRate ?? null,
                StampTaxAmount: data.StampTaxAmount ?? null,
                IsLateInterestApply: data.IsLateInterestApply ?? null,
                LateInterestContractYear: data.LateInterestContractYear ?? null,

                InvoiceNumber: data.InvoiceNumber ?? null,
                InvoiceStatusId: data.InvoiceStatusId ?? null,
                CompanyId: data.CompanyId ?? null,
                ContractUrl: data.ContractUrl ?? null,
                ProductId: data.ProductId ?? null,

                RemainingBalance_Amount: data.RemainingBalance?.Amount ?? null,
                RemainingBalance_Currency: data.RemainingBalance?.Currency ?? null,
                SigningDate: data.SigningDate ?? null
            });

            // Replace Child Arrays atomically
            delPaymentPlans.run(data.Id);
            if (data.ContractPaymentPlans && data.ContractPaymentPlans.length > 0) {
                for (const row of data.ContractPaymentPlans) {
                    insPaymentPlans.run({
                        Id: row.Id,
                        ContractId: data.Id,
                        Price_Amount: row.Price?.Amount ?? null,
                        Price_Currency: row.Price?.Currency ?? null,
                        TotalRate: row.TotalRate ?? null,
                        HasBeenCollected: row.HasBeenCollected ?? null,
                        PaymentDate: row.PaymentDate,
                        Name: row.Name ?? null
                    });
                }
            }

            delLisances.run(data.Id);
            if (data.ContractLisances && data.ContractLisances.length > 0) {
                for (const row of data.ContractLisances) {
                    insLisances.run({ Id: row.Id, ContractId: data.Id, LisanceId: row.LisanceId });
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
        console.error('[Contract Sync Error]', error);
        res.status(400).json({ status: 'error', message: error.message || 'Validation Failed' });
    }
});

export default router;
