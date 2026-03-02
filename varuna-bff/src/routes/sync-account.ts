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
        Id: z.string().nullable().optional(),
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

        const binding = {
            Id: payload.Id,
            Name: payload.Name ?? null,
            Code: payload.Code ?? null,
            Title: payload.Title ?? null,
            Type: payload.Type ?? null,
            ParentAccountId: payload.ParentAccountId ?? null,
            OwnerId: payload.OwnerId,
            TerritoryId: payload.TerritoryId ?? null,
            State: payload.State ?? null,
            DefaultDiscount: payload.DefaultDiscount ?? null,
            DefaultCurrency: payload.DefaultCurrency ?? null,
            IdentificationNumber: payload.IdentificationNumber ?? null,
            SurName: payload.SurName ?? null,
            CellPhone: payload.CellPhone ?? null,
            Phone: payload.Phone ?? null,
            TaxOffice: payload.TaxOffice ?? null,
            TaxNumber: payload.TaxNumber ?? null,
            Email: payload.Email ?? null,
            DealerId: payload.DealerId ?? null,
            AccountGroupId: payload.AccountGroupId ?? null,
            AccountAdditionalGroupId: payload.AccountAdditionalGroupId ?? null,
            CurrencyRateType: payload.CurrencyRateType ?? null,
            IsVATExempt: payload.IsVATExempt ?? null,
            AccountAutoNumberNextGen: payload.AccountAutoNumberNextGen ?? null,
            WebSite: payload.WebSite ?? null,
            Sector: payload.Sector ?? null,
            ActivitySummary: payload.ActivitySummary ?? null,
            LastTouchDate: payload.LastTouchDate ?? null,
            SignBoardName: payload.SignBoardName ?? null,
            Emplooyes: payload.Emplooyes ?? null,
            LeadSource: payload.LeadSource ?? null,
            AccountNumber: payload.AccountNumber ?? null,
            Instagram: payload.Instagram ?? null,
            Fax: payload.Fax ?? null,
            RelatedDepartment: payload.RelatedDepartment ?? null,
            ParamBusinessCardNo: payload.ParamBusinessCardNo ?? null,
            ReferenceCode: payload.ReferenceCode ?? null,
            MonthlyTurnoverLevel: payload.MonthlyTurnoverLevel ?? null,
            RivalFirmId: payload.RivalFirmId ?? null,
            AccountNameSurname: payload.AccountNameSurname ?? null,
            MonthlyTurnoverLevelTR: payload.MonthlyTurnoverLevelTR ?? null,
            SectorTR: payload.SectorTR ?? null,
            FirstCreatedDate: payload.FirstCreatedDate ?? null,
            FirstCreatedByName: payload.FirstCreatedByName ?? null,
            Email2: payload.Email2 ?? null,
            Email3: payload.Email3 ?? null,
            BusinessPartnerId: payload.BusinessPartnerId ?? null,
            UsedERP: payload.UsedERP ?? null,
            IsInvoiceGenerated: payload.IsInvoiceGenerated ?? null,
            IsTrainingProvided: payload.IsTrainingProvided ?? null,
            IsContractReceived: payload.IsContractReceived ?? null,
            NumberOfEmployees: payload.NumberOfEmployees ?? null,
            NumberOfDealer: payload.NumberOfDealer ?? null,
            NumberOfWorkingBank: payload.NumberOfWorkingBank ?? null,
            ENumberOfGroupComplaints: payload.ENumberOfGroupComplaints ?? null,
            CapitalSize: payload.CapitalSize ?? null,
            AccountGroupInfo: payload.AccountGroupInfo ?? null,
            CompanyAge: payload.CompanyAge ?? null,
            InRefCode: payload.InRefCode ?? null,
            City: payload.City ?? null,
            LeadSourceNextGenId: payload.LeadSourceNextGenId ?? null,
            IsSpecialField: payload.IsSpecialField ?? null,
            IsoThousandRank: payload.IsoThousandRank ?? null,
            CommunicationInfo: payload.CommunicationInfo ?? null,
            CreditUsageCountForLastMonth: payload.CreditUsageCountForLastMonth ?? null,
            CreditUsageCountForLastThreeMonth: payload.CreditUsageCountForLastThreeMonth ?? null,
            CreditUsageCountForYear: payload.CreditUsageCountForYear ?? null,
            FieldSalesRepresentativeId: payload.FieldSalesRepresentativeId ?? null,
            TPOutReferenceCode: payload.TPOutReferenceCode ?? null,
            CountrySapId: payload.CountrySapId ?? null,
            CountryRegionSapId: payload.CountryRegionSapId ?? null,
            CurrencySapId: payload.CurrencySapId ?? null,
            CustomerAccountGroupSapId: payload.CustomerAccountGroupSapId ?? null,
            LanguageSapId: payload.LanguageSapId ?? null,
            PaymentTermSapId: payload.PaymentTermSapId ?? null,
            SalesOfficeSapId: payload.SalesOfficeSapId ?? null,
            TaxClassificationSapId: payload.TaxClassificationSapId ?? null,
            SAPOutReferenceCode: payload.SAPOutReferenceCode ?? null,
            IBAN: payload.IBAN ?? null,
            BankCountryId: payload.BankCountryId ?? null,
            BankCurrencySapId: payload.BankCurrencySapId ?? null,
            AccountHolderName: payload.AccountHolderName ?? null,
            OtherUsedERP: payload.OtherUsedERP ?? null,
            EDocumentType: payload.EDocumentType ?? null,

            Location_Latitude: payload.Location?.Latitude ?? null,
            Location_Longitude: payload.Location?.Longitude ?? null,
            CreditLimit_Amount: payload.CreditLimit?.Amount ?? null,
            CreditLimit_Currency: payload.CreditLimit?.Currency ?? null,
            RiskLimit_Amount: payload.RiskLimit?.Amount ?? null,
            RiskLimit_Currency: payload.RiskLimit?.Currency ?? null,
            CreditUsageAmountForLastMonth_Amount: payload.CreditUsageAmountForLastMonth?.Amount ?? null,
            CreditUsageAmountForLastMonth_Currency: payload.CreditUsageAmountForLastMonth?.Currency ?? null,
            CreditUsageAmountForLastThreeMonths_Amount: payload.CreditUsageAmountForLastThreeMonths?.Amount ?? null,
            CreditUsageAmountForLastThreeMonths_Currency: payload.CreditUsageAmountForLastThreeMonths?.Currency ?? null,
            CreditUsageAmountForYear_Amount: payload.CreditUsageAmountForYear?.Amount ?? null,
            CreditUsageAmountForYear_Currency: payload.CreditUsageAmountForYear?.Currency ?? null
        };

        const existing = db.queryOne('SELECT Id FROM Account WHERE Id = ?', [payload.Id]);
        const isInsert = !existing;

        let upsertSql: string;
        if (db.driver === 'mssql') {
            upsertSql = `
                MERGE INTO Account AS target
                USING (SELECT @Id AS Id) AS source
                ON (target.Id = source.Id)
                WHEN MATCHED THEN
                    UPDATE SET
                        Name = @Name, Code = @Code, Title = @Title, [Type] = @Type,
                        ParentAccountId = @ParentAccountId, OwnerId = @OwnerId, TerritoryId = @TerritoryId,
                        [State] = @State, DefaultDiscount = @DefaultDiscount, DefaultCurrency = @DefaultCurrency,
                        IdentificationNumber = @IdentificationNumber, SurName = @SurName, CellPhone = @CellPhone,
                        Phone = @Phone, TaxOffice = @TaxOffice, TaxNumber = @TaxNumber, Email = @Email,
                        DealerId = @DealerId, AccountGroupId = @AccountGroupId, AccountAdditionalGroupId = @AccountAdditionalGroupId,
                        CurrencyRateType = @CurrencyRateType, IsVATExempt = @IsVATExempt, AccountAutoNumberNextGen = @AccountAutoNumberNextGen,
                        WebSite = @WebSite, Sector = @Sector, ActivitySummary = @ActivitySummary,
                        LastTouchDate = @LastTouchDate, SignBoardName = @SignBoardName, Emplooyes = @Emplooyes,
                        LeadSource = @LeadSource, AccountNumber = @AccountNumber, Instagram = @Instagram,
                        Fax = @Fax, RelatedDepartment = @RelatedDepartment, ParamBusinessCardNo = @ParamBusinessCardNo,
                        ReferenceCode = @ReferenceCode, MonthlyTurnoverLevel = @MonthlyTurnoverLevel, RivalFirmId = @RivalFirmId,
                        AccountNameSurname = @AccountNameSurname, MonthlyTurnoverLevelTR = @MonthlyTurnoverLevelTR,
                        SectorTR = @SectorTR, FirstCreatedDate = @FirstCreatedDate, FirstCreatedByName = @FirstCreatedByName,
                        Email2 = @Email2, Email3 = @Email3, BusinessPartnerId = @BusinessPartnerId, UsedERP = @UsedERP,
                        IsInvoiceGenerated = @IsInvoiceGenerated, IsTrainingProvided = @IsTrainingProvided, IsContractReceived = @IsContractReceived,
                        NumberOfEmployees = @NumberOfEmployees, NumberOfDealer = @NumberOfDealer, NumberOfWorkingBank = @NumberOfWorkingBank,
                        ENumberOfGroupComplaints = @ENumberOfGroupComplaints, CapitalSize = @CapitalSize, AccountGroupInfo = @AccountGroupInfo,
                        CompanyAge = @CompanyAge, InRefCode = @InRefCode, City = @City, LeadSourceNextGenId = @LeadSourceNextGenId,
                        IsSpecialField = @IsSpecialField, IsoThousandRank = @IsoThousandRank, CommunicationInfo = @CommunicationInfo,
                        CreditUsageCountForLastMonth = @CreditUsageCountForLastMonth, CreditUsageCountForLastThreeMonth = @CreditUsageCountForLastThreeMonth,
                        CreditUsageCountForYear = @CreditUsageCountForYear, FieldSalesRepresentativeId = @FieldSalesRepresentativeId,
                        TPOutReferenceCode = @TPOutReferenceCode, CountrySapId = @CountrySapId, CountryRegionSapId = @CountryRegionSapId,
                        CurrencySapId = @CurrencySapId, CustomerAccountGroupSapId = @CustomerAccountGroupSapId, LanguageSapId = @LanguageSapId,
                        PaymentTermSapId = @PaymentTermSapId, SalesOfficeSapId = @SalesOfficeSapId, TaxClassificationSapId = @TaxClassificationSapId,
                        SAPOutReferenceCode = @SAPOutReferenceCode, IBAN = @IBAN, BankCountryId = @BankCountryId,
                        BankCurrencySapId = @BankCurrencySapId, AccountHolderName = @AccountHolderName, OtherUsedERP = @OtherUsedERP,
                        EDocumentType = @EDocumentType,
                        Location_Latitude = @Location_Latitude, Location_Longitude = @Location_Longitude,
                        CreditLimit_Amount = @CreditLimit_Amount, CreditLimit_Currency = @CreditLimit_Currency,
                        RiskLimit_Amount = @RiskLimit_Amount, RiskLimit_Currency = @RiskLimit_Currency,
                        CreditUsageAmountForLastMonth_Amount = @CreditUsageAmountForLastMonth_Amount, CreditUsageAmountForLastMonth_Currency = @CreditUsageAmountForLastMonth_Currency,
                        CreditUsageAmountForLastThreeMonths_Amount = @CreditUsageAmountForLastThreeMonths_Amount, CreditUsageAmountForLastThreeMonths_Currency = @CreditUsageAmountForLastThreeMonths_Currency,
                        CreditUsageAmountForYear_Amount = @CreditUsageAmountForYear_Amount, CreditUsageAmountForYear_Currency = @CreditUsageAmountForYear_Currency,
                        _SyncedAt = GETUTCDATE()
                WHEN NOT MATCHED THEN
                    INSERT (
                        Id, Name, Code, Title, [Type], ParentAccountId, OwnerId, TerritoryId, [State], DefaultDiscount,
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
                        CreditUsageAmountForYear_Amount, CreditUsageAmountForYear_Currency, _SyncedAt
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
                        @CreditUsageAmountForYear_Amount, @CreditUsageAmountForYear_Currency, GETUTCDATE()
                    );
            `;
        } else {
            upsertSql = `
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
                    CreditUsageAmountForYear_Amount, CreditUsageAmountForYear_Currency, _SyncedAt
                ) VALUES (
                    :Id, :Name, :Code, :Title, :Type, :ParentAccountId, :OwnerId, :TerritoryId, :State, :DefaultDiscount,
                    :DefaultCurrency, :IdentificationNumber, :SurName, :CellPhone, :Phone, :TaxOffice, :TaxNumber, :Email,
                    :DealerId, :AccountGroupId, :AccountAdditionalGroupId, :CurrencyRateType, :IsVATExempt,
                    :AccountAutoNumberNextGen, :WebSite, :Sector, :ActivitySummary, :LastTouchDate, :SignBoardName,
                    :Emplooyes, :LeadSource, :AccountNumber, :Instagram, :Fax, :RelatedDepartment, :ParamBusinessCardNo,
                    :ReferenceCode, :MonthlyTurnoverLevel, :RivalFirmId, :AccountNameSurname, :MonthlyTurnoverLevelTR,
                    :SectorTR, :FirstCreatedDate, :FirstCreatedByName, :Email2, :Email3, :BusinessPartnerId, :UsedERP,
                    :IsInvoiceGenerated, :IsTrainingProvided, :IsContractReceived, :NumberOfEmployees, :NumberOfDealer,
                    :NumberOfWorkingBank, :ENumberOfGroupComplaints, :CapitalSize, :AccountGroupInfo, :CompanyAge,
                    :InRefCode, :City, :LeadSourceNextGenId, :IsSpecialField, :IsoThousandRank, :CommunicationInfo,
                    :CreditUsageCountForLastMonth, :CreditUsageCountForLastThreeMonth, :CreditUsageCountForYear,
                    :FieldSalesRepresentativeId, :TPOutReferenceCode, :CountrySapId, :CountryRegionSapId, :CurrencySapId,
                    :CustomerAccountGroupSapId, :LanguageSapId, :PaymentTermSapId, :SalesOfficeSapId, :TaxClassificationSapId,
                    :SAPOutReferenceCode, :IBAN, :BankCountryId, :BankCurrencySapId, :AccountHolderName, :OtherUsedERP,
                    :EDocumentType,
                    :Location_Latitude, :Location_Longitude,
                    :CreditLimit_Amount, :CreditLimit_Currency,
                    :RiskLimit_Amount, :RiskLimit_Currency,
                    :CreditUsageAmountForLastMonth_Amount, :CreditUsageAmountForLastMonth_Currency,
                    :CreditUsageAmountForLastThreeMonths_Amount, :CreditUsageAmountForLastThreeMonths_Currency,
                    :CreditUsageAmountForYear_Amount, :CreditUsageAmountForYear_Currency, datetime('now')
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
            `;
        }

        db.transaction(() => {
            db.execute(upsertSql, binding);

            db.execute('DELETE FROM Addresses WHERE AccountId = ?', [payload.Id]);
            db.execute('DELETE FROM AccountContacts WHERE AccountId = ?', [payload.Id]);
            db.execute('DELETE FROM AccountNotes WHERE AccountId = ?', [payload.Id]);
            db.execute('DELETE FROM AccountRepresentatives WHERE AccountId = ?', [payload.Id]);
            db.execute('DELETE FROM AccountCompanies WHERE AccountId = ?', [payload.Id]);
            db.execute('DELETE FROM IntegrationCurrencyDetails WHERE AccountId = ?', [payload.Id]);
            db.execute('DELETE FROM NetsisCompanyReferenceCodes WHERE AccountId = ?', [payload.Id]);
            db.execute('DELETE FROM WhoAreWeDealingWith WHERE AccountId = ?', [payload.Id]);
            db.execute('DELETE FROM InstallProcessRepresentatives WHERE AccountId = ?', [payload.Id]);

            payload.Addresses?.forEach((d: any) => db.execute('INSERT INTO Addresses (Id, AccountId, AddressType, AccountLocation, CentralAddress, Address_Country, Address_Subdivision1, Address_Subdivision2, Address_Subdivision3, Address_Subdivision4, Address_OpenAddress) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [d.Id ?? null, payload.Id, d.AddressType ?? null, d.AccountLocation ?? null, d.CentralAddress ?? null, d.Address?.Country ?? null, d.Address?.Subdivision1 ?? null, d.Address?.Subdivision2 ?? null, d.Address?.Subdivision3 ?? null, d.Address?.Subdivision4 ?? null, d.Address?.OpenAddress ?? null]));
            payload.Contacts?.forEach((d: any) => db.execute('INSERT INTO AccountContacts (AccountId, ContactDetailId) VALUES (?, ?)', [payload.Id, d.ContactDetailId ?? null]));
            payload.AccountNotes?.forEach((d: any) => db.execute('INSERT INTO AccountNotes (AccountId, Note, NoteText, CreatedOn, CreatedBy) VALUES (?, ?, ?, ?, ?)', [payload.Id, d.Note ?? null, d.NoteText ?? null, d.CreatedOn ?? null, d.CreatedBy ?? null]));
            payload.AccountRepresentatives?.forEach((d: any) => db.execute('INSERT INTO AccountRepresentatives (AccountId, AccountOwnerId, CompanyId, EnterpriceAccountRepresentativeId) VALUES (?, ?, ?, ?)', [payload.Id, d.AccountOwnerId ?? null, d.CompanyId ?? null, d.EnterpriceAccountRepresentativeId ?? null]));
            payload.AccountCompanies?.forEach((d: any) => db.execute('INSERT INTO AccountCompanies (AccountId, CompanyId) VALUES (?, ?)', [payload.Id, d.CompanyId ?? null]));
            payload.IntegrationCurrencyDetails?.forEach((d: any) => db.execute('INSERT INTO IntegrationCurrencyDetails (AccountId, CurrencyCode, ReferenceCode) VALUES (?, ?, ?)', [payload.Id, d.CurrencyCode ?? null, d.ReferenceCode ?? null]));
            payload.NetsisCompanyReferenceCodes?.forEach((d: any) => db.execute('INSERT INTO NetsisCompanyReferenceCodes (AccountId, CompanyId, TPOutReferenceCode) VALUES (?, ?, ?)', [payload.Id, d.CompanyId ?? null, d.TPOutReferenceCode ?? null]));
            payload.WhoAreWeDealingWith?.forEach((d: any) => db.execute('INSERT INTO WhoAreWeDealingWith (AccountId, WhoAreWeDealingWith) VALUES (?, ?)', [payload.Id, d.WhoAreWeDealingWith ?? null]));
            payload.InstallProcessRepresentatives?.forEach((d: any) => db.execute('INSERT INTO InstallProcessRepresentatives (AccountId, InstallProcessRePresentId) VALUES (?, ?)', [payload.Id, d.InstallProcessRePresentId ?? null]));
        });

        res.json({
            status: 'ok',
            upserted: isInsert,
            id: payload.Id,
            syncedAt: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('[Account Sync Error]', error);
        res.status(400).json({ status: 'error', message: error.message || 'Verification Failed' });
    }
});

export default router;
