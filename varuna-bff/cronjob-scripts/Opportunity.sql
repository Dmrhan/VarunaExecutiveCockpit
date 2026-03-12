MERGE [ParamCrm_Cockpit].[dbo].[Opportunity] AS TARGET
USING (
    SELECT
        Id,
        Name,
        AccountId,
        OwnerId,
        LeadOwnerId,
        PartnerId,
        PersonId,
        CompanyId,
        PipelineId,
        ProductGroupId,
        ProductCategoryId,
        Type,
        Source,
        DealType,
        WonLostType,
        DealStatus,
        ProbabilityBand,
        OpportunityStageName,
        OpportunityStageId,
        OpportunityStageNameTr,
        CAST(Amount_Amount AS float) AS Amount_Value,
        CAST(ExpectedRevenue_Amount AS float) AS ExpectedRevenue_Value,
        CAST(PotentialTurnover_Amount AS float) AS PotentialTurnover_Value,
        CAST(BKMTurnover_Amount AS float) AS BKMTurnover_Value,
        CAST(TargetTurnover_Amount AS float) AS TargetTurnover_Value,
        Probability,
        IsThereDelay,
        CAST(CloseDate AS date) AS CloseDate,
        CAST(DeliveryDate AS date) AS DeliveryDate,
        CAST(CreatedOn AS date) AS FirstCreatedDate
    FROM [1886662b0a1847a7973577f52892968fdb].[dbo].[Opportunity]
    WHERE DeletedOn IS NULL and CompanyId = '4f1687e4-f282-4601-a3cc-ef612e00c3e4'
) AS SOURCE
ON TARGET.Id = SOURCE.Id COLLATE Turkish_CI_AS
WHEN NOT MATCHED BY SOURCE THEN
    DELETE
WHEN MATCHED THEN
UPDATE SET
    TARGET.Name = SOURCE.Name,
    TARGET.AccountId = SOURCE.AccountId,
    TARGET.OwnerId = SOURCE.OwnerId,
    TARGET.LeadOwnerId = SOURCE.LeadOwnerId,
    TARGET.PartnerId = SOURCE.PartnerId,
    TARGET.PersonId = SOURCE.PersonId,
    TARGET.CompanyId = SOURCE.CompanyId,
    TARGET.PipelineId = SOURCE.PipelineId,
    TARGET.ProductGroupId = SOURCE.ProductGroupId,
    TARGET.ProductCategoryId = SOURCE.ProductCategoryId,
    TARGET.Type = SOURCE.Type,
    TARGET.Source = SOURCE.Source,
    TARGET.DealType = SOURCE.DealType,
    TARGET.WonLostType = SOURCE.WonLostType,
    TARGET.DealStatus = SOURCE.DealStatus,
    TARGET.ProbabilityBand = SOURCE.ProbabilityBand,
    TARGET.OpportunityStageName = SOURCE.OpportunityStageName,
    TARGET.OpportunityStageId = SOURCE.OpportunityStageId,
    TARGET.OpportunityStageNameTr = SOURCE.OpportunityStageNameTr,
    TARGET.Amount_Value = SOURCE.Amount_Value,
    TARGET.ExpectedRevenue_Value = SOURCE.ExpectedRevenue_Value,
    TARGET.PotentialTurnover_Value = SOURCE.PotentialTurnover_Value,
    TARGET.BKMTurnover_Value = SOURCE.BKMTurnover_Value,
    TARGET.TargetTurnover_Value = SOURCE.TargetTurnover_Value,
    TARGET.Probability = SOURCE.Probability,
    TARGET.IsThereDelay = SOURCE.IsThereDelay,
    TARGET.CloseDate = SOURCE.CloseDate,
    TARGET.DeliveryDate = SOURCE.DeliveryDate,
    TARGET.FirstCreatedDate = SOURCE.FirstCreatedDate

WHEN NOT MATCHED THEN
INSERT (
    Id, Name, AccountId, OwnerId, LeadOwnerId,
    PartnerId, PersonId, CompanyId, PipelineId,
    ProductGroupId, ProductCategoryId,
    Type, Source, DealType, WonLostType, DealStatus,
    ProbabilityBand, OpportunityStageName,
    OpportunityStageId, OpportunityStageNameTr,
    Amount_Value, ExpectedRevenue_Value,
    PotentialTurnover_Value, BKMTurnover_Value,
    TargetTurnover_Value,
    Probability, IsThereDelay,
    CloseDate, DeliveryDate, FirstCreatedDate
)
VALUES (
    SOURCE.Id, SOURCE.Name, SOURCE.AccountId, SOURCE.OwnerId, SOURCE.LeadOwnerId,
    SOURCE.PartnerId, SOURCE.PersonId, SOURCE.CompanyId, SOURCE.PipelineId,
    SOURCE.ProductGroupId, SOURCE.ProductCategoryId,
    SOURCE.Type, SOURCE.Source, SOURCE.DealType, SOURCE.WonLostType, SOURCE.DealStatus,
    SOURCE.ProbabilityBand, SOURCE.OpportunityStageName,
    SOURCE.OpportunityStageId, SOURCE.OpportunityStageNameTr,
    SOURCE.Amount_Value, SOURCE.ExpectedRevenue_Value,
    SOURCE.PotentialTurnover_Value, SOURCE.BKMTurnover_Value,
    SOURCE.TargetTurnover_Value,
    SOURCE.Probability, SOURCE.IsThereDelay,
    SOURCE.CloseDate, SOURCE.DeliveryDate, SOURCE.FirstCreatedDate
);