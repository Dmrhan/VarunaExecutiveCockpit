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

        const binding = {
            Id: payload.Id,
            CompanyId: payload.CompanyId ?? null,
            PersonalTitle: payload.PersonalTitle ?? null,
            FirstName: payload.FirstName ?? null,
            LastName: payload.LastName ?? null,
            Position: payload.Position ?? null,
            Email: payload.Email ?? null,
            ContactOwnerId: payload.ContactOwnerId ?? null,
            MobilePhone: payload.MobilePhone ?? null,
            Phone: payload.Phone ?? null,
            AccountNameId: payload.AccountNameId ?? null,
            FirstTouchDate: payload.FirstTouchDate ?? null,
            SDROwnerId: payload.SDROwnerId ?? null,
            SecondaryEmail: payload.SecondaryEmail ?? null,
            LastDate: payload.LastDate ?? null,
            Description: payload.Description ?? null,
            Website: payload.Website ?? null,
            BirthDate: payload.BirthDate ?? null,
            MemberId: payload.MemberId ?? null,
            AccountStatus: payload.AccountStatus ?? null,
            BlackList: payload.BlackList ?? null,
            RecordDate: payload.RecordDate ?? null,
            Importance: payload.Importance ?? null,
            CreditQuantity: payload.CreditQuantity ?? null,
            EducationStatus: payload.EducationStatus ?? null,
            WorkingType: payload.WorkingType ?? null,
            Profession: payload.Profession ?? null,
            Title: payload.Title ?? null,
            PayDay: payload.PayDay ?? null,
            CustomerType: payload.CustomerType ?? null,
            FirstSave: payload.FirstSave ?? null,
            ContactNameSurname: payload.ContactNameSurname ?? null,
            FirstCreatedDate: payload.FirstCreatedDate ?? null,
            FirstCreatedByName: payload.FirstCreatedByName ?? null,
            TCKN: payload.TCKN ?? null,
            ContactCode: payload.ContactCode ?? null,
            BirthPlace: payload.BirthPlace ?? null,
            MarketingAuthorizationviaGSM: payload.MarketingAuthorizationviaGSM ?? null,
            MarketingAuthorizationviaEmail: payload.MarketingAuthorizationviaEmail ?? null,
            Gender: payload.Gender ?? null,
            ContactAutoNumberNextGen: payload.ContactAutoNumberNextGen ?? null,
            RefCode: payload.RefCode ?? null,
            InRefCode: payload.InRefCode ?? null,
            CommunicationInfo: payload.CommunicationInfo ?? null,
            AddToAccountContacts: payload.AddToAccountContacts ?? null,
            AccountContactId: payload.AccountContactId ?? null,
            CreatedFromAccountListener: payload.CreatedFromAccountListener ?? null
        };

        const existing = db.queryOne('SELECT Id FROM Contacts WHERE Id = ?', [payload.Id]);
        const isInsert = !existing;

        let upsertSql: string;
        if (db.driver === 'mssql') {
            upsertSql = `
                MERGE INTO Contacts AS target
                USING (SELECT @Id AS Id) AS source
                ON (target.Id = source.Id)
                WHEN MATCHED THEN
                    UPDATE SET
                        CompanyId = @CompanyId, PersonalTitle = @PersonalTitle, FirstName = @FirstName,
                        LastName = @LastName, Position = @Position, Email = @Email,
                        ContactOwnerId = @ContactOwnerId, MobilePhone = @MobilePhone, Phone = @Phone,
                        AccountNameId = @AccountNameId, FirstTouchDate = @FirstTouchDate, SDROwnerId = @SDROwnerId,
                        SecondaryEmail = @SecondaryEmail, LastDate = @LastDate, Description = @Description,
                        Website = @Website, BirthDate = @BirthDate, MemberId = @MemberId,
                        AccountStatus = @AccountStatus, BlackList = @BlackList, RecordDate = @RecordDate,
                        Importance = @Importance, CreditQuantity = @CreditQuantity, EducationStatus = @EducationStatus,
                        WorkingType = @WorkingType, Profession = @Profession, [Title] = @Title, PayDay = @PayDay,
                        CustomerType = @CustomerType, FirstSave = @FirstSave, ContactNameSurname = @ContactNameSurname,
                        FirstCreatedDate = @FirstCreatedDate, FirstCreatedByName = @FirstCreatedByName, TCKN = @TCKN,
                        ContactCode = @ContactCode, BirthPlace = @BirthPlace,
                        MarketingAuthorizationviaGSM = @MarketingAuthorizationviaGSM, MarketingAuthorizationviaEmail = @MarketingAuthorizationviaEmail,
                        Gender = @Gender, ContactAutoNumberNextGen = @ContactAutoNumberNextGen, RefCode = @RefCode,
                        InRefCode = @InRefCode, CommunicationInfo = @CommunicationInfo,
                        AddToAccountContacts = @AddToAccountContacts, AccountContactId = @AccountContactId,
                        CreatedFromAccountListener = @CreatedFromAccountListener, _SyncedAt = GETUTCDATE()
                WHEN NOT MATCHED THEN
                    INSERT (
                        Id, CompanyId, PersonalTitle, FirstName, LastName, Position, Email, ContactOwnerId,
                        MobilePhone, Phone, AccountNameId, FirstTouchDate, SDROwnerId, SecondaryEmail, LastDate,
                        Description, Website, BirthDate, MemberId, AccountStatus, BlackList, RecordDate, Importance,
                        CreditQuantity, EducationStatus, WorkingType, Profession, [Title], PayDay, CustomerType, FirstSave,
                        ContactNameSurname, FirstCreatedDate, FirstCreatedByName, TCKN, ContactCode, BirthPlace,
                        MarketingAuthorizationviaGSM, MarketingAuthorizationviaEmail, Gender, ContactAutoNumberNextGen,
                        RefCode, InRefCode, CommunicationInfo, AddToAccountContacts, AccountContactId, CreatedFromAccountListener,
                        _SyncedAt
                    ) VALUES (
                        @Id, @CompanyId, @PersonalTitle, @FirstName, @LastName, @Position, @Email, @ContactOwnerId,
                        @MobilePhone, @Phone, @AccountNameId, @FirstTouchDate, @SDROwnerId, @SecondaryEmail, @LastDate,
                        @Description, @Website, @BirthDate, @MemberId, @AccountStatus, @BlackList, @RecordDate, @Importance,
                        @CreditQuantity, @EducationStatus, @WorkingType, @Profession, @Title, @PayDay, @CustomerType, @FirstSave,
                        @ContactNameSurname, @FirstCreatedDate, @FirstCreatedByName, @TCKN, @ContactCode, @BirthPlace,
                        @MarketingAuthorizationviaGSM, @MarketingAuthorizationviaEmail, @Gender, @ContactAutoNumberNextGen,
                        @RefCode, @InRefCode, @CommunicationInfo, @AddToAccountContacts, @AccountContactId, @CreatedFromAccountListener,
                        GETUTCDATE()
                    );
            `;
        } else {
            upsertSql = `
                INSERT INTO Contacts (
                    Id, CompanyId, PersonalTitle, FirstName, LastName, Position, Email, ContactOwnerId,
                    MobilePhone, Phone, AccountNameId, FirstTouchDate, SDROwnerId, SecondaryEmail, LastDate,
                    Description, Website, BirthDate, MemberId, AccountStatus, BlackList, RecordDate, Importance,
                    CreditQuantity, EducationStatus, WorkingType, Profession, Title, PayDay, CustomerType, FirstSave,
                    ContactNameSurname, FirstCreatedDate, FirstCreatedByName, TCKN, ContactCode, BirthPlace,
                    MarketingAuthorizationviaGSM, MarketingAuthorizationviaEmail, Gender, ContactAutoNumberNextGen,
                    RefCode, InRefCode, CommunicationInfo, AddToAccountContacts, AccountContactId, CreatedFromAccountListener,
                    _SyncedAt
                ) VALUES (
                    :Id, :CompanyId, :PersonalTitle, :FirstName, :LastName, :Position, :Email, :ContactOwnerId,
                    :MobilePhone, :Phone, :AccountNameId, :FirstTouchDate, :SDROwnerId, :SecondaryEmail, :LastDate,
                    :Description, :Website, :BirthDate, :MemberId, :AccountStatus, :BlackList, :RecordDate, :Importance,
                    :CreditQuantity, :EducationStatus, :WorkingType, :Profession, :Title, :PayDay, :CustomerType, :FirstSave,
                    :ContactNameSurname, :FirstCreatedDate, :FirstCreatedByName, :TCKN, :ContactCode, :BirthPlace,
                    :MarketingAuthorizationviaGSM, :MarketingAuthorizationviaEmail, :Gender, :ContactAutoNumberNextGen,
                    :RefCode, :InRefCode, :CommunicationInfo, :AddToAccountContacts, :AccountContactId, :CreatedFromAccountListener,
                    datetime('now')
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
            `;
        }

        db.transaction(() => {
            db.execute(upsertSql, binding);

            db.execute('DELETE FROM ContactNotes WHERE ContactId = ?', [payload.Id]);
            db.execute('DELETE FROM ContactAddressDetail WHERE ContactId = ?', [payload.Id]);
            db.execute('DELETE FROM BusinessPartners WHERE ContactId = ?', [payload.Id]);
            db.execute('DELETE FROM ContactFiles WHERE ContactId = ?', [payload.Id]);

            payload.ContactNotes?.forEach((d: any) => db.execute('INSERT INTO ContactNotes (ContactId, CreatedOn, Note, CreatedBy) VALUES (?, ?, ?, ?)', [payload.Id, d.CreatedOn ?? null, d.Note ?? null, d.CreatedBy ?? null]));
            payload.ContactAddressDetail?.forEach((d: any) => db.execute('INSERT INTO ContactAddressDetail (ContactId, Country, Subdivision1, Subdivision2, Subdivision3, Subdivision4, AddressLine) VALUES (?, ?, ?, ?, ?, ?, ?)', [payload.Id, d.Country ?? null, d.Subdivision1 ?? null, d.Subdivision2 ?? null, d.Subdivision3 ?? null, d.Subdivision4 ?? null, d.AddressLine ?? null]));
            payload.BusinessPartners?.forEach((d: any) => db.execute('INSERT INTO BusinessPartners (ContactId, BusinessPartnerId) VALUES (?, ?)', [payload.Id, d.BusinessPartnerId ?? null]));
            payload.ContactFiles?.forEach((d: any) => db.execute('INSERT INTO ContactFiles (ContactId, FilePath, FileName, FileType) VALUES (?, ?, ?, ?)', [payload.Id, d.FilePath ?? null, d.FileName ?? null, d.FileType ?? null]));
        });

        res.json({
            status: 'ok',
            upserted: isInsert,
            id: payload.Id,
            syncedAt: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('[Contacts Sync Error]', error);
        res.status(400).json({ status: 'error', message: error.message || 'Verification Failed' });
    }
});

export default router;
