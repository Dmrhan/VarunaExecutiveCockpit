const fs = require('fs');
const path = require('path');

const trPath = path.resolve('src/i18n/locales/tr.json');
const enPath = path.resolve('src/i18n/locales/en.json');

const trData = JSON.parse(fs.readFileSync(trPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Common
trData.common.noData = "Veri bulunamadı";
enData.common.noData = "No data available";
trData.common.selectedCount = "{{count}} seçildi";
enData.common.selectedCount = "{{count}} selected";

// Risk
if (!trData.risk) trData.risk = {};
if (!enData.risk) enData.risk = {};
trData.risk.High = "Yüksek";
enData.risk.High = "High";
trData.risk.Medium = "Orta";
enData.risk.Medium = "Medium";
trData.risk.Low = "Düşük";
enData.risk.Low = "Low";

// Quotes
if (!trData.quotes.units) trData.quotes.units = {};
if (!enData.quotes.units) enData.quotes.units = {};
trData.quotes.units.approved = "Onaylı Teklif";
enData.quotes.units.approved = "Approved Quote";

if (!trData.quotes.table) trData.quotes.table = {};
if (!enData.quotes.table) enData.quotes.table = {};
trData.quotes.table.product = "Ürün";
enData.quotes.table.product = "Product";

if (!trData.quotes.charts) trData.quotes.charts = {};
if (!enData.quotes.charts) enData.quotes.charts = {};
trData.quotes.charts.customerInsight = "Müşteri dağılım istatistikleri";
enData.quotes.charts.customerInsight = "Customer distribution stats";

// Orders
trData.orders.productPerformance = "Ürün Performansı";
enData.orders.productPerformance = "Product Performance";

// Opportunities
trData.opportunities.forecast = trData.opportunities.forecast || {};
enData.opportunities.forecast = enData.opportunities.forecast || {};
trData.opportunities.forecast.title = "Tahmini Kapanış Öngörüsü";
enData.opportunities.forecast.title = "Estimated Closing Forecast";
trData.opportunities.forecast.subtitle = "Önümüzdeki 12 ay için beklenen satış hacmi";
enData.opportunities.forecast.subtitle = "Expected sales volume for next 12 months";

// Contracts
trData.contracts.charts = trData.contracts.charts || {};
enData.contracts.charts = enData.contracts.charts || {};
trData.contracts.charts.statusDistribution = "Sözleşme Durum Dağılımı";
enData.contracts.charts.statusDistribution = "Contract Status Distribution";

trData.contracts.productHealth = trData.contracts.productHealth || {};
enData.contracts.productHealth = enData.contracts.productHealth || {};
trData.contracts.productHealth.title = "Ürün Kontrat Sağlığı";
enData.contracts.productHealth.title = "Product Contract Health";
trData.contracts.productHealth.subtitle = "Ürün bazlı sözleşme riski ve değeri";
enData.contracts.productHealth.subtitle = "Product based contract risk and value";

// ExecutiveBrief
trData.executiveBrief = trData.executiveBrief || { kpis: {} };
enData.executiveBrief = enData.executiveBrief || { kpis: {} };
trData.executiveBrief.kpis.acceptable = "Kabul Edilebilir";
enData.executiveBrief.kpis.acceptable = "Acceptable";
trData.executiveBrief.kpis.needsAttention = "Dikkat Gerekiyor";
enData.executiveBrief.kpis.needsAttention = "Needs Attention";
trData.executiveBrief.kpis.riskAnalysis = "Risk Analizi";
enData.executiveBrief.kpis.riskAnalysis = "Risk Analysis";

// Extra for GamifiedLeaderboard and generic status dates
trData.gamification = trData.gamification || {};
enData.gamification = enData.gamification || {};
trData.gamification.invoiced = "FATURALANAN";
enData.gamification.invoiced = "INVOICED";

trData.contracts.statusDate = "Durum Tarihi";
enData.contracts.statusDate = "Status Date";

trData.contracts.status = trData.contracts.status || {};
enData.contracts.status = enData.contracts.status || {};
trData.contracts.status.univeraSigned = "Univera İmzasında";
enData.contracts.status.univeraSigned = "Signed by Univera";
trData.contracts.status.noMaintenance = "Bakıma Devir Olmadı";
enData.contracts.status.noMaintenance = "No Maintenance Turnover";

trData.executive.confidence = trData.executive.confidence || {};
enData.executive.confidence = enData.executive.confidence || {};
trData.executive.confidence.title = "Uygulama Güveni";
enData.executive.confidence.title = "Execution Confidence";

trData.performance.topPerformers = "En İyi Performans Gösterenler";
enData.performance.topPerformers = "Top Performers";

trData.opportunities.riskLevels = { high: "RİSK", good: "İYİ", normal: "NORMAL" };
enData.opportunities.riskLevels = { high: "RISK", good: "GOOD", normal: "NORMAL" };

trData.executive.aiBrief = "AI Yönetim Özeti";
enData.executive.aiBrief = "AI Executive Brief";


fs.writeFileSync(trPath, JSON.stringify(trData, null, 4));
fs.writeFileSync(enPath, JSON.stringify(enData, null, 4));
console.log("Locales successfully updated.");
