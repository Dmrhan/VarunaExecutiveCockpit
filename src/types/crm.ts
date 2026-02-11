export type ProductGroup = 'EnRoute' | 'Quest' | 'Stokbar' | 'ServiceCore' | 'Varuna' | 'Hosting' | 'Unidox';

export type DealStage = 'Lead' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Order' | 'Lost' |
    'Teklif' | 'Sözleşme' | 'Konumlama' | 'Demo' | 'Kazanıldı' | 'Kaybedildi';

export type DealSource = 'Univera Satış' | 'Univera İş Ortakları' | 'Univera EnRoute PY' | 'Univera Stokbar PY' | 'Univera Quest PY' | 'Diğer';

export interface User {
    id: string;
    name: string;
    avatar: string;
    role: 'sales_rep' | 'manager' | 'executive';
    department?: 'Sales' | 'Partners' | 'Presales' | 'CustomerSuccess';
}

export interface Activity {
    id: string;
    type: 'outbound_call' | 'outbound_email' | 'meeting' | 'inbound_call' | 'sales' | 'inbound_email' | 'account_mgmt' | 'other' | 'contract' | 'proposal' | 'support' | 'renewal' | 'proposal_followup' | 'vacancy' | 'training' | 'linkedin' | 'demo' | 'satisfaction' | 'field_sales' | 'proposal_verbal' | 'retention';
    date: string; // ISO date (Scheduled or Completed date)
    dealId: string;
    userId: string;
    notes?: string;
    outcome?: 'positive' | 'neutral' | 'negative';
    outcomeReason?: 'price' | 'product_gap' | 'timing' | 'competitor' | 'other';
    status: 'completed' | 'pending' | 'overdue';
    dueDate?: string;
    completedAt?: string;
}

export type Deal = {
    id: string;
    title: string;
    customerName: string;
    product: ProductGroup;
    value: number;
    stage: DealStage;
    probability: number;
    ownerId: string;
    source: DealSource;
    topic: string;
    createdAt: string;
    expectedCloseDate: string;
    lastActivityDate: string;
    updatedAt?: string;
    notes?: string;
    currency: 'TRY' | 'USD' | 'EUR';

    // Computed fields
    weightedValue: number; // value * (probability / 100)

    // Computed fields (for analytics)
    aging: number; // days in current stage
    velocity: number; // average days per stage
    healthScore: number; // 0-100
}

export type QuoteStatus = 'Draft' | 'Review' | 'Approved' | 'Rejected' | 'Sent' | 'Accepted' | 'Denied';
export type OrderStatus = 'Open' | 'Closed' | 'Canceled';

export interface Quote {
    id: string;
    dealId: string;
    customerName: string;
    product: ProductGroup;
    title: string;
    amount: number;
    status: QuoteStatus;
    createdAt: string;
    validUntil: string;
    items: { product: string; quantity: number; price: number }[];
    salesRepId?: string;
    salesRepName?: string;
    // Risk factors
    discount?: number; // percentage 0-100
    lastActivityDate?: string;
    hasCompetitor?: boolean;
}

export interface Order {
    id: string;
    quoteId: string;
    customerName: string;
    product: ProductGroup;
    title: string;
    amount: number;
    status: OrderStatus;
    createdAt: string;
    deliveryDate: string;
    salesRepId: string;
}

export interface DashboardMetrics {
    totalPipelineValue: number;
    executionConfidenceScore: number; // 0-100
    stalledDealsCount: number;
    leakageByStage: Record<DealStage, number>;
    topPerformers: { userId: string; score: number }[];
}

export type ContractType = 'Initialization' | 'Renewal' | 'Maintenance' | 'Rental' | 'License';
export type ContractStatus = 'Draft' | 'Negotiation' | 'Active' | 'Archived' | 'Terminated';
export type BillingStatus = 'Invoiced' | 'Pending' | 'Cancelled';
export type ContractRiskLevel = 'Low' | 'Medium' | 'High';


export interface RenewalEvent {
    date: string;
    action: 'Renewed' | 'Auto-Renewed' | 'Extension';
    priceChangePercentage: number;
}

export interface PaymentDiscipline {
    averageDelayDays: number;
    consistencyScore: number; // 0-100
    trend: 'Improving' | 'Stable' | 'Declining';
}

export interface Contract {
    id: string;
    title: string;
    customerName: string;
    salesOwnerId: string;
    ownerName: string; // The accountable person (CSM / Account Manager)
    productGroup: ProductGroup;
    type: ContractType;
    status: ContractStatus;

    // Financials
    totalValue: number;
    currency: 'TRY' | 'USD' | 'EUR';
    totalValueTL: number; // Normalized for reporting

    // Dates
    startDate: string;
    endDate: string;
    signatureDate?: string;
    renewalDate: string;

    // Billing
    billingStatus: BillingStatus;
    billingCadence: 'Monthly' | 'Quarterly' | 'Yearly' | 'One-Time';
    nextInvoiceDate: string;

    // Intelligence & Risk
    daysToRenewal: number;
    autoRenewal: boolean;
    riskLevel: ContractRiskLevel;
    riskFactors: string[];
    healthScore: number; // 0-100
    lastActivityDate?: string;

    actionsRequired: boolean;

    // Payment & Collection
    paymentPlan?: PaymentInstallment[];
    collectionRiskAnalysis?: CollectionAnalysisResult;
    paymentDiscipline?: PaymentDiscipline;
    renewalHistory?: RenewalEvent[];
}

export interface PaymentInstallment {
    id: string;
    date: string; // ISO Date
    amount: number;
    currency: 'TRY' | 'USD' | 'EUR';
    status: 'Collected' | 'Pending' | 'Overdue';
    invoiceNumber?: string;
}

export interface CollectionAnalysisResult {
    riskScore: number; // 0-100
    riskLevel: 'Low' | 'Medium' | 'High';
    insights: string[];
    recommendations: string[];
}
