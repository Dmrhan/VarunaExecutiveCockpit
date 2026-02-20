import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { z } from 'zod';

const router = Router();

// Zod Schema representing the C# IAccount model
const accountSchema = z.object({
    Id: z.string(),
    Name: z.string().nullable().optional(),
    Code: z.string().nullable().optional(),
    Title: z.string().nullable().optional(),
    Type: z.number().nullable().optional(),
    ParentAccountId: z.string().nullable().optional(),
    OwnerId: z.string(), // NOT NULL
    TerritoryId: z.string().nullable().optional(),
    State: z.number().nullable().optional(),
    DefaultDiscount: z.number().nullable().optional(),
    DefaultCurrency: z.number().nullable().optional(),
    IdentificationNumber: z.string().nullable().optional(),
    SurName: z.string().nullable().optional(),
    CellPhone: z.string().nullable().optional(),
    Phone: z.string().nullable().optional(),
    TaxOffice: z.string().nullable().optional(),
    TaxNumber: z.string().nullable().optional(),
    Email: z.string().nullable().optional(),
    DealerId: z.string().nullable().optional(),
    AccountGroupId: z.string().nullable().optional(),
    AccountAdditionalGroupId: z.string().nullable().optional(),
    CurrencyRateType: z.number().nullable().optional(),
    IsVATExempt: z.number().nullable().optional(),
    AccountAutoNumberNextGen: z.number().nullable().optional(),
    WebSite: z.string().nullable().optional(),
    Sector: z.number().nullable().optional(),
    ActivitySummary: z.string().nullable().optional(),
    LastTouchDate: z.string().nullable().optional(),
    SignBoardName: z.string().nullable().optional(),
    Emplooyes: z.number().nullable().optional(),
    LeadSource: z.number().nullable().optional(),
    AccountNumber: z.number().nullable().optional(),
    Instagram: z.string().nullable().optional(),
    Fax: z.string().nullable().optional(),
    RelatedDepartment: z.string().nullable().optional(),
    ParamBusinessCardNo: z.number().nullable().optional(),
    ReferenceCode: z.string().nullable().optional(),
    MonthlyTurnoverLevel: z.number().nullable().optional(),
    RivalFirmId: z.string().nullable().optional(),
    AccountNameSurname: z.string().nullable().optional(),
    MonthlyTurnoverLevelTR: z.string().nullable().optional(),
    SectorTR: z.string().nullable().optional(),
    FirstCreatedDate: z.string().nullable().optional(),
    FirstCreatedByName: z.string().nullable().optional(),
    Email2: z.string().nullable().optional(),
    Email3: z.string().nullable().optional(),
    BusinessPartnerId: z.string().nullable().optional(),
    UsedERP: z.number().nullable().optional(),
    IsInvoiceGenerated: z.number().nullable().optional(),
    IsTrainingProvided: z.number().nullable().optional(),
    IsContractReceived: z.number().nullable().optional(),
    NumberOfEmployees: z.number().nullable().optional(),
    NumberOfDealer: z.number().nullable().optional(),
    NumberOfWorkingBank: z.number().nullable().optional(),
    ENumberOfGroupComplaints: z.number().nullable().optional(),
    CapitalSize: z.number().nullable().optional(),
    AccountGroupInfo: z.number().nullable().optional(),
    CompanyAge: z.number().nullable().optional(),
    InRefCode: z.string().nullable().optional(),
    City: z.string().nullable().optional(),
    LeadSourceNextGenId: z.string().nullable().optional(),
    IsSpecialField: z.number().nullable().optional(),
    IsoThousandRank: z.number().nullable().optional(),
    CommunicationInfo: z.number().nullable().optional(),
    CreditUsageCountForLastMonth: z.number().nullable().optional(),
    CreditUsageCountForLastThreeMonth: z.number().nullable().optional(),
    CreditUsageCountForYear: z.number().nullable().optional(),
    FieldSalesRepresentativeId: z.string().nullable().optional(),
    TPOutReferenceCode: z.string().nullable().optional(),
    CountrySapId: z.string().nullable().optional(),
    CountryRegionSapId: z.string().nullable().optional(),
    CurrencySapId: z.string().nullable().optional(),
    CustomerAccountGroupSapId: z.string().nullable().optional(),
    LanguageSapId: z.string().nullable().optional(),
    PaymentTermSapId: z.string().nullable().optional(),
    SalesOfficeSapId: z.string().nullable().optional(),
    TaxClassificationSapId: z.string().nullable().optional(),
    SAPOutReferenceCode: z.string().nullable().optional(),
    IBAN: z.string().nullable().optional(),
    BankCountryId: z.string().nullable().optional(),
    BankCurrencySapId: z.string().nullable().optional(),
    AccountHolderName: z.string().nullable().optional(),
    OtherUsedERP: z.string().nullable().optional(),
    EDocumentType: z.number().nullable().optional(),

    // Complex Types
    Location: z.object({
        Latitude: z.number().nullable().optional(),
        Longitude: z.number().nullable().optional()
    }).nullable().optional(),

    CreditLimit: z.object({
        Amount: z.number().nullable().optional(),
        Currency: z.number().nullable().optional()
    }).nullable().optional(),

    RiskLimit: z.object({
        Amount: z.number().nullable().optional(),
        Currency: z.number().nullable().optional()
    }).nullable().optional(),

    CreditUsageAmountForLastMonth: z.object({
        Amount: z.number().nullable().optional(),
        Currency: z.number().nullable().optional()
    }).nullable().optional(),

    CreditUsageAmountForLastThreeMonths: z.object({
        Amount: z.number().nullable().optional(),
        Currency: z.number().nullable().optional()
    }).nullable().optional(),

    CreditUsageAmountForYear: z.object({
        Amount: z.number().nullable().optional(),
        Currency: z.number().nullable().optional()
    }).nullable().optional(),

    // Detail collections
    Addresses: z.array(z.object({
        AddressType: z.number().nullable().optional(),
        AccountLocation: z.string().nullable().optional(),
        CentralAddress: z.number().nullable().optional(),
        Address: z.object({
            Country: z.string().nullable().optional(),
            Subdivision1: z.string().nullable().optional(),
            Subdivision2: z.string().nullable().optional(),
            Subdivision3: z.string().nullable().optional(),
            Subdivision4: z.string().nullable().optional(),
            OpenAddress: z.string().nullable().optional()
        }).nullable().optional()
    })).nullable().optional(),

    Contacts: z.array(z.object({
        ContactDetailId: z.string().nullable().optional()
    })).nullable().optional(),

    AccountNotes: z.array(z.object({
        Note: z.string().nullable().optional(),
        NoteText: z.string().nullable().optional(),
        CreatedOn: z.string().nullable().optional(),
        CreatedBy: z.string().nullable().optional()
    })).nullable().optional(),

    AccountRepresentatives: z.array(z.object({
        AccountOwnerId: z.string().nullable().optional(),
        CompanyId: z.string().nullable().optional(),
        EnterpriceAccountRepresentativeId: z.string().nullable().optional()
    })).nullable().optional(),

    AccountCompanies: z.array(z.object({
        CompanyId: z.string().nullable().optional()
    })).nullable().optional(),

    IntegrationCurrencyDetails: z.array(z.object({
        CurrencyCode: z.number().nullable().optional(),
        ReferenceCode: z.string().nullable().optional()
    })).nullable().optional(),

    NetsisCompanyReferenceCodes: z.array(z.object({
        CompanyId: z.string().nullable().optional(),
        TPOutReferenceCode: z.string().nullable().optional()
    })).nullable().optional(),

    WhoAreWeDealingWith: z.array(z.object({
        WhoAreWeDealingWith: z.number().nullable().optional()
    })).nullable().optional(),

    InstallProcessRepresentatives: z.array(z.object({
        InstallProcessRePresentId: z.string().nullable().optional()
    })).nullable().optional()
});

router.post('/', (req: Request, res: Response) => {
    try {
        const payload = accountSchema.parse(req.body);
        const db = getDb();

        const upsertAccount = db.prepare(`
            INSERT INTO Account (
                Id, Name, Code, Title, Type, ParentAccountId, OwnerId, TerritoryId, State, DefaultDiscount,
                DefaultCurrency, IdentificationNumber, SurName, CellPhone, Phone, TaxOffice, TaxNumber, Email,
                DealerId, AccountGroupId, AccountAdditionalGroupId, CurrencyRateType, IsVATExempt,
                AccountAutoNumberNextGen, WebSite, Sector, ActivitySummary, LastTouchDate, SignBoardName,
                Emplooyes, LeadSource, AccountNumber, Instagram, Fax, RelatedDepartment, ParamBusinessCardNo,
                ReferenceCode, MonthlyTurnoverLevel, RivalFirmId, AccountNameSurname, MonthlyTurnoverLevelTR,
                SectorTR, FirstCreatedDate, FirstCreatedByName, Email2, Email3, BusinessPartnerId, UsedERP,
                IsInvoiceGenerated, IsTrainingProvided, IsContractReceived, NumberOfEmployees, NumberOfDealer,
                NumberOfWorkingBank, ENumberOfGroupComplaints, CapitalSize, AccountGroupInfo, CompanyAge,
                InRefCode, City, LeadSourceNextGenId, IsSpecialField, IsoThousandRank, CommunicationInfo,
                CreditUsageCountForLastMonth, CreditUsageCountForLastThreeMonth, CreditUsageCountForYear,
                FieldSalesRepresentativeId, TPOutReferenceCode, CountrySapId, CountryRegionSapId, CurrencySapId,
                CustomerAccountGroupSapId, LanguageSapId, PaymentTermSapId, SalesOfficeSapId, TaxClassificationSapId,
                SAPOutReferenceCode, IBAN, BankCountryId, BankCurrencySapId, AccountHolderName, OtherUsedERP,
                EDocumentType,
                Location_Latitude, Location_Longitude,
                CreditLimit_Amount, CreditLimit_Currency,
                RiskLimit_Amount, RiskLimit_Currency,
                CreditUsageAmountForLastMonth_Amount, CreditUsageAmountForLastMonth_Currency,
                CreditUsageAmountForLastThreeMonths_Amount, CreditUsageAmountForLastThreeMonths_Currency,
                CreditUsageAmountForYear_Amount, CreditUsageAmountForYear_Currency
            ) VALUES (
                         @Id, @Name, @Code, @Title, @Type, @ParentAccountId, @OwnerId, @TerritoryId, @State, @DefaultDiscount,
                         @DefaultCurrency, @IdentificationNumber, @SurName, @CellPhone, @Phone, @TaxOffice, @TaxNumber, @Email,
                         @DealerId, @AccountGroupId, @AccountAdditionalGroupId, @CurrencyRateType, @IsVATExempt,
                         @AccountAutoNumberNextGen, @WebSite, @Sector, @ActivitySummary, @LastTouchDate, @SignBoardName,
                         @Emplooyes, @LeadSource, @AccountNumber, @Instagram, @Fax, @RelatedDepartment, @ParamBusinessCardNo,
                         @ReferenceCode, @MonthlyTurnoverLevel, @RivalFirmId, @AccountNameSurname, @MonthlyTurnoverLevelTR,
                         @SectorTR, @FirstCreatedDate, @FirstCreatedByName, @Email2, @Email3, @BusinessPartnerId, @UsedERP,
                         @IsInvoiceGenerated, @IsTrainingProvided, @IsContractReceived, @NumberOfEmployees, @NumberOfDealer,
                         @NumberOfWorkingBank, @ENumberOfGroupComplaints, @CapitalSize, @AccountGroupInfo, @CompanyAge,
                         @InRefCode, @City, @LeadSourceNextGenId, @IsSpecialField, @IsoThousandRank, @CommunicationInfo,
                         @CreditUsageCountForLastMonth, @CreditUsageCountForLastThreeMonth, @CreditUsageCountForYear,
                         @FieldSalesRepresentativeId, @TPOutReferenceCode, @CountrySapId, @CountryRegionSapId, @CurrencySapId,
                         @CustomerAccountGroupSapId, @LanguageSapId, @PaymentTermSapId, @SalesOfficeSapId, @TaxClassificationSapId,
                         @SAPOutReferenceCode, @IBAN, @BankCountryId, @BankCurrencySapId, @AccountHolderName, @OtherUsedERP,
                         @EDocumentType,
                         @Location_Latitude, @Location_Longitude,
                         @CreditLimit_Amount, @CreditLimit_Currency,
                         @RiskLimit_Amount, @RiskLimit_Currency,
                         @CreditUsageAmountForLastMonth_Amount, @CreditUsageAmountForLastMonth_Currency,
                         @CreditUsageAmountForLastThreeMonths_Amount, @CreditUsageAmountForLastThreeMonths_Currency,
                         @CreditUsageAmountForYear_Amount, @CreditUsageAmountForYear_Currency
                     )
            ON CONFLICT(Id) DO UPDATE SET
                Name = excluded.Name, Code = excluded.Code, Title = excluded.Title, Type = excluded.Type,
                ParentAccountId = excluded.ParentAccountId, OwnerId = excluded.OwnerId, TerritoryId = excluded.TerritoryId,
                State = excluded.State, DefaultDiscount = excluded.DefaultDiscount, DefaultCurrency = excluded.DefaultCurrency,
                IdentificationNumber = excluded.IdentificationNumber, SurName = excluded.SurName, CellPhone = excluded.CellPhone,
                Phone = excluded.Phone, TaxOffice = excluded.TaxOffice, TaxNumber = excluded.TaxNumber, Email = excluded.Email,
                DealerId = excluded.DealerId, AccountGroupId = excluded.AccountGroupId, AccountAdditionalGroupId = excluded.AccountAdditionalGroupId,
                CurrencyRateType = excluded.CurrencyRateType, IsVATExempt = excluded.IsVATExempt, AccountAutoNumberNextGen = excluded.AccountAutoNumberNextGen,
                WebSite = excluded.WebSite, Sector = excluded.Sector, ActivitySummary = excluded.ActivitySummary,
                LastTouchDate = excluded.LastTouchDate, SignBoardName = excluded.SignBoardName, Emplooyes = excluded.Emplooyes,
                LeadSource = excluded.LeadSource, AccountNumber = excluded.AccountNumber, Instagram = excluded.Instagram,
                Fax = excluded.Fax, RelatedDepartment = excluded.RelatedDepartment, ParamBusinessCardNo = excluded.ParamBusinessCardNo,
                ReferenceCode = excluded.ReferenceCode, MonthlyTurnoverLevel = excluded.MonthlyTurnoverLevel, RivalFirmId = excluded.RivalFirmId,
                AccountNameSurname = excluded.AccountNameSurname, MonthlyTurnoverLevelTR = excluded.MonthlyTurnoverLevelTR,
                SectorTR = excluded.SectorTR, FirstCreatedDate = excluded.FirstCreatedDate, FirstCreatedByName = excluded.FirstCreatedByName,
                Email2 = excluded.Email2, Email3 = excluded.Email3, BusinessPartnerId = excluded.BusinessPartnerId, UsedERP = excluded.UsedERP,
                IsInvoiceGenerated = excluded.IsInvoiceGenerated, IsTrainingProvided = excluded.IsTrainingProvided, IsContractReceived = excluded.IsContractReceived,
                NumberOfEmployees = excluded.NumberOfEmployees, NumberOfDealer = excluded.NumberOfDealer, NumberOfWorkingBank = excluded.NumberOfWorkingBank,
                ENumberOfGroupComplaints = excluded.ENumberOfGroupComplaints, CapitalSize = excluded.CapitalSize, AccountGroupInfo = excluded.AccountGroupInfo,
                CompanyAge = excluded.CompanyAge, InRefCode = excluded.InRefCode, City = excluded.City, LeadSourceNextGenId = excluded.LeadSourceNextGenId,
                IsSpecialField = excluded.IsSpecialField, IsoThousandRank = excluded.IsoThousandRank, CommunicationInfo = excluded.CommunicationInfo,
                CreditUsageCountForLastMonth = excluded.CreditUsageCountForLastMonth, CreditUsageCountForLastThreeMonth = excluded.CreditUsageCountForLastThreeMonth,
                CreditUsageCountForYear = excluded.CreditUsageCountForYear, FieldSalesRepresentativeId = excluded.FieldSalesRepresentativeId,
                TPOutReferenceCode = excluded.TPOutReferenceCode, CountrySapId = excluded.CountrySapId, CountryRegionSapId = excluded.CountryRegionSapId,
                CurrencySapId = excluded.CurrencySapId, CustomerAccountGroupSapId = excluded.CustomerAccountGroupSapId, LanguageSapId = excluded.LanguageSapId,
                PaymentTermSapId = excluded.PaymentTermSapId, SalesOfficeSapId = excluded.SalesOfficeSapId, TaxClassificationSapId = excluded.TaxClassificationSapId,
                SAPOutReferenceCode = excluded.SAPOutReferenceCode, IBAN = excluded.IBAN, BankCountryId = excluded.BankCountryId,
                BankCurrencySapId = excluded.BankCurrencySapId, AccountHolderName = excluded.AccountHolderName, OtherUsedERP = excluded.OtherUsedERP,
                EDocumentType = excluded.EDocumentType,
                Location_Latitude = excluded.Location_Latitude, Location_Longitude = excluded.Location_Longitude,
                CreditLimit_Amount = excluded.CreditLimit_Amount, CreditLimit_Currency = excluded.CreditLimit_Currency,
                RiskLimit_Amount = excluded.RiskLimit_Amount, RiskLimit_Currency = excluded.RiskLimit_Currency,
                CreditUsageAmountForLastMonth_Amount = excluded.CreditUsageAmountForLastMonth_Amount, CreditUsageAmountForLastMonth_Currency = excluded.CreditUsageAmountForLastMonth_Currency,
                CreditUsageAmountForLastThreeMonths_Amount = excluded.CreditUsageAmountForLastThreeMonths_Amount, CreditUsageAmountForLastThreeMonths_Currency = excluded.CreditUsageAmountForLastThreeMonths_Currency,
                CreditUsageAmountForYear_Amount = excluded.CreditUsageAmountForYear_Amount, CreditUsageAmountForYear_Currency = excluded.CreditUsageAmountForYear_Currency,
                _SyncedAt = datetime('now')
        `);

        // Prepare statements for Detail Tables
        const insertAddress = db.prepare('INSERT INTO Addresses (AccountId, AddressType, AccountLocation, CentralAddress, Address_Country, Address_Subdivision1, Address_Subdivision2, Address_Subdivision3, Address_Subdivision4, Address_OpenAddress) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        const insertContact = db.prepare('INSERT INTO AccountContacts (AccountId, ContactDetailId) VALUES (?, ?)');
        const insertNote = db.prepare('INSERT INTO AccountNotes (AccountId, Note, NoteText, CreatedOn, CreatedBy) VALUES (?, ?, ?, ?, ?)');
        const insertRep = db.prepare('INSERT INTO AccountRepresentatives (AccountId, AccountOwnerId, CompanyId, EnterpriceAccountRepresentativeId) VALUES (?, ?, ?, ?)');
        const insertComp = db.prepare('INSERT INTO AccountCompanies (AccountId, CompanyId) VALUES (?, ?)');
        const insertCur = db.prepare('INSERT INTO IntegrationCurrencyDetails (AccountId, CurrencyCode, ReferenceCode) VALUES (?, ?, ?)');
        const insertNetsis = db.prepare('INSERT INTO NetsisCompanyReferenceCodes (AccountId, CompanyId, TPOutReferenceCode) VALUES (?, ?, ?)');
        const insertWho = db.prepare('INSERT INTO WhoAreWeDealingWith (AccountId, WhoAreWeDealingWith) VALUES (?, ?)');
        const insertInstall = db.prepare('INSERT INTO InstallProcessRepresentatives (AccountId, InstallProcessRePresentId) VALUES (?, ?)');

        // Run as a transaction
        const syncTransaction = db.transaction((data) => {
            // 1. Upsert Account
            const info = upsertAccount.run({
                Id: data.Id,
                Name: data.Name ?? null,
                Code: data.Code ?? null,
                Title: data.Title ?? null,
                Type: data.Type ?? null,
                ParentAccountId: data.ParentAccountId ?? null,
                OwnerId: data.OwnerId,
                TerritoryId: data.TerritoryId ?? null,
                State: data.State ?? null,
                DefaultDiscount: data.DefaultDiscount ?? null,
                DefaultCurrency: data.DefaultCurrency ?? null,
                IdentificationNumber: data.IdentificationNumber ?? null,
                SurName: data.SurName ?? null,
                CellPhone: data.CellPhone ?? null,
                Phone: data.Phone ?? null,
                TaxOffice: data.TaxOffice ?? null,
                TaxNumber: data.TaxNumber ?? null,
                Email: data.Email ?? null,
                DealerId: data.DealerId ?? null,
                AccountGroupId: data.AccountGroupId ?? null,
                AccountAdditionalGroupId: data.AccountAdditionalGroupId ?? null,
                CurrencyRateType: data.CurrencyRateType ?? null,
                IsVATExempt: data.IsVATExempt ?? null,
                AccountAutoNumberNextGen: data.AccountAutoNumberNextGen ?? null,
                WebSite: data.WebSite ?? null,
                Sector: data.Sector ?? null,
                ActivitySummary: data.ActivitySummary ?? null,
                LastTouchDate: data.LastTouchDate ?? null,
                SignBoardName: data.SignBoardName ?? null,
                Emplooyes: data.Emplooyes ?? null,
                LeadSource: data.LeadSource ?? null,
                AccountNumber: data.AccountNumber ?? null,
                Instagram: data.Instagram ?? null,
                Fax: data.Fax ?? null,
                RelatedDepartment: data.RelatedDepartment ?? null,
                ParamBusinessCardNo: data.ParamBusinessCardNo ?? null,
                ReferenceCode: data.ReferenceCode ?? null,
                MonthlyTurnoverLevel: data.MonthlyTurnoverLevel ?? null,
                RivalFirmId: data.RivalFirmId ?? null,
                AccountNameSurname: data.AccountNameSurname ?? null,
                MonthlyTurnoverLevelTR: data.MonthlyTurnoverLevelTR ?? null,
                SectorTR: data.SectorTR ?? null,
                FirstCreatedDate: data.FirstCreatedDate ?? null,
                FirstCreatedByName: data.FirstCreatedByName ?? null,
                Email2: data.Email2 ?? null,
                Email3: data.Email3 ?? null,
                BusinessPartnerId: data.BusinessPartnerId ?? null,
                UsedERP: data.UsedERP ?? null,
                IsInvoiceGenerated: data.IsInvoiceGenerated ?? null,
                IsTrainingProvided: data.IsTrainingProvided ?? null,
                IsContractReceived: data.IsContractReceived ?? null,
                NumberOfEmployees: data.NumberOfEmployees ?? null,
                NumberOfDealer: data.NumberOfDealer ?? null,
                NumberOfWorkingBank: data.NumberOfWorkingBank ?? null,
                ENumberOfGroupComplaints: data.ENumberOfGroupComplaints ?? null,
                CapitalSize: data.CapitalSize ?? null,
                AccountGroupInfo: data.AccountGroupInfo ?? null,
                CompanyAge: data.CompanyAge ?? null,
                InRefCode: data.InRefCode ?? null,
                City: data.City ?? null,
                LeadSourceNextGenId: data.LeadSourceNextGenId ?? null,
                IsSpecialField: data.IsSpecialField ?? null,
                IsoThousandRank: data.IsoThousandRank ?? null,
                CommunicationInfo: data.CommunicationInfo ?? null,
                CreditUsageCountForLastMonth: data.CreditUsageCountForLastMonth ?? null,
                CreditUsageCountForLastThreeMonth: data.CreditUsageCountForLastThreeMonth ?? null,
                CreditUsageCountForYear: data.CreditUsageCountForYear ?? null,
                FieldSalesRepresentativeId: data.FieldSalesRepresentativeId ?? null,
                TPOutReferenceCode: data.TPOutReferenceCode ?? null,
                CountrySapId: data.CountrySapId ?? null,
                CountryRegionSapId: data.CountryRegionSapId ?? null,
                CurrencySapId: data.CurrencySapId ?? null,
                CustomerAccountGroupSapId: data.CustomerAccountGroupSapId ?? null,
                LanguageSapId: data.LanguageSapId ?? null,
                PaymentTermSapId: data.PaymentTermSapId ?? null,
                SalesOfficeSapId: data.SalesOfficeSapId ?? null,
                TaxClassificationSapId: data.TaxClassificationSapId ?? null,
                SAPOutReferenceCode: data.SAPOutReferenceCode ?? null,
                IBAN: data.IBAN ?? null,
                BankCountryId: data.BankCountryId ?? null,
                BankCurrencySapId: data.BankCurrencySapId ?? null,
                AccountHolderName: data.AccountHolderName ?? null,
                OtherUsedERP: data.OtherUsedERP ?? null,
                EDocumentType: data.EDocumentType ?? null,

                Location_Latitude: data.Location?.Latitude ?? null,
                Location_Longitude: data.Location?.Longitude ?? null,
                CreditLimit_Amount: data.CreditLimit?.Amount ?? null,
                CreditLimit_Currency: data.CreditLimit?.Currency ?? null,
                RiskLimit_Amount: data.RiskLimit?.Amount ?? null,
                RiskLimit_Currency: data.RiskLimit?.Currency ?? null,
                CreditUsageAmountForLastMonth_Amount: data.CreditUsageAmountForLastMonth?.Amount ?? null,
                CreditUsageAmountForLastMonth_Currency: data.CreditUsageAmountForLastMonth?.Currency ?? null,
                CreditUsageAmountForLastThreeMonths_Amount: data.CreditUsageAmountForLastThreeMonths?.Amount ?? null,
                CreditUsageAmountForLastThreeMonths_Currency: data.CreditUsageAmountForLastThreeMonths?.Currency ?? null,
                CreditUsageAmountForYear_Amount: data.CreditUsageAmountForYear?.Amount ?? null,
                CreditUsageAmountForYear_Currency: data.CreditUsageAmountForYear?.Currency ?? null
            });

            const isInsert = info.changes === 1;

            // 2. Clear old detail records (Cascade delete won't trigger on UPDATE, so we do it manually)
            db.prepare('DELETE FROM Addresses WHERE AccountId = ?').run(data.Id);
            db.prepare('DELETE FROM AccountContacts WHERE AccountId = ?').run(data.Id);
            db.prepare('DELETE FROM AccountNotes WHERE AccountId = ?').run(data.Id);
            db.prepare('DELETE FROM AccountRepresentatives WHERE AccountId = ?').run(data.Id);
            db.prepare('DELETE FROM AccountCompanies WHERE AccountId = ?').run(data.Id);
            db.prepare('DELETE FROM IntegrationCurrencyDetails WHERE AccountId = ?').run(data.Id);
            db.prepare('DELETE FROM NetsisCompanyReferenceCodes WHERE AccountId = ?').run(data.Id);
            db.prepare('DELETE FROM WhoAreWeDealingWith WHERE AccountId = ?').run(data.Id);
            db.prepare('DELETE FROM InstallProcessRepresentatives WHERE AccountId = ?').run(data.Id);

            // 3. Insert new detail records
            data.Addresses?.forEach((d: any) => insertAddress.run(data.Id, d.AddressType ?? null, d.AccountLocation ?? null, d.CentralAddress ?? null, d.Address?.Country ?? null, d.Address?.Subdivision1 ?? null, d.Address?.Subdivision2 ?? null, d.Address?.Subdivision3 ?? null, d.Address?.Subdivision4 ?? null, d.Address?.OpenAddress ?? null));
            data.Contacts?.forEach((d: any) => insertContact.run(data.Id, d.ContactDetailId ?? null));
            data.AccountNotes?.forEach((d: any) => insertNote.run(data.Id, d.Note ?? null, d.NoteText ?? null, d.CreatedOn ?? null, d.CreatedBy ?? null));
            data.AccountRepresentatives?.forEach((d: any) => insertRep.run(data.Id, d.AccountOwnerId ?? null, d.CompanyId ?? null, d.EnterpriceAccountRepresentativeId ?? null));
            data.AccountCompanies?.forEach((d: any) => insertComp.run(data.Id, d.CompanyId ?? null));
            data.IntegrationCurrencyDetails?.forEach((d: any) => insertCur.run(data.Id, d.CurrencyCode ?? null, d.ReferenceCode ?? null));
            data.NetsisCompanyReferenceCodes?.forEach((d: any) => insertNetsis.run(data.Id, d.CompanyId ?? null, d.TPOutReferenceCode ?? null));
            data.WhoAreWeDealingWith?.forEach((d: any) => insertWho.run(data.Id, d.WhoAreWeDealingWith ?? null));
            data.InstallProcessRepresentatives?.forEach((d: any) => insertInstall.run(data.Id, d.InstallProcessRePresentId ?? null));

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
        console.error('[Account Sync Error]', error);
        res.status(400).json({ status: 'error', message: error.message || 'Verification Failed' });
    }
});

export default router;
