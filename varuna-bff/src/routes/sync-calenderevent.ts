import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { z } from 'zod';

const router = Router();

// Zod Schema representing the C# ICalenderEvent model + child collections
const calenderEventSchema = z.object({
    Id: z.string(),
    OwnerId: z.string(),
    Subject: z.string(),
    Type: z.number(),
    Description: z.string().nullable().optional(),

    StartDate: z.string().nullable().optional(),
    FinishDate: z.string().nullable().optional(),
    Location: z.string().nullable().optional(),

    AccountId: z.string().nullable().optional(),
    LeadId: z.string().nullable().optional(),
    ContactId: z.string().nullable().optional(),
    CompanyId: z.string().nullable().optional(),
    ParentEventId: z.string().nullable().optional(),

    IsAllDay: z.number().int().min(0).max(1),
    IsRepeat: z.number().int().min(0).max(1),
    IsReminderSet: z.number().int().min(0).max(1),
    IsNewAccount: z.number().int().min(0).max(1).nullable().optional(),

    RepeatPattern: z.number().nullable().optional(),
    RepeatEvery: z.number().nullable().optional(),
    MonthForRepeatOnYearly: z.number().nullable().optional(),
    EndRepeat: z.number().nullable().optional(),
    AfterOccurrenceCount: z.number().nullable().optional(),
    TimeBeforeEvent: z.number().nullable().optional(),
    RepeatEveryHours: z.number().nullable().optional(),
    RepeatEveryDays: z.number().nullable().optional(),
    RepeatOnMonthly: z.number().nullable().optional(),
    RepeatOnYearly: z.number().nullable().optional(),

    EndRepeatDate: z.string().nullable().optional(),
    Status: z.number(),
    RecurrenceRule: z.string().nullable().optional(),
    RecurrenceException: z.string().nullable().optional(),
    ParticipantType: z.number().nullable().optional(),
    SubjectType: z.number().nullable().optional(),
    ExcludeWeekends: z.number().int().min(0).max(1).nullable().optional(),
    FirstCreatedBy: z.string().nullable().optional(),
    FirstCreatedDate: z.string().nullable().optional(),
    EventEnvironment: z.number().nullable().optional(),
    CalendarEventResultId: z.string().nullable().optional(),
    GoogleCalendarEventCreatedMail: z.string().nullable().optional(),

    SubjectTypeTr: z.string().nullable().optional(),
    TypeTr: z.string().nullable().optional(),
    StatusTr: z.string().nullable().optional(),
    EventEnvironmentTr: z.string().nullable().optional(),
    ParticipantTypeTr: z.string().nullable().optional(),

    // Child Collections
    DaysForRepeatOnWeekly: z.array(z.object({
        Id: z.string(),
        CalenderEventId: z.string(),
        Day: z.number()
    })).nullable().optional(),

    ParticipantPeople: z.array(z.object({
        Id: z.string(),
        CalenderEventId: z.string(),
        ParticipantPersonId: z.string()
    })).nullable().optional(),

    ParticipantLeads: z.array(z.object({
        Id: z.string(),
        CalenderEventId: z.string(),
        ParticipantLeadId: z.string()
    })).nullable().optional(),

    ParticipantContacts: z.array(z.object({
        Id: z.string(),
        CalenderEventId: z.string(),
        ParticipantContactId: z.string()
    })).nullable().optional()
});

router.post('/', (req: Request, res: Response) => {
    try {
        const payload = calenderEventSchema.parse(req.body);
        const db = getDb();

        const upsertEventSql = db.driver === 'mssql' ? `
            MERGE INTO CalenderEvent AS target
            USING (SELECT @Id AS Id) AS source
            ON (target.Id = source.Id)
            WHEN MATCHED THEN
                UPDATE SET 
                    OwnerId = @OwnerId, Subject = @Subject, Type = @Type, Description = @Description,
                    StartDate = @StartDate, FinishDate = @FinishDate, Location = @Location,
                    AccountId = @AccountId, LeadId = @LeadId, ContactId = @ContactId,
                    CompanyId = @CompanyId, ParentEventId = @ParentEventId, IsAllDay = @IsAllDay,
                    IsRepeat = @IsRepeat, IsReminderSet = @IsReminderSet, IsNewAccount = @IsNewAccount,
                    RepeatPattern = @RepeatPattern, RepeatEvery = @RepeatEvery, MonthForRepeatOnYearly = @MonthForRepeatOnYearly,
                    EndRepeat = @EndRepeat, AfterOccurrenceCount = @AfterOccurrenceCount, TimeBeforeEvent = @TimeBeforeEvent,
                    RepeatEveryHours = @RepeatEveryHours, RepeatEveryDays = @RepeatEveryDays, RepeatOnMonthly = @RepeatOnMonthly,
                    RepeatOnYearly = @RepeatOnYearly, EndRepeatDate = @EndRepeatDate, Status = @Status,
                    RecurrenceRule = @RecurrenceRule, RecurrenceException = @RecurrenceException, ParticipantType = @ParticipantType,
                    SubjectType = @SubjectType, ExcludeWeekends = @ExcludeWeekends, FirstCreatedBy = @FirstCreatedBy,
                    FirstCreatedDate = @FirstCreatedDate, EventEnvironment = @EventEnvironment, CalendarEventResultId = @CalendarEventResultId,
                    GoogleCalendarEventCreatedMail = @GoogleCalendarEventCreatedMail, SubjectTypeTr = @SubjectTypeTr, TypeTr = @TypeTr,
                    StatusTr = @StatusTr, EventEnvironmentTr = @EventEnvironmentTr, ParticipantTypeTr = @ParticipantTypeTr,
                    _SyncedAt = GETUTCDATE()
            WHEN NOT MATCHED THEN
                INSERT (
                    Id, OwnerId, Subject, Type, Description, 
                    StartDate, FinishDate, Location, AccountId, LeadId, 
                    ContactId, CompanyId, ParentEventId, IsAllDay, IsRepeat, 
                    IsReminderSet, IsNewAccount, RepeatPattern, RepeatEvery, MonthForRepeatOnYearly, 
                    EndRepeat, AfterOccurrenceCount, TimeBeforeEvent, RepeatEveryHours, RepeatEveryDays, 
                    RepeatOnMonthly, RepeatOnYearly, EndRepeatDate, Status, RecurrenceRule, 
                    RecurrenceException, ParticipantType, SubjectType, ExcludeWeekends, FirstCreatedBy, 
                    FirstCreatedDate, EventEnvironment, CalendarEventResultId, GoogleCalendarEventCreatedMail, SubjectTypeTr, 
                    TypeTr, StatusTr, EventEnvironmentTr, ParticipantTypeTr, _SyncedAt
                ) VALUES (
                    @Id, @OwnerId, @Subject, @Type, @Description, 
                    @StartDate, @FinishDate, @Location, @AccountId, @LeadId, 
                    @ContactId, @CompanyId, @ParentEventId, @IsAllDay, @IsRepeat, 
                    @IsReminderSet, @IsNewAccount, @RepeatPattern, @RepeatEvery, @MonthForRepeatOnYearly, 
                    @EndRepeat, @AfterOccurrenceCount, @TimeBeforeEvent, @RepeatEveryHours, @RepeatEveryDays, 
                    @RepeatOnMonthly, @RepeatOnYearly, @EndRepeatDate, @Status, @RecurrenceRule, 
                    @RecurrenceException, @ParticipantType, @SubjectType, @ExcludeWeekends, @FirstCreatedBy, 
                    @FirstCreatedDate, @EventEnvironment, @CalendarEventResultId, @GoogleCalendarEventCreatedMail, @SubjectTypeTr, 
                    @TypeTr, @StatusTr, @EventEnvironmentTr, @ParticipantTypeTr, GETUTCDATE()
                );
        ` : `
            INSERT INTO CalenderEvent (
                Id, OwnerId, Subject, Type, Description, 
                StartDate, FinishDate, Location, AccountId, LeadId, 
                ContactId, CompanyId, ParentEventId, IsAllDay, IsRepeat, 
                IsReminderSet, IsNewAccount, RepeatPattern, RepeatEvery, MonthForRepeatOnYearly, 
                EndRepeat, AfterOccurrenceCount, TimeBeforeEvent, RepeatEveryHours, RepeatEveryDays, 
                RepeatOnMonthly, RepeatOnYearly, EndRepeatDate, Status, RecurrenceRule, 
                RecurrenceException, ParticipantType, SubjectType, ExcludeWeekends, FirstCreatedBy, 
                FirstCreatedDate, EventEnvironment, CalendarEventResultId, GoogleCalendarEventCreatedMail, SubjectTypeTr, 
                TypeTr, StatusTr, EventEnvironmentTr, ParticipantTypeTr
            ) VALUES (
                @Id, @OwnerId, @Subject, @Type, @Description, 
                @StartDate, @FinishDate, @Location, @AccountId, @LeadId, 
                @ContactId, @CompanyId, @ParentEventId, @IsAllDay, @IsRepeat, 
                @IsReminderSet, @IsNewAccount, @RepeatPattern, @RepeatEvery, @MonthForRepeatOnYearly, 
                @EndRepeat, @AfterOccurrenceCount, @TimeBeforeEvent, @RepeatEveryHours, @RepeatEveryDays, 
                @RepeatOnMonthly, @RepeatOnYearly, @EndRepeatDate, @Status, @RecurrenceRule, 
                @RecurrenceException, @ParticipantType, @SubjectType, @ExcludeWeekends, @FirstCreatedBy, 
                @FirstCreatedDate, @EventEnvironment, @CalendarEventResultId, @GoogleCalendarEventCreatedMail, @SubjectTypeTr, 
                @TypeTr, @StatusTr, @EventEnvironmentTr, @ParticipantTypeTr
            )
            ON CONFLICT(Id) DO UPDATE SET
                OwnerId = excluded.OwnerId, Subject = excluded.Subject, Type = excluded.Type, Description = excluded.Description,
                StartDate = excluded.StartDate, FinishDate = excluded.FinishDate, Location = excluded.Location,
                AccountId = excluded.AccountId, LeadId = excluded.LeadId, ContactId = excluded.ContactId,
                CompanyId = excluded.CompanyId, ParentEventId = excluded.ParentEventId, IsAllDay = excluded.IsAllDay,
                IsRepeat = excluded.IsRepeat, IsReminderSet = excluded.IsReminderSet, IsNewAccount = excluded.IsNewAccount,
                RepeatPattern = excluded.RepeatPattern, RepeatEvery = excluded.RepeatEvery, MonthForRepeatOnYearly = excluded.MonthForRepeatOnYearly,
                EndRepeat = excluded.EndRepeat, AfterOccurrenceCount = excluded.AfterOccurrenceCount, TimeBeforeEvent = excluded.TimeBeforeEvent,
                RepeatEveryHours = excluded.RepeatEveryHours, RepeatEveryDays = excluded.RepeatEveryDays, RepeatOnMonthly = excluded.RepeatOnMonthly,
                RepeatOnYearly = excluded.RepeatOnYearly, EndRepeatDate = excluded.EndRepeatDate, Status = excluded.Status,
                RecurrenceRule = excluded.RecurrenceRule, RecurrenceException = excluded.RecurrenceException, ParticipantType = excluded.ParticipantType,
                SubjectType = excluded.SubjectType, ExcludeWeekends = excluded.ExcludeWeekends, FirstCreatedBy = excluded.FirstCreatedBy,
                FirstCreatedDate = excluded.FirstCreatedDate, EventEnvironment = excluded.EventEnvironment, CalendarEventResultId = excluded.CalendarEventResultId,
                GoogleCalendarEventCreatedMail = excluded.GoogleCalendarEventCreatedMail, SubjectTypeTr = excluded.SubjectTypeTr, TypeTr = excluded.TypeTr,
                StatusTr = excluded.StatusTr, EventEnvironmentTr = excluded.EventEnvironmentTr, ParticipantTypeTr = excluded.ParticipantTypeTr,
                _SyncedAt = datetime('now')
        `;

        const wasInserted = db.transaction(() => {
            // 1. Upsert main CalenderEvent record
            const result = db.execute(upsertEventSql, {
                Id: payload.Id,
                OwnerId: payload.OwnerId,
                Subject: payload.Subject,
                Type: payload.Type,
                Description: payload.Description ?? null,
                StartDate: payload.StartDate ?? null,
                FinishDate: payload.FinishDate ?? null,
                Location: payload.Location ?? null,
                AccountId: payload.AccountId ?? null,
                LeadId: payload.LeadId ?? null,
                ContactId: payload.ContactId ?? null,
                CompanyId: payload.CompanyId ?? null,
                ParentEventId: payload.ParentEventId ?? null,
                IsAllDay: payload.IsAllDay,
                IsRepeat: payload.IsRepeat,
                IsReminderSet: payload.IsReminderSet,
                IsNewAccount: payload.IsNewAccount ?? null,
                RepeatPattern: payload.RepeatPattern ?? null,
                RepeatEvery: payload.RepeatEvery ?? null,
                MonthForRepeatOnYearly: payload.MonthForRepeatOnYearly ?? null,
                EndRepeat: payload.EndRepeat ?? null,
                AfterOccurrenceCount: payload.AfterOccurrenceCount ?? null,
                TimeBeforeEvent: payload.TimeBeforeEvent ?? null,
                RepeatEveryHours: payload.RepeatEveryHours ?? null,
                RepeatEveryDays: payload.RepeatEveryDays ?? null,
                RepeatOnMonthly: payload.RepeatOnMonthly ?? null,
                RepeatOnYearly: payload.RepeatOnYearly ?? null,
                EndRepeatDate: payload.EndRepeatDate ?? null,
                Status: payload.Status,
                RecurrenceRule: payload.RecurrenceRule ?? null,
                RecurrenceException: payload.RecurrenceException ?? null,
                ParticipantType: payload.ParticipantType ?? null,
                SubjectType: payload.SubjectType ?? null,
                ExcludeWeekends: payload.ExcludeWeekends ?? null,
                FirstCreatedBy: payload.FirstCreatedBy ?? null,
                FirstCreatedDate: payload.FirstCreatedDate ?? null,
                EventEnvironment: payload.EventEnvironment ?? null,
                CalendarEventResultId: payload.CalendarEventResultId ?? null,
                GoogleCalendarEventCreatedMail: payload.GoogleCalendarEventCreatedMail ?? null,
                SubjectTypeTr: payload.SubjectTypeTr ?? null,
                TypeTr: payload.TypeTr ?? null,
                StatusTr: payload.StatusTr ?? null,
                EventEnvironmentTr: payload.EventEnvironmentTr ?? null,
                ParticipantTypeTr: payload.ParticipantTypeTr ?? null
            });

            // 2. Replace Repeat Days atomically
            db.execute(`DELETE FROM CalenderEventDaysForRepeatOnWeekly WHERE CalenderEventId = @id`, { id: payload.Id });
            if (payload.DaysForRepeatOnWeekly && payload.DaysForRepeatOnWeekly.length > 0) {
                const insertDaySql = `INSERT INTO CalenderEventDaysForRepeatOnWeekly (Id, CalenderEventId, Day) VALUES (@Id, @CalenderEventId, @Day)`;
                for (const row of payload.DaysForRepeatOnWeekly) {
                    db.execute(insertDaySql, { Id: row.Id, CalenderEventId: payload.Id, Day: row.Day });
                }
            }

            // 3. Replace Participant People atomically
            db.execute(`DELETE FROM CalenderEventParticipantPeople WHERE CalenderEventId = @id`, { id: payload.Id });
            if (payload.ParticipantPeople && payload.ParticipantPeople.length > 0) {
                const insertPersonSql = `INSERT INTO CalenderEventParticipantPeople (Id, CalenderEventId, ParticipantPersonId) VALUES (@Id, @CalenderEventId, @ParticipantPersonId)`;
                for (const row of payload.ParticipantPeople) {
                    db.execute(insertPersonSql, { Id: row.Id, CalenderEventId: payload.Id, ParticipantPersonId: row.ParticipantPersonId });
                }
            }

            // 4. Replace Participant Leads atomically
            db.execute(`DELETE FROM CalenderEventParticipantLeads WHERE CalenderEventId = @id`, { id: payload.Id });
            if (payload.ParticipantLeads && payload.ParticipantLeads.length > 0) {
                const insertLeadSql = `INSERT INTO CalenderEventParticipantLeads (Id, CalenderEventId, ParticipantLeadId) VALUES (@Id, @CalenderEventId, @ParticipantLeadId)`;
                for (const row of payload.ParticipantLeads) {
                    db.execute(insertLeadSql, { Id: row.Id, CalenderEventId: payload.Id, ParticipantLeadId: row.ParticipantLeadId });
                }
            }

            // 5. Replace Participant Contacts atomically
            db.execute(`DELETE FROM CalenderEventParticipantContacts WHERE CalenderEventId = @id`, { id: payload.Id });
            if (payload.ParticipantContacts && payload.ParticipantContacts.length > 0) {
                const insertContactSql = `INSERT INTO CalenderEventParticipantContacts (Id, CalenderEventId, ParticipantContactId) VALUES (@Id, @CalenderEventId, @ParticipantContactId)`;
                for (const row of payload.ParticipantContacts) {
                    db.execute(insertContactSql, { Id: row.Id, CalenderEventId: payload.Id, ParticipantContactId: row.ParticipantContactId });
                }
            }

            return result.changes === 1;
        });


        res.json({
            status: 'ok',
            upserted: wasInserted,
            id: payload.Id,
            syncedAt: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('[CalenderEvent Sync Error]', error);
        res.status(400).json({ status: 'error', message: error.message || 'Verification Failed' });
    }
});

export default router;
