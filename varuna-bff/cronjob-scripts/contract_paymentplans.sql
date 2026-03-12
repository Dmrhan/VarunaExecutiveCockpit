MERGE ParamCrm_Cockpit.dbo.ContractPaymentPlans AS TARGET
USING
(
    SELECT
        CAST(Id AS nvarchar(450)) COLLATE DATABASE_DEFAULT       AS Id,
        CAST(Contract_Id AS nvarchar(450)) COLLATE DATABASE_DEFAULT AS ContractId,
        CAST(Price_Amount AS float)                                AS Price_Amount,
        CAST(Price_Currency AS nvarchar(max))                      AS Price_Currency,
        TotalRate,
        CAST(HasBeenCollected AS int)                              AS HasBeenCollected,
        CONVERT(nvarchar(max), PaymentDate, 126)                   AS PaymentDate,
        Name
    FROM [1886662b0a1847a7973577f52892968fdb].dbo.Contract_PaymentPlans
    WHERE DeletedOn IS NULL
) AS SOURCE
ON TARGET.Id = SOURCE.Id
WHEN NOT MATCHED BY SOURCE THEN
    DELETE
WHEN MATCHED THEN
UPDATE SET
    TARGET.ContractId       = SOURCE.ContractId,
    TARGET.Price_Amount     = SOURCE.Price_Amount,
    TARGET.Price_Currency   = SOURCE.Price_Currency,
    TARGET.TotalRate        = SOURCE.TotalRate,
    TARGET.HasBeenCollected = SOURCE.HasBeenCollected,
    TARGET.PaymentDate      = SOURCE.PaymentDate,
    TARGET.Name             = SOURCE.Name

WHEN NOT MATCHED BY TARGET THEN
INSERT
(
    Id,
    ContractId,
    Price_Amount,
    Price_Currency,
    TotalRate,
    HasBeenCollected,
    PaymentDate,
    Name
)
VALUES
(
    SOURCE.Id,
    SOURCE.ContractId,
    SOURCE.Price_Amount,
    SOURCE.Price_Currency,
    SOURCE.TotalRate,
    SOURCE.HasBeenCollected,
    SOURCE.PaymentDate,
    SOURCE.Name
);