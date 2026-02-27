import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../varuna.db');
const db = new Database(DB_PATH);

console.log('[Seed] Seeding realistic Person Scorecard data...');

// Helper to generate random dates
const randomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const run = db.transaction(() => {
    // 1. Get all persons
    const persons = db.prepare('SELECT Id FROM Person').all() as { Id: string }[];
    if (persons.length === 0) {
        console.log('[Seed] No persons found, skipping seed.');
        return;
    }

    // Prepare statements MATCHING EXACT COLUMN NAMES FROM SQL SCHEMA
    // Opportunity does NOT have ExpectedRevenue_CurrencyId
    const insOpp = db.prepare(`INSERT INTO Opportunity (Id, OwnerId, AccountId, Name, ExpectedRevenue_Value, DealStatus, FirstCreatedDate, CloseDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

    // Quote REQUIRES strictly non-null columns Name, Number, ExpirationDate, PaymentType, Status, AccountId, ProposalOwnerId
    const insQuote = db.prepare(`INSERT INTO Quote (Id, ProposalOwnerId, AccountId, Name, Number, ExpirationDate, PaymentType, Status, TotalNetAmountLocalCurrency_Amount, FirstCreatedDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    // Order uses ProposalOwnerId instead of OwnerId, and InvoiceDate/CreateOrderDate
    const insOrder = db.prepare(`INSERT INTO CrmOrder (Id, ProposalOwnerId, AccountId, Name, CustomerOrderNumber, TotalNetAmountLocalCurrency_Amount, Status, InvoiceDate, CreateOrderDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    // Contract uses FinishDate instead of EndDate
    const insContract = db.prepare(`INSERT INTO Contract (Id, SalesRepresentativeId, AccountId, ContractStatus, TotalAmountLocalCurrency_Amount, StartDate, FinishDate, ContractNo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

    // Payment plans
    const insPayment = db.prepare(`INSERT INTO ContractPaymentPlans (Id, ContractId, Price_Amount, PaymentDate, HasBeenCollected) VALUES (?, ?, ?, ?, ?)`);

    // Events
    const insEvent = db.prepare(`INSERT INTO CalenderEvent (Id, OwnerId, AccountId, Subject, Type, Status, StartDate, FinishDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    // Iterate persons and generate funnel
    for (const p of persons) {
        const ownerId = p.Id;
        const accountId = 'acc_1'; // Just use acc_1 for mock

        // Let's create 15 opportunity flows per person
        for (let i = 0; i < 15; i++) {
            const oppId = crypto.randomUUID();
            const oppDate = randomDate(oneYearAgo, now);
            const initialAmount = Math.floor(Math.random() * 500000) + 100000;

            // 1. Opportunity
            const closeDateForOpp = new Date(oppDate.getTime() + (Math.random() * 60 + 10) * 24 * 60 * 60 * 1000).toISOString();
            insOpp.run(oppId, ownerId, accountId, `Opp ${i}`, initialAmount, 1, oppDate.toISOString(), closeDateForOpp);

            // 70% chance to move to Quote
            if (Math.random() > 0.3) {
                const quoteId = crypto.randomUUID();
                const quoteDate = randomDate(oppDate, now);
                const expDate = new Date(quoteDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
                const quoteAmount = Math.round(initialAmount * (0.8 + Math.random() * 0.2)); // 80-100% of opp

                // 60% won quote, 40% lost
                const isWon = Math.random() > 0.4;
                const qtStatus = isWon ? 1 : 2;

                insQuote.run(quoteId, ownerId, accountId, `Quote ${i}`, `NUM-${quoteId}`, expDate, 1, qtStatus, quoteAmount, quoteDate.toISOString());

                // If won, move to Order
                if (isWon) {
                    const orderId = crypto.randomUUID();
                    const orderDate = randomDate(quoteDate, now);
                    const orderAmount = Math.round(quoteAmount * (0.9 + Math.random() * 0.1)); // 90-100%

                    // 80% invoiced
                    const isInvoiced = Math.random() > 0.2;
                    const invDate = isInvoiced ? randomDate(orderDate, now).toISOString() : null;

                    insOrder.run(orderId, ownerId, accountId, `Siparis ${i}`, `CUST-ORD-${i}`, orderAmount, 2, invDate, orderDate.toISOString());

                    // Create Contract
                    const contractId = crypto.randomUUID();
                    const contractAmount = Math.round(orderAmount * 0.95);
                    const endDate = new Date(orderDate.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
                    insContract.run(contractId, ownerId, accountId, 1, contractAmount, orderDate.toISOString(), endDate, `CNO-${contractId}`);

                    // Create Collections (if invoiced)
                    if (isInvoiced) {
                        const collectedCount = Math.floor(Math.random() * 4) + 1;
                        for (let c = 0; c < collectedCount; c++) {
                            const isCol = Math.random() > 0.1;
                            insPayment.run(crypto.randomUUID(), contractId, Math.round(contractAmount / collectedCount), randomDate(orderDate, now).toISOString(), isCol ? 1 : 0);
                        }
                    }
                }
            }

            // Activities
            for (let a = 0; a < 3; a++) {
                insEvent.run(crypto.randomUUID(), ownerId, accountId, `Musteri Toplantisi ${a}`, 1, 1, randomDate(oneYearAgo, now).toISOString(), null);
            }
        }
    }
});

try {
    run();
    console.log('[Seed] Successfully generated funnel data for all persons!');
} catch (e) {
    console.error('[Seed] Error:', e);
}
