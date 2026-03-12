USE [ParamCrm_Cockpit]
GO

MERGE INTO [dbo].[TeamDefinition] AS TARGET
USING (
    SELECT
        CAST([Id] AS nvarchar(450)) COLLATE Turkish_CI_AS AS [Id],
        CAST([Code] AS nvarchar(50)) COLLATE Turkish_CI_AS AS [Code],
        CAST([Definition] AS nvarchar(max)) AS [Definition],
        [Status],
        GETUTCDATE() AS [_SyncedAt]
    FROM [1886662b0a1847a7973577f52892968fdb].[dbo].[TeamDefinition]
	Where DeletedOn is null
) AS SOURCE
ON TARGET.[Id] = SOURCE.[Id] COLLATE Turkish_CI_AS
WHEN MATCHED THEN
    UPDATE SET
        TARGET.Code = SOURCE.Code,
        TARGET.Definition = SOURCE.Definition,
        TARGET.Status = SOURCE.Status,
        TARGET._SyncedAt = SOURCE._SyncedAt
WHEN NOT MATCHED BY SOURCE THEN
    DELETE
WHEN NOT MATCHED BY TARGET THEN
    INSERT (Id, Code, Definition, Status, _SyncedAt)
    VALUES (SOURCE.Id, SOURCE.Code, SOURCE.Definition, SOURCE.Status, SOURCE._SyncedAt);
GO