MERGE [ParamCrm_Cockpit].[dbo].[CrmOrderProducts] AS TARGET
USING (
    SELECT
        CAST(Id AS nvarchar(450)) AS Id,
        CAST(CrmOrderId AS nvarchar(450)) AS CrmOrderId,
        CAST(StockId AS nvarchar(max)) AS StockId,
        CAST(Quantity AS float) AS Quantity,
		StockUnitType AS StockUnitTypeIdentifier,
        CONVERT(nvarchar(max), DeliveryTime, 126) AS DeliveryTime,
        CONVERT(nvarchar(max), TransactionDate, 126) AS TransactionDate,
        CAST(LineDiscountAmount_Amount AS float) AS LineDiscountAmount_Amount,
        CAST(LineDiscountAmount_Currency AS nvarchar(max)) AS LineDiscountAmount_Currency,
        CAST(UnitPrice_Amount AS float) AS UnitPrice_Amount,
        CAST(UnitPrice_Currency AS nvarchar(max)) AS UnitPrice_Currency,
        CAST(Total_Amount AS float) AS Total_Amount,
        CAST(Total_Currency AS nvarchar(max)) AS Total_Currency,
        CAST(PurchasingPrice_Amount AS float) AS PurchasingPrice_Amount,
        CAST(PurchasingPrice_Currency AS nvarchar(max)) AS PurchasingPrice_Currency,
		CAST(0 AS float) AS Tax,
        GETUTCDATE() AS _SyncedAt
    FROM [1886662b0a1847a7973577f52892968fdb].[dbo].[CrmOrderProducts]
    WHERE DeletedOn IS NULL
) AS SOURCE
ON TARGET.Id = SOURCE.Id COLLATE Turkish_CI_AS
WHEN NOT MATCHED BY SOURCE THEN
    DELETE
WHEN MATCHED THEN
UPDATE SET
    TARGET.Quantity = SOURCE.Quantity,
    TARGET.UnitPrice_Amount = SOURCE.UnitPrice_Amount,
    TARGET.Total_Amount = SOURCE.Total_Amount,
    TARGET._SyncedAt = GETUTCDATE(),
	TARGET.Tax = SOURCE.Tax,
	TARGET.StockUnitTypeIdentifier = SOURCE.StockUnitTypeIdentifier

WHEN NOT MATCHED THEN
INSERT (
    Id, CrmOrderId, StockId, Quantity,
    DeliveryTime, TransactionDate,
    LineDiscountAmount_Amount, LineDiscountAmount_Currency,
    UnitPrice_Amount, UnitPrice_Currency,
    Total_Amount, Total_Currency,
    PurchasingPrice_Amount, PurchasingPrice_Currency,
	Tax,
	StockUnitTypeIdentifier,
    _SyncedAt
)
VALUES (
    SOURCE.Id, SOURCE.CrmOrderId, SOURCE.StockId, SOURCE.Quantity,
    SOURCE.DeliveryTime, SOURCE.TransactionDate,
    SOURCE.LineDiscountAmount_Amount, SOURCE.LineDiscountAmount_Currency,
    SOURCE.UnitPrice_Amount, SOURCE.UnitPrice_Currency,
    SOURCE.Total_Amount, SOURCE.Total_Currency,
    SOURCE.PurchasingPrice_Amount, SOURCE.PurchasingPrice_Currency,
	Source.Tax,
	Source.StockUnitTypeIdentifier,
    SOURCE._SyncedAt
);