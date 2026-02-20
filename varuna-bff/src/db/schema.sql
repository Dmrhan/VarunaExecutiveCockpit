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
