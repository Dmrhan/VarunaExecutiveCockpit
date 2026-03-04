import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { SyncPayloadSchema } from '../validators/opportunitySchema';
import { ZodError } from 'zod';

const router = Router();

/**
 * POST /api/opportunity/sync
 *
 * Receives an Opportunity payload from Varuna and upserts it into SQLite.
 * Detail tables (notes, contacts, productGroups) are replaced atomically
 * using delete-then-insert within a single transaction.
 *
 * Strategy for detail tables: DELETE WHERE OpportunityId = ? then INSERT.
 * This avoids drift from orphaned rows when lists change on source.
 */
router.post('/sync', (req: Request, res: Response) => {
    const parseResult = SyncPayloadSchema.safeParse(req.body);

    if (!parseResult.success) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid payload',
            errors: (parseResult.error as ZodError).flatten(),
        });
    }

    const { opportunity, notes, contacts, productGroups } = parseResult.data;
    const db = getDb();

    // Check if this is an insert or update for response reporting
    const existing = db.queryOne('SELECT Id FROM Opportunity WHERE Id = ?', [opportunity.Id]);
    const isUpsert = !existing;

    // ── Bindings ──────────────────────────────────────────────────────────────
    const binding = {
        Id: opportunity.Id,
        Name: opportunity.Name ?? null,
        AccountId: opportunity.AccountId ?? null,
        OwnerId: opportunity.OwnerId ?? null,
        LeadOwnerId: opportunity.LeadOwnerId ?? null,
        PartnerId: opportunity.PartnerId ?? null,
        PersonId: opportunity.PersonId ?? null,
        CompanyId: opportunity.CompanyId ?? null,
        PipelineId: opportunity.PipelineId ?? null,
        ProductGroupId: opportunity.ProductGroupId ?? null,
        ProductCategoryId: opportunity.ProductCategoryId ?? null,
        Type: opportunity.Type ?? null,
        Source: opportunity.Source ?? null,
        DealType: opportunity.DealType ?? null,
        WonLostType: opportunity.WonLostType ?? null,
        DealStatus: opportunity.DealStatus ?? null,
        ProbabilityBand: opportunity.ProbabilityBand ?? null,
        OpportunityStageName: opportunity.OpportunityStageName ?? null,
        OpportunityStageId: opportunity.OpportunityStageId ?? null,
        OpportunityStageNameTr: opportunity.OpportunityStageNameTr ?? null,
        Amount_Value: opportunity.Amount_Value ?? null,
        ExpectedRevenue_Value: opportunity.ExpectedRevenue_Value ?? null,
        PotentialTurnover_Value: opportunity.PotentialTurnover_Value ?? null,
        BKMTurnover_Value: opportunity.BKMTurnover_Value ?? null,
        TargetTurnover_Value: opportunity.TargetTurnover_Value ?? null,
        Probability: opportunity.Probability ?? null,
        IsThereDelay: opportunity.IsThereDelay ?? null,
        CloseDate: opportunity.CloseDate ?? null,
        DeliveryDate: opportunity.DeliveryDate ?? null,
        FirstCreatedDate: opportunity.FirstCreatedDate ?? null,
    };

    // ── SQL Construction ──────────────────────────────────────────────────────
    let upsertSql: string;

    if (db.driver === 'mssql') {
        upsertSql = `
            MERGE INTO Opportunity AS target
            USING (SELECT @Id AS Id) AS source
            ON (target.Id = source.Id)
            WHEN MATCHED THEN
                UPDATE SET
                    Name                    = @Name,
                    AccountId               = @AccountId,
                    OwnerId                 = @OwnerId,
                    LeadOwnerId             = @LeadOwnerId,
                    PartnerId               = @PartnerId,
                    PersonId                = @PersonId,
                    CompanyId               = @CompanyId,
                    PipelineId              = @PipelineId,
                    ProductGroupId          = @ProductGroupId,
                    ProductCategoryId       = @ProductCategoryId,
                    [Type]                  = @Type,
                    [Source]                = @Source,
                    DealType                = @DealType,
                    WonLostType             = @WonLostType,
                    DealStatus              = @DealStatus,
                    ProbabilityBand         = @ProbabilityBand,
                    OpportunityStageName    = @OpportunityStageName,
                    OpportunityStageId      = @OpportunityStageId,
                    OpportunityStageNameTr  = @OpportunityStageNameTr,
                    Amount_Value            = @Amount_Value,
                    ExpectedRevenue_Value   = @ExpectedRevenue_Value,
                    PotentialTurnover_Value = @PotentialTurnover_Value,
                    BKMTurnover_Value       = @BKMTurnover_Value,
                    TargetTurnover_Value    = @TargetTurnover_Value,
                    Probability             = @Probability,
                    IsThereDelay            = @IsThereDelay,
                    CloseDate               = @CloseDate,
                    DeliveryDate            = @DeliveryDate,
                    FirstCreatedDate        = @FirstCreatedDate,
                    _SyncedAt               = GETUTCDATE()
            WHEN NOT MATCHED THEN
                INSERT (
                    Id, Name, AccountId, OwnerId, LeadOwnerId, PartnerId,
                    PersonId, CompanyId, PipelineId, ProductGroupId, ProductCategoryId,
                    [Type], [Source], DealType, WonLostType, DealStatus, ProbabilityBand,
                    OpportunityStageName, OpportunityStageId, OpportunityStageNameTr,
                    Amount_Value, ExpectedRevenue_Value, PotentialTurnover_Value,
                    BKMTurnover_Value, TargetTurnover_Value, Probability,
                    IsThereDelay, CloseDate, DeliveryDate, FirstCreatedDate, _SyncedAt
                ) VALUES (
                    @Id, @Name, @AccountId, @OwnerId, @LeadOwnerId, @PartnerId,
                    @PersonId, @CompanyId, @PipelineId, @ProductGroupId, @ProductCategoryId,
                    @Type, @Source, @DealType, @WonLostType, @DealStatus, @ProbabilityBand,
                    @OpportunityStageName, @OpportunityStageId, @OpportunityStageNameTr,
                    @Amount_Value, @ExpectedRevenue_Value, @PotentialTurnover_Value,
                    @BKMTurnover_Value, @TargetTurnover_Value, @Probability,
                    @IsThereDelay, @CloseDate, @DeliveryDate, @FirstCreatedDate,
                    GETUTCDATE()
                );
        `;
    } else {
        upsertSql = `
            INSERT INTO Opportunity (
                Id, Name, AccountId, OwnerId, LeadOwnerId, PartnerId,
                PersonId, CompanyId, PipelineId, ProductGroupId, ProductCategoryId,
                Type, Source, DealType, WonLostType, DealStatus, ProbabilityBand,
                OpportunityStageName, OpportunityStageId, OpportunityStageNameTr,
                Amount_Value, ExpectedRevenue_Value, PotentialTurnover_Value,
                BKMTurnover_Value, TargetTurnover_Value, Probability,
                IsThereDelay, CloseDate, DeliveryDate, FirstCreatedDate, _SyncedAt
            ) VALUES (
                :Id, :Name, :AccountId, :OwnerId, :LeadOwnerId, :PartnerId,
                :PersonId, :CompanyId, :PipelineId, :ProductGroupId, :ProductCategoryId,
                :Type, :Source, :DealType, :WonLostType, :DealStatus, :ProbabilityBand,
                :OpportunityStageName, :OpportunityStageId, :OpportunityStageNameTr,
                :Amount_Value, :ExpectedRevenue_Value, :PotentialTurnover_Value,
                :BKMTurnover_Value, :TargetTurnover_Value, :Probability,
                :IsThereDelay, :CloseDate, :DeliveryDate, :FirstCreatedDate,
                datetime('now')
            )
            ON CONFLICT(Id) DO UPDATE SET
                Name                    = excluded.Name,
                AccountId               = excluded.AccountId,
                OwnerId                 = excluded.OwnerId,
                LeadOwnerId             = excluded.LeadOwnerId,
                PartnerId               = excluded.PartnerId,
                PersonId                = excluded.PersonId,
                CompanyId               = excluded.CompanyId,
                PipelineId              = excluded.PipelineId,
                ProductGroupId          = excluded.ProductGroupId,
                ProductCategoryId       = excluded.ProductCategoryId,
                Type                    = excluded.Type,
                Source                  = excluded.Source,
                DealType                = excluded.DealType,
                WonLostType             = excluded.WonLostType,
                DealStatus              = excluded.DealStatus,
                ProbabilityBand         = excluded.ProbabilityBand,
                OpportunityStageName    = excluded.OpportunityStageName,
                OpportunityStageId      = excluded.OpportunityStageId,
                OpportunityStageNameTr  = excluded.OpportunityStageNameTr,
                Amount_Value            = excluded.Amount_Value,
                ExpectedRevenue_Value   = excluded.ExpectedRevenue_Value,
                PotentialTurnover_Value = excluded.PotentialTurnover_Value,
                BKMTurnover_Value       = excluded.BKMTurnover_Value,
                TargetTurnover_Value    = excluded.TargetTurnover_Value,
                Probability             = excluded.Probability,
                IsThereDelay            = excluded.IsThereDelay,
                CloseDate               = excluded.CloseDate,
                DeliveryDate            = excluded.DeliveryDate,
                FirstCreatedDate        = excluded.FirstCreatedDate,
                _SyncedAt               = datetime('now')
        `;
    }

    try {
        db.transaction(() => {
            db.execute(upsertSql, binding);

            // Detail tables: delete-then-insert
            db.execute('DELETE FROM OpportunityNotes    WHERE OpportunityId = ?', [opportunity.Id]);
            db.execute('DELETE FROM OpportunityContacts WHERE OpportunityId = ?', [opportunity.Id]);

            for (const note of notes) {
                db.execute(`
                    INSERT INTO OpportunityNotes (OpportunityId, DateTaken, Note, UserName, NoteText)
                    VALUES (:OpportunityId, :DateTaken, :Note, :UserName, :NoteText)
                `, {
                    OpportunityId: opportunity.Id,
                    DateTaken: note.DateTaken ?? null,
                    Note: note.Note ?? null,
                    UserName: note.UserName ?? null,
                    NoteText: note.NoteText ?? null,
                });
            }
            for (const contact of contacts) {
                db.execute(`
                    INSERT INTO OpportunityContacts
                        (OpportunityId, Name, Title, Email, Phone, CellPhone, Website, DefaultContact)
                    VALUES
                        (:OpportunityId, :Name, :Title, :Email, :Phone, :CellPhone, :Website, :DefaultContact)
                `, {
                    OpportunityId: opportunity.Id,
                    Name: contact.Name ?? null,
                    Title: contact.Title ?? null,
                    Email: contact.Email ?? null,
                    Phone: contact.Phone ?? null,
                    CellPhone: contact.CellPhone ?? null,
                    Website: contact.Website ?? null,
                    DefaultContact: contact.DefaultContact ?? null,
                });
            }
        });

        return res.status(200).json({
            status: 'ok',
            upserted: isUpsert,
            id: opportunity.Id,
            syncedAt: new Date().toISOString(),
        });
    } catch (err) {
        console.error('[SYNC] Transaction failed:', err);
        return res.status(500).json({ status: 'error', message: 'Database write failed' });
    }
});

export default router;
