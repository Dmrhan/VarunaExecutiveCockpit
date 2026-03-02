-- Varuna Intelligence – MSSQL Analytics Schema
-- Source of truth: C# models
-- Column names MUST match property names exactly

-- ============================================================
-- TABLE: Opportunity
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Opportunity]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Opportunity] (
    Id                      NVARCHAR(450) PRIMARY KEY,
    Name                    NVARCHAR(MAX),
    AccountId               NVARCHAR(450),
    OwnerId                 NVARCHAR(450),
    LeadOwnerId             NVARCHAR(450),
    PartnerId               NVARCHAR(450),
    PersonId                NVARCHAR(450),
    CompanyId               NVARCHAR(450),
    PipelineId              NVARCHAR(450),
    ProductGroupId          NVARCHAR(450),
    ProductCategoryId       NVARCHAR(450),
    [Type]                  INT,
    [Source]                INT,
    DealType                INT,
    WonLostType             INT,
    DealStatus              INT,
    ProbabilityBand         INT,
    OpportunityStageName    INT,
    OpportunityStageId      NVARCHAR(450),
    OpportunityStageNameTr  NVARCHAR(MAX),
    Amount_Value            FLOAT,
    ExpectedRevenue_Value   FLOAT,
    PotentialTurnover_Value FLOAT,
    BKMTurnover_Value       FLOAT,
    TargetTurnover_Value    FLOAT,
    Probability             FLOAT,
    IsThereDelay            INT,
    CloseDate               DATE,
    DeliveryDate            DATE,
    FirstCreatedDate        DATE,
    _SyncedAt               DATETIME DEFAULT GETUTCDATE()
);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_opp_closedate' AND object_id = OBJECT_ID('Opportunity'))
CREATE INDEX idx_opp_closedate ON Opportunity(CloseDate);
GO

-- ============================================================
-- TABLE: OpportunityNotes
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[OpportunityNotes]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[OpportunityNotes] (
    Id            INT IDENTITY(1,1) PRIMARY KEY,
    OpportunityId NVARCHAR(450) NOT NULL,
    DateTaken     DATETIME,
    Note          NVARCHAR(MAX),
    UserName      NVARCHAR(MAX),
    NoteText      NVARCHAR(MAX),
    CONSTRAINT FK_Notes_Opportunity FOREIGN KEY (OpportunityId) REFERENCES Opportunity(Id) ON DELETE CASCADE
);
END
GO

-- ============================================================
-- TABLE: OpportunityContacts
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[OpportunityContacts]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[OpportunityContacts] (
    Id             INT IDENTITY(1,1) PRIMARY KEY,
    OpportunityId  NVARCHAR(450) NOT NULL,
    Name           NVARCHAR(MAX),
    Title          NVARCHAR(MAX),
    Email          NVARCHAR(MAX),
    Phone          NVARCHAR(MAX),
    CellPhone      NVARCHAR(MAX),
    Website        NVARCHAR(MAX),
    DefaultContact INT,
    CONSTRAINT FK_Contacts_Opportunity FOREIGN KEY (OpportunityId) REFERENCES Opportunity(Id) ON DELETE CASCADE
);
END
GO

-- ============================================================
-- TABLE: ProductGroups
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ProductGroups]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[ProductGroups] (
    Id             INT IDENTITY(1,1) PRIMARY KEY,
    OpportunityId  NVARCHAR(450) NOT NULL,
    ProductGroupId NVARCHAR(MAX),
    CONSTRAINT FK_PG_Opportunity FOREIGN KEY (OpportunityId) REFERENCES Opportunity(Id) ON DELETE CASCADE
);
END
GO

-- ============================================================
-- TABLE: Person
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Person]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Person] (
    Id NVARCHAR(450) PRIMARY KEY,
    Name NVARCHAR(MAX) NOT NULL,
    SurName NVARCHAR(MAX) NOT NULL,
    Title NVARCHAR(MAX),
    Email NVARCHAR(MAX),
    CellPhone NVARCHAR(MAX),
    Phone NVARCHAR(MAX),
    EmploymentDate DATE,
    EndOfEmploymentDate DATE,
    UserName NVARCHAR(MAX),
    IdentificationNumber NVARCHAR(MAX),
    Nationality NVARCHAR(MAX),
    BirthDate DATE,
    Gender INT,
    MaritalStatus INT,
    NumberOfChildren INT,
    BloodType INT,
    Height FLOAT,
    Weight FLOAT,
    Size INT,
    ShoeSize FLOAT,
    ManagerId NVARCHAR(450),
    [Status] INT,
    DealerId NVARCHAR(450),
    RoleId NVARCHAR(450),
    MaxDiscountRate FLOAT,
    CompanyId NVARCHAR(450),
    PersonNameSurname NVARCHAR(MAX),
    ManagerType INT,
    PlaCod NVARCHAR(450),
    AddressInfo_City NVARCHAR(MAX),
    AddressInfo_Town NVARCHAR(MAX),
    AddressInfo_AddressLine NVARCHAR(MAX),
    AddressInfo_PostalCode NVARCHAR(MAX),
    AddressInfo_Country NVARCHAR(MAX),
    _SyncedAt DATETIME DEFAULT GETUTCDATE()
);
END
GO

-- ============================================================
-- TABLE: Education
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Education]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Education] (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    PersonId NVARCHAR(450),
    EducationType INT,
    FieldOfStudy NVARCHAR(MAX),
    SchoolName NVARCHAR(MAX),
    StartYear INT,
    EndYear INT,
    CONSTRAINT FK_Edu_Person FOREIGN KEY (PersonId) REFERENCES Person(Id) ON DELETE CASCADE
);
END
GO

-- ============================================================
-- TABLE: PersonFile
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[PersonFile]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[PersonFile] (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    PersonId NVARCHAR(450),
    FilePath NVARCHAR(MAX),
    [FileName] NVARCHAR(MAX),
    FileType NVARCHAR(MAX),
    CONSTRAINT FK_File_Person FOREIGN KEY (PersonId) REFERENCES Person(Id) ON DELETE CASCADE
);
END
GO

-- ============================================================
-- TABLE: Companies
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Companies]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Companies] (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    PersonId NVARCHAR(450),
    CompanyId NVARCHAR(MAX),
    CONSTRAINT FK_Comp_Person FOREIGN KEY (PersonId) REFERENCES Person(Id) ON DELETE CASCADE
);
END
GO

-- ============================================================
-- TABLE: Account
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Account]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Account] (
    Id NVARCHAR(450) PRIMARY KEY,
    Name NVARCHAR(MAX),
    Code NVARCHAR(MAX),
    Title NVARCHAR(MAX),
    [Type] INT,
    ParentAccountId NVARCHAR(MAX),
    OwnerId NVARCHAR(MAX) NOT NULL,
    TerritoryId NVARCHAR(MAX),
    [State] INT,
    DefaultDiscount FLOAT,
    DefaultCurrency INT,
    IdentificationNumber NVARCHAR(MAX),
    SurName NVARCHAR(MAX),
    CellPhone NVARCHAR(MAX),
    Phone NVARCHAR(MAX),
    TaxOffice NVARCHAR(MAX),
    TaxNumber NVARCHAR(MAX),
    Email NVARCHAR(MAX),
    DealerId NVARCHAR(MAX),
    AccountGroupId NVARCHAR(MAX),
    AccountAdditionalGroupId NVARCHAR(MAX),
    CurrencyRateType INT,
    IsVATExempt INT,
    AccountAutoNumberNextGen INT,
    WebSite NVARCHAR(MAX),
    Sector INT,
    ActivitySummary NVARCHAR(MAX),
    LastTouchDate DATE,
    SignBoardName NVARCHAR(MAX),
    Emplooyes INT,
    LeadSource INT,
    AccountNumber INT,
    Instagram NVARCHAR(MAX),
    Fax NVARCHAR(MAX),
    RelatedDepartment NVARCHAR(MAX),
    ParamBusinessCardNo INT,
    ReferenceCode NVARCHAR(MAX),
    MonthlyTurnoverLevel INT,
    RivalFirmId NVARCHAR(MAX),
    AccountNameSurname NVARCHAR(MAX),
    MonthlyTurnoverLevelTR NVARCHAR(MAX),
    SectorTR NVARCHAR(MAX),
    FirstCreatedDate DATE,
    FirstCreatedByName NVARCHAR(MAX),
    Email2 NVARCHAR(MAX),
    Email3 NVARCHAR(MAX),
    BusinessPartnerId NVARCHAR(MAX),
    UsedERP INT,
    IsInvoiceGenerated INT,
    IsTrainingProvided INT,
    IsContractReceived INT,
    NumberOfEmployees INT,
    NumberOfDealer INT,
    NumberOfWorkingBank INT,
    ENumberOfGroupComplaints INT,
    CapitalSize INT,
    AccountGroupInfo INT,
    CompanyAge INT,
    InRefCode NVARCHAR(MAX),
    City NVARCHAR(MAX),
    LeadSourceNextGenId NVARCHAR(MAX),
    IsSpecialField INT,
    IsoThousandRank INT,
    CommunicationInfo INT,
    CreditUsageCountForLastMonth FLOAT,
    CreditUsageCountForLastThreeMonth FLOAT,
    CreditUsageCountForYear FLOAT,
    FieldSalesRepresentativeId NVARCHAR(MAX),
    TPOutReferenceCode NVARCHAR(MAX),
    CountrySapId NVARCHAR(MAX),
    CountryRegionSapId NVARCHAR(MAX),
    CurrencySapId NVARCHAR(MAX),
    CustomerAccountGroupSapId NVARCHAR(MAX),
    LanguageSapId NVARCHAR(MAX),
    PaymentTermSapId NVARCHAR(MAX),
    SalesOfficeSapId NVARCHAR(MAX),
    TaxClassificationSapId NVARCHAR(MAX),
    SAPOutReferenceCode NVARCHAR(MAX),
    IBAN NVARCHAR(MAX),
    BankCountryId NVARCHAR(MAX),
    BankCurrencySapId NVARCHAR(MAX),
    AccountHolderName NVARCHAR(MAX),
    OtherUsedERP NVARCHAR(MAX),
    EDocumentType INT,
    Location_Latitude FLOAT,
    Location_Longitude FLOAT,
    CreditLimit_Amount FLOAT,
    CreditLimit_Currency INT,
    RiskLimit_Amount FLOAT,
    RiskLimit_Currency INT,
    CreditUsageAmountForLastMonth_Amount FLOAT,
    CreditUsageAmountForLastMonth_Currency INT,
    CreditUsageAmountForLastThreeMonths_Amount FLOAT,
    CreditUsageAmountForLastThreeMonths_Currency INT,
    CreditUsageAmountForYear_Amount FLOAT,
    CreditUsageAmountForYear_Currency INT,
    _SyncedAt DATETIME DEFAULT GETUTCDATE()
);
END
GO

-- ============================================================
-- TABLE: Addresses
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Addresses]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Addresses] (
    Id CHAR(36) PRIMARY KEY,
    AccountId NVARCHAR(450),
    AddressType INT,
    AccountLocation NVARCHAR(MAX),
    CentralAddress INT,
    Address_Country NVARCHAR(MAX),
    Address_Subdivision1 NVARCHAR(MAX),
    Address_Subdivision2 NVARCHAR(MAX),
    Address_Subdivision3 NVARCHAR(MAX),
    Address_Subdivision4 NVARCHAR(MAX),
    Address_OpenAddress NVARCHAR(MAX),
    CONSTRAINT FK_Addr_Account FOREIGN KEY (AccountId) REFERENCES Account(Id) ON DELETE CASCADE
);
END
GO

-- ============================================================
-- TABLE: Stock
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Stock]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Stock] (
    Id NVARCHAR(450) PRIMARY KEY,
    Code NVARCHAR(MAX) NOT NULL,
    Name NVARCHAR(MAX) NOT NULL,
    ShortName NVARCHAR(MAX) NOT NULL,
    BaseUnitType NVARCHAR(MAX) NOT NULL,
    SerialTrackingEnabled INT,
    SerialCodeType INT,
    SalesVatValue FLOAT NOT NULL,
    PurchaseVatValue FLOAT NOT NULL,
    VatCalculationType INT,
    StockType INT,
    ParentStocktId NVARCHAR(MAX),
    [State] INT,
    ProductGroupId NVARCHAR(MAX),
    BrandId NVARCHAR(MAX),
    MinStockLevel INT,
    OrderLevel INT,
    TargetLevel INT,
    OrderTime INT,
    ReferenceCode NVARCHAR(MAX),
    CompanyId NVARCHAR(MAX),
    ProductType INT,
    AccountingDetailCode NVARCHAR(MAX),
    InvWillWarrantyBeFollowed INT,
    InvWarrantyPeriod INT,
    InvWarrantyPeriodType INT,
    InvIsInstallationNecessary INT,
    TPOutReferenceCode NVARCHAR(MAX),
    SAPOutReferenceCode NVARCHAR(MAX),
    _SyncedAt DATETIME DEFAULT GETUTCDATE()
);
END
GO

-- ============================================================
-- TABLE: Contacts
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Contacts]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Contacts] (
    Id NVARCHAR(450) PRIMARY KEY,
    CompanyId NVARCHAR(MAX),
    PersonalTitle INT,
    FirstName NVARCHAR(MAX),
    LastName NVARCHAR(MAX),
    Position NVARCHAR(MAX),
    Email NVARCHAR(MAX),
    ContactOwnerId NVARCHAR(MAX),
    MobilePhone NVARCHAR(MAX),
    Phone NVARCHAR(MAX),
    AccountNameId NVARCHAR(MAX),
    FirstTouchDate NVARCHAR(MAX),
    SDROwnerId NVARCHAR(MAX),
    SecondaryEmail NVARCHAR(MAX),
    LastDate NVARCHAR(MAX),
    Description NVARCHAR(MAX),
    Website NVARCHAR(MAX),
    BirthDate NVARCHAR(MAX),
    MemberId NVARCHAR(MAX),
    AccountStatus INT,
    BlackList INT,
    RecordDate NVARCHAR(MAX),
    Importance INT,
    CreditQuantity INT,
    EducationStatus INT,
    WorkingType INT,
    Profession INT,
    Title INT,
    PayDay NVARCHAR(MAX),
    CustomerType INT,
    FirstSave INT,
    ContactNameSurname NVARCHAR(MAX),
    FirstCreatedDate NVARCHAR(MAX),
    FirstCreatedByName NVARCHAR(MAX),
    TCKN NVARCHAR(MAX),
    ContactCode NVARCHAR(MAX),
    BirthPlace NVARCHAR(MAX),
    MarketingAuthorizationviaGSM INT,
    MarketingAuthorizationviaEmail INT,
    Gender INT,
    ContactAutoNumberNextGen INT,
    RefCode NVARCHAR(MAX),
    InRefCode NVARCHAR(MAX),
    CommunicationInfo INT,
    AddToAccountContacts INT,
    AccountContactId NVARCHAR(MAX),
    CreatedFromAccountListener INT,
    _SyncedAt DATETIME DEFAULT GETUTCDATE()
);
END
GO

-- ============================================================
-- TABLE: CrmOrder
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CrmOrder]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[CrmOrder] (
    Id NVARCHAR(450) PRIMARY KEY,
    QuoteId NVARCHAR(MAX),
    AccountId NVARCHAR(MAX),
    ProposalOwnerId NVARCHAR(MAX),
    WarehouseId NVARCHAR(MAX),
    TeamId NVARCHAR(MAX),
    TeamCreatedById NVARCHAR(MAX),
    CompanyId NVARCHAR(MAX),
    StockId NVARCHAR(MAX),
    SpecialCodeId NVARCHAR(MAX),
    DistributionChannelSapId NVARCHAR(MAX),
    DivisionSapId NVARCHAR(MAX),
    SalesDocumentTypeSapId NVARCHAR(MAX),
    SalesOrganizationSapId NVARCHAR(MAX),
    SalesPaymentTermSapId NVARCHAR(MAX),
    CrmSalesOfficeSapId NVARCHAR(MAX),
    CurrencySapId NVARCHAR(MAX),
    SalesGroupSapId NVARCHAR(MAX),
    ContractId NVARCHAR(MAX),
    PaymentType INT,
    PaymentTypeTime INT,
    DeliveryType INT,
    DeliveryTypeTime INT,
    SubTotalAlternativeCurrency INT,
    SubTotalDiscountType INT,
    [Status] INT,
    IsVATExempt INT,
    IsEligibleForNetsisIntegration INT,
    IsEligibleForSapIntegration INT,
    IsDeletedFromBackend INT,
    ExpirationDate NVARCHAR(MAX),
    DeliveryDate NVARCHAR(MAX),
    CreateOrderDate NVARCHAR(MAX),
    PlannedInvoiceDate NVARCHAR(MAX),
    InvoiceDate NVARCHAR(MAX),
    SubTotalDiscount FLOAT,
    DeliveryTime INT,
    PaymentTime INT,
    AlternativeCurrencyRate FLOAT,
    SubTotalDiscountAmount FLOAT,
    TotalDiscountRate FLOAT,
    NetSubTotalLocalCurrency_Amount FLOAT,
    NetSubTotalLocalCurrency_Currency NVARCHAR(MAX),
    TotalNetAmountLocalCurrency_Amount FLOAT,
    TotalNetAmountLocalCurrency_Currency NVARCHAR(MAX),
    TotalAmountWithTaxLocalCurrency_Amount FLOAT,
    TotalAmountWithTaxLocalCurrency_Currency NVARCHAR(MAX),
    TotalProfitAmount_Amount FLOAT,
    TotalProfitAmount_Currency NVARCHAR(MAX),
    NetSubTotalAlternativeCurrency_Amount FLOAT,
    NetSubTotalAlternativeCurrency_Currency NVARCHAR(MAX),
    TotalNetAmountAlternativeCurrency_Amount FLOAT,
    TotalNetAmountAlternativeCurrency_Currency NVARCHAR(MAX),
    TotalAmountWithTaxAlternativeCurrency_Amount FLOAT,
    TotalAmountWithTaxAlternativeCurrency_Currency NVARCHAR(MAX),
    TotalProfitAmountAlternativeCurrency_Amount FLOAT,
    TotalProfitAmountAlternativeCurrency_Currency NVARCHAR(MAX),
    ReferenceCode NVARCHAR(MAX),
    InRefCode NVARCHAR(MAX),
    CustomerOrderNumber NVARCHAR(MAX),
    TPOutReferenceCode NVARCHAR(MAX),
    SAPOutReferenceCode NVARCHAR(MAX),
    ItemNo NVARCHAR(MAX),
    CrmOrderNotes NVARCHAR(MAX),
    Name NVARCHAR(MAX),
    SerialNumber NVARCHAR(MAX),
    _SyncedAt DATETIME DEFAULT GETUTCDATE()
);
END
GO

-- ============================================================
-- TABLE: CrmOrderProducts
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CrmOrderProducts]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[CrmOrderProducts] (
    Id NVARCHAR(450) PRIMARY KEY,
    CrmOrderId NVARCHAR(450) NOT NULL,
    StockId NVARCHAR(MAX) NOT NULL,
    Quantity FLOAT NOT NULL,
    DeliveryTime NVARCHAR(MAX),
    TransactionDate NVARCHAR(MAX) NOT NULL,
    LineDiscountRate FLOAT,
    LineDiscountType INT,
    Tax FLOAT NOT NULL,
    ProfitRate FLOAT,
    CurrencyRate FLOAT,
    ComissionRate FLOAT,
    StockUnitTypeIdentifier NVARCHAR(MAX) NOT NULL,
    StockUnitType NVARCHAR(MAX),
    Description NVARCHAR(MAX),
    ItemNo NVARCHAR(MAX),
    PYPSapId NVARCHAR(MAX),
    StorageLocationSapId NVARCHAR(MAX),
    ProductionLocationSapId NVARCHAR(MAX),
    QuoteProductId NVARCHAR(MAX),
    PFApplicaitonType INT,
    LineDiscountAmount_Amount FLOAT,
    LineDiscountAmount_Currency NVARCHAR(MAX),
    UnitPrice_Amount FLOAT,
    UnitPrice_Currency NVARCHAR(MAX),
    PurchasingPrice_Amount FLOAT,
    PurchasingPrice_Currency NVARCHAR(MAX),
    Total_Amount FLOAT,
    Total_Currency NVARCHAR(MAX),
    NetLineSubTotal_Amount FLOAT,
    NetLineSubTotal_Currency NVARCHAR(MAX),
    TotalProfitAmountWithLocalCurrency_Amount FLOAT,
    TotalProfitAmountWithLocalCurrency_Currency NVARCHAR(MAX),
    UnitProfitAmountWithLocalCurrency_Amount FLOAT,
    UnitProfitAmountWithLocalCurrency_Currency NVARCHAR(MAX),
    NetLineTotalAmount_Amount FLOAT,
    NetLineTotalAmount_Currency NVARCHAR(MAX),
    NetLineTotalWithTax_Amount FLOAT,
    NetLineTotalWithTax_Currency NVARCHAR(MAX),
    NetLineTotalWithTaxLocalCurrency_Amount FLOAT,
    NetLineTotalWithTaxLocalCurrency_Currency NVARCHAR(MAX),
    NetLineSubTotalLocalCurrency_Amount FLOAT,
    NetLineSubTotalLocalCurrency_Currency NVARCHAR(MAX),
    NetLineTotalAmountLocalCurrency_Amount FLOAT,
    NetLineTotalAmountLocalCurrency_Currency NVARCHAR(MAX),
    ProfitAfterSubtotalDiscountLocalCurrency_Amount FLOAT,
    ProfitAfterSubtotalDiscountLocalCurrency_Currency NVARCHAR(MAX),
    _SyncedAt DATETIME DEFAULT GETUTCDATE()
);
END
GO

-- ============================================================
-- TABLE: InventoryAccountProduct
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[InventoryAccountProduct]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[InventoryAccountProduct] (
    Id NVARCHAR(450) PRIMARY KEY,
    AccountId NVARCHAR(MAX) NOT NULL,
    StockId NVARCHAR(MAX) NOT NULL,
    ContactId NVARCHAR(MAX),
    StartDate NVARCHAR(MAX),
    FinishDate NVARCHAR(MAX),
    Domain NVARCHAR(MAX),
    PosAccountNo NVARCHAR(MAX),
    CardNo NVARCHAR(MAX),
    [Status] INT,
    FinancialProductType INT,
    Amount INT,
    InvSerialId NVARCHAR(MAX),
    InvInstalledDate NVARCHAR(MAX),
    InvPurchaseDate NVARCHAR(MAX) NOT NULL,
    InvOutOfWarehouseSerial INT,
    IsPFActive INT,
    Price_Amount FLOAT,
    Price_Currency NVARCHAR(MAX),
    Vat_Amount FLOAT,
    Vat_Currency NVARCHAR(MAX),
    TotalListPrice_Amount FLOAT,
    TotalListPrice_Currency NVARCHAR(MAX),
    TotalPackagePrice_Amount FLOAT,
    TotalPackagePrice_Currency NVARCHAR(MAX),
    TotalPackageVATAmount_Amount FLOAT,
    TotalPackageVATAmount_Currency NVARCHAR(MAX),
    InvInstalledAddress_CountryCode NVARCHAR(MAX),
    InvInstalledAddress_Subdivision1 NVARCHAR(MAX),
    InvInstalledAddress_Subdivision2 NVARCHAR(MAX),
    InvInstalledAddress_Subdivision3 NVARCHAR(MAX),
    InvInstalledAddress_Subdivision4 NVARCHAR(MAX),
    InvInstalledAddress_OpenAddress NVARCHAR(MAX),
    InvOutOfWarehouseSerialCode NVARCHAR(MAX),
    _SyncedAt DATETIME DEFAULT GETUTCDATE()
);
END
GO

-- ============================================================
-- TABLE: Company
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Company]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Company] (
    Id NVARCHAR(450) PRIMARY KEY,
    Name NVARCHAR(MAX) NOT NULL,
    OrderNo INT NOT NULL,
    ValidForAllUserGroups INT,
    Email NVARCHAR(MAX),
    IntegrationUsername NVARCHAR(MAX),
    IntegrationPassword NVARCHAR(MAX),
    IntegrationGrantType NVARCHAR(MAX),
    IntegrationBranchCode INT,
    IntegrationDbName NVARCHAR(MAX),
    IntegrationDbUser NVARCHAR(MAX),
    IntegrationDbType INT,
    IntegrationDbPassword NVARCHAR(MAX),
    IntegrationPath NVARCHAR(MAX),
    IntegrationType INT,
    SalesOrganizationSapId NVARCHAR(MAX),
    _SyncedAt DATETIME DEFAULT GETUTCDATE()
);
END
GO

-- ============================================================
-- TABLE: CalenderEvent
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CalenderEvent]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[CalenderEvent] (
    Id NVARCHAR(450) PRIMARY KEY,
    OwnerId NVARCHAR(MAX) NOT NULL,
    Subject NVARCHAR(MAX) NOT NULL,
    [Type] INT NOT NULL,
    Description NVARCHAR(MAX),
    StartDate NVARCHAR(450),
    FinishDate NVARCHAR(450),
    Location NVARCHAR(MAX),
    AccountId NVARCHAR(MAX),
    LeadId NVARCHAR(MAX),
    ContactId NVARCHAR(MAX),
    CompanyId NVARCHAR(MAX),
    ParentEventId NVARCHAR(MAX),
    IsAllDay INT,
    IsRepeat INT,
    IsReminderSet INT,
    IsNewAccount INT,
    RepeatPattern INT,
    RepeatEvery INT,
    MonthForRepeatOnYearly INT,
    EndRepeat INT,
    AfterOccurrenceCount INT,
    TimeBeforeEvent INT,
    RepeatEveryHours INT,
    RepeatEveryDays INT,
    RepeatOnMonthly INT,
    RepeatOnYearly INT,
    EndRepeatDate NVARCHAR(450),
    [Status] INT NOT NULL,
    RecurrenceRule NVARCHAR(MAX),
    RecurrenceException NVARCHAR(MAX),
    ParticipantType INT,
    SubjectType INT,
    ExcludeWeekends INT,
    FirstCreatedBy NVARCHAR(450),
    FirstCreatedDate NVARCHAR(450),
    EventEnvironment INT,
    CalendarEventResultId NVARCHAR(450),
    GoogleCalendarEventCreatedMail NVARCHAR(MAX),
    SubjectTypeTr NVARCHAR(MAX),
    TypeTr NVARCHAR(MAX),
    StatusTr NVARCHAR(MAX),
    EventEnvironmentTr NVARCHAR(MAX),
    ParticipantTypeTr NVARCHAR(MAX),
    _SyncedAt DATETIME DEFAULT GETUTCDATE()
);
END
GO

-- Ensure StartDate is indexable if table already exists
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('CalenderEvent') AND name = 'StartDate' AND max_length = -1)
BEGIN
    ALTER TABLE [dbo].[CalenderEvent] ALTER COLUMN StartDate NVARCHAR(450);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_event_start' AND object_id = OBJECT_ID('CalenderEvent'))
CREATE INDEX idx_event_start ON CalenderEvent(StartDate);
GO

-- ============================================================
-- TABLE: CalenderEventDaysForRepeatOnWeekly
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CalenderEventDaysForRepeatOnWeekly]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[CalenderEventDaysForRepeatOnWeekly] (
    Id NVARCHAR(450) PRIMARY KEY,
    CalenderEventId NVARCHAR(450) NOT NULL,
    [Day] INT NOT NULL,
    CONSTRAINT FK_Repeats_Event FOREIGN KEY (CalenderEventId) REFERENCES CalenderEvent(Id) ON DELETE CASCADE
);
END
GO

-- ============================================================
-- TABLE: CalenderEventParticipantPeople
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CalenderEventParticipantPeople]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[CalenderEventParticipantPeople] (
    Id NVARCHAR(450) PRIMARY KEY,
    CalenderEventId NVARCHAR(450) NOT NULL,
    ParticipantPersonId NVARCHAR(MAX) NOT NULL,
    CONSTRAINT FK_People_Event FOREIGN KEY (CalenderEventId) REFERENCES CalenderEvent(Id) ON DELETE CASCADE
);
END
GO

-- ============================================================
-- TABLE: CalenderEventParticipantLeads
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CalenderEventParticipantLeads]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[CalenderEventParticipantLeads] (
    Id NVARCHAR(450) PRIMARY KEY,
    CalenderEventId NVARCHAR(450) NOT NULL,
    ParticipantLeadId NVARCHAR(MAX) NOT NULL,
    CONSTRAINT FK_Leads_Event FOREIGN KEY (CalenderEventId) REFERENCES CalenderEvent(Id) ON DELETE CASCADE
);
END
GO

-- ============================================================
-- TABLE: CalenderEventParticipantContacts
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CalenderEventParticipantContacts]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[CalenderEventParticipantContacts] (
    Id NVARCHAR(450) PRIMARY KEY,
    CalenderEventId NVARCHAR(450) NOT NULL,
    ParticipantContactId NVARCHAR(MAX) NOT NULL,
    CONSTRAINT FK_Contacts_Event FOREIGN KEY (CalenderEventId) REFERENCES CalenderEvent(Id) ON DELETE CASCADE
);
END
GO

-- ============================================================
-- TABLE: Quote
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Quote]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Quote] (
    Id NVARCHAR(450) PRIMARY KEY,
    OpportunityId NVARCHAR(450),
    RevisionId NVARCHAR(450),
    Number NVARCHAR(450) NOT NULL,
    Name NVARCHAR(MAX) NOT NULL,
    ExpirationDate NVARCHAR(450) NOT NULL,
    SubTotalDiscount FLOAT,
    WarehouseId NVARCHAR(450),
    ProposalOwnerId NVARCHAR(450) NOT NULL,
    PaymentType INT NOT NULL,
    PaymentTypeTime INT,
    [Status] INT NOT NULL,
    AddressIdentifier NVARCHAR(450),
    DeliveryType INT,
    DeliveryTime INT,
    DeliveryDate NVARCHAR(450),
    CustomerOrderNumber NVARCHAR(MAX),
    PaymentTime INT,
    DeliveryTypeTime INT,
    PersonId NVARCHAR(450),
    SpecialCodeId NVARCHAR(450),
    AccountId NVARCHAR(450) NOT NULL,
    Description NVARCHAR(MAX),
    RevNo INT,
    NetSubTotalLocalCurrency_Amount FLOAT,
    NetSubTotalLocalCurrency_Currency NVARCHAR(MAX),
    TotalNetAmountLocalCurrency_Amount FLOAT,
    TotalNetAmountLocalCurrency_Currency NVARCHAR(MAX),
    TotalAmountWithTaxLocalCurrency_Amount FLOAT,
    TotalAmountWithTaxLocalCurrency_Currency NVARCHAR(MAX),
    TotalProfitAmount_Amount FLOAT,
    TotalProfitAmount_Currency NVARCHAR(MAX),
    RevStatus INT,
    SubTotalAlternativeCurrency INT,
    AlternativeCurrencyRate FLOAT,
    NetSubTotalAlternativeCurrency_Amount FLOAT,
    NetSubTotalAlternativeCurrency_Currency NVARCHAR(MAX),
    TotalNetAmountAlternativeCurrency_Amount FLOAT,
    TotalNetAmountAlternativeCurrency_Currency NVARCHAR(MAX),
    TotalAmountWithTaxAlternativeCurrency_Amount FLOAT,
    TotalAmountWithTaxAlternativeCurrency_Currency NVARCHAR(MAX),
    TotalProfitAmountAlternativeCurrency_Amount FLOAT,
    TotalProfitAmountAlternativeCurrency_Currency NVARCHAR(MAX),
    IsVATExempt INT,
    TermsAndConditions NVARCHAR(MAX),
    ProductsAndServices NVARCHAR(MAX),
    ServiceStartDate NVARCHAR(450),
    ServiceFinishDate NVARCHAR(450),
    ReferenceCode NVARCHAR(450),
    TransferWithForeignCurrency INT,
    ContactId NVARCHAR(MAX),
    FirstCreatedDate NVARCHAR(MAX),
    FirstCreatedByName NVARCHAR(MAX),
    TeamId NVARCHAR(MAX),
    TeamCreatedById NVARCHAR(MAX),
    SubTotalDiscountType INT,
    SubTotalDiscountAmount FLOAT,
    InRefCode NVARCHAR(MAX),
    CompanyId NVARCHAR(MAX),
    QuoteApprovalProcessStatus INT,
    TotalDiscountRate FLOAT,
    FirstReleaseDate NVARCHAR(MAX),
    RevisedDate NVARCHAR(MAX),
    CRMRevNo INT,
    PublicationSource NVARCHAR(MAX),
    TermsAndConditions2 NVARCHAR(MAX),
    ProductsAndServices2 NVARCHAR(MAX),
    StockId NVARCHAR(MAX),
    ItemNo NVARCHAR(MAX),
    QuoteType INT,
    CrmOrderId NVARCHAR(MAX),
    OrderWillBeCreate INT,
    OrderOwnerWillBeChanged INT,
    TPOutReferenceCode NVARCHAR(MAX),
    _SyncedAt DATETIME DEFAULT GETUTCDATE()
);
END
GO

-- ============================================================
-- TABLE: QuoteOrderDetails
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[QuoteOrderDetails]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[QuoteOrderDetails] (
    Id NVARCHAR(450) PRIMARY KEY,
    QuoteId NVARCHAR(450) NOT NULL,
    CrmOrderId NVARCHAR(MAX) NOT NULL,
    CONSTRAINT FK_Details_Quote FOREIGN KEY (QuoteId) REFERENCES Quote(Id) ON DELETE CASCADE
);
END
GO

-- ============================================================
-- TABLE: QuoteDynamicFields
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[QuoteDynamicFields]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[QuoteDynamicFields] (
    Id NVARCHAR(450) PRIMARY KEY,
    QuoteId NVARCHAR(450) NOT NULL,
    FieldName NVARCHAR(MAX) NOT NULL,
    FieldValue NVARCHAR(MAX),
    CONSTRAINT FK_Fields_Quote FOREIGN KEY (QuoteId) REFERENCES Quote(Id) ON DELETE CASCADE
);
END
GO

-- ============================================================
-- TABLE: Contract
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Contract]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Contract] (
    Id NVARCHAR(450) PRIMARY KEY,
    ContractNo NVARCHAR(MAX),
    ContractName NVARCHAR(MAX),
    AccountId NVARCHAR(MAX) NOT NULL,
    SalesRepresentativeId NVARCHAR(MAX) NOT NULL,
    ContractType INT,
    ContractStatus INT,
    StartDate NVARCHAR(MAX) NOT NULL,
    FinishDate NVARCHAR(MAX) NOT NULL,
    RenewalDate NVARCHAR(MAX),
    IsAutoExtending INT,
    InvoiceDueDate INT,
    TotalAmount_Amount FLOAT,
    TotalAmount_Currency NVARCHAR(MAX),
    TotalAmountLocalCurrency_Amount FLOAT,
    TotalAmountLocalCurrency_Currency NVARCHAR(MAX),
    StampTaxRate FLOAT,
    StampTaxAmount FLOAT,
    IsLateInterestApply INT,
    LateInterestContractYear INT,
    InvoiceNumber INT,
    InvoiceStatusId NVARCHAR(MAX),
    CompanyId NVARCHAR(MAX),
    ContractUrl NVARCHAR(MAX),
    ProductId NVARCHAR(MAX),
    RemainingBalance_Amount FLOAT,
    RemainingBalance_Currency NVARCHAR(MAX),
    SigningDate NVARCHAR(MAX),
    _SyncedAt DATETIME DEFAULT GETUTCDATE()
);
END
GO

-- ============================================================
-- TABLE: ContractPaymentPlans
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ContractPaymentPlans]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[ContractPaymentPlans] (
    Id NVARCHAR(450) PRIMARY KEY,
    ContractId NVARCHAR(450) NOT NULL,
    Price_Amount FLOAT,
    Price_Currency NVARCHAR(MAX),
    TotalRate FLOAT,
    HasBeenCollected INT,
    PaymentDate NVARCHAR(MAX) NOT NULL,
    Name NVARCHAR(MAX),
    CONSTRAINT FK_Payment_Contract FOREIGN KEY (ContractId) REFERENCES Contract(Id) ON DELETE CASCADE
);
END
GO

-- ============================================================
-- TABLE: ContractLisances
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ContractLisances]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[ContractLisances] (
    Id NVARCHAR(450) PRIMARY KEY,
    ContractId NVARCHAR(450) NOT NULL,
    LisanceId NVARCHAR(MAX) NOT NULL,
    CONSTRAINT FK_Lisance_Contract FOREIGN KEY (ContractId) REFERENCES Contract(Id) ON DELETE CASCADE
);
END
GO

-- ============================================================
-- TABLE: SalesPipeline
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SalesPipeline]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[SalesPipeline] (
    Id NVARCHAR(450) PRIMARY KEY,
    Name NVARCHAR(MAX),
    CompanyId NVARCHAR(MAX),
    [Status] INT,
    IsDefault INT,
    _SyncedAt DATETIME DEFAULT GETUTCDATE()
);
END
GO

-- ============================================================
-- TABLE: SalesPipelineStages
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SalesPipelineStages]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[SalesPipelineStages] (
    Id NVARCHAR(450) PRIMARY KEY,
    SalesPipelineId NVARCHAR(450) NOT NULL,
    PipelineStageId NVARCHAR(MAX) NOT NULL,
    PipelineStageName INT,
    CONSTRAINT FK_Stages_Pipeline FOREIGN KEY (SalesPipelineId) REFERENCES SalesPipeline(Id) ON DELETE CASCADE
);
END
GO

-- ============================================================
-- TABLE: CompanyCurrency
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CompanyCurrency]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[CompanyCurrency] (
    Id NVARCHAR(450) PRIMARY KEY,
    CompanyId NVARCHAR(450) NOT NULL,
    CurrencyCode INT NOT NULL,
    _SyncedAt DATETIME DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Currency_Company FOREIGN KEY (CompanyId) REFERENCES Company(Id) ON DELETE CASCADE
);
END
GO

-- ============================================================
-- TABLE: CurrencyRates
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CurrencyRates]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[CurrencyRates] (
    Id NVARCHAR(450) PRIMARY KEY,
    BaseCurrency INT NOT NULL,
    TargetCurrency INT NOT NULL,
    Rate FLOAT NOT NULL,
    RateDate NVARCHAR(MAX) NOT NULL,
    _SyncedAt DATETIME DEFAULT GETUTCDATE()
);
END
GO

-- ============================================================
-- TABLE: SystemEnums
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SystemEnums]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[SystemEnums] (
        EnumType NVARCHAR(450) NOT NULL,
        EnumValue INT NOT NULL,
        Id NVARCHAR(450),
        EnumName NVARCHAR(MAX) NOT NULL,
        DisplayName NVARCHAR(MAX),
        PRIMARY KEY (EnumType, EnumValue)
    );
END
ELSE
BEGIN
    -- Migration: Check if PK is on Id instead of (EnumType, EnumValue)
    IF EXISTS (
        SELECT 1 
        FROM sys.index_columns ic
        JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
        JOIN sys.indexes i ON ic.object_id = i.object_id AND ic.index_id = i.index_id
        WHERE i.is_primary_key = 1 
        AND i.object_id = OBJECT_ID(N'[dbo].[SystemEnums]')
        AND c.name = 'Id'
    )
    BEGIN
        DECLARE @ConstraintName NVARCHAR(128);
        SELECT @ConstraintName = name FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID(N'[dbo].[SystemEnums]') AND type = 'PK';
        IF @ConstraintName IS NOT NULL
        BEGIN
            EXEC('ALTER TABLE [dbo].[SystemEnums] DROP CONSTRAINT ' + @ConstraintName);
        END
        ALTER TABLE [dbo].[SystemEnums] ALTER COLUMN EnumType NVARCHAR(450) NOT NULL;
        ALTER TABLE [dbo].[SystemEnums] ALTER COLUMN EnumValue INT NOT NULL;
        ALTER TABLE [dbo].[SystemEnums] ADD PRIMARY KEY (EnumType, EnumValue);
    END
END
GO

-- Ensure EnumType is indexable
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('SystemEnums') AND name = 'EnumType' AND max_length = -1)
BEGIN
    ALTER TABLE [dbo].[SystemEnums] ALTER COLUMN EnumType NVARCHAR(450) NOT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_enum_type' AND object_id = OBJECT_ID('SystemEnums'))
CREATE INDEX idx_enum_type ON SystemEnums(EnumType);
GO
