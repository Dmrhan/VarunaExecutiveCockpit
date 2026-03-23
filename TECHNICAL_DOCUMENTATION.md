# Varuna CRM Executive Cockpit - Teknik Doküman ve Veri Envanteri

## 1. Doküman Özeti
Bu döküman, Varuna CRM Executive Cockpit (Yönetici Zekası / GM Dashboard) projesinin tüm sayfalarını, bileşenlerini ve bu bileşenlerin beslendiği veri kaynaklarını (BFF & DB) eksiksiz olarak detaylandırmaktadır.

**Kapsam:** Frontend (React/Vite), BFF (Node/Express), Veritabanı (SQLite Projection Schema).

---

## 2. Sistem Mimarisi ve Veri Akışı
Sistem, gerçek zamanlıya yakın verileri göstermek için aşağıdaki katmanları kullanır:
1.  **Frontend (UI):** React tabanlı Dashboard'lar.
2.  **BFF (Backend For Frontend):** Dashboard'lara özel kümelenmiş (aggregated) veriler sunan API katmanı.
3.  **Database (SQLite):** Projection tabloları (Contract, Opportunity, Quote, CrmOrder, vb.).

---

## 3. Sayfa Bazlı Veri ve Hesaplama Envanteri

### 3.1 Yönetici Zekası (Kokpit V2 / Management Intelligence)
**Frontend Dosyası:** [ExecutiveDashboardPageV2.tsx](file:///Users/demirhan.isbakan/.gemini/antigravity/scratch/executive-cockpit/src/features/dashboard/ExecutiveDashboardPageV2.tsx)
**BFF Endpoint:** `GET /api/analytics/kpis`
**BFF Dosyası:** [analytics-kpis.ts](file:///Users/demirhan.isbakan/.gemini/antigravity/scratch/executive-cockpit/varuna-bff/src/routes/analytics-kpis.ts)

| Widget / KPI | DB Tablo | Filtre / Koşul | Hesaplama Mantığı |
| :--- | :--- | :--- | :--- |
| Toplam Fırsat | `Opportunity` | `1=1` (Tarih filtresine tabi) | `SUM(Amount_Value)` |
| Teklif Gönderildi | `Quote` | `Status NOT IN (1,2,3)` | `SUM(TotalNetAmountLocalCurrency_Amount)` |
| Kazanılan Teklifler | `Quote` | `Status IN (4,7,10)` | `SUM(TotalNetAmountLocalCurrency_Amount)` |
| Açık Siparişler | `CrmOrder` | `Status = 0` | `SUM(TotalAmountWithTaxLocalCurrency_Amount)` |
| Faturalandı | `CrmOrder` | `InvoiceDate IS NOT NULL` | `SUM(TotalNetAmountLocalCurrency_Amount)` |
| Ağırlıklı Pipeline | `Opportunity` | `DealStatus = 0` | `SUM(Amount_Value * Probability / 100.0)` |

### 3.2 Performans Kokpiti (Daily Dashboard / Performance Cockpit)
**Frontend Dosyası:** [PerformanceCockpit.tsx](file:///Users/demirhan.isbakan/.gemini/antigravity/scratch/executive-cockpit/src/features/dashboard/PerformanceCockpit.tsx)
**BFF Endpoint:** `GET /api/analytics/performance/daily`
**BFF Dosyası:** [analytics-performance.ts](file:///Users/demirhan.isbakan/.gemini/antigravity/scratch/executive-cockpit/varuna-bff/src/routes/analytics-performance.ts)

| KPI / Metrik | DB Tablo | Tarih Mantığı | Detay |
| :--- | :--- | :--- | :--- |
| Haftalık Sözleşme | `Contract` | `SigningDate >= HaftaBaşlı` | Toplam Adet ve Tutar |
| Aylık Fatura Hedefi | `CrmOrder` | `CreateOrderDate >= AyBaşı` | `monthlyTarget` parametresi ile oranlanır |
| Tahsilat Oranı | `ContractPaymentPlans` | `Tüm Zamanlar` | `CollectedAmount / TotalAmount` |
| Riskli Alacak | `ContractPaymentPlans` | `PaymentDate < Bugün` VE `HasBeenCollected = 0` | Gecikmiş ödemelerin toplamı |

### 3.3 Fırsatlar & Fırsat Yönetimi
**Frontend Dosyaları:** [OpportunitiesDashboard.tsx](file:///Users/demirhan.isbakan/.gemini/antigravity/scratch/executive-cockpit/src/features/dashboard/OpportunitiesDashboard.tsx), [OpportunityManagementPage.tsx](file:///Users/demirhan.isbakan/.gemini/antigravity/scratch/executive-cockpit/src/features/opportunities/OpportunityManagementPage.tsx)
**BFF Endpoint:** `/api/opportunities` (ODATA Filter desteği)
**BFF Dosyası:** [opportunities.ts](file:///Users/demirhan.isbakan/.gemini/antigravity/scratch/executive-cockpit/varuna-bff/src/routes/opportunities.ts)

*   **Veri Bağlantısı:** `Opportunity` tablosu `Account` (AccountId) ve `Person` (OwnerId) ile JOIN edilir.
*   **Filtreler:** Ürün Grubu, Satış Temsilcisi, Müşteri, Tarih Aralığı.
*   **Aşama Badgeları:** `OpportunityStageNameTr` alanına göre renklendirilir (Kazanıldı: Emerald, Kaybedildi: Red, Diğer: Blue).

### 3.4 Aktiviteler
**Frontend Dosyası:** [ActivitiesDashboard.tsx](file:///Users/demirhan.isbakan/.gemini/antigravity/scratch/executive-cockpit/src/features/dashboard/ActivitiesDashboard.tsx)
**BFF Endpoint:** `GET /api/activities`
**BFF Dosyası:** [activities.ts](file:///Users/demirhan.isbakan/.gemini/antigravity/scratch/executive-cockpit/varuna-bff/src/routes/activities.ts)

*   **Veri Bağlantısı:** `CalenderEvent` tablosu `Account` ve `Person` ile JOIN edilir.
*   **Aktivite Matrix:** Satış temsilcisi bazında aktivite tiplerinin (Telefon, Toplantı, vb.) dağılımını gösterir.

### 3.5 Teklifler (Quotes)
**Frontend Dosyayı:** [QuotesDashboard.tsx](file:///Users/demirhan.isbakan/.gemini/antigravity/scratch/executive-cockpit/src/features/dashboard/QuotesDashboard.tsx)
**BFF Endpoint:** `GET /api/quotes`
**BFF Dosyası:** [quotes.ts](file:///Users/demirhan.isbakan/.gemini/antigravity/scratch/executive-cockpit/varuna-bff/src/routes/quotes.ts)

*   **Risk Analizi (UI Side):**
    *   30 günden uzun süredir açık olanlar → Yüksek Risk.
    *   14 günden uzun süredir etkileşim olmayanlar → Orta Risk.
    *   İskonto > %20 veya Rakip varsa → Riskli.

### 3.6 Siparişler (Orders)
**Frontend Dosyası:** [OrdersDashboard.tsx](file:///Users/demirhan.isbakan/.gemini/antigravity/scratch/executive-cockpit/src/features/dashboard/OrdersDashboard.tsx)
**BFF Endpoint:** `GET /api/orders`
**BFF Dosyası:** [orders.ts](file:///Users/demirhan.isbakan/.gemini/antigravity/scratch/executive-cockpit/varuna-bff/src/routes/orders.ts)

*   **Veri Bağlantısı:** `CrmOrder` tablosu. `CrmOrderProducts` üzerinden ürün isimleri subquery ile çekilir.
*   **Statü:** 0=Açık, 1=Kapalı, 2=İptal.

### 3.7 Sözleşmeler (Gelir Güvencesi)
**Frontend Dosyayı:** [ContractsDashboard.tsx](file:///Users/demirhan.isbakan/.gemini/antigravity/scratch/executive-cockpit/src/features/dashboard/ContractsDashboard.tsx)
**BFF Endpoint:** `POST /api/analytics/contract/dashboard`
**BFF Dosyası:** [analytics-contract.ts](file:///Users/demirhan.isbakan/.gemini/antigravity/scratch/executive-cockpit/varuna-bff/src/routes/analytics-contract.ts)

*   **Kritik Alanlar:** `ContractStatus` (Enum 0-10), `SigningDate`, `FinishDate`.
*   **Yenileme Gün Sayısı:** `CAST(julianday(FinishDate) - julianday('now') AS INTEGER)`.
*   **Trend:** Son 12 ayın toplam sözleşme tutarı/adedi.

### 3.8 Kişi Karnesi (Person Scorecard)
**Frontend Dosyayı:** [PersonScorecardPage.tsx](file:///Users/demirhan.isbakan/.gemini/antigravity/scratch/executive-cockpit/src/features/scorecard/PersonScorecardPage.tsx)
**BFF Endpoint:** `GET /api/analytics/person-scorecard`
**BFF Dosyası:** [analytics-person-scorecard.ts](file:///Users/demirhan.isbakan/.gemini/antigravity/scratch/executive-cockpit/varuna-bff/src/routes/analytics-person-scorecard.ts)

*   **Team Rank:** İlgili kişinin `TeamId`'si üzerinden "YTD Won Quote" tutarına göre sıralanır.
*   **Funnel:** Opportunity → Quote → Won Quote → Order → Contract → Invoice → Collection şeklinde tüm akış tek kişiye göre filtrelenir.

---

## 4. Sayfalar Arası Mutabakat (Summary ↔ List)
*   **Kural:** Summary sayfalarındaki (V2 Dashboard) rakamlar, liste sayfalarındaki filtreler ile (Örn: Kazanıldı statüsü seçili liste toplamı) birebir örtüşmektedir.
*   **Ortak Filtre Servisi:** `AnalyticsService` ve `ListingServices` aynı BFF route yapılarını (özellikle aggregate yapanlar) kullanır.

---

## 5. Teknik Notlar ve Kanıtlar
*   **Veri Tutarsızlığı Kontrolü:** "Satış Yöneticisi Performans İzleme" widget'ı `analytics-kpis` üzerinden `Opportunity` tablosundan beslenirken, Fırsatlar sayfası `opportunities` listesinden beslenir. İkisi de aynı `Amount_Value` alanını referans alır.
*   **Tarih Mantığı:** Çoğu sorgu `FirstCreatedDate` veya `CreatedOn` alanlarını baz alır.
*   **Para Birimi:** Değerler `TotalAmountLocalCurrency_Amount` veya `Amount_Value` alanlarından (TL bazlı) okunur.
