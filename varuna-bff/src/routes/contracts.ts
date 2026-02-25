import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

router.get('/', (req: Request, res: Response) => {
    const db = getDb();

    const top = parseInt(req.query.$top as string) || 100;
    const skip = parseInt(req.query.$skip as string) || 0;

    const rows = db.prepare(`
        SELECT c.*, a.Name as AccountName, p.PersonNameSurname as OwnerName,
               CAST(julianday(c.FinishDate) - julianday('now') AS INTEGER) as DaysToRenewal
        FROM Contract c
        LEFT JOIN Account a ON c.AccountId = a.Id
        LEFT JOIN Person p ON c.SalesRepresentativeId = p.Id
        ORDER BY c.SigningDate DESC
        LIMIT ? OFFSET ?
    `).all(top, skip) as Record<string, any>[];

    // Map to frontend shape
    const mapped = rows.map(row => ({
        id: row.Id,
        title: row.ContractName || row.ContractNo || 'Sözleşme',
        customerName: row.AccountName || row.AccountId || '',
        salesOwnerId: row.SalesRepresentativeId,
        ownerName: row.OwnerName || 'Unknown',
        productGroup: row.ProductId || 'EnRoute',
        type: row.ContractType === 1 ? 'Initialization' : 'Renewal',
        status: row.ContractStatus === 1 ? 'Active' : 'Archived',
        totalValue: row.TotalAmountLocalCurrency_Amount || 0,
        currency: row.TotalAmountLocalCurrency_Currency || 'TRY',
        totalValueTL: row.TotalAmountLocalCurrency_Amount || 0,
        startDate: row.StartDate,
        endDate: row.FinishDate,
        renewalDate: row.RenewalDate || row.FinishDate,
        billingStatus: 'Invoiced',
        billingCadence: 'Yearly',
        nextInvoiceDate: row.RenewalDate || row.FinishDate,
        daysToRenewal: row.DaysToRenewal || 0,
        autoRenewal: row.IsAutoExtending === 1,
        riskLevel: (row.DaysToRenewal < 30) ? 'High' : (row.DaysToRenewal < 90 ? 'Medium' : 'Low'),
        riskFactors: [],
        healthScore: 100,
        actionsRequired: false
    }));

    return res.json({ value: mapped });
});

router.get('/:id', (req: Request, res: Response) => {
    try {
        const db = getDb();
        const contract = db.prepare(`
            SELECT c.*, a.Name as AccountName, p.PersonNameSurname as OwnerName,
                   CAST(julianday(c.FinishDate) - julianday('now') AS INTEGER) as DaysToRenewal
            FROM Contract c
            LEFT JOIN Account a ON c.AccountId = a.Id
            LEFT JOIN Person p ON c.SalesRepresentativeId = p.Id
            WHERE c.Id = ?
        `).get(req.params.id) as Record<string, any>;

        if (!contract) return res.status(404).json({ error: 'Contract not found' });

        const paymentPlans = db.prepare(`
            SELECT * FROM ContractPaymentPlans WHERE ContractId = ? ORDER BY PaymentDate ASC
        `).all(req.params.id) as Record<string, any>[];

        const mapped = {
            id: contract.Id,
            title: contract.ContractName || contract.ContractNo || 'Sözleşme',
            customerName: contract.AccountName || contract.AccountId || '',
            salesOwnerId: contract.SalesRepresentativeId,
            ownerName: contract.OwnerName || 'Unknown',
            productGroup: contract.ProductId || 'EnRoute',
            type: contract.ContractType === 1 ? 'Initialization' : 'Renewal',
            status: contract.ContractStatus === 1 ? 'Active' : 'Archived',
            totalValue: contract.TotalAmountLocalCurrency_Amount || 0,
            currency: contract.TotalAmountLocalCurrency_Currency || 'TRY',
            totalValueTL: contract.TotalAmountLocalCurrency_Amount || 0,
            startDate: contract.StartDate,
            endDate: contract.FinishDate,
            renewalDate: contract.RenewalDate || contract.FinishDate,
            billingStatus: 'Invoiced',
            billingCadence: 'Yearly',
            nextInvoiceDate: contract.RenewalDate || contract.FinishDate,
            daysToRenewal: contract.DaysToRenewal || 0,
            autoRenewal: contract.IsAutoExtending === 1,
            riskLevel: (contract.DaysToRenewal < 30) ? 'High' : (contract.DaysToRenewal < 90 ? 'Medium' : 'Low'),
            riskFactors: [],
            healthScore: 100,
            actionsRequired: false,
            paymentPlan: paymentPlans.map(pp => ({
                id: pp.Id,
                date: pp.PaymentDate,
                amount: pp.Price_Amount || 0,
                currency: pp.Price_Currency || 'TRY',
                status: pp.HasBeenCollected === 1 ? 'Collected' : (new Date(pp.PaymentDate) < new Date() ? 'Overdue' : 'Pending'),
                invoiceNumber: pp.Name || ''
            }))
        };

        return res.json(mapped);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
