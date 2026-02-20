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

        const upsertEvent = db.prepare(`
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
        `);

        // Prepare statements for child collections
        const deleteDays = db.prepare(`DELETE FROM CalenderEventDaysForRepeatOnWeekly WHERE CalenderEventId = ?`);
        const insertDay = db.prepare(`INSERT INTO CalenderEventDaysForRepeatOnWeekly (Id, CalenderEventId, Day) VALUES (@Id, @CalenderEventId, @Day)`);

        const deletePeople = db.prepare(`DELETE FROM CalenderEventParticipantPeople WHERE CalenderEventId = ?`);
        const insertPerson = db.prepare(`INSERT INTO CalenderEventParticipantPeople (Id, CalenderEventId, ParticipantPersonId) VALUES (@Id, @CalenderEventId, @ParticipantPersonId)`);

        const deleteLeads = db.prepare(`DELETE FROM CalenderEventParticipantLeads WHERE CalenderEventId = ?`);
        const insertLead = db.prepare(`INSERT INTO CalenderEventParticipantLeads (Id, CalenderEventId, ParticipantLeadId) VALUES (@Id, @CalenderEventId, @ParticipantLeadId)`);

        const deleteContacts = db.prepare(`DELETE FROM CalenderEventParticipantContacts WHERE CalenderEventId = ?`);
        const insertContact = db.prepare(`INSERT INTO CalenderEventParticipantContacts (Id, CalenderEventId, ParticipantContactId) VALUES (@Id, @CalenderEventId, @ParticipantContactId)`);

        // Run as a transaction
        const syncTransaction = db.transaction((data) => {
            // 1. Upsert main CalenderEvent record
            const info = upsertEvent.run({
                Id: data.Id,
                OwnerId: data.OwnerId,
                Subject: data.Subject,
                Type: data.Type,
                Description: data.Description ?? null,
                StartDate: data.StartDate ?? null,
                FinishDate: data.FinishDate ?? null,
                Location: data.Location ?? null,
                AccountId: data.AccountId ?? null,
                LeadId: data.LeadId ?? null,
                ContactId: data.ContactId ?? null,
                CompanyId: data.CompanyId ?? null,
                ParentEventId: data.ParentEventId ?? null,
                IsAllDay: data.IsAllDay,
                IsRepeat: data.IsRepeat,
                IsReminderSet: data.IsReminderSet,
                IsNewAccount: data.IsNewAccount ?? null,
                RepeatPattern: data.RepeatPattern ?? null,
                RepeatEvery: data.RepeatEvery ?? null,
                MonthForRepeatOnYearly: data.MonthForRepeatOnYearly ?? null,
                EndRepeat: data.EndRepeat ?? null,
                AfterOccurrenceCount: data.AfterOccurrenceCount ?? null,
                TimeBeforeEvent: data.TimeBeforeEvent ?? null,
                RepeatEveryHours: data.RepeatEveryHours ?? null,
                RepeatEveryDays: data.RepeatEveryDays ?? null,
                RepeatOnMonthly: data.RepeatOnMonthly ?? null,
                RepeatOnYearly: data.RepeatOnYearly ?? null,
                EndRepeatDate: data.EndRepeatDate ?? null,
                Status: data.Status,
                RecurrenceRule: data.RecurrenceRule ?? null,
                RecurrenceException: data.RecurrenceException ?? null,
                ParticipantType: data.ParticipantType ?? null,
                SubjectType: data.SubjectType ?? null,
                ExcludeWeekends: data.ExcludeWeekends ?? null,
                FirstCreatedBy: data.FirstCreatedBy ?? null,
                FirstCreatedDate: data.FirstCreatedDate ?? null,
                EventEnvironment: data.EventEnvironment ?? null,
                CalendarEventResultId: data.CalendarEventResultId ?? null,
                GoogleCalendarEventCreatedMail: data.GoogleCalendarEventCreatedMail ?? null,
                SubjectTypeTr: data.SubjectTypeTr ?? null,
                TypeTr: data.TypeTr ?? null,
                StatusTr: data.StatusTr ?? null,
                EventEnvironmentTr: data.EventEnvironmentTr ?? null,
                ParticipantTypeTr: data.ParticipantTypeTr ?? null
            });

            // 2. Replace Repeat Days atomically
            deleteDays.run(data.Id);
            if (data.DaysForRepeatOnWeekly && data.DaysForRepeatOnWeekly.length > 0) {
                for (const row of data.DaysForRepeatOnWeekly) {
                    insertDay.run({ Id: row.Id, CalenderEventId: data.Id, Day: row.Day });
                }
            }

            // 3. Replace Participant People atomically
            deletePeople.run(data.Id);
            if (data.ParticipantPeople && data.ParticipantPeople.length > 0) {
                for (const row of data.ParticipantPeople) {
                    insertPerson.run({ Id: row.Id, CalenderEventId: data.Id, ParticipantPersonId: row.ParticipantPersonId });
                }
            }

            // 4. Replace Participant Leads atomically
            deleteLeads.run(data.Id);
            if (data.ParticipantLeads && data.ParticipantLeads.length > 0) {
                for (const row of data.ParticipantLeads) {
                    insertLead.run({ Id: row.Id, CalenderEventId: data.Id, ParticipantLeadId: row.ParticipantLeadId });
                }
            }

            // 5. Replace Participant Contacts atomically
            deleteContacts.run(data.Id);
            if (data.ParticipantContacts && data.ParticipantContacts.length > 0) {
                for (const row of data.ParticipantContacts) {
                    insertContact.run({ Id: row.Id, CalenderEventId: data.Id, ParticipantContactId: row.ParticipantContactId });
                }
            }

            return info.changes === 1;
        });

        const wasInserted = syncTransaction(payload);

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
