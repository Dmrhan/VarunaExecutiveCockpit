MERGE ParamCrm_Cockpit.dbo.ContractLisances AS TARGET
USING
(
    SELECT
        CAST(Id AS nvarchar(450)) COLLATE DATABASE_DEFAULT        AS Id,
        CAST(Contract_Id AS nvarchar(450)) COLLATE DATABASE_DEFAULT AS ContractId,
        CAST(LisanceId AS nvarchar(max)) COLLATE DATABASE_DEFAULT  AS LisanceId
    FROM [1886662b0a1847a7973577f52892968fdb].dbo.Contract_Lisances
    WHERE DeletedOn IS NULL
) AS SOURCE
ON TARGET.Id = SOURCE.Id
WHEN NOT MATCHED BY SOURCE THEN
    DELETE
WHEN MATCHED THEN
UPDATE SET
    TARGET.ContractId = SOURCE.ContractId,
    TARGET.LisanceId  = SOURCE.LisanceId

WHEN NOT MATCHED BY TARGET THEN
INSERT
(
    Id,
    ContractId,
    LisanceId
)
VALUES
(
    SOURCE.Id,
    SOURCE.ContractId,
    SOURCE.LisanceId
);