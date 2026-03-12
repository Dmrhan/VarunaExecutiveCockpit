USE [ParamCrm_Cockpit]
GO

MERGE INTO dbo.Stock AS TARGET
USING
(
    SELECT
        CAST(Id AS nvarchar(450)) COLLATE Turkish_CI_AS AS Id,
        CAST(Code AS nvarchar(max)) COLLATE Turkish_CI_AS AS Code,
        CAST(Name AS nvarchar(max)) COLLATE Turkish_CI_AS AS Name,
        CAST(ShortName AS nvarchar(max)) COLLATE Turkish_CI_AS AS ShortName,
        CAST(BaseUnitType AS nvarchar(max)) COLLATE Turkish_CI_AS AS BaseUnitType,

        CAST(SerialTrackingEnabled AS int) AS SerialTrackingEnabled,
        SerialCodeType,
        SalesVatValue,
        PurchaseVatValue,
        VatCalculationType,
        StockType,

        CAST(ParentStocktId AS nvarchar(max)) COLLATE Turkish_CI_AS AS ParentStocktId,
        State,

        CAST(ProductGroupId AS nvarchar(max)) COLLATE Turkish_CI_AS AS ProductGroupId,
        CAST(BrandId AS nvarchar(max)) COLLATE Turkish_CI_AS AS BrandId,

        MinStockLevel,
        OrderLevel,
        TargetLevel,
        OrderTime,

        CAST(ReferenceCode AS nvarchar(max)) COLLATE Turkish_CI_AS AS ReferenceCode,
        CAST(CompanyId AS nvarchar(max)) COLLATE Turkish_CI_AS AS CompanyId,

        ProductType,
        CAST(AccountingDetailCode AS nvarchar(max)) COLLATE Turkish_CI_AS AS AccountingDetailCode,

        CAST(InvWillWarrantyBeFollowed AS int) AS InvWillWarrantyBeFollowed,
        InvWarrantyPeriod,
        InvWarrantyPeriodType,
        CAST(InvIsInstallationNecessary AS int) AS InvIsInstallationNecessary,

        CAST(TPOutReferenceCode AS nvarchar(max)) COLLATE Turkish_CI_AS AS TPOutReferenceCode,
        CAST(SAPOutReferenceCode AS nvarchar(max)) COLLATE Turkish_CI_AS AS SAPOutReferenceCode,

        GETUTCDATE() AS _SyncedAt

    FROM [1886662b0a1847a7973577f52892968fdb].dbo.Stock
	Where DeletedOn is null
) AS SOURCE

ON TARGET.Id = SOURCE.Id COLLATE Turkish_CI_AS

WHEN MATCHED THEN
UPDATE SET
    TARGET.Code = SOURCE.Code,
    TARGET.Name = SOURCE.Name,
    TARGET.ShortName = SOURCE.ShortName,
    TARGET.BaseUnitType = SOURCE.BaseUnitType,
    TARGET.SerialTrackingEnabled = SOURCE.SerialTrackingEnabled,
    TARGET.SerialCodeType = SOURCE.SerialCodeType,
    TARGET.SalesVatValue = SOURCE.SalesVatValue,
    TARGET.PurchaseVatValue = SOURCE.PurchaseVatValue,
    TARGET.VatCalculationType = SOURCE.VatCalculationType,
    TARGET.StockType = SOURCE.StockType,
    TARGET.ParentStocktId = SOURCE.ParentStocktId,
    TARGET.State = SOURCE.State,
    TARGET.ProductGroupId = SOURCE.ProductGroupId,
    TARGET.BrandId = SOURCE.BrandId,
    TARGET.MinStockLevel = SOURCE.MinStockLevel,
    TARGET.OrderLevel = SOURCE.OrderLevel,
    TARGET.TargetLevel = SOURCE.TargetLevel,
    TARGET.OrderTime = SOURCE.OrderTime,
    TARGET.ReferenceCode = SOURCE.ReferenceCode,
    TARGET.CompanyId = SOURCE.CompanyId,
    TARGET.ProductType = SOURCE.ProductType,
    TARGET.AccountingDetailCode = SOURCE.AccountingDetailCode,
    TARGET.InvWillWarrantyBeFollowed = SOURCE.InvWillWarrantyBeFollowed,
    TARGET.InvWarrantyPeriod = SOURCE.InvWarrantyPeriod,
    TARGET.InvWarrantyPeriodType = SOURCE.InvWarrantyPeriodType,
    TARGET.InvIsInstallationNecessary = SOURCE.InvIsInstallationNecessary,
    TARGET.TPOutReferenceCode = SOURCE.TPOutReferenceCode,
    TARGET.SAPOutReferenceCode = SOURCE.SAPOutReferenceCode,
    TARGET._SyncedAt = SOURCE._SyncedAt
WHEN NOT MATCHED BY SOURCE THEN
    DELETE
WHEN NOT MATCHED BY TARGET THEN
INSERT
(
    Id, Code, Name, ShortName, BaseUnitType,
    SerialTrackingEnabled, SerialCodeType,
    SalesVatValue, PurchaseVatValue,
    VatCalculationType, StockType,
    ParentStocktId, State,
    ProductGroupId, BrandId,
    MinStockLevel, OrderLevel, TargetLevel, OrderTime,
    ReferenceCode, CompanyId, ProductType, AccountingDetailCode,
    InvWillWarrantyBeFollowed, InvWarrantyPeriod, InvWarrantyPeriodType,
    InvIsInstallationNecessary, TPOutReferenceCode, SAPOutReferenceCode,
    _SyncedAt
)
VALUES
(
    SOURCE.Id, SOURCE.Code, SOURCE.Name, SOURCE.ShortName, SOURCE.BaseUnitType,
    SOURCE.SerialTrackingEnabled, SOURCE.SerialCodeType,
    SOURCE.SalesVatValue, SOURCE.PurchaseVatValue,
    SOURCE.VatCalculationType, SOURCE.StockType,
    SOURCE.ParentStocktId, SOURCE.State,
    SOURCE.ProductGroupId, SOURCE.BrandId,
    SOURCE.MinStockLevel, SOURCE.OrderLevel, SOURCE.TargetLevel, SOURCE.OrderTime,
    SOURCE.ReferenceCode, SOURCE.CompanyId, SOURCE.ProductType, SOURCE.AccountingDetailCode,
    SOURCE.InvWillWarrantyBeFollowed, SOURCE.InvWarrantyPeriod, SOURCE.InvWarrantyPeriodType,
    SOURCE.InvIsInstallationNecessary, SOURCE.TPOutReferenceCode, SOURCE.SAPOutReferenceCode,
    SOURCE._SyncedAt
);
GO