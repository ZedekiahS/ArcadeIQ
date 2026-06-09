CREATE VIEW dbo.vwGameBasic AS
SELECT
    ID,
    [Name],
    Price,
    ReleaseDate
FROM dbo.Game;
GO

CREATE VIEW dbo.vwGameDevelopers AS
SELECT
    d.GameID,
    dev.[Name] AS DeveloperName
FROM dbo.Develops d
JOIN dbo.Developer dev
  ON d.DevID = dev.ID;
GO

CREATE VIEW dbo.vwGameProducers AS
SELECT
    p.GameID,
    prod.[Name] AS ProducerName
FROM dbo.Produces p
JOIN dbo.Producer prod
  ON p.ProID = prod.ID;
GO

CREATE VIEW dbo.vwGameTags AS
SELECT
    ht.GameID,
    t.TagName
FROM dbo.HasTag ht
JOIN dbo.Tag t
  ON ht.TagID = t.ID;
GO
