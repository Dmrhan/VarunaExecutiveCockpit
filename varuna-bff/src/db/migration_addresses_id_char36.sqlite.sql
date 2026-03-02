-- Migration: Change Addresses.Id from INTEGER PRIMARY KEY AUTOINCREMENT to CHAR(36)
-- Date: 2026-02-27

PRAGMA foreign_keys=OFF;

BEGIN TRANSACTION;

-- 1. Create a new table with the desired schema
CREATE TABLE Addresses_new (
    Id CHAR(36) PRIMARY KEY,
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

-- 2. Copy data from the old table to the new table
-- Converting Integer Id to String
INSERT INTO Addresses_new (
    Id, AccountId, AddressType, AccountLocation, CentralAddress, 
    Address_Country, Address_Subdivision1, Address_Subdivision2, 
    Address_Subdivision3, Address_Subdivision4, Address_OpenAddress
)
SELECT 
    CAST(Id AS TEXT), AccountId, AddressType, AccountLocation, CentralAddress, 
    Address_Country, Address_Subdivision1, Address_Subdivision2, 
    Address_Subdivision3, Address_Subdivision4, Address_OpenAddress
FROM Addresses;

-- 3. Drop the old table
DROP TABLE Addresses;

-- 4. Rename the new table to the original name
ALTER TABLE Addresses_new RENAME TO Addresses;

-- 5. Re-create indexes
CREATE INDEX idx_addr_accountid ON Addresses(AccountId);

COMMIT;

PRAGMA foreign_keys=ON;
