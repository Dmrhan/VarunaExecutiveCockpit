import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { z } from 'zod';

const router = Router();

// Zod Schema representing the C# IContacts model
const contactsSchema = z.object({
    Id: z.string(),
    CompanyId: z.string().nullable().optional(),
    PersonalTitle: z.number().nullable().optional(),
    FirstName: z.string().nullable().optional(),
    LastName: z.string().nullable().optional(),
    Position: z.string().nullable().optional(),
    Email: z.string().nullable().optional(),
    ContactOwnerId: z.string().nullable().optional(),
    MobilePhone: z.string().nullable().optional(),
    Phone: z.string().nullable().optional(),
    AccountNameId: z.string().nullable().optional(),
    FirstTouchDate: z.string().nullable().optional(),
    SDROwnerId: z.string().nullable().optional(),
    SecondaryEmail: z.string().nullable().optional(),
    LastDate: z.string().nullable().optional(),
    Description: z.string().nullable().optional(),
    Website: z.string().nullable().optional(),
    BirthDate: z.string().nullable().optional(),
    MemberId: z.string().nullable().optional(),
    AccountStatus: z.number().nullable().optional(),
    BlackList: z.number().nullable().optional(),
    RecordDate: z.string().nullable().optional(),
    Importance: z.number().nullable().optional(),
    CreditQuantity: z.number().nullable().optional(),
    EducationStatus: z.number().nullable().optional(),
    WorkingType: z.number().nullable().optional(),
    Profession: z.number().nullable().optional(),
    Title: z.number().nullable().optional(),
    PayDay: z.string().nullable().optional(),
    CustomerType: z.number().nullable().optional(),
    FirstSave: z.number().nullable().optional(),
    ContactNameSurname: z.string().nullable().optional(),
    FirstCreatedDate: z.string().nullable().optional(),
    FirstCreatedByName: z.string().nullable().optional(),
    TCKN: z.string().nullable().optional(),
    ContactCode: z.string().nullable().optional(),
    BirthPlace: z.string().nullable().optional(),
    MarketingAuthorizationviaGSM: z.number().nullable().optional(),
    MarketingAuthorizationviaEmail: z.number().nullable().optional(),
    Gender: z.number().nullable().optional(),
    ContactAutoNumberNextGen: z.number().nullable().optional(),
    RefCode: z.string().nullable().optional(),
    InRefCode: z.string().nullable().optional(),
    CommunicationInfo: z.number().nullable().optional(),
    AddToAccountContacts: z.number().nullable().optional(),
    AccountContactId: z.string().nullable().optional(),
    CreatedFromAccountListener: z.number().nullable().optional(),

    // Detail collections
    ContactNotes: z.array(z.object({
        CreatedOn: z.string().nullable().optional(),
        Note: z.string().nullable().optional(),
        CreatedBy: z.string().nullable().optional()
    })).nullable().optional(),

    ContactAddressDetail: z.array(z.object({
        Country: z.string().nullable().optional(),
        Subdivision1: z.string().nullable().optional(),
        Subdivision2: z.string().nullable().optional(),
        Subdivision3: z.string().nullable().optional(),
        Subdivision4: z.string().nullable().optional(),
        AddressLine: z.string().nullable().optional()
    })).nullable().optional(),

    BusinessPartners: z.array(z.object({
        BusinessPartnerId: z.string().nullable().optional()
    })).nullable().optional(),

    ContactFiles: z.array(z.object({
        FilePath: z.string().nullable().optional(),
        FileName: z.string().nullable().optional(),
        FileType: z.string().nullable().optional()
    })).nullable().optional()
});

router.post('/', (req: Request, res: Response) => {
    try {
        const payload = contactsSchema.parse(req.body);
        const db = getDb();

        const upsertContact = db.prepare(`
            INSERT INTO Contacts (
                Id, CompanyId, PersonalTitle, FirstName, LastName, Position, Email, ContactOwnerId,
                MobilePhone, Phone, AccountNameId, FirstTouchDate, SDROwnerId, SecondaryEmail, LastDate,
                Description, Website, BirthDate, MemberId, AccountStatus, BlackList, RecordDate, Importance,
                CreditQuantity, EducationStatus, WorkingType, Profession, Title, PayDay, CustomerType, FirstSave,
                ContactNameSurname, FirstCreatedDate, FirstCreatedByName, TCKN, ContactCode, BirthPlace,
                MarketingAuthorizationviaGSM, MarketingAuthorizationviaEmail, Gender, ContactAutoNumberNextGen,
                RefCode, InRefCode, CommunicationInfo, AddToAccountContacts, AccountContactId, CreatedFromAccountListener
            ) VALUES (
                @Id, @CompanyId, @PersonalTitle, @FirstName, @LastName, @Position, @Email, @ContactOwnerId,
                @MobilePhone, @Phone, @AccountNameId, @FirstTouchDate, @SDROwnerId, @SecondaryEmail, @LastDate,
                @Description, @Website, @BirthDate, @MemberId, @AccountStatus, @BlackList, @RecordDate, @Importance,
                @CreditQuantity, @EducationStatus, @WorkingType, @Profession, @Title, @PayDay, @CustomerType, @FirstSave,
                @ContactNameSurname, @FirstCreatedDate, @FirstCreatedByName, @TCKN, @ContactCode, @BirthPlace,
                @MarketingAuthorizationviaGSM, @MarketingAuthorizationviaEmail, @Gender, @ContactAutoNumberNextGen,
                @RefCode, @InRefCode, @CommunicationInfo, @AddToAccountContacts, @AccountContactId, @CreatedFromAccountListener
            )
            ON CONFLICT(Id) DO UPDATE SET
                CompanyId = excluded.CompanyId, PersonalTitle = excluded.PersonalTitle, FirstName = excluded.FirstName,
                LastName = excluded.LastName, Position = excluded.Position, Email = excluded.Email,
                ContactOwnerId = excluded.ContactOwnerId, MobilePhone = excluded.MobilePhone, Phone = excluded.Phone,
                AccountNameId = excluded.AccountNameId, FirstTouchDate = excluded.FirstTouchDate, SDROwnerId = excluded.SDROwnerId,
                SecondaryEmail = excluded.SecondaryEmail, LastDate = excluded.LastDate, Description = excluded.Description,
                Website = excluded.Website, BirthDate = excluded.BirthDate, MemberId = excluded.MemberId,
                AccountStatus = excluded.AccountStatus, BlackList = excluded.BlackList, RecordDate = excluded.RecordDate,
                Importance = excluded.Importance, CreditQuantity = excluded.CreditQuantity, EducationStatus = excluded.EducationStatus,
                WorkingType = excluded.WorkingType, Profession = excluded.Profession, Title = excluded.Title, PayDay = excluded.PayDay,
                CustomerType = excluded.CustomerType, FirstSave = excluded.FirstSave, ContactNameSurname = excluded.ContactNameSurname,
                FirstCreatedDate = excluded.FirstCreatedDate, FirstCreatedByName = excluded.FirstCreatedByName, TCKN = excluded.TCKN,
                ContactCode = excluded.ContactCode, BirthPlace = excluded.BirthPlace,
                MarketingAuthorizationviaGSM = excluded.MarketingAuthorizationviaGSM, MarketingAuthorizationviaEmail = excluded.MarketingAuthorizationviaEmail,
                Gender = excluded.Gender, ContactAutoNumberNextGen = excluded.ContactAutoNumberNextGen, RefCode = excluded.RefCode,
                InRefCode = excluded.InRefCode, CommunicationInfo = excluded.CommunicationInfo,
                AddToAccountContacts = excluded.AddToAccountContacts, AccountContactId = excluded.AccountContactId,
                CreatedFromAccountListener = excluded.CreatedFromAccountListener,
                _SyncedAt = datetime('now')
        `);

        // Prepare statements for Detail Tables
        const insertNote = db.prepare('INSERT INTO ContactNotes (ContactId, CreatedOn, Note, CreatedBy) VALUES (?, ?, ?, ?)');
        const insertAddress = db.prepare('INSERT INTO ContactAddressDetail (ContactId, Country, Subdivision1, Subdivision2, Subdivision3, Subdivision4, AddressLine) VALUES (?, ?, ?, ?, ?, ?, ?)');
        const insertBiz = db.prepare('INSERT INTO BusinessPartners (ContactId, BusinessPartnerId) VALUES (?, ?)');
        const insertFile = db.prepare('INSERT INTO ContactFiles (ContactId, FilePath, FileName, FileType) VALUES (?, ?, ?, ?)');

        // Run as a transaction
        const syncTransaction = db.transaction((data) => {
            // 1. Upsert Contacts
            const info = upsertContact.run({
                Id: data.Id,
                CompanyId: data.CompanyId ?? null,
                PersonalTitle: data.PersonalTitle ?? null,
                FirstName: data.FirstName ?? null,
                LastName: data.LastName ?? null,
                Position: data.Position ?? null,
                Email: data.Email ?? null,
                ContactOwnerId: data.ContactOwnerId ?? null,
                MobilePhone: data.MobilePhone ?? null,
                Phone: data.Phone ?? null,
                AccountNameId: data.AccountNameId ?? null,
                FirstTouchDate: data.FirstTouchDate ?? null,
                SDROwnerId: data.SDROwnerId ?? null,
                SecondaryEmail: data.SecondaryEmail ?? null,
                LastDate: data.LastDate ?? null,
                Description: data.Description ?? null,
                Website: data.Website ?? null,
                BirthDate: data.BirthDate ?? null,
                MemberId: data.MemberId ?? null,
                AccountStatus: data.AccountStatus ?? null,
                BlackList: data.BlackList ?? null,
                RecordDate: data.RecordDate ?? null,
                Importance: data.Importance ?? null,
                CreditQuantity: data.CreditQuantity ?? null,
                EducationStatus: data.EducationStatus ?? null,
                WorkingType: data.WorkingType ?? null,
                Profession: data.Profession ?? null,
                Title: data.Title ?? null,
                PayDay: data.PayDay ?? null,
                CustomerType: data.CustomerType ?? null,
                FirstSave: data.FirstSave ?? null,
                ContactNameSurname: data.ContactNameSurname ?? null,
                FirstCreatedDate: data.FirstCreatedDate ?? null,
                FirstCreatedByName: data.FirstCreatedByName ?? null,
                TCKN: data.TCKN ?? null,
                ContactCode: data.ContactCode ?? null,
                BirthPlace: data.BirthPlace ?? null,
                MarketingAuthorizationviaGSM: data.MarketingAuthorizationviaGSM ?? null,
                MarketingAuthorizationviaEmail: data.MarketingAuthorizationviaEmail ?? null,
                Gender: data.Gender ?? null,
                ContactAutoNumberNextGen: data.ContactAutoNumberNextGen ?? null,
                RefCode: data.RefCode ?? null,
                InRefCode: data.InRefCode ?? null,
                CommunicationInfo: data.CommunicationInfo ?? null,
                AddToAccountContacts: data.AddToAccountContacts ?? null,
                AccountContactId: data.AccountContactId ?? null,
                CreatedFromAccountListener: data.CreatedFromAccountListener ?? null
            });

            const isInsert = info.changes === 1;

            // 2. Clear old detail records
            db.prepare('DELETE FROM ContactNotes WHERE ContactId = ?').run(data.Id);
            db.prepare('DELETE FROM ContactAddressDetail WHERE ContactId = ?').run(data.Id);
            db.prepare('DELETE FROM BusinessPartners WHERE ContactId = ?').run(data.Id);
            db.prepare('DELETE FROM ContactFiles WHERE ContactId = ?').run(data.Id);

            // 3. Insert new detail records
            data.ContactNotes?.forEach((d: any) => insertNote.run(data.Id, d.CreatedOn ?? null, d.Note ?? null, d.CreatedBy ?? null));
            data.ContactAddressDetail?.forEach((d: any) => insertAddress.run(data.Id, d.Country ?? null, d.Subdivision1 ?? null, d.Subdivision2 ?? null, d.Subdivision3 ?? null, d.Subdivision4 ?? null, d.AddressLine ?? null));
            data.BusinessPartners?.forEach((d: any) => insertBiz.run(data.Id, d.BusinessPartnerId ?? null));
            data.ContactFiles?.forEach((d: any) => insertFile.run(data.Id, d.FilePath ?? null, d.FileName ?? null, d.FileType ?? null));

            return isInsert;
        });

        const wasInserted = syncTransaction(payload);

        res.json({
            status: 'ok',
            upserted: wasInserted,
            id: payload.Id,
            syncedAt: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('[Contacts Sync Error]', error);
        res.status(400).json({ status: 'error', message: error.message || 'Verification Failed' });
    }
});

export default router;
