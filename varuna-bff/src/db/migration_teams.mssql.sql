-- migration_teams.mssql.sql
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TeamDefinition]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[TeamDefinition] (
        Id          NVARCHAR(450) PRIMARY KEY,
        Code        NVARCHAR(50) NOT NULL,
        Definition  NVARCHAR(MAX) NOT NULL,
        [Status]    INT DEFAULT 1,
        _SyncedAt   DATETIME DEFAULT GETUTCDATE()
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TeamMember]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[TeamMember] (
        Id          INT IDENTITY(1,1) PRIMARY KEY,
        TeamId      NVARCHAR(450) NOT NULL,
        PersonId    NVARCHAR(450) NOT NULL,
        _SyncedAt   DATETIME DEFAULT GETUTCDATE(),
        CONSTRAINT FK_TeamMember_Team FOREIGN KEY (TeamId) REFERENCES TeamDefinition(Id) ON DELETE CASCADE,
        CONSTRAINT FK_TeamMember_Person FOREIGN KEY (PersonId) REFERENCES Person(Id) ON DELETE CASCADE
    );
END
GO
