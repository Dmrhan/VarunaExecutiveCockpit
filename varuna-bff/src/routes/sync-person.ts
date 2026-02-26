import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { z } from 'zod';

const router = Router();

// Zod Schema representing the C# IPerson model
const personSchema = z.object({
    Id: z.string(),
    Name: z.string(),
    SurName: z.string(),
    Title: z.string().nullable().optional(),
    Email: z.string().nullable().optional(),
    CellPhone: z.string().nullable().optional(),
    Phone: z.string().nullable().optional(),
    EmploymentDate: z.string().nullable().optional(),
    EndOfEmploymentDate: z.string().nullable().optional(),
    UserName: z.string().nullable().optional(),
    IdentificationNumber: z.string().nullable().optional(),
    Nationality: z.string().nullable().optional(),
    BirthDate: z.string().nullable().optional(),
    Gender: z.number().nullable().optional(),
    MaritalStatus: z.number().nullable().optional(),
    NumberOfChildren: z.number().nullable().optional(),
    BloodType: z.number().nullable().optional(),
    Height: z.number().nullable().optional(),
    Weight: z.number().nullable().optional(),
    Size: z.number().nullable().optional(),
    ShoeSize: z.number().nullable().optional(),
    ManagerId: z.string().nullable().optional(),
    Status: z.number().nullable().optional(),
    DealerId: z.string().nullable().optional(),
    RoleId: z.string().nullable().optional(),
    MaxDiscountRate: z.number().nullable().optional(),
    CompanyId: z.string().nullable().optional(),
    PersonNameSurname: z.string().nullable().optional(),
    ManagerType: z.number().nullable().optional(),
    PlaCod: z.string().nullable().optional(),

    // Complex Types
    AddressInfo: z.object({
        City: z.string().nullable().optional(),
        Town: z.string().nullable().optional(),
        AddressLine: z.string().nullable().optional(),
        PostalCode: z.string().nullable().optional(),
        Country: z.string().nullable().optional()
    }).nullable().optional(),

    // Detail collections
    Education: z.array(z.object({
        EducationType: z.number().nullable().optional(),
        FieldOfStudy: z.string().nullable().optional(),
        SchoolName: z.string().nullable().optional(),
        StartYear: z.number().nullable().optional(),
        EndYear: z.number().nullable().optional()
    })).nullable().optional(),

    PersonFile: z.array(z.object({
        FilePath: z.string().nullable().optional(),
        FileName: z.string().nullable().optional(),
        FileType: z.string().nullable().optional()
    })).nullable().optional(),

    Companies: z.array(z.object({
        CompanyId: z.string().nullable().optional()
    })).nullable().optional()
});

router.post('/', (req: Request, res: Response) => {
    try {
        const payload = personSchema.parse(req.body);
        const db = getDb();

        const binding = {
            Id: payload.Id,
            Name: payload.Name,
            SurName: payload.SurName,
            Title: payload.Title || null,
            Email: payload.Email || null,
            CellPhone: payload.CellPhone || null,
            Phone: payload.Phone || null,
            EmploymentDate: payload.EmploymentDate || null,
            EndOfEmploymentDate: payload.EndOfEmploymentDate || null,
            UserName: payload.UserName || null,
            IdentificationNumber: payload.IdentificationNumber || null,
            Nationality: payload.Nationality || null,
            BirthDate: payload.BirthDate || null,
            Gender: payload.Gender ?? null,
            MaritalStatus: payload.MaritalStatus ?? null,
            NumberOfChildren: payload.NumberOfChildren ?? null,
            BloodType: payload.BloodType ?? null,
            Height: payload.Height ?? null,
            Weight: payload.Weight ?? null,
            Size: payload.Size ?? null,
            ShoeSize: payload.ShoeSize ?? null,
            ManagerId: payload.ManagerId || null,
            Status: payload.Status ?? null,
            DealerId: payload.DealerId || null,
            RoleId: payload.RoleId || null,
            MaxDiscountRate: payload.MaxDiscountRate ?? null,
            CompanyId: payload.CompanyId || null,
            PersonNameSurname: payload.PersonNameSurname || null,
            ManagerType: payload.ManagerType ?? null,
            PlaCod: payload.PlaCod || null,
            AddressInfo_City: payload.AddressInfo?.City || null,
            AddressInfo_Town: payload.AddressInfo?.Town || null,
            AddressInfo_AddressLine: payload.AddressInfo?.AddressLine || null,
            AddressInfo_PostalCode: payload.AddressInfo?.PostalCode || null,
            AddressInfo_Country: payload.AddressInfo?.Country || null
        };

        const existing = db.queryOne('SELECT Id FROM Person WHERE Id = ?', [payload.Id]);
        const isInsert = !existing;

        let upsertSql: string;
        if (db.driver === 'mssql') {
            upsertSql = `
                MERGE INTO Person AS target
                USING (SELECT @Id AS Id) AS source
                ON (target.Id = source.Id)
                WHEN MATCHED THEN
                    UPDATE SET
                        Name = @Name, SurName = @SurName, Title = @Title, Email = @Email, CellPhone = @CellPhone,
                        Phone = @Phone, EmploymentDate = @EmploymentDate, EndOfEmploymentDate = @EndOfEmploymentDate,
                        UserName = @UserName, IdentificationNumber = @IdentificationNumber, Nationality = @Nationality,
                        BirthDate = @BirthDate, Gender = @Gender, MaritalStatus = @MaritalStatus,
                        NumberOfChildren = @NumberOfChildren, BloodType = @BloodType, Height = @Height,
                        Weight = @Weight, Size = @Size, ShoeSize = @ShoeSize, ManagerId = @ManagerId,
                        Status = @Status, DealerId = @DealerId, RoleId = @RoleId, MaxDiscountRate = @MaxDiscountRate,
                        CompanyId = @CompanyId, PersonNameSurname = @PersonNameSurname, ManagerType = @ManagerType,
                        PlaCod = @PlaCod, AddressInfo_City = @AddressInfo_City, AddressInfo_Town = @AddressInfo_Town,
                        AddressInfo_AddressLine = @AddressInfo_AddressLine, AddressInfo_PostalCode = @AddressInfo_PostalCode,
                        AddressInfo_Country = @AddressInfo_Country, _SyncedAt = GETUTCDATE()
                WHEN NOT MATCHED THEN
                    INSERT (
                        Id, Name, SurName, Title, Email, CellPhone, Phone, EmploymentDate, EndOfEmploymentDate,
                        UserName, IdentificationNumber, Nationality, BirthDate, Gender, MaritalStatus,
                        NumberOfChildren, BloodType, Height, Weight, Size, ShoeSize, ManagerId, Status,
                        DealerId, RoleId, MaxDiscountRate, CompanyId, PersonNameSurname, ManagerType, PlaCod,
                        AddressInfo_City, AddressInfo_Town, AddressInfo_AddressLine, AddressInfo_PostalCode, AddressInfo_Country,
                        _SyncedAt
                    ) VALUES (
                        @Id, @Name, @SurName, @Title, @Email, @CellPhone, @Phone, @EmploymentDate, @EndOfEmploymentDate,
                        @UserName, @IdentificationNumber, @Nationality, @BirthDate, @Gender, @MaritalStatus,
                        @NumberOfChildren, @BloodType, @Height, @Weight, @Size, @ShoeSize, @ManagerId, @Status,
                        @DealerId, @RoleId, @MaxDiscountRate, @CompanyId, @PersonNameSurname, @ManagerType, @PlaCod,
                        @AddressInfo_City, @AddressInfo_Town, @AddressInfo_AddressLine, @AddressInfo_PostalCode, @AddressInfo_Country,
                        GETUTCDATE()
                    );
            `;
        } else {
            upsertSql = `
                INSERT INTO Person (
                    Id, Name, SurName, Title, Email, CellPhone, Phone, EmploymentDate, EndOfEmploymentDate,
                    UserName, IdentificationNumber, Nationality, BirthDate, Gender, MaritalStatus,
                    NumberOfChildren, BloodType, Height, Weight, Size, ShoeSize, ManagerId, Status,
                    DealerId, RoleId, MaxDiscountRate, CompanyId, PersonNameSurname, ManagerType, PlaCod,
                    AddressInfo_City, AddressInfo_Town, AddressInfo_AddressLine, AddressInfo_PostalCode, AddressInfo_Country,
                    _SyncedAt
                ) VALUES (
                    :Id, :Name, :SurName, :Title, :Email, :CellPhone, :Phone, :EmploymentDate, :EndOfEmploymentDate,
                    :UserName, :IdentificationNumber, :Nationality, :BirthDate, :Gender, :MaritalStatus,
                    :NumberOfChildren, :BloodType, :Height, :Weight, :Size, :ShoeSize, :ManagerId, :Status,
                    :DealerId, :RoleId, :MaxDiscountRate, :CompanyId, :PersonNameSurname, :ManagerType, :PlaCod,
                    :AddressInfo_City, :AddressInfo_Town, :AddressInfo_AddressLine, :AddressInfo_PostalCode, :AddressInfo_Country,
                    datetime('now')
                )
                ON CONFLICT(Id) DO UPDATE SET
                    Name = excluded.Name, SurName = excluded.SurName, Title = excluded.Title, Email = excluded.Email,
                    CellPhone = excluded.CellPhone, Phone = excluded.Phone, EmploymentDate = excluded.EmploymentDate,
                    EndOfEmploymentDate = excluded.EndOfEmploymentDate, UserName = excluded.UserName,
                    IdentificationNumber = excluded.IdentificationNumber, Nationality = excluded.Nationality,
                    BirthDate = excluded.BirthDate, Gender = excluded.Gender, MaritalStatus = excluded.MaritalStatus,
                    NumberOfChildren = excluded.NumberOfChildren, BloodType = excluded.BloodType,
                    Height = excluded.Height, Weight = excluded.Weight, Size = excluded.Size, ShoeSize = excluded.ShoeSize,
                    ManagerId = excluded.ManagerId, Status = excluded.Status, DealerId = excluded.DealerId,
                    RoleId = excluded.RoleId, MaxDiscountRate = excluded.MaxDiscountRate, CompanyId = excluded.CompanyId,
                    PersonNameSurname = excluded.PersonNameSurname, ManagerType = excluded.ManagerType,
                    PlaCod = excluded.PlaCod, AddressInfo_City = excluded.AddressInfo_City,
                    AddressInfo_Town = excluded.AddressInfo_Town, AddressInfo_AddressLine = excluded.AddressInfo_AddressLine,
                    AddressInfo_PostalCode = excluded.AddressInfo_PostalCode, AddressInfo_Country = excluded.AddressInfo_Country,
                    _SyncedAt = datetime('now')
            `;
        }

        db.transaction(() => {
            db.execute(upsertSql, binding);

            db.execute('DELETE FROM Education WHERE PersonId = ?', [payload.Id]);
            db.execute('DELETE FROM PersonFile WHERE PersonId = ?', [payload.Id]);
            db.execute('DELETE FROM Companies WHERE PersonId = ?', [payload.Id]);

            if (payload.Education && payload.Education.length > 0) {
                for (const edu of payload.Education) {
                    db.execute(`
                        INSERT INTO Education (PersonId, EducationType, FieldOfStudy, SchoolName, StartYear, EndYear)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `, [payload.Id, edu.EducationType ?? null, edu.FieldOfStudy || null, edu.SchoolName || null, edu.StartYear ?? null, edu.EndYear ?? null]);
                }
            }

            if (payload.PersonFile && payload.PersonFile.length > 0) {
                for (const file of payload.PersonFile) {
                    db.execute(`
                        INSERT INTO PersonFile (PersonId, FilePath, FileName, FileType)
                        VALUES (?, ?, ?, ?)
                    `, [payload.Id, file.FilePath || null, file.FileName || null, file.FileType || null]);
                }
            }

            if (payload.Companies && payload.Companies.length > 0) {
                for (const comp of payload.Companies) {
                    db.execute('INSERT INTO Companies (PersonId, CompanyId) VALUES (?, ?)', [payload.Id, comp.CompanyId || null]);
                }
            }
        });

        res.json({
            status: 'ok',
            upserted: isInsert,
            id: payload.Id,
            syncedAt: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('[Person Sync Error]', error);
        res.status(400).json({ status: 'error', message: error.message || 'Verification Failed' });
    }
});

export default router;
