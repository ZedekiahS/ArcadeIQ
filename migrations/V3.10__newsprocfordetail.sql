CREATE OR ALTER PROCEDURE dbo.GetGameBasic
    @GameID INT
AS
BEGIN
    SELECT
        g.Name,
        g.Price,
        g.ReleaseDate
    FROM dbo.Game AS g
    WHERE g.ID = @GameID;
END;
GO

CREATE OR ALTER PROCEDURE dbo.GetGameDevelopers
    @GameID INT
AS
BEGIN
    SELECT
        dev.Name AS Developer
    FROM dbo.Develops AS d
    JOIN dbo.Developer AS dev
      ON d.DevID = dev.ID
    WHERE d.GameID = @GameID;
END;
GO

CREATE OR ALTER PROCEDURE dbo.GetGameProducers
    @GameID INT
AS
BEGIN
    SELECT
        prod.Name AS Producer
    FROM dbo.Produces AS p
    JOIN dbo.Producer AS prod
      ON p.ProID = prod.ID
    WHERE p.GameID = @GameID;
END;
GO

CREATE OR ALTER PROCEDURE dbo.GetGameTags
    @GameID INT
AS
BEGIN
    SELECT
        t.TagName AS Tag
    FROM dbo.HasTag AS ht
    JOIN dbo.Tag AS t
      ON ht.TagID = t.ID
    WHERE ht.GameID = @GameID;
END;
GO
