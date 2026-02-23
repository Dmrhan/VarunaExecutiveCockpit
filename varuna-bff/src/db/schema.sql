-- Varuna Intelligence – SQLite Analytics Schema
-- Source of truth: C# IOpportunity model
-- Column names MUST match property names exactly

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- ============================================================
-- MAIN TABLE: Opportunity
-- ============================================================
CREATE TABLE IF NOT EXISTS Opportunity (
    -- Identity (from IDocument)
    Id                      TEXT PRIMARY KEY,
    Name                    TEXT,

    -- Ownership & Relationships
    AccountId               TEXT,
    OwnerId                 TEXT,
    LeadOwnerId             TEXT,
    PartnerId               TEXT,
    PersonId                TEXT,
    CompanyId               TEXT,
    PipelineId              TEXT,
    ProductGroupId          TEXT,
    ProductCategoryId       TEXT,

    -- Classification (enums stored as INTEGER)
    Type                    INTEGER,
    Source                  INTEGER,
    DealType                INTEGER,
    WonLostType             INTEGER,
    DealStatus              INTEGER,
    ProbabilityBand         INTEGER,
    OpportunityStageName    INTEGER,

    -- Stage
    OpportunityStageId      TEXT,
    OpportunityStageNameTr  TEXT,

    -- Financials: IMoney complex types flattened to _Value suffix
    Amount_Value            REAL,
    ExpectedRevenue_Value   REAL,
    PotentialTurnover_Value REAL,
    BKMTurnover_Value       REAL,
    TargetTurnover_Value    REAL,

    -- Metrics
    Probability             REAL,

    -- Flags (boolean stored as INTEGER 0/1)
    IsThereDelay            INTEGER,

    -- Dates (stored as ISO 8601 TEXT for SQLite date functions compatibility)
    CloseDate               DATE,
    DeliveryDate            DATE,
    FirstCreatedDate        DATE,

    -- BFF audit column (not in C# model)
    _SyncedAt               DATETIME DEFAULT (datetime('now'))
);

-- Indexes for analytical query performance
CREATE INDEX IF NOT EXISTS idx_opp_closedate       ON Opportunity(CloseDate);
CREATE INDEX IF NOT EXISTS idx_opp_dealstatus      ON Opportunity(DealStatus);
CREATE INDEX IF NOT EXISTS idx_opp_wonlosttype     ON Opportunity(WonLostType);
CREATE INDEX IF NOT EXISTS idx_opp_ownerid         ON Opportunity(OwnerId);
CREATE INDEX IF NOT EXISTS idx_opp_accountid       ON Opportunity(AccountId);
CREATE INDEX IF NOT EXISTS idx_opp_probband        ON Opportunity(ProbabilityBand);
CREATE INDEX IF NOT EXISTS idx_opp_dealstatus_date ON Opportunity(DealStatus, CloseDate);
CREATE INDEX IF NOT EXISTS idx_opp_wonlost_date    ON Opportunity(WonLostType, CloseDate);

-- ============================================================
-- DETAIL TABLE: OpportunityNotes
-- ============================================================
CREATE TABLE IF NOT EXISTS OpportunityNotes (
    Id            INTEGER PRIMARY KEY AUTOINCREMENT,
    OpportunityId TEXT NOT NULL,
    DateTaken     DATETIME,
    Note          TEXT,
    UserName      TEXT,
    NoteText      TEXT,
    FOREIGN KEY (OpportunityId) REFERENCES Opportunity(Id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notes_oppid ON OpportunityNotes(OpportunityId);

-- ============================================================
-- DETAIL TABLE: OpportunityContacts
-- ============================================================
CREATE TABLE IF NOT EXISTS OpportunityContacts (
    Id             INTEGER PRIMARY KEY AUTOINCREMENT,
    OpportunityId  TEXT NOT NULL,
    Name           TEXT,
    Title          TEXT,
    Email          TEXT,
    Phone          TEXT,
    CellPhone      TEXT,
    Website        TEXT,
    DefaultContact INTEGER,
    FOREIGN KEY (OpportunityId) REFERENCES Opportunity(Id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_contacts_oppid ON OpportunityContacts(OpportunityId);

-- ============================================================
-- DETAIL TABLE: ProductGroups
-- ============================================================
CREATE TABLE IF NOT EXISTS ProductGroups (
    Id             INTEGER PRIMARY KEY AUTOINCREMENT,
    OpportunityId  TEXT NOT NULL,
    ProductGroupId TEXT,
    FOREIGN KEY (OpportunityId) REFERENCES Opportunity(Id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pg_oppid ON ProductGroups(OpportunityId);

-- ============================================================
-- MAIN TABLE: Person
-- ============================================================
CREATE TABLE IF NOT EXISTS Person (
    Id TEXT PRIMARY KEY,
    Name TEXT NOT NULL,
    SurName TEXT NOT NULL,
    Title TEXT,
    Email TEXT,
    CellPhone TEXT,
    Phone TEXT,
    EmploymentDate DATE,
    EndOfEmploymentDate DATE,
    UserName TEXT,
    IdentificationNumber TEXT,
    Nationality TEXT,
    BirthDate DATE,
    Gender INTEGER,
    MaritalStatus INTEGER,
    NumberOfChildren INTEGER,
    BloodType INTEGER,
    Height REAL,
    Weight REAL,
    Size INTEGER,
    ShoeSize REAL,
    ManagerId TEXT,
    Status INTEGER,
    DealerId TEXT,
    RoleId TEXT,
    MaxDiscountRate REAL,
    CompanyId TEXT,
    PersonNameSurname TEXT,
    ManagerType INTEGER,
    PlaCod TEXT,
    
    -- AddressInfo Flattening
    AddressInfo_City TEXT,
    AddressInfo_Town TEXT,
    AddressInfo_AddressLine TEXT,
    AddressInfo_PostalCode TEXT,
    AddressInfo_Country TEXT,
    
    _SyncedAt DATETIME DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_person_status ON Person(Status);
CREATE INDEX IF NOT EXISTS idx_person_role ON Person(RoleId);
CREATE INDEX IF NOT EXISTS idx_person_dealer ON Person(DealerId);
CREATE INDEX IF NOT EXISTS idx_person_company ON Person(CompanyId);
CREATE INDEX IF NOT EXISTS idx_person_manager_type ON Person(ManagerType);

-- ============================================================
-- DETAIL TABLE: Education
-- ============================================================
CREATE TABLE IF NOT EXISTS Education (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    PersonId TEXT,
    EducationType INTEGER,
    FieldOfStudy TEXT,
    SchoolName TEXT,
    StartYear INTEGER,
    EndYear INTEGER,
    FOREIGN KEY(PersonId) REFERENCES Person(Id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_edu_personid ON Education(PersonId);

-- ============================================================
-- DETAIL TABLE: PersonFile
-- ============================================================
CREATE TABLE IF NOT EXISTS PersonFile (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    PersonId TEXT,
    FilePath TEXT,
    FileName TEXT,
    FileType TEXT,
    FOREIGN KEY(PersonId) REFERENCES Person(Id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_file_personid ON PersonFile(PersonId);

-- ============================================================
-- DETAIL TABLE: Companies (Person assignments)
-- ============================================================
CREATE TABLE IF NOT EXISTS Companies (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    PersonId TEXT,
    CompanyId TEXT,
    FOREIGN KEY(PersonId) REFERENCES Person(Id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comp_personid ON Companies(PersonId);

-- ============================================================
-- MAIN TABLE: Account
-- ============================================================
CREATE TABLE IF NOT EXISTS Account (
    Id TEXT PRIMARY KEY,
    Name TEXT,
    Code TEXT,
    Title TEXT,
    Type INTEGER,
    ParentAccountId TEXT,
    OwnerId TEXT NOT NULL,
    TerritoryId TEXT,
    State INTEGER,
    DefaultDiscount REAL,
    DefaultCurrency INTEGER,
    IdentificationNumber TEXT,
    SurName TEXT,
    CellPhone TEXT,
    Phone TEXT,
    TaxOffice TEXT,
    TaxNumber TEXT,
    Email TEXT,
    DealerId TEXT,
    AccountGroupId TEXT,
    AccountAdditionalGroupId TEXT,
    CurrencyRateType INTEGER,
    IsVATExempt INTEGER,
    AccountAutoNumberNextGen INTEGER,
    WebSite TEXT,
    Sector INTEGER,
    ActivitySummary TEXT,
    LastTouchDate DATE,
    SignBoardName TEXT,
    Emplooyes INTEGER,
    LeadSource INTEGER,
    AccountNumber INTEGER,
    Instagram TEXT,
    Fax TEXT,
    RelatedDepartment TEXT,
    ParamBusinessCardNo INTEGER,
    ReferenceCode TEXT,
    MonthlyTurnoverLevel INTEGER,
    RivalFirmId TEXT,
    AccountNameSurname TEXT,
    MonthlyTurnoverLevelTR TEXT,
    SectorTR TEXT,
    FirstCreatedDate DATE,
    FirstCreatedByName TEXT,
    Email2 TEXT,
    Email3 TEXT,
    BusinessPartnerId TEXT,
    UsedERP INTEGER,
    IsInvoiceGenerated INTEGER,
    IsTrainingProvided INTEGER,
    IsContractReceived INTEGER,
    NumberOfEmployees INTEGER,
    NumberOfDealer INTEGER,
    NumberOfWorkingBank INTEGER,
    ENumberOfGroupComplaints INTEGER,
    CapitalSize INTEGER,
    AccountGroupInfo INTEGER,
    CompanyAge INTEGER,
    InRefCode TEXT,
    City TEXT,
    LeadSourceNextGenId TEXT,
    IsSpecialField INTEGER,
    IsoThousandRank INTEGER,
    CommunicationInfo INTEGER,
    CreditUsageCountForLastMonth REAL,
    CreditUsageCountForLastThreeMonth REAL,
    CreditUsageCountForYear REAL,
    FieldSalesRepresentativeId TEXT,
    TPOutReferenceCode TEXT,
    CountrySapId TEXT,
    CountryRegionSapId TEXT,
    CurrencySapId TEXT,
    CustomerAccountGroupSapId TEXT,
    LanguageSapId TEXT,
    PaymentTermSapId TEXT,
    SalesOfficeSapId TEXT,
    TaxClassificationSapId TEXT,
    SAPOutReferenceCode TEXT,
    IBAN TEXT,
    BankCountryId TEXT,
    BankCurrencySapId TEXT,
    AccountHolderName TEXT,
    OtherUsedERP TEXT,
    EDocumentType INTEGER,

    -- Complex Types Flattening
    Location_Latitude REAL,
    Location_Longitude REAL,
    CreditLimit_Amount REAL,
    CreditLimit_Currency INTEGER,
    RiskLimit_Amount REAL,
    RiskLimit_Currency INTEGER,
    CreditUsageAmountForLastMonth_Amount REAL,
    CreditUsageAmountForLastMonth_Currency INTEGER,
    CreditUsageAmountForLastThreeMonths_Amount REAL,
    CreditUsageAmountForLastThreeMonths_Currency INTEGER,
    CreditUsageAmountForYear_Amount REAL,
    CreditUsageAmountForYear_Currency INTEGER,
    
    _SyncedAt DATETIME DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_account_owner ON Account(OwnerId);
CREATE INDEX IF NOT EXISTS idx_account_state ON Account(State);
CREATE INDEX IF NOT EXISTS idx_account_sector ON Account(Sector);
CREATE INDEX IF NOT EXISTS idx_account_lasttouch ON Account(LastTouchDate);

-- ============================================================
-- DETAIL TABLES
-- ============================================================
CREATE TABLE IF NOT EXISTS Addresses (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    AccountId TEXT,
    AddressType INTEGER,
    AccountLocation TEXT,
    CentralAddress INTEGER,
    Address_Country TEXT,
    Address_Subdivision1 TEXT,
    Address_Subdivision2 TEXT,
    Address_Subdivision3 TEXT,
    Address_Subdivision4 TEXT,
    Address_OpenAddress TEXT,
    FOREIGN KEY(AccountId) REFERENCES Account(Id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_addr_accountid ON Addresses(AccountId);

CREATE TABLE IF NOT EXISTS AccountContacts (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    AccountId TEXT,
    ContactDetailId TEXT,
    FOREIGN KEY(AccountId) REFERENCES Account(Id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_contact_accountid ON AccountContacts(AccountId);

CREATE TABLE IF NOT EXISTS AccountNotes (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    AccountId TEXT,
    Note TEXT,
    NoteText TEXT,
    CreatedOn TEXT,
    CreatedBy TEXT,
    FOREIGN KEY(AccountId) REFERENCES Account(Id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_anotes_accountid ON AccountNotes(AccountId);

CREATE TABLE IF NOT EXISTS AccountRepresentatives (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    AccountId TEXT,
    AccountOwnerId TEXT,
    CompanyId TEXT,
    EnterpriceAccountRepresentativeId TEXT,
    FOREIGN KEY(AccountId) REFERENCES Account(Id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_arep_accountid ON AccountRepresentatives(AccountId);

CREATE TABLE IF NOT EXISTS AccountCompanies (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    AccountId TEXT,
    CompanyId TEXT,
    FOREIGN KEY(AccountId) REFERENCES Account(Id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_acomp_accountid ON AccountCompanies(AccountId);

CREATE TABLE IF NOT EXISTS IntegrationCurrencyDetails (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    AccountId TEXT,
    CurrencyCode INTEGER,
    ReferenceCode TEXT,
    FOREIGN KEY(AccountId) REFERENCES Account(Id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_icd_accountid ON IntegrationCurrencyDetails(AccountId);

CREATE TABLE IF NOT EXISTS NetsisCompanyReferenceCodes (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    AccountId TEXT,
    CompanyId TEXT,
    TPOutReferenceCode TEXT,
    FOREIGN KEY(AccountId) REFERENCES Account(Id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_ncrc_accountid ON NetsisCompanyReferenceCodes(AccountId);

CREATE TABLE IF NOT EXISTS WhoAreWeDealingWith (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    AccountId TEXT,
    WhoAreWeDealingWith INTEGER,
    FOREIGN KEY(AccountId) REFERENCES Account(Id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_wdw_accountid ON WhoAreWeDealingWith(AccountId);

CREATE TABLE IF NOT EXISTS InstallProcessRepresentatives (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    AccountId TEXT,
    InstallProcessRePresentId TEXT,
    FOREIGN KEY(AccountId) REFERENCES Account(Id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_ipr_accountid ON InstallProcessRepresentatives(AccountId);

-- ============================================================
-- MAIN TABLE: Stock
-- ============================================================
CREATE TABLE IF NOT EXISTS Stock (
    Id TEXT PRIMARY KEY,
    Code TEXT NOT NULL,
    Name TEXT NOT NULL,
    ShortName TEXT NOT NULL,
    BaseUnitType TEXT NOT NULL,
    SerialTrackingEnabled INTEGER,
    SerialCodeType INTEGER,
    SalesVatValue REAL NOT NULL,
    PurchaseVatValue REAL NOT NULL,
    VatCalculationType INTEGER,
    StockType INTEGER,
    ParentStocktId TEXT,
    State INTEGER,
    ProductGroupId TEXT,
    BrandId TEXT,
    MinStockLevel INTEGER,
    OrderLevel INTEGER,
    TargetLevel INTEGER,
    OrderTime INTEGER,
    ReferenceCode TEXT,
    CompanyId TEXT,
    ProductType INTEGER,
    AccountingDetailCode TEXT,
    InvWillWarrantyBeFollowed INTEGER,
    InvWarrantyPeriod INTEGER,
    InvWarrantyPeriodType INTEGER,
    InvIsInstallationNecessary INTEGER,
    TPOutReferenceCode TEXT,
    SAPOutReferenceCode TEXT,
    
    _SyncedAt DATETIME DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_stock_state ON Stock(State);
CREATE INDEX IF NOT EXISTS idx_stock_brand ON Stock(BrandId);
CREATE INDEX IF NOT EXISTS idx_stock_group ON Stock(ProductGroupId);
CREATE INDEX IF NOT EXISTS idx_stock_company ON Stock(CompanyId);

-- ============================================================
-- DETAIL TABLES
-- ============================================================
CREATE TABLE IF NOT EXISTS StockUnitTypes (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    StockId TEXT,
    UnitType TEXT,
    Quantity REAL,
    Weight REAL,
    Volume REAL,
    RelatedUnitType TEXT,
    Barcode TEXT,
    IsTransactionUnit INTEGER,
    TPOutReferenceCode TEXT,
    FOREIGN KEY(StockId) REFERENCES Stock(Id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sut_stockid ON StockUnitTypes(StockId);

CREATE TABLE IF NOT EXISTS AdditionalTaxes (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    StockId TEXT,
    TaxId TEXT,
    FOREIGN KEY(StockId) REFERENCES Stock(Id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_addtax_stockid ON AdditionalTaxes(StockId);

CREATE TABLE IF NOT EXISTS StockFiles (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    StockId TEXT,
    FilePath TEXT,
    FileName TEXT,
    FileType TEXT,
    FOREIGN KEY(StockId) REFERENCES Stock(Id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sfile_stockid ON StockFiles(StockId);

CREATE TABLE IF NOT EXISTS Companies_Stock (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    StockId TEXT,
    CompanyId TEXT,
    FOREIGN KEY(StockId) REFERENCES Stock(Id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_compstock_stockid ON Companies_Stock(StockId);

-- ============================================================
-- MAIN TABLE: Contacts
-- ============================================================
CREATE TABLE IF NOT EXISTS Contacts (
    Id TEXT PRIMARY KEY,
    CompanyId TEXT,
    PersonalTitle INTEGER,
    FirstName TEXT,
    LastName TEXT,
    Position TEXT,
    Email TEXT,
    ContactOwnerId TEXT,
    MobilePhone TEXT,
    Phone TEXT,
    AccountNameId TEXT,
    FirstTouchDate TEXT,
    SDROwnerId TEXT,
    SecondaryEmail TEXT,
    LastDate TEXT,
    Description TEXT,
    Website TEXT,
    BirthDate TEXT,
    MemberId TEXT,
    AccountStatus INTEGER,
    BlackList INTEGER,
    RecordDate TEXT,
    Importance INTEGER,
    CreditQuantity INTEGER,
    EducationStatus INTEGER,
    WorkingType INTEGER,
    Profession INTEGER,
    Title INTEGER,
    PayDay TEXT,
    CustomerType INTEGER,
    FirstSave INTEGER,
    ContactNameSurname TEXT,
    FirstCreatedDate TEXT,
    FirstCreatedByName TEXT,
    TCKN TEXT,
    ContactCode TEXT,
    BirthPlace TEXT,
    MarketingAuthorizationviaGSM INTEGER,
    MarketingAuthorizationviaEmail INTEGER,
    Gender INTEGER,
    ContactAutoNumberNextGen INTEGER,
    RefCode TEXT,
    InRefCode TEXT,
    CommunicationInfo INTEGER,
    AddToAccountContacts INTEGER,
    AccountContactId TEXT,
    CreatedFromAccountListener INTEGER,
    
    _SyncedAt DATETIME DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_contact_owner ON Contacts(ContactOwnerId);
CREATE INDEX IF NOT EXISTS idx_contact_company ON Contacts(CompanyId);
CREATE INDEX IF NOT EXISTS idx_contact_status ON Contacts(AccountStatus);
CREATE INDEX IF NOT EXISTS idx_contact_blacklist ON Contacts(BlackList);
CREATE INDEX IF NOT EXISTS idx_contact_sdr ON Contacts(SDROwnerId);

-- ============================================================
-- DETAIL TABLES
-- ============================================================
CREATE TABLE IF NOT EXISTS ContactNotes (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    ContactId TEXT,
    CreatedOn TEXT,
    Note TEXT,
    CreatedBy TEXT,
    FOREIGN KEY(ContactId) REFERENCES Contacts(Id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_cn_contactid ON ContactNotes(ContactId);

CREATE TABLE IF NOT EXISTS ContactAddressDetail (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    ContactId TEXT,
    Country TEXT,
    Subdivision1 TEXT,
    Subdivision2 TEXT,
    Subdivision3 TEXT,
    Subdivision4 TEXT,
    AddressLine TEXT,
    FOREIGN KEY(ContactId) REFERENCES Contacts(Id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_cad_contactid ON ContactAddressDetail(ContactId);

CREATE TABLE IF NOT EXISTS BusinessPartners (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    ContactId TEXT,
    BusinessPartnerId TEXT,
    FOREIGN KEY(ContactId) REFERENCES Contacts(Id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_bp_contactid ON BusinessPartners(ContactId);

CREATE TABLE IF NOT EXISTS ContactFiles (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    ContactId TEXT,
    FilePath TEXT,
    FileName TEXT,
    FileType TEXT,
    FOREIGN KEY(ContactId) REFERENCES Contacts(Id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_cf_contactid ON ContactFiles(ContactId);

-- ============================================================
-- MAIN TABLE: CrmOrder
-- ============================================================
CREATE TABLE IF NOT EXISTS CrmOrder (
    Id TEXT PRIMARY KEY,
    QuoteId TEXT,
    AccountId TEXT,
    ProposalOwnerId TEXT,
    WarehouseId TEXT,
    TeamId TEXT,
    TeamCreatedById TEXT,
    CompanyId TEXT,
    StockId TEXT,
    SpecialCodeId TEXT,
    DistributionChannelSapId TEXT,
    DivisionSapId TEXT,
    SalesDocumentTypeSapId TEXT,
    SalesOrganizationSapId TEXT,
    SalesPaymentTermSapId TEXT,
    CrmSalesOfficeSapId TEXT,
    CurrencySapId TEXT,
    SalesGroupSapId TEXT,
    ContractId TEXT,
    PaymentType INTEGER,
    PaymentTypeTime INTEGER,
    DeliveryType INTEGER,
    DeliveryTypeTime INTEGER,
    SubTotalAlternativeCurrency INTEGER,
    SubTotalDiscountType INTEGER,
    Status INTEGER,
    IsVATExempt INTEGER,
    IsEligibleForNetsisIntegration INTEGER,
    IsEligibleForSapIntegration INTEGER,
    IsDeletedFromBackend INTEGER,
    ExpirationDate TEXT,
    DeliveryDate TEXT,
    CreateOrderDate TEXT,
    PlannedInvoiceDate TEXT,
    InvoiceDate TEXT,
    SubTotalDiscount REAL,
    DeliveryTime INTEGER,
    PaymentTime INTEGER,
    AlternativeCurrencyRate REAL,
    SubTotalDiscountAmount REAL,
    TotalDiscountRate REAL,
    NetSubTotalLocalCurrency_Amount REAL,
    NetSubTotalLocalCurrency_Currency TEXT,
    TotalNetAmountLocalCurrency_Amount REAL,
    TotalNetAmountLocalCurrency_Currency TEXT,
    TotalAmountWithTaxLocalCurrency_Amount REAL,
    TotalAmountWithTaxLocalCurrency_Currency TEXT,
    TotalProfitAmount_Amount REAL,
    TotalProfitAmount_Currency TEXT,
    NetSubTotalAlternativeCurrency_Amount REAL,
    NetSubTotalAlternativeCurrency_Currency TEXT,
    TotalNetAmountAlternativeCurrency_Amount REAL,
    TotalNetAmountAlternativeCurrency_Currency TEXT,
    TotalAmountWithTaxAlternativeCurrency_Amount REAL,
    TotalAmountWithTaxAlternativeCurrency_Currency TEXT,
    TotalProfitAmountAlternativeCurrency_Amount REAL,
    TotalProfitAmountAlternativeCurrency_Currency TEXT,
    ReferenceCode TEXT,
    InRefCode TEXT,
    CustomerOrderNumber TEXT,
    TPOutReferenceCode TEXT,
    SAPOutReferenceCode TEXT,
    ItemNo TEXT,
    CrmOrderNotes TEXT,
    Name TEXT,
    SerialNumber TEXT,
    _SyncedAt DATETIME DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_order_account ON CrmOrder(AccountId);
CREATE INDEX IF NOT EXISTS idx_order_owner ON CrmOrder(ProposalOwnerId);
CREATE INDEX IF NOT EXISTS idx_order_team ON CrmOrder(TeamId);
CREATE INDEX IF NOT EXISTS idx_order_status ON CrmOrder(Status);
CREATE INDEX IF NOT EXISTS idx_order_date ON CrmOrder(CreateOrderDate);
CREATE INDEX IF NOT EXISTS idx_order_invoice ON CrmOrder(InvoiceDate);
CREATE INDEX IF NOT EXISTS idx_order_company ON CrmOrder(CompanyId);

-- ============================================================
-- MAIN TABLE: CrmOrderProducts
-- ============================================================
CREATE TABLE IF NOT EXISTS CrmOrderProducts (
    Id TEXT PRIMARY KEY,
    CrmOrderId TEXT NOT NULL,
    StockId TEXT NOT NULL,
    Quantity REAL NOT NULL,
    DeliveryTime TEXT,
    TransactionDate TEXT NOT NULL,
    LineDiscountRate REAL,
    LineDiscountType INTEGER,
    Tax REAL NOT NULL,
    ProfitRate REAL,
    CurrencyRate REAL,
    ComissionRate REAL,
    StockUnitTypeIdentifier TEXT NOT NULL,
    StockUnitType TEXT,
    Description TEXT,
    ItemNo TEXT,
    PYPSapId TEXT,
    StorageLocationSapId TEXT,
    ProductionLocationSapId TEXT,
    QuoteProductId TEXT,
    PFApplicaitonType INTEGER,
    LineDiscountAmount_Amount REAL,
    LineDiscountAmount_Currency TEXT,
    UnitPrice_Amount REAL,
    UnitPrice_Currency TEXT,
    PurchasingPrice_Amount REAL,
    PurchasingPrice_Currency TEXT,
    Total_Amount REAL,
    Total_Currency TEXT,
    NetLineSubTotal_Amount REAL,
    NetLineSubTotal_Currency TEXT,
    TotalProfitAmountWithLocalCurrency_Amount REAL,
    TotalProfitAmountWithLocalCurrency_Currency TEXT,
    UnitProfitAmountWithLocalCurrency_Amount REAL,
    UnitProfitAmountWithLocalCurrency_Currency TEXT,
    NetLineTotalAmount_Amount REAL,
    NetLineTotalAmount_Currency TEXT,
    NetLineTotalWithTax_Amount REAL,
    NetLineTotalWithTax_Currency TEXT,
    NetLineTotalWithTaxLocalCurrency_Amount REAL,
    NetLineTotalWithTaxLocalCurrency_Currency TEXT,
    NetLineSubTotalLocalCurrency_Amount REAL,
    NetLineSubTotalLocalCurrency_Currency TEXT,
    NetLineTotalAmountLocalCurrency_Amount REAL,
    NetLineTotalAmountLocalCurrency_Currency TEXT,
    ProfitAfterSubtotalDiscountLocalCurrency_Amount REAL,
    ProfitAfterSubtotalDiscountLocalCurrency_Currency TEXT,
    _SyncedAt DATETIME DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_orderproduct_order ON CrmOrderProducts(CrmOrderId);
CREATE INDEX IF NOT EXISTS idx_orderproduct_stock ON CrmOrderProducts(StockId);
CREATE INDEX IF NOT EXISTS idx_orderproduct_date ON CrmOrderProducts(TransactionDate);
CREATE INDEX IF NOT EXISTS idx_orderproduct_pyp ON CrmOrderProducts(PYPSapId);
CREATE INDEX IF NOT EXISTS idx_orderproduct_storage ON CrmOrderProducts(StorageLocationSapId);

-- ============================================================
-- MAIN TABLE: InventoryAccountProduct
-- ============================================================
CREATE TABLE IF NOT EXISTS InventoryAccountProduct (
    Id TEXT PRIMARY KEY,
    AccountId TEXT NOT NULL,
    StockId TEXT NOT NULL,
    ContactId TEXT,
    StartDate TEXT,
    FinishDate TEXT,
    Domain TEXT,
    PosAccountNo TEXT,
    CardNo TEXT,
    Status INTEGER,
    FinancialProductType INTEGER,
    Amount INTEGER,
    InvSerialId TEXT,
    InvInstalledDate TEXT,
    InvPurchaseDate TEXT NOT NULL,
    InvOutOfWarehouseSerial INTEGER,
    IsPFActive INTEGER,
    Price_Amount REAL,
    Price_Currency TEXT,
    Vat_Amount REAL,
    Vat_Currency TEXT,
    TotalListPrice_Amount REAL,
    TotalListPrice_Currency TEXT,
    TotalPackagePrice_Amount REAL,
    TotalPackagePrice_Currency TEXT,
    TotalPackageVATAmount_Amount REAL,
    TotalPackageVATAmount_Currency TEXT,
    InvInstalledAddress_CountryCode TEXT,
    InvInstalledAddress_Subdivision1 TEXT,
    InvInstalledAddress_Subdivision2 TEXT,
    InvInstalledAddress_Subdivision3 TEXT,
    InvInstalledAddress_Subdivision4 TEXT,
    InvInstalledAddress_OpenAddress TEXT,
    InvOutOfWarehouseSerialCode TEXT,
    _SyncedAt DATETIME DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_inventory_account ON InventoryAccountProduct(AccountId);
CREATE INDEX IF NOT EXISTS idx_inventory_stock ON InventoryAccountProduct(StockId);
CREATE INDEX IF NOT EXISTS idx_inventory_serial ON InventoryAccountProduct(InvSerialId);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON InventoryAccountProduct(Status);
CREATE INDEX IF NOT EXISTS idx_inventory_pf ON InventoryAccountProduct(IsPFActive);
CREATE INDEX IF NOT EXISTS idx_inventory_purchase_date ON InventoryAccountProduct(InvPurchaseDate);

-- ============================================================
-- MAIN TABLE: Company
-- ============================================================
CREATE TABLE IF NOT EXISTS Company (
    Id TEXT PRIMARY KEY,
    Name TEXT NOT NULL,
    OrderNo INTEGER NOT NULL,
    ValidForAllUserGroups INTEGER,
    Email TEXT,
    IntegrationUsername TEXT,
    IntegrationPassword TEXT,
    IntegrationGrantType TEXT,
    IntegrationBranchCode INTEGER,
    IntegrationDbName TEXT,
    IntegrationDbUser TEXT,
    IntegrationDbType INTEGER,
    IntegrationDbPassword TEXT,
    IntegrationPath TEXT,
    IntegrationType INTEGER,
    SalesOrganizationSapId TEXT,
    _SyncedAt DATETIME DEFAULT (datetime('now'))
);

-- ============================================================
-- CHILD TABLE: CompanyPipelines
-- ============================================================
CREATE TABLE IF NOT EXISTS CompanyPipelines (
    Id TEXT PRIMARY KEY,
    CompanyId TEXT NOT NULL,
    PipelineId TEXT NOT NULL,
    FOREIGN KEY (CompanyId) REFERENCES Company(Id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_company_pipeline_company ON CompanyPipelines(CompanyId);

-- ============================================================
-- CHILD TABLE: CompanyUserGroups
-- ============================================================
CREATE TABLE IF NOT EXISTS CompanyUserGroups (
    Id TEXT PRIMARY KEY,
    CompanyId TEXT NOT NULL,
    UserGroupId TEXT NOT NULL,
    UserGroupName TEXT NOT NULL,
    FOREIGN KEY (CompanyId) REFERENCES Company(Id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_company_usergroup_company ON CompanyUserGroups(CompanyId);

-- ============================================================
-- MAIN TABLE: CalenderEvent (Activity Fact Table)
-- ============================================================
CREATE TABLE IF NOT EXISTS CalenderEvent (
    Id TEXT PRIMARY KEY,
    OwnerId TEXT NOT NULL,
    Subject TEXT NOT NULL,
    Type INTEGER NOT NULL,
    Description TEXT,
    StartDate TEXT,
    FinishDate TEXT,
    Location TEXT,
    AccountId TEXT,
    LeadId TEXT,
    ContactId TEXT,
    CompanyId TEXT,
    ParentEventId TEXT,
    IsAllDay INTEGER,
    IsRepeat INTEGER,
    IsReminderSet INTEGER,
    IsNewAccount INTEGER,
    RepeatPattern INTEGER,
    RepeatEvery INTEGER,
    MonthForRepeatOnYearly INTEGER,
    EndRepeat INTEGER,
    AfterOccurrenceCount INTEGER,
    TimeBeforeEvent INTEGER,
    RepeatEveryHours INTEGER,
    RepeatEveryDays INTEGER,
    RepeatOnMonthly INTEGER,
    RepeatOnYearly INTEGER,
    EndRepeatDate TEXT,
    Status INTEGER NOT NULL,
    RecurrenceRule TEXT,
    RecurrenceException TEXT,
    ParticipantType INTEGER,
    SubjectType INTEGER,
    ExcludeWeekends INTEGER,
    FirstCreatedBy TEXT,
    FirstCreatedDate TEXT,
    EventEnvironment INTEGER,
    CalendarEventResultId TEXT,
    GoogleCalendarEventCreatedMail TEXT,
    SubjectTypeTr TEXT,
    TypeTr TEXT,
    StatusTr TEXT,
    EventEnvironmentTr TEXT,
    ParticipantTypeTr TEXT,
    _SyncedAt DATETIME DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_event_owner ON CalenderEvent(OwnerId);
CREATE INDEX IF NOT EXISTS idx_event_account ON CalenderEvent(AccountId);
CREATE INDEX IF NOT EXISTS idx_event_start ON CalenderEvent(StartDate);
CREATE INDEX IF NOT EXISTS idx_event_type ON CalenderEvent(Type);
CREATE INDEX IF NOT EXISTS idx_event_status ON CalenderEvent(Status);

-- ============================================================
-- CHILD TABLE: CalenderEventDaysForRepeatOnWeekly
-- ============================================================
CREATE TABLE IF NOT EXISTS CalenderEventDaysForRepeatOnWeekly (
    Id TEXT PRIMARY KEY,
    CalenderEventId TEXT NOT NULL,
    Day INTEGER NOT NULL,
    FOREIGN KEY (CalenderEventId) REFERENCES CalenderEvent(Id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_event_repeat_days ON CalenderEventDaysForRepeatOnWeekly(CalenderEventId);

-- ============================================================
-- CHILD TABLE: CalenderEventParticipantPeople
-- ============================================================
CREATE TABLE IF NOT EXISTS CalenderEventParticipantPeople (
    Id TEXT PRIMARY KEY,
    CalenderEventId TEXT NOT NULL,
    ParticipantPersonId TEXT NOT NULL,
    FOREIGN KEY (CalenderEventId) REFERENCES CalenderEvent(Id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_event_people ON CalenderEventParticipantPeople(CalenderEventId);

-- ============================================================
-- CHILD TABLE: CalenderEventParticipantLeads
-- ============================================================
CREATE TABLE IF NOT EXISTS CalenderEventParticipantLeads (
    Id TEXT PRIMARY KEY,
    CalenderEventId TEXT NOT NULL,
    ParticipantLeadId TEXT NOT NULL,
    FOREIGN KEY (CalenderEventId) REFERENCES CalenderEvent(Id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_event_leads ON CalenderEventParticipantLeads(CalenderEventId);

-- ============================================================
-- CHILD TABLE: CalenderEventParticipantContacts
-- ============================================================
CREATE TABLE IF NOT EXISTS CalenderEventParticipantContacts (
    Id TEXT PRIMARY KEY,
    CalenderEventId TEXT NOT NULL,
    ParticipantContactId TEXT NOT NULL,
    FOREIGN KEY (CalenderEventId) REFERENCES CalenderEvent(Id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_event_contacts ON CalenderEventParticipantContacts(CalenderEventId);

-- ============================================================
-- MAIN TABLE: Quote (Pre-Revenue Fact Table)
-- ============================================================
CREATE TABLE IF NOT EXISTS Quote (
    Id TEXT PRIMARY KEY,
    
    OpportunityId TEXT,
    RevisionId TEXT,
    
    Number TEXT NOT NULL,
    Name TEXT NOT NULL,
    
    ExpirationDate TEXT NOT NULL,
    
    SubTotalDiscount REAL,
    WarehouseId TEXT,
    ProposalOwnerId TEXT NOT NULL,
    
    PaymentType INTEGER NOT NULL,
    PaymentTypeTime INTEGER,
    Status INTEGER NOT NULL,
    
    AddressIdentifier TEXT,
    
    DeliveryType INTEGER,
    DeliveryTime INTEGER,
    DeliveryDate TEXT,
    
    CustomerOrderNumber TEXT,
    
    PaymentTime INTEGER,
    DeliveryTypeTime INTEGER,
    
    PersonId TEXT,
    SpecialCodeId TEXT,
    AccountId TEXT NOT NULL,
    Description TEXT,
    RevNo INTEGER,
    
    -- Local Currency Money Fields
    NetSubTotalLocalCurrency_Amount REAL,
    NetSubTotalLocalCurrency_Currency TEXT,
    
    TotalNetAmountLocalCurrency_Amount REAL,
    TotalNetAmountLocalCurrency_Currency TEXT,
    
    TotalAmountWithTaxLocalCurrency_Amount REAL,
    TotalAmountWithTaxLocalCurrency_Currency TEXT,
    
    TotalProfitAmount_Amount REAL,
    TotalProfitAmount_Currency TEXT,
    
    RevStatus INTEGER,
    
    SubTotalAlternativeCurrency INTEGER,
    AlternativeCurrencyRate REAL,
    
    -- Alternative Currency Money Fields
    NetSubTotalAlternativeCurrency_Amount REAL,
    NetSubTotalAlternativeCurrency_Currency TEXT,
    
    TotalNetAmountAlternativeCurrency_Amount REAL,
    TotalNetAmountAlternativeCurrency_Currency TEXT,
    
    TotalAmountWithTaxAlternativeCurrency_Amount REAL,
    TotalAmountWithTaxAlternativeCurrency_Currency TEXT,
    
    TotalProfitAmountAlternativeCurrency_Amount REAL,
    TotalProfitAmountAlternativeCurrency_Currency TEXT,
    
    IsVATExempt INTEGER,
    
    TermsAndConditions TEXT,
    ProductsAndServices TEXT,
    
    ServiceStartDate TEXT,
    ServiceFinishDate TEXT,
    
    ReferenceCode TEXT,
    TransferWithForeignCurrency INTEGER,
    ContactId TEXT,
    
    FirstCreatedDate TEXT,
    FirstCreatedByName TEXT,
    
    TeamId TEXT,
    TeamCreatedById TEXT,
    
    SubTotalDiscountType INTEGER,
    SubTotalDiscountAmount REAL,
    InRefCode TEXT,
    CompanyId TEXT,
    
    QuoteApprovalProcessStatus INTEGER,
    TotalDiscountRate REAL,
    FirstReleaseDate TEXT,
    RevisedDate TEXT,
    CRMRevNo INTEGER,
    PublicationSource TEXT,
    TermsAndConditions2 TEXT,
    ProductsAndServices2 TEXT,
    StockId TEXT,
    ItemNo TEXT,
    QuoteType INTEGER,
    CrmOrderId TEXT,
    OrderWillBeCreate INTEGER,
    OrderOwnerWillBeChanged INTEGER,
    TPOutReferenceCode TEXT,
    
    _SyncedAt DATETIME DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_quote_owner ON Quote(ProposalOwnerId);
CREATE INDEX IF NOT EXISTS idx_quote_account ON Quote(AccountId);
CREATE INDEX IF NOT EXISTS idx_quote_status ON Quote(Status);
CREATE INDEX IF NOT EXISTS idx_quote_crmorder ON Quote(CrmOrderId);
CREATE INDEX IF NOT EXISTS idx_quote_team ON Quote(TeamId);

-- ============================================================
-- CHILD TABLE: QuoteOrderDetails
-- ============================================================
CREATE TABLE IF NOT EXISTS QuoteOrderDetails (
    Id TEXT PRIMARY KEY,
    QuoteId TEXT NOT NULL,
    CrmOrderId TEXT NOT NULL,
    FOREIGN KEY (QuoteId) REFERENCES Quote(Id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_quote_order ON QuoteOrderDetails(QuoteId);

-- ============================================================
-- CHILD TABLE: QuoteDynamicFields
-- ============================================================
CREATE TABLE IF NOT EXISTS QuoteDynamicFields (
    Id TEXT PRIMARY KEY,
    QuoteId TEXT NOT NULL,
    FieldName TEXT NOT NULL,
    FieldValue TEXT,
    FOREIGN KEY (QuoteId) REFERENCES Quote(Id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_quote_dynamic ON QuoteDynamicFields(QuoteId);

-- ============================================================
-- MAIN TABLE: Contract (Recurring Revenue Fact Table)
-- ============================================================
CREATE TABLE IF NOT EXISTS Contract (
    Id TEXT PRIMARY KEY,
    
    ContractNo TEXT UNIQUE,
    ContractName TEXT,
    
    AccountId TEXT NOT NULL,
    SalesRepresentativeId TEXT NOT NULL,
    
    ContractType INTEGER,
    ContractStatus INTEGER,
    
    StartDate TEXT NOT NULL,
    FinishDate TEXT NOT NULL,
    RenewalDate TEXT,
    
    IsAutoExtending INTEGER,
    InvoiceDueDate INTEGER,
    
    -- Total Amount
    TotalAmount_Amount REAL,
    TotalAmount_Currency TEXT,
    
    -- Total Amount Local
    TotalAmountLocalCurrency_Amount REAL,
    TotalAmountLocalCurrency_Currency TEXT,
    
    StampTaxRate REAL,
    StampTaxAmount REAL,
    
    IsLateInterestApply INTEGER,
    LateInterestContractYear INTEGER,
    
    InvoiceNumber INTEGER,
    InvoiceStatusId TEXT,
    CompanyId TEXT,
    ContractUrl TEXT,
    ProductId TEXT,
    
    -- Remaining Balance
    RemainingBalance_Amount REAL,
    RemainingBalance_Currency TEXT,
    
    SigningDate TEXT,
    
    _SyncedAt DATETIME DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_contract_account ON Contract(AccountId);
CREATE INDEX IF NOT EXISTS idx_contract_rep ON Contract(SalesRepresentativeId);
CREATE INDEX IF NOT EXISTS idx_contract_status ON Contract(ContractStatus);
CREATE INDEX IF NOT EXISTS idx_contract_dates ON Contract(StartDate, FinishDate);

-- ============================================================
-- CHILD TABLE: ContractPaymentPlans
-- ============================================================
CREATE TABLE IF NOT EXISTS ContractPaymentPlans (
    Id TEXT PRIMARY KEY,
    ContractId TEXT NOT NULL,
    
    Price_Amount REAL,
    Price_Currency TEXT,
    
    TotalRate REAL,
    HasBeenCollected INTEGER,
    
    PaymentDate TEXT NOT NULL,
    Name TEXT,
    
    FOREIGN KEY (ContractId) REFERENCES Contract(Id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_contract_payment ON ContractPaymentPlans(ContractId);

-- ============================================================
-- CHILD TABLE: ContractLisances
-- ============================================================
CREATE TABLE IF NOT EXISTS ContractLisances (
    Id TEXT PRIMARY KEY,
    ContractId TEXT NOT NULL,
    LisanceId TEXT NOT NULL,
    FOREIGN KEY (ContractId) REFERENCES Contract(Id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_contract_lisance ON ContractLisances(ContractId);

-- ============================================================
-- MAIN TABLE: SalesPipeline (Dimension Table)
-- ============================================================
CREATE TABLE IF NOT EXISTS SalesPipeline (
    Id TEXT PRIMARY KEY,
    
    Name TEXT,
    CompanyId TEXT,
    Status INTEGER,
    IsDefault INTEGER,
    
    _SyncedAt DATETIME DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_salespipeline_company ON SalesPipeline(CompanyId);
CREATE INDEX IF NOT EXISTS idx_salespipeline_status ON SalesPipeline(Status);

-- ============================================================
-- CHILD TABLE: SalesPipelineStages
-- ============================================================
CREATE TABLE IF NOT EXISTS SalesPipelineStages (
    Id TEXT PRIMARY KEY,
    SalesPipelineId TEXT NOT NULL,
    
    PipelineStageId TEXT NOT NULL,
    PipelineStageName INTEGER, -- Enum mapping to INTEGER
    
    FOREIGN KEY (SalesPipelineId) REFERENCES SalesPipeline(Id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_salespipeline_stage ON SalesPipelineStages(SalesPipelineId);

-- ============================================================
-- MAIN TABLE: CompanyCurrency (Currency Dimension per tenant)
-- ============================================================
CREATE TABLE IF NOT EXISTS CompanyCurrency (
    Id TEXT PRIMARY KEY,
    
    CompanyId TEXT NOT NULL,
    CurrencyCode INTEGER NOT NULL,
    
    _SyncedAt DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (CompanyId) REFERENCES Company(Id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_company_currency ON CompanyCurrency(CompanyId);
CREATE INDEX IF NOT EXISTS idx_currency_code ON CompanyCurrency(CurrencyCode);

-- ============================================================
-- FX INTELLIGENCE EXTENSION: CurrencyRates
-- ============================================================
CREATE TABLE IF NOT EXISTS CurrencyRates (
    Id TEXT PRIMARY KEY,
    BaseCurrency INTEGER NOT NULL,
    TargetCurrency INTEGER NOT NULL,
    Rate REAL NOT NULL,
    RateDate TEXT NOT NULL,
    
    _SyncedAt DATETIME DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_currency_rates ON CurrencyRates(BaseCurrency, TargetCurrency);
CREATE INDEX IF NOT EXISTS idx_currency_rates_date ON CurrencyRates(RateDate);

-- ============================================================
-- PERFORMANCE COCKPIT VIEWS (Read-Only)
-- ============================================================

-- View 1: Daily Grain
CREATE VIEW IF NOT EXISTS vw_DailyPerformanceSummary AS
WITH DailyEvents AS (
    -- 1. Contract Performance
    SELECT 
        date(StartDate) as DateKey,
        CompanyId,
        SalesRepresentativeId as OwnerId,
        TotalAmountLocalCurrency_Amount as ContractAmount,
        1 as ContractCount,
        0 as InvoiceAmount,
        0 as InvoiceCount,
        0 as CollectionAmount
    FROM Contract
    
    UNION ALL
    
    -- 2. Invoice Performance (From CrmOrder assumed invoiced)
    SELECT 
        date(InvoiceDate) as DateKey,
        CompanyId,
        ProposalOwnerId as OwnerId,
        0 as ContractAmount,
        0 as ContractCount,
        TotalNetAmountLocalCurrency_Amount as InvoiceAmount,
        1 as InvoiceCount,
        0 as CollectionAmount
    FROM CrmOrder
    WHERE InvoiceDate IS NOT NULL AND Status = 1
    
    UNION ALL
    
    -- 3. Collection Performance
    SELECT 
        date(cp.PaymentDate) as DateKey,
        c.CompanyId,
        c.SalesRepresentativeId as OwnerId,
        0 as ContractAmount,
        0 as ContractCount,
        0 as InvoiceAmount,
        0 as InvoiceCount,
        cp.Price_Amount as CollectionAmount
    FROM ContractPaymentPlans cp
    JOIN Contract c ON cp.ContractId = c.Id
    WHERE cp.HasBeenCollected = 1
)
SELECT 
    DateKey,
    CompanyId,
    OwnerId,
    SUM(ContractAmount) as ContractAmount,
    SUM(ContractCount) as ContractCount,
    SUM(InvoiceAmount) as InvoiceAmount,
    SUM(InvoiceCount) as InvoiceCount,
    SUM(CollectionAmount) as CollectionAmount
FROM DailyEvents
WHERE DateKey IS NOT NULL
GROUP BY DateKey, CompanyId, OwnerId;

-- View 2: Weekly Grain
CREATE VIEW IF NOT EXISTS vw_WeeklyPerformanceSummary AS
SELECT 
    strftime('%Y-%W', DateKey) as PeriodKey,
    CompanyId,
    OwnerId,
    SUM(ContractAmount) as ContractAmount,
    SUM(ContractCount) as ContractCount,
    SUM(InvoiceAmount) as InvoiceAmount,
    SUM(InvoiceCount) as InvoiceCount,
    SUM(CollectionAmount) as CollectionAmount
FROM vw_DailyPerformanceSummary
GROUP BY strftime('%Y-%W', DateKey), CompanyId, OwnerId;

-- View 3: Monthly Grain
CREATE VIEW IF NOT EXISTS vw_MonthlyPerformanceSummary AS
SELECT 
    strftime('%Y-%m', DateKey) as PeriodKey,
    CompanyId,
    OwnerId,
    SUM(ContractAmount) as ContractAmount,
    SUM(ContractCount) as ContractCount,
    SUM(InvoiceAmount) as InvoiceAmount,
    SUM(InvoiceCount) as InvoiceCount,
    SUM(CollectionAmount) as CollectionAmount
FROM vw_DailyPerformanceSummary
GROUP BY strftime('%Y-%m', DateKey), CompanyId, OwnerId;

-- View 4: Quarterly Grain
CREATE VIEW IF NOT EXISTS vw_QuarterlyPerformanceSummary AS
SELECT 
    strftime('%Y', DateKey) || '-Q' || ((cast(strftime('%m', DateKey) as integer) + 2) / 3) as PeriodKey,
    CompanyId,
    OwnerId,
    SUM(ContractAmount) as ContractAmount,
    SUM(ContractCount) as ContractCount,
    SUM(InvoiceAmount) as InvoiceAmount,
    SUM(InvoiceCount) as InvoiceCount,
    SUM(CollectionAmount) as CollectionAmount
FROM vw_DailyPerformanceSummary
GROUP BY strftime('%Y', DateKey) || '-Q' || ((cast(strftime('%m', DateKey) as integer) + 2) / 3), CompanyId, OwnerId;
