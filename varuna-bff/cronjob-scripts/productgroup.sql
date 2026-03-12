MERGE [ParamCrm_Cockpit].[dbo].[ProductGroup] AS Target
USING
(
    SELECT
        CONVERT(nvarchar(36), Id) COLLATE Turkish_CI_AS AS Id,
        Code COLLATE Turkish_CI_AS AS Code,
        Name COLLATE Turkish_CI_AS AS Name,
        ISNULL(ShortName COLLATE Turkish_CI_AS, N'') AS ShortName,
        Status,
        CONVERT(nvarchar(36), ParentGroupId) COLLATE Turkish_CI_AS AS ParentGroupId,
        Level,
        GETUTCDATE() AS _SyncedAt
    FROM [1886662b0a1847a7973577f52892968fdb].[dbo].[ProductGroup]
	Where DeletedOn is null
) AS Source
ON Target.Id = Source.Id
WHEN MATCHED THEN
    UPDATE SET
        Code = Source.Code,
        Name = Source.Name,
        ShortName = Source.ShortName,
        Status = Source.Status,
        ParentGroupId = Source.ParentGroupId,
        Level = Source.Level,
        _SyncedAt = Source._SyncedAt
WHEN NOT MATCHED BY SOURCE THEN
    DELETE
WHEN NOT MATCHED BY TARGET THEN
    INSERT (
        Id, Code, Name, ShortName, Status, ParentGroupId, Level, _SyncedAt
    )
    VALUES (
        Source.Id, Source.Code, Source.Name, Source.ShortName, Source.Status, Source.ParentGroupId, Source.Level, Source._SyncedAt
    );
GO