-- Migration: Change Addresses.Id from INT IDENTITY to CHAR(36)
-- Date: 2026-02-27

BEGIN TRANSACTION;

-- 1. Drop existing primary key constraint
DECLARE @ConstraintName NVARCHAR(MAX);
SELECT @ConstraintName = name
FROM sys.key_constraints
WHERE type = 'PK' AND parent_object_id = OBJECT_ID('[dbo].[Addresses]');

IF @ConstraintName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE [dbo].[Addresses] DROP CONSTRAINT ' + @ConstraintName);
END

-- 2. Rename existing Id column to OldId
EXEC sp_rename 'dbo.Addresses.Id', 'OldId', 'COLUMN';

-- 3. Add new Id column as CHAR(36)
ALTER TABLE [dbo].[Addresses] ADD Id CHAR(36);

-- 4. Move data from OldId to Id (converting INT to STRING)
-- Note: This just makes them strings like '1', '2', etc. 
-- If new records should be UUIDs, future inserts will provide them or we can use NEWID().
UPDATE [dbo].[Addresses] SET Id = CAST(OldId AS CHAR(36));

-- 5. Set Id to NOT NULL
ALTER TABLE [dbo].[Addresses] ALTER COLUMN Id CHAR(36) NOT NULL;

-- 6. Add Primary Key back to new Id column
ALTER TABLE [dbo].[Addresses] ADD PRIMARY KEY (Id);

-- 7. Drop the OldId column
ALTER TABLE [dbo].[Addresses] DROP COLUMN OldId;

COMMIT TRANSACTION;
GO
