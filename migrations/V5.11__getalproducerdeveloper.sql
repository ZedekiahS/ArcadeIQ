CREATE OR ALTER PROCEDURE dbo.GetAllProducers
AS
BEGIN
  SELECT [Name] AS Producer
  FROM Producer;
END;
GO
GRANT EXECUTE ON dbo.GetAllProducers TO ArcadeIQApp;
GO
CREATE OR ALTER PROCEDURE dbo.GetAllDevelopers AS
  SELECT [Name] AS Developer FROM Developer;
GO
GRANT EXECUTE ON dbo.GetAllDevelopers TO ArcadeIQApp;