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

        const upsertPerson = db.prepare(`
            INSERT INTO Person (
                Id, Name, SurName, Title, Email, CellPhone, Phone, EmploymentDate, EndOfEmploymentDate,
                UserName, IdentificationNumber, Nationality, BirthDate, Gender, MaritalStatus,
                NumberOfChildren, BloodType, Height, Weight, Size, ShoeSize, ManagerId, Status,
                DealerId, RoleId, MaxDiscountRate, CompanyId, PersonNameSurname, ManagerType, PlaCod,
                AddressInfo_City, AddressInfo_Town, AddressInfo_AddressLine, AddressInfo_PostalCode, AddressInfo_Country
            ) VALUES (
                         @Id, @Name, @SurName, @Title, @Email, @CellPhone, @Phone, @EmploymentDate, @EndOfEmploymentDate,
                         @UserName, @IdentificationNumber, @Nationality, @BirthDate, @Gender, @MaritalStatus,
                         @NumberOfChildren, @BloodType, @Height, @Weight, @Size, @ShoeSize, @ManagerId, @Status,
                         @DealerId, @RoleId, @MaxDiscountRate, @CompanyId, @PersonNameSurname, @ManagerType, @PlaCod,
                         @AddressInfo_City, @AddressInfo_Town, @AddressInfo_AddressLine, @AddressInfo_PostalCode, @AddressInfo_Country
                     )
            ON CONFLICT(Id) DO UPDATE SET
                Name = excluded.Name,
                SurName = excluded.SurName,
                Title = excluded.Title,
                Email = excluded.Email,
                CellPhone = excluded.CellPhone,
                Phone = excluded.Phone,
                EmploymentDate = excluded.EmploymentDate,
                EndOfEmploymentDate = excluded.EndOfEmploymentDate,
                UserName = excluded.UserName,
                IdentificationNumber = excluded.IdentificationNumber,
                Nationality = excluded.Nationality,
                BirthDate = excluded.BirthDate,
                Gender = excluded.Gender,
                MaritalStatus = excluded.MaritalStatus,
                NumberOfChildren = excluded.NumberOfChildren,
                BloodType = excluded.BloodType,
                Height = excluded.Height,
                Weight = excluded.Weight,
                Size = excluded.Size,
                ShoeSize = excluded.ShoeSize,
                ManagerId = excluded.ManagerId,
                Status = excluded.Status,
                DealerId = excluded.DealerId,
                RoleId = excluded.RoleId,
                MaxDiscountRate = excluded.MaxDiscountRate,
                CompanyId = excluded.CompanyId,
                PersonNameSurname = excluded.PersonNameSurname,
                ManagerType = excluded.ManagerType,
                PlaCod = excluded.PlaCod,
                AddressInfo_City = excluded.AddressInfo_City,
                AddressInfo_Town = excluded.AddressInfo_Town,
                AddressInfo_AddressLine = excluded.AddressInfo_AddressLine,
                AddressInfo_PostalCode = excluded.AddressInfo_PostalCode,
                AddressInfo_Country = excluded.AddressInfo_Country,
                _SyncedAt = datetime('now')
        `);

        // Prepare statements for Detail Tables
        const insertEdu = db.prepare('INSERT INTO Education (PersonId, EducationType, FieldOfStudy, SchoolName, StartYear, EndYear) VALUES (?, ?, ?, ?, ?, ?)');
        const insertFile = db.prepare('INSERT INTO PersonFile (PersonId, FilePath, FileName, FileType) VALUES (?, ?, ?, ?)');
        const insertComp = db.prepare('INSERT INTO Companies (PersonId, CompanyId) VALUES (?, ?)');

        // Run as a transaction
        const syncTransaction = db.transaction((data) => {
            // 1. Upsert Person
            const info = upsertPerson.run({
                Id: data.Id,
                Name: data.Name,
                SurName: data.SurName,
                Title: data.Title || null,
                Email: data.Email || null,
                CellPhone: data.CellPhone || null,
                Phone: data.Phone || null,
                EmploymentDate: data.EmploymentDate || null,
                EndOfEmploymentDate: data.EndOfEmploymentDate || null,
                UserName: data.UserName || null,
                IdentificationNumber: data.IdentificationNumber || null,
                Nationality: data.Nationality || null,
                BirthDate: data.BirthDate || null,
                Gender: data.Gender ?? null,
                MaritalStatus: data.MaritalStatus ?? null,
                NumberOfChildren: data.NumberOfChildren ?? null,
                BloodType: data.BloodType ?? null,
                Height: data.Height ?? null,
                Weight: data.Weight ?? null,
                Size: data.Size ?? null,
                ShoeSize: data.ShoeSize ?? null,
                ManagerId: data.ManagerId || null,
                Status: data.Status ?? null,
                DealerId: data.DealerId || null,
                RoleId: data.RoleId || null,
                MaxDiscountRate: data.MaxDiscountRate ?? null,
                CompanyId: data.CompanyId || null,
                PersonNameSurname: data.PersonNameSurname || null,
                ManagerType: data.ManagerType ?? null,
                PlaCod: data.PlaCod || null,

                AddressInfo_City: data.AddressInfo?.City || null,
                AddressInfo_Town: data.AddressInfo?.Town || null,
                AddressInfo_AddressLine: data.AddressInfo?.AddressLine || null,
                AddressInfo_PostalCode: data.AddressInfo?.PostalCode || null,
                AddressInfo_Country: data.AddressInfo?.Country || null
            });

            const isInsert = info.changes === 1; // SQLite returns 1 for insert, usually 1 or 2 for update in ON CONFLICT

            // 2. Clear old detail records (Cascade delete won't trigger on UPDATE, so we do it manually)
            db.prepare('DELETE FROM Education WHERE PersonId = ?').run(data.Id);
            db.prepare('DELETE FROM PersonFile WHERE PersonId = ?').run(data.Id);
            db.prepare('DELETE FROM Companies WHERE PersonId = ?').run(data.Id);

            // 3. Insert new detail records
            if (data.Education && data.Education.length > 0) {
                for (const edu of data.Education) {
                    insertEdu.run(data.Id, edu.EducationType ?? null, edu.FieldOfStudy || null, edu.SchoolName || null, edu.StartYear ?? null, edu.EndYear ?? null);
                }
            }

            if (data.PersonFile && data.PersonFile.length > 0) {
                for (const file of data.PersonFile) {
                    insertFile.run(data.Id, file.FilePath || null, file.FileName || null, file.FileType || null);
                }
            }

            if (data.Companies && data.Companies.length > 0) {
                for (const comp of data.Companies) {
                    insertComp.run(data.Id, comp.CompanyId || null);
                }
            }

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
        console.error('[Person Sync Error]', error);
        res.status(400).json({ status: 'error', message: error.message || 'Verification Failed' });
    }
});

export default router;
