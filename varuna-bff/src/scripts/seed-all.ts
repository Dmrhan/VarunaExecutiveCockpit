/**
 * seed-all.ts – v2
 * Deterministik seed (SEED=2026). Her çalıştırmada aynı sonuç.
 * Düzeltmeler:
 *  - Tüm ürünler fırsatlara dağıtılır (EnRoute / Quest / Stokbar / Varuna / ServiceCore / Hosting / Unidox)
 *  - Fırsat aşamaları gerçekçi dağılımda (Lead → Kazanıldı / Kaybedildi)
 *  - Tahmini kapanış tarihleri önümüzdeki 7 aya yayılır
 *  - Tekliflerin tüm statüsleri kullanılır (10 farklı durum)
 *  - Siparişlerde müşteri adı + sipariş adı + tüm ürünler mevcut
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
function pickWeighted<T>(arr: T[], weights: number[]): T {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = rng() * total;
    for (let i = 0; i < arr.length; i++) { r -= weights[i]; if (r <= 0) return arr[i]; }
    return arr[arr.length - 1];
}

function addDays(base: Date, days: number): Date {
    const d = new Date(base); d.setDate(d.getDate() + days); return d;
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

// 7 ürün — görsel isimleriyle
const PRODUCTS = [
    { id: 'STK-ENROUTE', code: 'ENR', name: 'EnRoute', shortName: 'ENR', groupId: 'PG-ENR' },
    { id: 'STK-QUEST', code: 'QST', name: 'Quest', shortName: 'QST', groupId: 'PG-QST' },
    { id: 'STK-STOKBAR', code: 'STB', name: 'Stokbar', shortName: 'STB', groupId: 'PG-STB' },
    { id: 'STK-SVCCORE', code: 'SVC', name: 'ServiceCore', shortName: 'SVC', groupId: 'PG-SVC' },
    { id: 'STK-VARUNA', code: 'VRN', name: 'Varuna', shortName: 'VRN', groupId: 'PG-VRN' },
    { id: 'STK-HOSTING', code: 'HST', name: 'Hosting', shortName: 'HST', groupId: 'PG-HST' },
    { id: 'STK-UNIDOX', code: 'UDX', name: 'Unidox', shortName: 'UDX', groupId: 'PG-UDX' },
];
// Ürün ağırlıkları: EnRoute en büyük payda, Unidox en küçük
const PRODUCT_WEIGHTS = [30, 20, 15, 12, 10, 8, 5];

// ─── Opportunity Stage Config ─────────────────────────────────────────────────
// DealStatus: 0=Open, 2=Won, 3=Lost
// OpportunityStageName (integer): 1=Lead, 2=Qualified, 3=Proposal, 4=Negotiation, 5=Won, 6=Lost
interface StageConfig { status: number; stage: number; nameTr: string; prob: number; }
const OPEN_STAGES: StageConfig[] = [
    { status: 0, stage: 1, nameTr: 'Lead', prob: 20 },
    { status: 0, stage: 2, nameTr: 'Nitelikli', prob: 40 },
    { status: 0, stage: 3, nameTr: 'Teklif', prob: 60 },
    { status: 0, stage: 4, nameTr: 'Müzakere', prob: 75 },
];
// Açık fırsatları aşamalara dağıtacak ağırlıklar (sırası: Lead, Qualified, Proposal, Negotiation)
const OPEN_STAGE_WEIGHTS = [25, 30, 30, 15]; // daha gerçekçi huni

const WON_STAGE: StageConfig = { status: 2, stage: 5, nameTr: 'Kazanıldı', prob: 100 };
const LOST_STAGE: StageConfig = { status: 3, stage: 6, nameTr: 'Kaybedildi', prob: 0 };

// ─── Quote Status Config ──────────────────────────────────────────────────────
// Türkçe isimleri:
//  0  = Taslak
//  1  = Değerlendirme Gerekiyor
//  2  = Değerlendirmeye Alındı
//  3  = Onaylandı
//  4  = Reddedildi
//  5  = Gönderildi (Aktif)
//  6  = Kabul Edildi
//  7  = İptal Edildi
//  8  = Kaybedildi
//  9  = Kısmen Siparişleşti
const Q = { DRAFT: 0, NEEDS_REVIEW: 1, IN_REVIEW: 2, APPROVED: 3, REJECTED: 4, SENT: 5, ACCEPTED: 6, CANCELLED: 7, LOST: 8, PARTIAL: 9 };
const Q_NAMES: Record<number, string> = {
    0: 'Taslak', 1: 'Değerlendirme Gerekiyor', 2: 'Değerlendirmeye Alındı',
    3: 'Onaylandı', 4: 'Reddedildi', 5: 'Gönderildi (Aktif)',
    6: 'Kabul Edildi', 7: 'İptal Edildi', 8: 'Kaybedildi', 9: 'Kısmen Siparişleşti',
};
// Won quotes for order creation: Accepted + Approved + Partial
const WON_Q_STATUSES = [Q.ACCEPTED, Q.APPROVED, Q.PARTIAL];

// CrmOrder Status: 0=Open, 1=Closed
const ORD_OPEN = 0, ORD_CLOSED = 1;

// Contract Status: 2=Active
const CTR_ACTIVE = 2;

// CalendarEvent Type+Status
const EVT_TYPES = [1, 2, 3, 4];
const EVT_STATUS_DONE = 1, EVT_STATUS_PENDING = 2;
const EVT_SUBJECTS: Record<number, string[]> = {
    1: ['Müşteri Görüşmesi', 'Tanıtım Araması', 'Takip Görüşmesi'],
    2: ['Keşif Toplantısı', 'Demo Sunumu', 'Strateji Toplantısı'],
    3: ['Teklif Gönderildi', 'Bilgi Talebi Yanıtı', 'Takip E-postası'],
    4: ['Ürün Demosu', 'Pilot Demo', 'Teknik Demo'],
};

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log('[seed-all v2] SEED=2026 başlatıldı…');

    const db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = OFF');

    const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    db.exec(schema);

    // ── Wipe ─────────────────────────────────────────────────────────────────
    for (const tbl of [
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
        'SalesPipelineStages', 'SalesPipeline',
        'CompanyCurrency', 'CompanyUserGroups', 'CompanyPipelines', 'Company',
    ]) { try { db.exec(`DELETE FROM "${tbl}"`); } catch { } }

    db.pragma('foreign_keys = ON');

    const runTx = db.transaction(() => {

        // ──────────────────────────────────────────────────────────────────────
        // 1. COMPANY + CURRENCY
        // ──────────────────────────────────────────────────────────────────────
        db.prepare(`INSERT INTO Company(Id,Name,OrderNo) VALUES(?,?,?)`).run(COMPANY_ID, 'Univera Yazılım', 1);
        db.prepare(`INSERT INTO CompanyCurrency(Id,CompanyId,CurrencyCode) VALUES(?,?,?)`).run('CCY-001', COMPANY_ID, 1);

        // ──────────────────────────────────────────────────────────────────────
        // 2. SALES PIPELINE
        // ──────────────────────────────────────────────────────────────────────
        db.prepare(`INSERT INTO SalesPipeline(Id,Name,CompanyId,Status,IsDefault) VALUES(?,?,?,?,?)`)
            .run(PIPELINE_ID, 'Ana Pipeline', COMPANY_ID, 1, 1);
        const stmtPStage = db.prepare(`INSERT INTO SalesPipelineStages(Id,SalesPipelineId,PipelineStageId,PipelineStageName) VALUES(?,?,?,?)`);
        [{ id: 'PST-1', stageId: 'STG-1', sn: 1 }, { id: 'PST-2', stageId: 'STG-2', sn: 2 }, { id: 'PST-3', stageId: 'STG-3', sn: 3 },
        { id: 'PST-4', stageId: 'STG-4', sn: 4 }, { id: 'PST-5', stageId: 'STG-5', sn: 5 }, { id: 'PST-6', stageId: 'STG-6', sn: 6 }]
            .forEach(s => stmtPStage.run(s.id, PIPELINE_ID, s.stageId, s.sn));

        // ──────────────────────────────────────────────────────────────────────
        // 3. PERSONS (8 satış temsilcisi)
        // ──────────────────────────────────────────────────────────────────────
        const persons: { id: string; name: string; surname: string }[] = [];
        const stmtPerson = db.prepare(`INSERT INTO Person(Id,Name,SurName,Title,Email,CompanyId,Status,PersonNameSurname) VALUES(?,?,?,?,?,?,?,?)`);
        for (let i = 0; i < 8; i++) {
            const p = PERSON_NAMES[i];
            const id = `prs-${String(i + 1).padStart(3, '0')}`;
            persons.push({ id, name: p.name, surname: p.surname });
            stmtPerson.run(id, p.name, p.surname, 'Satış Uzmanı',
                `${p.name.toLowerCase()}.${p.surname.toLowerCase()}@univera.com`,
                COMPANY_ID, 1, `${p.name} ${p.surname}`);
        }

        // ──────────────────────────────────────────────────────────────────────
        // 4. STOCK (7 ürün)
        // ──────────────────────────────────────────────────────────────────────
        const stmtStock = db.prepare(`INSERT INTO Stock(Id,Code,Name,ShortName,BaseUnitType,SalesVatValue,PurchaseVatValue,State,ProductGroupId,CompanyId) VALUES(?,?,?,?,?,?,?,?,?,?)`);
        for (const p of PRODUCTS) {
            stmtStock.run(p.id, p.code, p.name, p.shortName, 'Adet', 20, 20, 1, p.groupId, COMPANY_ID);
        }

        // ──────────────────────────────────────────────────────────────────────
        // 5. ACCOUNTS (30 müşteri)
        // ──────────────────────────────────────────────────────────────────────
        const accounts: { id: string; name: string; ownerId: string }[] = [];
        const stmtAccount = db.prepare(`INSERT INTO Account(Id,Name,OwnerId,DealerId,State,LastTouchDate) VALUES(?,?,?,?,?,?)`);
        for (let i = 0; i < ACCOUNT_NAMES.length; i++) {
            const id = `acc-${String(i + 1).padStart(3, '0')}`;
            const owner = persons[i % persons.length];
            accounts.push({ id, name: ACCOUNT_NAMES[i], ownerId: owner.id });
            stmtAccount.run(id, ACCOUNT_NAMES[i], owner.id, COMPANY_ID, 1,
                isoDate(addDays(TODAY, -rand(1, 30))));
        }

        // ──────────────────────────────────────────────────────────────────────
        // 6. OPPORTUNITIES
        //    - Ürünler ağırlıklı random
        //    - Aşamalar gerçekçi dağılım
        //    - Kapanış tarihleri: geçmiş (won/lost) + önümüzdeki 7 ay (open)
        //    - 90 günlük günlük dağılım (2-4 adet/gün) = ~250 kayıt
        // ──────────────────────────────────────────────────────────────────────
        interface OppRecord {
            id: string; accountId: string; accountName: string;
            ownerId: string; ownerName: string;
            amount: number; dealStatus: number; stage: StageConfig;
            closeDate: Date; createdDate: Date;
            product: typeof PRODUCTS[number];
        }
        const opportunities: OppRecord[] = [];

        const stmtOpp = db.prepare(`
            INSERT INTO Opportunity(
                Id,Name,AccountId,OwnerId,CompanyId,PipelineId,ProductGroupId,
                Amount_Value,ExpectedRevenue_Value,PotentialTurnover_Value,
                Probability,DealStatus,OpportunityStageName,OpportunityStageNameTr,
                CloseDate,FirstCreatedDate,_SyncedAt)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);

        const TOTAL_OPPS = 250;
        for (let dayOffset = 89; dayOffset >= 0 && opportunities.length < TOTAL_OPPS; dayOffset--) {
            const createdDate = addDays(TODAY, -dayOffset);
            const dayCount = rand(2, 4);
            for (let d = 0; d < dayCount && opportunities.length < TOTAL_OPPS; d++) {
                const id = `opp-${String(opportunities.length + 1).padStart(4, '0')}`;
                const account = pick(accounts);
                const person = pick(persons);
                const product = pickWeighted(PRODUCTS, PRODUCT_WEIGHTS);
                const amount = rand(800_000, 9_000_000);

                // Aşama dağılımı: %24 Won, %11 Lost, %65 Open
                const r = rng();
                let stage: StageConfig;
                let closeDate: Date;
                if (r < 0.24) {
                    stage = WON_STAGE;
                    closeDate = addDays(createdDate, rand(20, 60));
                } else if (r < 0.35) {
                    stage = LOST_STAGE;
                    closeDate = addDays(createdDate, rand(15, 45));
                } else {
                    // Open — aşamayı ağırlıklı dağıt
                    stage = pickWeighted(OPEN_STAGES, OPEN_STAGE_WEIGHTS);
                    // Kapanış: önümüzdeki 1–7 ay
                    closeDate = addDays(TODAY, rand(15, 210));
                }

                opportunities.push({
                    id, accountId: account.id, accountName: account.name,
                    ownerId: person.id, ownerName: `${person.name} ${person.surname}`,
                    amount, dealStatus: stage.status, stage, closeDate, createdDate, product,
                });

                stmtOpp.run(
                    id,
                    `${account.name} – ${product.name} Fırsatı`,
                    account.id, person.id, COMPANY_ID, PIPELINE_ID, product.groupId,
                    amount,
                    Math.round(amount * stage.prob / 100),
                    Math.round(amount * 1.1),
                    stage.prob, stage.status, stage.stage, stage.nameTr,
                    isoDate(closeDate), isoDate(createdDate), isoDateTime(new Date()),
                );
            }
        }
        console.log(`[seed] Opportunities: ${opportunities.length}`);

        // ──────────────────────────────────────────────────────────────────────
        // 7. QUOTES
        //    Her teklif bir Opportunity'ye bağlı (%72 oranında üretilir)
        //    Statüler 10 farklı duruma dağıtılır
        //    Won Opp → Kabul Edildi / Onaylandı / Kısmen Siparişleşti
        //    Lost Opp → Kaybedildi / Reddedildi / İptal Edildi
        //    Open Opp → Taslak / Değerlendirme Gerekiyor / Değerlendirmeye Alındı / Gönderildi
        // ──────────────────────────────────────────────────────────────────────
        interface QuoteRecord {
            id: string; quoteId: string; accountId: string; accountName: string;
            ownerId: string; ownerName: string; amount: number;
            product: typeof PRODUCTS[number]; createdDate: Date; status: number;
        }
        const wonQuotes: QuoteRecord[] = [];

        const stmtQuote = db.prepare(`
            INSERT INTO Quote(
                Id,Number,Name,OpportunityId,AccountId,ProposalOwnerId,CompanyId,
                Status,PaymentType,ExpirationDate,FirstCreatedDate,
                TotalNetAmountLocalCurrency_Amount,TotalNetAmountLocalCurrency_Currency,
                TotalAmountWithTaxLocalCurrency_Amount,TotalAmountWithTaxLocalCurrency_Currency,
                ServiceStartDate,ServiceFinishDate,RevNo,_SyncedAt)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);

        let qIdx = 0;
        for (const opp of opportunities) {
            if (rng() < 0.28) continue; // %28 fırsatta teklif yok

            qIdx++;
            const qId = `qte-${String(qIdx).padStart(4, '0')}`;
            const qDate = addDays(opp.createdDate, rand(3, 14));
            const expDate = addDays(qDate, rand(30, 90));
            const discount = 0.80 + rng() * 0.20;
            const netAmount = Math.round(opp.amount * discount);
            const vatAmount = Math.round(netAmount * 1.20);

            // Durum seçimi
            let status: number;
            if (opp.dealStatus === WON_STAGE.status) {
                // Won opp → ağırlıklı Kabul Edildi / Onaylandı / Kısmen Siparişleşti
                status = pickWeighted([Q.ACCEPTED, Q.APPROVED, Q.PARTIAL], [50, 30, 20]);
            } else if (opp.dealStatus === LOST_STAGE.status) {
                // Lost opp → Kaybedildi / Reddedildi / İptal Edildi
                status = pickWeighted([Q.LOST, Q.REJECTED, Q.CANCELLED], [50, 30, 20]);
            } else {
                // Open opp → açık teklif durumları
                status = pickWeighted(
                    [Q.DRAFT, Q.NEEDS_REVIEW, Q.IN_REVIEW, Q.SENT],
                    [20, 20, 25, 35]
                );
            }

            stmtQuote.run(
                qId, `TKL-${String(qIdx).padStart(5, '0')}`,
                `${opp.accountName} – ${opp.product.name} Teklifi`,
                opp.id, opp.accountId, opp.ownerId, COMPANY_ID,
                status, 1, isoDate(expDate), isoDate(qDate),
                netAmount, 'TRY', vatAmount, 'TRY',
                isoDate(qDate), isoDate(addDays(qDate, 365)), rand(0, 2),
                isoDateTime(new Date()),
            );

            if (WON_Q_STATUSES.includes(status)) {
                wonQuotes.push({
                    id: `ord-from-${qId}`, quoteId: qId,
                    accountId: opp.accountId, accountName: opp.accountName,
                    ownerId: opp.ownerId, ownerName: opp.ownerName,
                    amount: vatAmount, product: opp.product,
                    createdDate: qDate, status,
                });
            }
        }
        console.log(`[seed] Quotes: ${qIdx}, Won: ${wonQuotes.length}`);

        // ──────────────────────────────────────────────────────────────────────
        // 8. CrmORDER + CrmOrderProducts
        //    - Müşteri adı + sipariş adı her satırda
        //    - Her siparişte ana ürün + 1-2 ek ürün (tüm ürünler görünür)
        //    - %5 won quote → sipariş oluşmaz
        // ──────────────────────────────────────────────────────────────────────
        interface OrderRecord {
            id: string; accountId: string; accountName: string; ownerId: string;
            amount: number; product: typeof PRODUCTS[number]; orderDate: Date; invoiced: boolean;
        }
        const orders: OrderRecord[] = [];

        const stmtOrder = db.prepare(`
            INSERT INTO CrmOrder(
                Id,QuoteId,AccountId,ProposalOwnerId,CompanyId,
                Status,CreateOrderDate,DeliveryDate,InvoiceDate,PlannedInvoiceDate,
                TotalNetAmountLocalCurrency_Amount,TotalNetAmountLocalCurrency_Currency,
                TotalAmountWithTaxLocalCurrency_Amount,TotalAmountWithTaxLocalCurrency_Currency,
                Name,_SyncedAt)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);

        const stmtOrderProd = db.prepare(`
            INSERT INTO CrmOrderProducts(
                Id,CrmOrderId,StockId,Quantity,TransactionDate,Tax,StockUnitTypeIdentifier,
                UnitPrice_Amount,UnitPrice_Currency,
                Total_Amount,Total_Currency,
                NetLineTotalWithTaxLocalCurrency_Amount,NetLineTotalWithTaxLocalCurrency_Currency,
                Description,_SyncedAt)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);

        for (const wq of wonQuotes) {
            if (rng() < 0.05) continue; // %5 sipariş oluşmaz

            const ordId = wq.id;
            const orderDate = addDays(wq.createdDate, rand(1, 7));
            const delivDate = addDays(orderDate, rand(7, 30));
            const isInvoiced = rng() < 0.80;
            const invoiceDate = isInvoiced ? isoDate(addDays(orderDate, rand(1, 14))) : null;
            const isClosed = isInvoiced && rng() < 0.85;

            orders.push({
                id: ordId, accountId: wq.accountId, accountName: wq.accountName,
                ownerId: wq.ownerId, amount: wq.amount, product: wq.product,
                orderDate, invoiced: isInvoiced,
            });

            stmtOrder.run(
                ordId, wq.quoteId, wq.accountId, wq.ownerId, COMPANY_ID,
                isClosed ? ORD_CLOSED : ORD_OPEN,
                isoDate(orderDate), isoDate(delivDate),
                invoiceDate, isoDate(delivDate),
                Math.round(wq.amount / 1.20), 'TRY', wq.amount, 'TRY',
                `${wq.accountName} – ${wq.product.name} Siparişi`,
                isoDateTime(new Date()),
            );

            // Ana ürün satırı
            const unitPrice = Math.round(wq.amount / 1.20 / 2);
            stmtOrderProd.run(
                `cop-${ordId}-0`, ordId, wq.product.id, 1,
                isoDate(orderDate), 20, 'Adet',
                unitPrice, 'TRY', unitPrice, 'TRY', Math.round(unitPrice * 1.20), 'TRY',
                wq.product.name, isoDateTime(new Date()),
            );

            // Ek ürün satırları (1-2 farklı ürün, tüm ürünler havuza girer)
            const extraCount = rand(1, 2);
            const usedProductIds = new Set([wq.product.id]);
            for (let e = 0; e < extraCount; e++) {
                const otherProduct = PRODUCTS.filter(p => !usedProductIds.has(p.id));
                if (!otherProduct.length) break;
                const extraProd = pick(otherProduct);
                usedProductIds.add(extraProd.id);
                const extraPrice = Math.round(wq.amount / 1.20 / 2 * (0.15 + rng() * 0.35));
                stmtOrderProd.run(
                    `cop-${ordId}-${e + 1}`, ordId, extraProd.id, 1,
                    isoDate(orderDate), 20, 'Adet',
                    extraPrice, 'TRY', extraPrice, 'TRY', Math.round(extraPrice * 1.20), 'TRY',
                    extraProd.name, isoDateTime(new Date()),
                );
            }
        }
        console.log(`[seed] Orders: ${orders.length}`);

        // ──────────────────────────────────────────────────────────────────────
        // 9. CONTRACT + PAYMENT PLANS + INVENTORY
        // ──────────────────────────────────────────────────────────────────────
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
            if (!ord.invoiced || rng() < 0.10) continue;

            ctrIdx++;
            const ctrId = `ctr-${String(ctrIdx).padStart(4, '0')}`;
            const startDate = addDays(ord.orderDate, rand(3, 10));
            const finishDate = addDays(startDate, 365);
            const renewalDate = addDays(finishDate, -30);
            const signingDate = addDays(startDate, -rand(1, 5));
            const isActive = rng() < 0.85;
            const contractAmt = Math.round(ord.amount * (0.90 + rng() * 0.10));

            stmtContract.run(
                ctrId, `CTR-${String(ctrIdx).padStart(5, '0')}`,
                `${ord.accountName} – Hizmet Sözleşmesi`,
                ord.accountId, ord.ownerId, COMPANY_ID,
                1, isActive ? CTR_ACTIVE : 0,
                isoDate(startDate), isoDate(finishDate), isoDate(renewalDate), isoDate(signingDate),
                contractAmt, 'TRY', contractAmt, 'TRY',
                1, isoDateTime(new Date()),
            );

            const installAmt = Math.round(contractAmt / 4);
            for (let q = 0; q < 4; q++) {
                const payDate = addDays(startDate, q * 90);
                stmtPayPlan.run(
                    `pp-${ctrId}-${q}`, ctrId, installAmt, 'TRY',
                    25, payDate <= TODAY ? 1 : 0, isoDate(payDate), `${q + 1}. Taksit`,
                );
            }

            db.prepare(`
                INSERT INTO InventoryAccountProduct(
                    Id,AccountId,StockId,Status,InvPurchaseDate,StartDate,FinishDate,
                    Price_Amount,Price_Currency,Vat_Amount,Vat_Currency,
                    TotalListPrice_Amount,TotalListPrice_Currency,_SyncedAt)
                VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
                `inv-${ctrId}`, ord.accountId, ord.product.id,
                1, isoDate(startDate), isoDate(startDate), isoDate(finishDate),
                Math.round(contractAmt / 1.20), 'TRY',
                Math.round(contractAmt * 0.20 / 1.20), 'TRY',
                contractAmt, 'TRY',
                isoDateTime(new Date()),
            );
        }
        console.log(`[seed] Contracts: ${ctrIdx}`);

        // ──────────────────────────────────────────────────────────────────────
        // 10. CalendarEvents
        // ──────────────────────────────────────────────────────────────────────
        const stmtEvent = db.prepare(`
            INSERT INTO CalenderEvent(Id,OwnerId,Subject,Type,Status,StartDate,FinishDate,AccountId,CompanyId,IsAllDay,IsRepeat,_SyncedAt)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`);

        let evtIdx = 0;
        for (const opp of opportunities) {
            const evtCount = rand(1, 3);
            for (let e = 0; e < evtCount; e++) {
                evtIdx++;
                const evtId = `evt-${String(evtIdx).padStart(5, '0')}`;
                const type = pick(EVT_TYPES);
                const evtDate = addDays(opp.createdDate, rand(0, 30));
                const isPast = evtDate <= TODAY;
                const finEnd = new Date(evtDate); finEnd.setHours(evtDate.getHours() + 1);
                stmtEvent.run(
                    evtId, opp.ownerId, pick(EVT_SUBJECTS[type] || ['Görüşme']),
                    type, isPast ? EVT_STATUS_DONE : EVT_STATUS_PENDING,
                    isoDateTime(evtDate), isoDateTime(finEnd),
                    opp.accountId, COMPANY_ID, 0, 0, isoDateTime(new Date()),
                );
            }
        }
        console.log(`[seed] CalendarEvents: ${evtIdx}`);
    });

    try {
        runTx();
        console.log('\n[seed] ✅ Tamamlandı!\n');

        // ─── Verification ───────────────────────────────────────────────────
        const checks = [
            { l: 'Company', q: 'SELECT COUNT(*) n FROM Company' },
            { l: 'Person', q: 'SELECT COUNT(*) n FROM Person' },
            { l: 'Account', q: 'SELECT COUNT(*) n FROM Account' },
            { l: 'Opportunity (Toplam)', q: 'SELECT COUNT(*) n FROM Opportunity' },
            { l: 'Opportunity (Lead)', q: `SELECT COUNT(*) n FROM Opportunity WHERE OpportunityStageName=1` },
            { l: 'Opportunity (Qualified)', q: `SELECT COUNT(*) n FROM Opportunity WHERE OpportunityStageName=2` },
            { l: 'Opportunity (Proposal)', q: `SELECT COUNT(*) n FROM Opportunity WHERE OpportunityStageName=3` },
            { l: 'Opportunity (Negotiation)', q: `SELECT COUNT(*) n FROM Opportunity WHERE OpportunityStageName=4` },
            { l: 'Opportunity (Won)', q: `SELECT COUNT(*) n FROM Opportunity WHERE DealStatus=2` },
            { l: 'Opportunity (Lost)', q: `SELECT COUNT(*) n FROM Opportunity WHERE DealStatus=3` },
            { l: 'Opp Toplam Amount (M TL)', q: 'SELECT ROUND(SUM(Amount_Value)/1e6,1) n FROM Opportunity' },
            { l: 'Quote (Toplam)', q: 'SELECT COUNT(*) n FROM Quote' },
            { l: 'Quote (Taslak)', q: `SELECT COUNT(*) n FROM Quote WHERE Status=0` },
            { l: 'Quote (Değerlendirme Gerekiyor)', q: `SELECT COUNT(*) n FROM Quote WHERE Status=1` },
            { l: 'Quote (Değerlendirmeye Alındı)', q: `SELECT COUNT(*) n FROM Quote WHERE Status=2` },
            { l: 'Quote (Onaylandı)', q: `SELECT COUNT(*) n FROM Quote WHERE Status=3` },
            { l: 'Quote (Reddedildi)', q: `SELECT COUNT(*) n FROM Quote WHERE Status=4` },
            { l: 'Quote (Gönderildi Aktif)', q: `SELECT COUNT(*) n FROM Quote WHERE Status=5` },
            { l: 'Quote (Kabul Edildi)', q: `SELECT COUNT(*) n FROM Quote WHERE Status=6` },
            { l: 'Quote (İptal Edildi)', q: `SELECT COUNT(*) n FROM Quote WHERE Status=7` },
            { l: 'Quote (Kaybedildi)', q: `SELECT COUNT(*) n FROM Quote WHERE Status=8` },
            { l: 'Quote (Kısmen Siparişleşti)', q: `SELECT COUNT(*) n FROM Quote WHERE Status=9` },
            { l: 'Quote Sent+ Net (M TL)', q: `SELECT ROUND(SUM(TotalNetAmountLocalCurrency_Amount)/1e6,1) n FROM Quote WHERE Status NOT IN (0)` },
            { l: 'Quote Won Net (M TL)', q: `SELECT ROUND(SUM(TotalNetAmountLocalCurrency_Amount)/1e6,1) n FROM Quote WHERE Status IN (3,6,9)` },
            { l: 'CrmOrder', q: 'SELECT COUNT(*) n FROM CrmOrder' },
            { l: 'CrmOrderProducts', q: 'SELECT COUNT(*) n FROM CrmOrderProducts' },
            { l: 'Distinct products in Orders', q: 'SELECT COUNT(DISTINCT StockId) n FROM CrmOrderProducts' },
            { l: 'Order Toplam VAT (M TL)', q: 'SELECT ROUND(SUM(TotalAmountWithTaxLocalCurrency_Amount)/1e6,1) n FROM CrmOrder' },
            { l: 'Contract', q: 'SELECT COUNT(*) n FROM Contract' },
            { l: 'Contract Active Amount (M TL)', q: `SELECT ROUND(SUM(TotalAmountLocalCurrency_Amount)/1e6,1) n FROM Contract WHERE ContractStatus=2` },
            { l: 'CalenderEvent', q: 'SELECT COUNT(*) n FROM CalenderEvent' },
        ];

        console.log('──── Doğrulama ────');
        for (const c of checks) {
            const row = db.prepare(c.q).get({}) as { n: number };
            console.log(`  ${c.l.padEnd(40)} ${row?.n ?? 0}`);
        }

        // Ürün dağılım özeti
        console.log('\n──── Ürün Dağılımı (Opportunity) ────');
        const prodDist = db.prepare(`SELECT ProductGroupId, COUNT(*) cnt, ROUND(SUM(Amount_Value)/1e6,1) amt FROM Opportunity GROUP BY ProductGroupId ORDER BY cnt DESC`).all({}) as { ProductGroupId: string; cnt: number; amt: number }[];
        for (const r of prodDist) {
            console.log(`  ${(r.ProductGroupId || '?').padEnd(12)} ${String(r.cnt).padStart(4)} fırsat  ${r.amt}M TL`);
        }

        // Teklif statü özeti
        console.log('\n──── Teklif Statü Dağılımı ────');
        const qStatDist = db.prepare(`SELECT Status, COUNT(*) cnt FROM Quote GROUP BY Status ORDER BY Status`).all({}) as { Status: number; cnt: number }[];
        for (const r of qStatDist) {
            console.log(`  ${String(r.Status).padEnd(3)} ${(Q_NAMES[r.Status] || '?').padEnd(30)} ${r.cnt}`);
        }

    } catch (err) {
        console.error('[seed] ❌', err);
        process.exit(1);
    } finally {
        db.close();
    }
}

main();
