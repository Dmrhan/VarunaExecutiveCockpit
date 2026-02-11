
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export async function openDb() {
    return open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });
}

const PRODUCTS = ['EnRoute', 'Quest', 'Stokbar', 'ServiceCore', 'Varuna', 'Hosting'];
const SOURCES = ['Univera Satış', 'Univera İş Ortakları', 'Univera EnRoute PY', 'Univera Stokbar PY', 'Univera Quest PY', 'Diğer'];
const STAGES = ['Teklif', 'Sözleşme', 'Konumlama', 'Demo', 'Kazanıldı', 'Kaybedildi', 'Lead', 'Qualified', 'Proposal', 'Negotiation'];
const CORPORATE_CUSTOMERS = [
    'Koç Holding', 'Sabancı Sanayi', 'Türkiye İş Bankası', 'Garanti BBVA', 'Akbank',
    'Türk Telekom', 'Turkcell', 'Pegasus Hava Yolları', 'Şişecam', 'Eczacıbaşı Grup',
    'Migros Ticaret', 'Anadolu Efes', 'Arçelik Global', 'Vestel Elektronik', 'Ford Otosan',
    'Tofaş', 'Türk Hava Yolları', 'Coca-Cola İçecek', 'Ülker Bisküvi', 'Eti Gıda',
    'Hayat Kimya', 'LC Waikiki', 'Boyner Grup', 'Enerjisa', 'Socar Türkiye',
    'BAT - British American Tobacco', 'JTI - Japan Tobacco Intl', 'Philip Morris',
    'Unilever TR', 'P&G Türkiye', 'Nestle Waters', 'Danone Hayat', 'Mey Diageo',
    'Borusan Lojistik', 'Kibar Holding', 'Tekfen İnşaat', 'Enka İnşaat',
    'Yıldız Holding', 'Doğuş Grubu', 'Eczacıbaşı İlaç', 'Abdi İbrahim'
];

const PROJECT_TOPICS: Record<string, string[]> = {
    'EnRoute': ['Saha Satış Otomasyonu', 'Mobil Sipariş Sistemi', 'Route Optimizasyonu', 'Bayi Yönetim Sistemi'],
    'Quest': ['Merch Takip Sistemi', 'Anket & Denetim Projesi', 'Saha Analitiği', 'Mükemmel Mağaza (Perfect Store)'],
    'Stokbar': ['Depo Yönetim Sistemi', 'WMS Entegrasyonu', 'Radyo Frekanslı Takip', 'Envanter Optimizasyonu'],
    'ServiceCore': ['Müşteri Deneyimi Portalı', 'Omnichannel Destek', 'Call Center Modernizasyonu', 'B2B Destek Hattı'],
    'Varuna': ['ERP Geçiş Projesi', 'Finansal Raporlama Modülü', 'Üretim Planlama', 'IK Portalı'],
    'Hosting': ['Cloud Migration', 'Azure Altyapı Kurulumu', 'Disaster Recovery Planı', 'Server Modernizasyonu']
};

const USERS = [
    { id: 'u1', name: 'Ali Yılmaz', role: 'sales_rep', department: 'Sales' },
    { id: 'u2', name: 'Ayşe Demir', role: 'sales_rep', department: 'Sales' },
    { id: 'u3', name: 'Mehmet Kaya', role: 'sales_rep', department: 'Partners' },
    { id: 'u4', name: 'Zeynep Çelik', role: 'manager', department: 'Sales' },
];

const generateRandomDate = (start: Date, end: Date) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
};

async function setup() {
    const db = await openDb();

    await db.exec(`
    CREATE TABLE IF NOT EXISTS opportunities (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      product TEXT NOT NULL,
      value REAL NOT NULL,
      stage TEXT NOT NULL,
      probability REAL NOT NULL,
      owner_id TEXT NOT NULL,
      source TEXT,
      topic TEXT,
      expected_close_date TEXT,
      last_activity_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      currency TEXT DEFAULT 'TRY',
      weighted_value REAL,
      aging INTEGER,
      velocity INTEGER,
      health_score INTEGER,
      notes TEXT
    )
  `);

    const countQuery = await db.get('SELECT COUNT(*) as count FROM opportunities');

    if (countQuery.count === 0) {
        console.log('Seeding database...');

        // Generate 100 mock deals
        for (let i = 0; i < 100; i++) {
            const createdAt = generateRandomDate(new Date('2023-01-01'), new Date());
            const stage = STAGES[Math.floor(Math.random() * STAGES.length)];
            const owner = USERS[Math.floor(Math.random() * USERS.length)];
            const source = SOURCES[Math.floor(Math.random() * SOURCES.length)];
            const customerName = CORPORATE_CUSTOMERS[Math.floor(Math.random() * CORPORATE_CUSTOMERS.length)];
            const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
            const topics = PROJECT_TOPICS[product] || ['Sistem Geliştirme'];
            const randomTopic = topics[Math.floor(Math.random() * topics.length)];
            const value = Math.floor(Math.random() * 5000000) + 50000;
            const probability = stage === 'Kazanıldı' ? 100 : stage === 'Kaybedildi' ? 0 : Math.floor(Math.random() * 80 + 10);
            const weightedValue = Math.round(value * (probability / 100));

            await db.run(
                `INSERT INTO opportunities (
                id, title, customer_name, product, value, stage, probability, owner_id, 
                source, topic, expected_close_date, last_activity_date, created_at, 
                currency, weighted_value, aging, velocity, health_score, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    `deal-${i}`,
                    `${customerName} - ${randomTopic}`,
                    customerName,
                    product,
                    value,
                    stage,
                    probability,
                    owner.id,
                    source,
                    `${product} ${randomTopic}`,
                    generateRandomDate(new Date(), new Date('2026-12-31')),
                    generateRandomDate(new Date(createdAt), new Date()),
                    createdAt,
                    'TRY',
                    weightedValue,
                    Math.floor(Math.random() * 90),
                    Math.floor(Math.random() * 20),
                    Math.floor(Math.random() * 100),
                    'Seeded via setup script'
                ]
            );
        }
        console.log('Database seeded successfully.');
    } else {
        console.log('Database already has data. Skipping seed.');
    }
}

setup();
