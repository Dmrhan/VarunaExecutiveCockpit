import { z } from 'zod';

// ─── Nested schemas ───────────────────────────────────────────────────────────

const NoteSchema = z.object({
    DateTaken: z.string().nullable().optional(),
    Note: z.string().nullable().optional(),
    UserName: z.string().nullable().optional(),
    NoteText: z.string().nullable().optional(),
});

const ContactSchema = z.object({
    Name: z.string().nullable().optional(),
    Title: z.string().nullable().optional(),
    Email: z.string().nullable().optional(),
    Phone: z.string().nullable().optional(),
    CellPhone: z.string().nullable().optional(),
    Website: z.string().nullable().optional(),
    DefaultContact: z.number().int().nullable().optional(),
});

const ProductGroupSchema = z.object({
    ProductGroupId: z.string().nullable().optional(),
});

// ─── Main Opportunity schema ──────────────────────────────────────────────────
// Field names MUST match C# IOpportunity property names exactly.

export const OpportunitySchema = z.object({
    Id: z.string(),
    Name: z.string().nullable().optional(),

    AccountId: z.string().nullable().optional(),
    OwnerId: z.string().nullable().optional(),
    LeadOwnerId: z.string().nullable().optional(),
    PartnerId: z.string().nullable().optional(),
    PersonId: z.string().nullable().optional(),
    CompanyId: z.string().nullable().optional(),
    PipelineId: z.string().nullable().optional(),
    ProductGroupId: z.string().nullable().optional(),
    ProductCategoryId: z.string().nullable().optional(),

    // Enums (integers)
    Type: z.number().int().nullable().optional(),
    Source: z.number().int().nullable().optional(),
    DealType: z.number().int().nullable().optional(),
    WonLostType: z.number().int().nullable().optional(),
    DealStatus: z.number().int().nullable().optional(),
    ProbabilityBand: z.number().int().nullable().optional(),
    OpportunityStageName: z.number().int().nullable().optional(),

    // Stage
    OpportunityStageId: z.string().nullable().optional(),
    OpportunityStageNameTr: z.string().nullable().optional(),

    // Financials (IMoney flattened)
    Amount_Value: z.number().nullable().optional(),
    ExpectedRevenue_Value: z.number().nullable().optional(),
    PotentialTurnover_Value: z.number().nullable().optional(),
    BKMTurnover_Value: z.number().nullable().optional(),
    TargetTurnover_Value: z.number().nullable().optional(),

    Probability: z.number().nullable().optional(),

    // Booleans (as integers)
    IsThereDelay: z.number().int().min(0).max(1).nullable().optional(),

    // Dates
    CloseDate: z.string().nullable().optional(),
    DeliveryDate: z.string().nullable().optional(),
    FirstCreatedDate: z.string().nullable().optional(),
});

// ─── Full sync payload ────────────────────────────────────────────────────────

export const SyncPayloadSchema = z.object({
    opportunity: OpportunitySchema,
    notes: z.array(NoteSchema).optional().default([]),
    contacts: z.array(ContactSchema).optional().default([]),
    productGroups: z.array(ProductGroupSchema).optional().default([]),
});

export type SyncPayload = z.infer<typeof SyncPayloadSchema>;
export type OpportunityRecord = z.infer<typeof OpportunitySchema>;
