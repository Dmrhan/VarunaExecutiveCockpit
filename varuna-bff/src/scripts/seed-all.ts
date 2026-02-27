/**
 * seed-all.ts
 * Deterministic, FK-ordered seed script for Varuna Intelligence SQLite DB.
 * SEED = 2026 — produces identical output on every run.
 * Run: npx ts-node src/scripts/seed-all.ts
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// ─── Config ──────────────────────────────────────────────────────────────────
const SEED = 2026;
const DB_PATH = path.join(__dirname, '../../varuna.db');
const SCHEMA_PATH = path.join(__dirname, '../db/schema.sql');
const COMPANY_ID = 'COMP-001';
const TODAY = new Date('2026-02-27');

// ─── Deterministic PRNG (mulberry32) ─────────────────────────────────────────
function makePrng(seed: number) {
    let s = seed >>> 0;
    return () => {
        s |= 0; s = s + 0x6D2B79F5 | 0;
        let t = Math.imul(s ^ s >>> 15, 1 | s);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}
const rng = makePrng(SEED);

function rand(min: number, max: number) { return Math.floor(rng() * (max - min + 1)) + min; }
function pick<T>(arr: T[]): T { return arr[rand(0, arr.length - 1)]; }
function uid(prefix: string) { return `${prefix}-${Math.floor(rng() * 1e9).toString(16).toUpperCase().padStart(8, '0')}`; }

function addDays(base: Date, days: number): Date {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return d;
}
function isoDate(d: Date) { return d.toISOString().split('T')[0]; }
function isoDateTime(d: Date) { return d.toISOString(); }

// ─── Reference Data ───────────────────────────────────────────────────────────
const PIPELINE_ID = 'PL-001';

const PERSON_NAMES = [
    { name: 'Mehmet', surname: 'Yılmaz' },
    { name: 'Ayşe', surname: 'Kaya' },
    { name: 'Ali', surname: 'Demir' },
    { name: 'Fatma', surname: 'Çelik' },
    { name: 'Mustafa', surname: 'Şahin' },
    { name: 'Zeynep', surname: 'Yıldız' },
    { name: 'Hüseyin', surname: 'Arslan' },
    { name: 'Emine', surname: 'Doğan' },
];

const ACCOUNT_NAMES = [
    'Borusan Holding', 'Koç Sistem', 'ACE Entegrasyon', 'Aselsan', 'Turkcell',
    'Sabancı Dijital', 'Arçelik', 'Migros', 'BIM Mağazaları', 'Petkim',
    'Enerjisa', 'Tofaş', 'Ford Otosan', 'Alarko Holding', 'İş Bankası',
    'Garanti BBVA', 'Yapı Kredi', 'Eczacıbaşı', 'Kordsa Teknik', 'Temsa',
    'Doğan Holding', 'Rönesans', 'Limak Holding', 'Acıbadem Sağlık', 'Türk Telekom',
    'OYAK Teknoloji', 'TAV Havalimanları', 'Yıldız Holding', 'Polisan Kimya', 'Metro Turizm',
];

const PRODUCTS = [
    { id: 'STK-ENROUTE', code: 'ENR', name: 'EnRoute', shortName: 'ENR', groupId: 'PG-ENR' },
    { id: 'STK-QUEST', code: 'QST', name: 'Quest', shortName: 'QST', groupId: 'PG-QST' },
    { id: 'STK-STOKBAR', code: 'STB', name: 'Stokbar', shortName: 'STB', groupId: 'PG-STB' },
    { id: 'STK-SVCCORE', code: 'SVC', name: 'ServiceCore', shortName: 'SVC', groupId: 'PG-SVC' },
    { id: 'STK-VARUNA', code: 'VRN', name: 'Varuna', shortName: 'VRN', groupId: 'PG-VRN' },
    { id: 'STK-HOSTING', code: 'HST', name: 'Hosting', shortName: 'HST', groupId: 'PG-HST' },
    { id: 'STK-UNIDOX', code: 'UDX', name: 'Unidox', shortName: 'UDX', groupId: 'PG-UDX' },
];

// Opportunity stage enum values (integer codes, same assumption as analytics.ts)
// DealStatus: 0=Open, 1=Negotiation, 2=Won, 3=Lost
// OpportunityStageName: 1=Lead, 2=Qualified, 3=Proposal, 4=Negotiation, 5=Order, 6=Lost
const OPEN_STAGES = [
    { status: 0, stage: 1, nameTr: 'Lead', prob: 20 },
    { status: 0, stage: 2, nameTr: 'Nitelikli', prob: 40 },
    { status: 0, stage: 3, nameTr: 'Teklif', prob: 60 },
    { status: 0, stage: 4, nameTr: 'Müzakere', prob: 75 },
];
const WON_STAGE = { status: 2, stage: 5, nameTr: 'Kazanıldı', prob: 100 };
const LOST_STAGE = { status: 3, stage: 6, nameTr: 'Kaybedildi', prob: 0 };

// Quote Status integers — match analytics-quote.ts assumption
// 0=Draft, 1=Sent, 2=Accepted, 3=Rejected, 4=Review, 5=Approved, 6=Denied
const Q_DRAFT = 0, Q_SENT = 1, Q_ACCEPTED = 2, Q_REJECTED = 3, Q_APPROVED = 5, Q_DENIED = 6;

// CrmOrder Status: 0=Open, 1=Closed, 2=Canceled
const ORD_OPEN = 0, ORD_CLOSED = 1;

// Contract Status: 0=Draft, 1=Negotiation, 2=Active, 3=Archived, 4=Terminated
const CTR_ACTIVE = 2, CTR_DRAFT = 0;

// CalendarEvent Type: 1=Call, 2=Meeting, 3=Email, 4=Demo
// CalendarEvent Status: 1=Completed, 2=Pending, 3=Cancelled
const EVT_TYPES = [1, 2, 3, 4];
const EVT_STATUS_DONE = 1, EVT_STATUS_PENDING = 2;

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log('[seed-all] Starting deterministic seed (SEED=2026)…');

    const db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = OFF'); // temporarily off during bulk delete

    // Apply schema DDL
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    db.exec(schema);
    console.log('[seed-all] Schema applied.');

    // ── WIPE EXISTING DATA (reverse FK order) ─────────────────────────────────
    const tablesToWipe = [
        'ContractPaymentPlans', 'ContractLisances', 'Contract',
        'CrmOrderProducts', 'CrmOrder',
        'QuoteOrderDetails', 'QuoteDynamicFields', 'Quote',
        'CalenderEventParticipantContacts', 'CalenderEventParticipantLeads',
        'CalenderEventParticipantPeople', 'CalenderEventDaysForRepeatOnWeekly', 'CalenderEvent',
        'InventoryAccountProduct',
        'ProductGroups', 'OpportunityContacts', 'OpportunityNotes', 'Opportunity',
        'AccountNotes', 'AccountRepresentatives', 'AccountCompanies', 'Addresses', 'Account',
        'Companies', 'PersonFile', 'Education', 'Person',
        'StockUnitTypes', 'AdditionalTaxes', 'StockFiles', 'Companies_Stock', 'Stock',
        'CompanuPipelines', 'SalesPipelineStages', 'SalesPipeline',
        'CompanyCurrency', 'CompanyUserGroups', 'CompanyPipelines', 'Company',
    ];
    for (const tbl of tablesToWipe) {
        try { db.exec(`DELETE FROM "${tbl}"`); } catch { /* ignore if table missing */ }
    }
    console.log('[seed-all] Tables wiped.');

    db.pragma('foreign_keys = ON');

    const runTx = db.transaction(() => {

        // ══════════════════════════════════════════════════════════════════════
        // 1. COMPANY
        // ══════════════════════════════════════════════════════════════════════
        db.prepare(`INSERT INTO Company(Id,Name,OrderNo) VALUES(?,?,?)`).run(COMPANY_ID, 'Univera Yazılım', 1);
        db.prepare(`INSERT INTO CompanyCurrency(Id,CompanyId,CurrencyCode) VALUES(?,?,?)`).run('CCY-001', COMPANY_ID, 1); // 1=TRY

        // ══════════════════════════════════════════════════════════════════════
        // 2. SALES PIPELINE
        // ══════════════════════════════════════════════════════════════════════
        db.prepare(`INSERT INTO SalesPipeline(Id,Name,CompanyId,Status,IsDefault) VALUES(?,?,?,?,?)`)
            .run(PIPELINE_ID, 'Ana Pipeline', COMPANY_ID, 1, 1);

        const pipelineStages = [
            { id: 'PST-1', stageId: 'STG-1', stageName: 1 }, // Lead
            { id: 'PST-2', stageId: 'STG-2', stageName: 2 }, // Qualified
            { id: 'PST-3', stageId: 'STG-3', stageName: 3 }, // Proposal
            { id: 'PST-4', stageId: 'STG-4', stageName: 4 }, // Negotiation
            { id: 'PST-5', stageId: 'STG-5', stageName: 5 }, // Won
            { id: 'PST-6', stageId: 'STG-6', stageName: 6 }, // Lost
        ];
        const stmtPStage = db.prepare(`INSERT INTO SalesPipelineStages(Id,SalesPipelineId,PipelineStageId,PipelineStageName) VALUES(?,?,?,?)`);
        for (const s of pipelineStages) stmtPStage.run(s.id, PIPELINE_ID, s.stageId, s.stageName);

        // ══════════════════════════════════════════════════════════════════════
        // 3. PERSONS (8 sales reps)
        // ══════════════════════════════════════════════════════════════════════
        const persons: { id: string; name: string; surname: string }[] = [];
        const stmtPerson = db.prepare(`
            INSERT INTO Person(Id,Name,SurName,Title,Email,CompanyId,Status,PersonNameSurname)
            VALUES(?,?,?,?,?,?,?,?)`);
        for (let i = 0; i < 8; i++) {
            const p = PERSON_NAMES[i];
            const id = `prs-${String(i + 1).padStart(3, '0')}`;
            persons.push({ id, name: p.name, surname: p.surname });
            stmtPerson.run(id, p.name, p.surname, 'Satış Uzmanı',
                `${p.name.toLowerCase()}.${p.surname.toLowerCase()}@univera.com`,
                COMPANY_ID, 1, `${p.name} ${p.surname}`);
        }

        // ══════════════════════════════════════════════════════════════════════
        // 4. STOCK (7 products)
        // ══════════════════════════════════════════════════════════════════════
        const stmtStock = db.prepare(`
            INSERT INTO Stock(Id,Code,Name,ShortName,BaseUnitType,SalesVatValue,PurchaseVatValue,State,ProductGroupId,CompanyId)
            VALUES(?,?,?,?,?,?,?,?,?,?)`);
        for (const p of PRODUCTS) {
            stmtStock.run(p.id, p.code, p.name, p.shortName, 'Adet', 20, 20, 1, p.groupId, COMPANY_ID);
        }

        // ══════════════════════════════════════════════════════════════════════
        // 5. ACCOUNTS (30 customers)
        // ══════════════════════════════════════════════════════════════════════
        const accounts: { id: string; name: string; ownerId: string }[] = [];
        const stmtAccount = db.prepare(`
            INSERT INTO Account(Id,Name,OwnerId,DealerId,State,LastTouchDate)
            VALUES(?,?,?,?,?,?)`);
        for (let i = 0; i < ACCOUNT_NAMES.length; i++) {
            const id = `acc-${String(i + 1).padStart(3, '0')}`;
            const owner = persons[i % persons.length];
            accounts.push({ id, name: ACCOUNT_NAMES[i], ownerId: owner.id });
            stmtAccount.run(id, ACCOUNT_NAMES[i], owner.id, COMPANY_ID, 1,
                isoDate(addDays(TODAY, -rand(1, 30))));
        }

        // ══════════════════════════════════════════════════════════════════════
        // 6. OPPORTUNITIES
        // Target: ~250 opps, ~400M TL total Amount_Value
        // Win ratio: ~24% (60 won), Lost: ~10% (25 lost), Open: ~66% (165 open)
        // Daily spread: last 90 days
        // ══════════════════════════════════════════════════════════════════════
        const opportunities: {
            id: string; accountId: string; ownerId: string;
            amount: number; dealStatus: number; stageName: number; closeDate: Date;
            createdDate: Date; product: typeof PRODUCTS[number];
        }[] = [];

        const stmtOpp = db.prepare(`
            INSERT INTO Opportunity(
                Id,Name,AccountId,OwnerId,CompanyId,PipelineId,
                Amount_Value,ExpectedRevenue_Value,PotentialTurnover_Value,
                Probability,DealStatus,OpportunityStageName,OpportunityStageNameTr,
                CloseDate,FirstCreatedDate,_SyncedAt)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);

        // Daily spread across 90 days
        const TOTAL_OPPS = 250;
        for (let dayOffset = 89; dayOffset >= 0; dayOffset--) {
            const createdDate = addDays(TODAY, -dayOffset);
            const dayCount = rand(2, 4); // 2-4 opps per day
            for (let d = 0; d < dayCount && opportunities.length < TOTAL_OPPS; d++) {
                const id = `opp-${String(opportunities.length + 1).padStart(4, '0')}`;
                const account = pick(accounts);
                const person = pick(persons);
                const product = pick(PRODUCTS);
                // Amount: 500k to 8M TL
                const amount = rand(500_000, 8_000_000);
                // Assign stage based on creation date + probability
                const r = rng();
                let stage; let closeDate: Date;
                if (r < 0.24) {
                    stage = WON_STAGE;
                    closeDate = addDays(createdDate, rand(20, 60));
                } else if (r < 0.34) {
                    stage = LOST_STAGE;
                    closeDate = addDays(createdDate, rand(15, 45));
                } else {
                    stage = pick(OPEN_STAGES);
                    closeDate = addDays(TODAY, rand(10, 90));
                }

                opportunities.push({ id, accountId: account.id, ownerId: person.id, amount, dealStatus: stage.status, stageName: stage.stage, closeDate, createdDate, product });

                stmtOpp.run(
                    id,
                    `${account.name} - ${product.name} Fırsatı`,
                    account.id, person.id, COMPANY_ID, PIPELINE_ID,
                    amount, Math.round(amount * stage.prob / 100), amount * 1.1,
                    stage.prob, stage.status, stage.stage, stage.nameTr,
                    isoDate(closeDate), isoDate(createdDate), isoDateTime(new Date()),
                );
            }
        }
        console.log(`[seed-all] Opportunities: ${opportunities.length}`);

        // ══════════════════════════════════════════════════════════════════════
        // 7. QUOTES
        // Rule: ~72% of opps get a quote.
        // Won opps -> Won quote (Accepted/Approved)
        // Lost opps -> Rejected quote (50%) or nothing
        // Open opps -> Sent/Draft/Review quote
        // ══════════════════════════════════════════════════════════════════════
        const wonQuotes: { id: string; quoteId: string; accountId: string; ownerId: string; amount: number; product: typeof PRODUCTS[number]; createdDate: Date }[] = [];

        const stmtQuote = db.prepare(`
            INSERT INTO Quote(
                Id,Number,Name,OpportunityId,AccountId,ProposalOwnerId,CompanyId,
                Status,PaymentType,ExpirationDate,FirstCreatedDate,
                TotalNetAmountLocalCurrency_Amount,TotalNetAmountLocalCurrency_Currency,
                TotalAmountWithTaxLocalCurrency_Amount,TotalAmountWithTaxLocalCurrency_Currency,
                ServiceStartDate,ServiceFinishDate,_SyncedAt)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);

        let qIdx = 0;
        for (const opp of opportunities) {
            // Skip ~28% of opps (no quote)
            if (rng() < 0.28) continue;

            qIdx++;
            const qId = `qte-${String(qIdx).padStart(4, '0')}`;
            const qDate = addDays(opp.createdDate, rand(3, 14));
            const expDate = addDays(qDate, rand(30, 90));
            // Quote amount = 80-100% of opp amount (discount applied)
            const discountFactor = 0.80 + rng() * 0.20;
            const netAmount = Math.round(opp.amount * discountFactor);
            const vatAmount = Math.round(netAmount * 1.20);

            let status: number;
            if (opp.dealStatus === WON_STAGE.status) {
                status = rng() < 0.6 ? Q_ACCEPTED : Q_APPROVED;
            } else if (opp.dealStatus === LOST_STAGE.status) {
                status = rng() < 0.5 ? Q_REJECTED : Q_DENIED;
            } else {
                const r2 = rng();
                if (r2 < 0.35) status = Q_SENT;
                else if (r2 < 0.60) status = Q_DRAFT;
                else status = 4; // Review
            }

            const svcStart = isoDate(qDate);
            const svcEnd = isoDate(addDays(qDate, 365));

            stmtQuote.run(
                qId, `TKL-${String(qIdx).padStart(5, '0')}`,
                `${opp.accountId.replace('acc-', 'Müşteri ')} - ${opp.product.name} Teklifi`,
                opp.id, opp.accountId, opp.ownerId, COMPANY_ID,
                status, 1, isoDate(expDate), isoDate(qDate),
                netAmount, 'TRY', vatAmount, 'TRY',
                svcStart, svcEnd, isoDateTime(new Date()),
            );

            if (status === Q_ACCEPTED || status === Q_APPROVED) {
                wonQuotes.push({ id: `ord-from-${qId}`, quoteId: qId, accountId: opp.accountId, ownerId: opp.ownerId, amount: vatAmount, product: opp.product, createdDate: qDate });
            }
        }
        console.log(`[seed-all] Quotes: ${qIdx}, Won: ${wonQuotes.length}`);

        // ══════════════════════════════════════════════════════════════════════
        // 8. CrmOrder (from won quotes — ~95% conversion)
        // ══════════════════════════════════════════════════════════════════════
        const orders: { id: string; quoteId: string; accountId: string; ownerId: string; amount: number; product: typeof PRODUCTS[number]; orderDate: Date; invoiced: boolean }[] = [];

        const stmtOrder = db.prepare(`
            INSERT INTO CrmOrder(
                Id,QuoteId,AccountId,ProposalOwnerId,CompanyId,
                Status,CreateOrderDate,DeliveryDate,InvoiceDate,PlannedInvoiceDate,
                TotalNetAmountLocalCurrency_Amount,TotalNetAmountLocalCurrency_Currency,
                TotalAmountWithTaxLocalCurrency_Amount,TotalAmountWithTaxLocalCurrency_Currency,
                Name,_SyncedAt)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);

        for (const wq of wonQuotes) {
            if (rng() < 0.05) continue; // 5% won't become orders
            const ordId = wq.id;
            const orderDate = addDays(wq.createdDate, rand(1, 7));
            const deliveryDate = addDays(orderDate, rand(7, 30));
            const isInvoiced = rng() < 0.80; // 80% are invoiced
            const invoiceDate = isInvoiced ? isoDate(addDays(orderDate, rand(1, 14))) : null;
            const isClosed = isInvoiced && rng() < 0.9;
            const status = isClosed ? ORD_CLOSED : ORD_OPEN;

            orders.push({ id: ordId, quoteId: wq.quoteId, accountId: wq.accountId, ownerId: wq.ownerId, amount: wq.amount, product: wq.product, orderDate, invoiced: isInvoiced });

            stmtOrder.run(
                ordId, wq.quoteId, wq.accountId, wq.ownerId, COMPANY_ID,
                status, isoDate(orderDate), isoDate(deliveryDate),
                invoiceDate, isoDate(deliveryDate),
                Math.round(wq.amount / 1.20), 'TRY', wq.amount, 'TRY',
                `Sipariş - ${wq.accountId}`, isoDateTime(new Date()),
            );

            // CrmOrderProducts (1 line per order)
            const prodId = `cop-${ordId}`;
            db.prepare(`
                INSERT INTO CrmOrderProducts(
                    Id,CrmOrderId,StockId,Quantity,TransactionDate,Tax,StockUnitTypeIdentifier,
                    UnitPrice_Amount,UnitPrice_Currency,
                    Total_Amount,Total_Currency,
                    NetLineTotalWithTaxLocalCurrency_Amount,NetLineTotalWithTaxLocalCurrency_Currency,
                    _SyncedAt)
                VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
                prodId, ordId, wq.product.id, 1,
                isoDate(orderDate), 20, 'Adet',
                Math.round(wq.amount / 1.20), 'TRY',
                Math.round(wq.amount / 1.20), 'TRY',
                wq.amount, 'TRY',
                isoDateTime(new Date()),
            );
        }
        console.log(`[seed-all] Orders: ${orders.length}`);

        // ══════════════════════════════════════════════════════════════════════
        // 9. Contracts (from invoiced closed orders — ~90%)
        // ══════════════════════════════════════════════════════════════════════
        const stmtContract = db.prepare(`
            INSERT INTO Contract(
                Id,ContractNo,ContractName,AccountId,SalesRepresentativeId,CompanyId,
                ContractType,ContractStatus,StartDate,FinishDate,RenewalDate,SigningDate,
                TotalAmount_Amount,TotalAmount_Currency,
                TotalAmountLocalCurrency_Amount,TotalAmountLocalCurrency_Currency,
                IsAutoExtending,_SyncedAt)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);

        const stmtPayPlan = db.prepare(`
            INSERT INTO ContractPaymentPlans(Id,ContractId,Price_Amount,Price_Currency,TotalRate,HasBeenCollected,PaymentDate,Name)
            VALUES(?,?,?,?,?,?,?,?)`);

        let ctrIdx = 0;
        for (const ord of orders) {
            if (!ord.invoiced) continue;
            if (rng() < 0.10) continue; // 10% won't have contract yet

            ctrIdx++;
            const ctrId = `ctr-${String(ctrIdx).padStart(4, '0')}`;
            const startDate = addDays(ord.orderDate, rand(3, 10));
            const finishDate = addDays(startDate, 365);
            const renewalDate = addDays(finishDate, -30);
            const signingDate = addDays(startDate, -rand(1, 5));
            const isActive = rng() < 0.85;
            const status = isActive ? CTR_ACTIVE : CTR_DRAFT;
            const contractAmount = Math.round(ord.amount * (0.90 + rng() * 0.10)); // ~same as order

            stmtContract.run(
                ctrId,
                `CTR-${String(ctrIdx).padStart(5, '0')}`,
                `${ord.accountId.replace('acc-', 'Müşteri ')} Sözleşmesi`,
                ord.accountId, ord.ownerId, COMPANY_ID,
                1, // 1=Initialization
                status,
                isoDate(startDate), isoDate(finishDate), isoDate(renewalDate), isoDate(signingDate),
                contractAmount, 'TRY', contractAmount, 'TRY',
                1, isoDateTime(new Date()),
            );

            // Payment plan: 4 quarterly installments
            const installAmount = Math.round(contractAmount / 4);
            for (let q = 0; q < 4; q++) {
                const payDate = addDays(startDate, q * 90);
                const collected = payDate <= TODAY ? 1 : 0;
                stmtPayPlan.run(
                    `pp-${ctrId}-${q}`, ctrId, installAmount, 'TRY',
                    25, collected, isoDate(payDate), `${q + 1}. Taksit`,
                );
            }

            // InventoryAccountProduct (the licensed product line)
            db.prepare(`
                INSERT INTO InventoryAccountProduct(
                    Id,AccountId,StockId,Status,InvPurchaseDate,StartDate,FinishDate,
                    Price_Amount,Price_Currency,Vat_Amount,Vat_Currency,
                    TotalListPrice_Amount,TotalListPrice_Currency,_SyncedAt)
                VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
                `inv-${ctrId}`, ord.accountId, ord.product.id,
                1, isoDate(startDate), isoDate(startDate), isoDate(finishDate),
                Math.round(contractAmount / 1.20), 'TRY',
                Math.round(contractAmount * 0.20 / 1.20), 'TRY',
                contractAmount, 'TRY',
                isoDateTime(new Date()),
            );
        }
        console.log(`[seed-all] Contracts: ${ctrIdx}`);

        // ══════════════════════════════════════════════════════════════════════
        // 10. CalendarEvents (activities)
        // ~1-3 events per opportunity, spread over opp lifetime
        // ══════════════════════════════════════════════════════════════════════
        const stmtEvent = db.prepare(`
            INSERT INTO CalenderEvent(
                Id,OwnerId,Subject,Type,Status,StartDate,FinishDate,
                AccountId,CompanyId,IsAllDay,IsRepeat,_SyncedAt)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`);

        const EVT_SUBJECTS: Record<number, string[]> = {
            1: ['Müşteri Görüşmesi', 'Tanıtım Araması', 'Takip Görüşmesi'],
            2: ['Keşif Toplantısı', 'Demo Sunumu', 'Strateji Toplantısı'],
            3: ['Teklif Gönderildi', 'Bilgi Talebi Yanıtı', 'Takip E-postası'],
            4: ['Ürün Demosu', 'Pilot Demo', 'Teknik Demo'],
        };

        let evtIdx = 0;
        for (const opp of opportunities) {
            const evtCount = rand(1, 3);
            for (let e = 0; e < evtCount; e++) {
                evtIdx++;
                const evtId = `evt-${String(evtIdx).padStart(5, '0')}`;
                const type = pick(EVT_TYPES);
                const evtDate = addDays(opp.createdDate, rand(0, 30)); // within 30d of opp creation
                const isPast = evtDate <= TODAY;
                const status = isPast ? EVT_STATUS_DONE : EVT_STATUS_PENDING;
                const subject = pick(EVT_SUBJECTS[type] || ['Görüşme']);
                const finishDate = addDays(evtDate, 0);
                finishDate.setHours(evtDate.getHours() + 1);

                stmtEvent.run(
                    evtId, opp.ownerId, subject, type, status,
                    isoDateTime(evtDate), isoDateTime(finishDate),
                    opp.accountId, COMPANY_ID, 0, 0, isoDateTime(new Date()),
                );
            }
        }
        console.log(`[seed-all] CalendarEvents: ${evtIdx}`);
    });

    try {
        runTx();
        console.log('[seed-all] ✅ Seed complete!');

        // ─── Verification summary ─────────────────────────────────────────────
        const checks = [
            { label: 'Company', sql: 'SELECT COUNT(*) as n FROM Company' },
            { label: 'Person', sql: 'SELECT COUNT(*) as n FROM Person' },
            { label: 'Account', sql: 'SELECT COUNT(*) as n FROM Account' },
            { label: 'Opportunity', sql: 'SELECT COUNT(*) as n FROM Opportunity' },
            { label: 'Quote', sql: 'SELECT COUNT(*) as n FROM Quote' },
            { label: 'CrmOrder', sql: 'SELECT COUNT(*) as n FROM CrmOrder' },
            { label: 'Contract', sql: 'SELECT COUNT(*) as n FROM Contract' },
            { label: 'CalenderEvent', sql: 'SELECT COUNT(*) as n FROM CalenderEvent' },
            { label: 'InventoryAccountProduct', sql: 'SELECT COUNT(*) as n FROM InventoryAccountProduct' },
            { label: 'Opp Total Amount (M TL)', sql: 'SELECT ROUND(SUM(Amount_Value)/1000000.0,1) as n FROM Opportunity' },
            { label: 'Quote Sent+ Net Amount (M TL)', sql: `SELECT ROUND(SUM(TotalNetAmountLocalCurrency_Amount)/1000000.0,1) as n FROM Quote WHERE Status != 0` },
            { label: 'Won Quote Amount (M TL)', sql: `SELECT ROUND(SUM(TotalAmountWithTaxLocalCurrency_Amount)/1000000.0,1) as n FROM Quote WHERE Status IN (2,5)` },
            { label: 'Order Total VAT Amount (M TL)', sql: `SELECT ROUND(SUM(TotalAmountWithTaxLocalCurrency_Amount)/1000000.0,1) as n FROM CrmOrder` },
            { label: 'Contract Total Amount (M TL)', sql: `SELECT ROUND(SUM(TotalAmountLocalCurrency_Amount)/1000000.0,1) as n FROM Contract WHERE ContractStatus = 2` },
        ];
        console.log('\n──── Seed Verification ────');
        for (const c of checks) {
            const row = db.prepare(c.sql).get({}) as { n: number };
            console.log(`  ${c.label.padEnd(35)} ${row?.n ?? 0}`);
        }
    } catch (err) {
        console.error('[seed-all] ❌ Error:', err);
        process.exit(1);
    } finally {
        db.close();
    }
}

main();
