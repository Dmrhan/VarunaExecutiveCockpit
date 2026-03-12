MERGE  [ParamCrm_Cockpit].dbo.Contract AS TARGET
USING
(
    SELECT
        CAST(Id AS nvarchar(450)) COLLATE Turkish_CI_AS AS Id,
        ContractNo COLLATE Turkish_CI_AS AS ContractNo,
        ContractName COLLATE Turkish_CI_AS AS ContractName,

        CAST(AccountId AS nvarchar(max)) COLLATE Turkish_CI_AS AS AccountId,
        CAST(SalesRepresentativeId AS nvarchar(max)) COLLATE Turkish_CI_AS AS SalesRepresentativeId,

        ContractType,
        ContractStatus,

        CONVERT(nvarchar(max), StartDate, 126) AS StartDate,
        CONVERT(nvarchar(max), FinishDate, 126) AS FinishDate,
        CONVERT(nvarchar(max), RenewalDate, 126) AS RenewalDate,

        CAST(IsAutoExtending AS int) AS IsAutoExtending,
        InvoiceDueDate,

        CAST(TotalAmount_Amount AS float) AS TotalAmount_Amount,
        CAST(TotalAmount_Currency AS nvarchar(max)) AS TotalAmount_Currency,

        CAST(TotalAmountLocalCurrency_Amount AS float) AS TotalAmountLocalCurrency_Amount,
        CAST(TotalAmountLocalCurrency_Currency AS nvarchar(max)) AS TotalAmountLocalCurrency_Currency,

        StampTaxRate,
        CAST(StampTaxAmount AS float) AS StampTaxAmount,

        CAST(IsLateInterestApply AS int) AS IsLateInterestApply,
        LateInterestContractYear,
        InvoiceNumber,

        CAST(InvoiceStatusId AS nvarchar(max)) COLLATE Turkish_CI_AS AS InvoiceStatusId,
        CAST(CompanyId AS nvarchar(max)) COLLATE Turkish_CI_AS AS CompanyId,
        ContractUrl COLLATE Turkish_CI_AS AS ContractUrl,
        CAST(ProductId AS nvarchar(max)) COLLATE Turkish_CI_AS AS ProductId,

        CAST(RemainingBalance_Amount AS float) AS RemainingBalance_Amount,
        CAST(RemainingBalance_Currency AS nvarchar(max)) AS RemainingBalance_Currency,

        CONVERT(nvarchar(max), SigningDate, 126) AS SigningDate,

        GETUTCDATE() AS _SyncedAt

    FROM [1886662b0a1847a7973577f52892968fdb].dbo.Contract
	Where CompanyId = '4f1687e4-f282-4601-a3cc-ef612e00c3e4'

) AS SOURCE

ON TARGET.Id = SOURCE.Id
WHEN NOT MATCHED BY SOURCE THEN
    DELETE
WHEN MATCHED THEN
UPDATE SET
    ContractNo = SOURCE.ContractNo,
    ContractName = SOURCE.ContractName,
    AccountId = SOURCE.AccountId,
    SalesRepresentativeId = SOURCE.SalesRepresentativeId,
    ContractType = SOURCE.ContractType,
    ContractStatus = SOURCE.ContractStatus,
    StartDate = SOURCE.StartDate,
    FinishDate = SOURCE.FinishDate,
    RenewalDate = SOURCE.RenewalDate,
    IsAutoExtending = SOURCE.IsAutoExtending,
    InvoiceDueDate = SOURCE.InvoiceDueDate,
    TotalAmount_Amount = SOURCE.TotalAmount_Amount,
    TotalAmount_Currency = SOURCE.TotalAmount_Currency,
    TotalAmountLocalCurrency_Amount = SOURCE.TotalAmountLocalCurrency_Amount,
    TotalAmountLocalCurrency_Currency = SOURCE.TotalAmountLocalCurrency_Currency,
    StampTaxRate = SOURCE.StampTaxRate,
    StampTaxAmount = SOURCE.StampTaxAmount,
    IsLateInterestApply = SOURCE.IsLateInterestApply,
    LateInterestContractYear = SOURCE.LateInterestContractYear,
    InvoiceNumber = SOURCE.InvoiceNumber,
    InvoiceStatusId = SOURCE.InvoiceStatusId,
    CompanyId = SOURCE.CompanyId,
    ContractUrl = SOURCE.ContractUrl,
    ProductId = SOURCE.ProductId,
    RemainingBalance_Amount = SOURCE.RemainingBalance_Amount,
    RemainingBalance_Currency = SOURCE.RemainingBalance_Currency,
    SigningDate = SOURCE.SigningDate,
    _SyncedAt = SOURCE._SyncedAt

WHEN NOT MATCHED BY TARGET THEN
INSERT
(
    Id,
    ContractNo,
    ContractName,
    AccountId,
    SalesRepresentativeId,
    ContractType,
    ContractStatus,
    StartDate,
    FinishDate,
    RenewalDate,
    IsAutoExtending,
    InvoiceDueDate,
    TotalAmount_Amount,
    TotalAmount_Currency,
    TotalAmountLocalCurrency_Amount,
    TotalAmountLocalCurrency_Currency,
    StampTaxRate,
    StampTaxAmount,
    IsLateInterestApply,
    LateInterestContractYear,
    InvoiceNumber,
    InvoiceStatusId,
    CompanyId,
    ContractUrl,
    ProductId,
    RemainingBalance_Amount,
    RemainingBalance_Currency,
    SigningDate,
    _SyncedAt
)
VALUES
(
    SOURCE.Id,
    SOURCE.ContractNo,
    SOURCE.ContractName,
    SOURCE.AccountId,
    SOURCE.SalesRepresentativeId,
    SOURCE.ContractType,
    SOURCE.ContractStatus,
    SOURCE.StartDate,
    SOURCE.FinishDate,
    SOURCE.RenewalDate,
    SOURCE.IsAutoExtending,
    SOURCE.InvoiceDueDate,
    SOURCE.TotalAmount_Amount,
    SOURCE.TotalAmount_Currency,
    SOURCE.TotalAmountLocalCurrency_Amount,
    SOURCE.TotalAmountLocalCurrency_Currency,
    SOURCE.StampTaxRate,
    SOURCE.StampTaxAmount,
    SOURCE.IsLateInterestApply,
    SOURCE.LateInterestContractYear,
    SOURCE.InvoiceNumber,
    SOURCE.InvoiceStatusId,
    SOURCE.CompanyId,
    SOURCE.ContractUrl,
    SOURCE.ProductId,
    SOURCE.RemainingBalance_Amount,
    SOURCE.RemainingBalance_Currency,
    SOURCE.SigningDate,
    SOURCE._SyncedAt
);