CREATE OR ALTER PROCEDURE dbo.RegisterDeveloperGame
    @GameID        INT,
    @DeveloperName NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @DevID INT;
    SELECT @DevID = ID
      FROM Developer
     WHERE Name = @DeveloperName;

    IF @DevID IS NULL
        THROW 50001, 'Developer does not exist.', 1;
    INSERT INTO Develops(GameID, DevID)
    VALUES(@GameID, @DevID);
END;
GO

GRANT EXECUTE
  ON dbo.RegisterDeveloperGame
  TO [ArcadeIQApp];
GO  


CREATE OR ALTER PROCEDURE dbo.RegisterProducerGame
    @GameID       INT,
    @ProducerName NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ProID INT;

    SELECT @ProID = ID
      FROM Producer
     WHERE Name = @ProducerName;

    IF @ProID IS NULL
        THROW 50002, 'Producer  does not exist.', 1;

    INSERT INTO Produces(GameID, ProID)
    VALUES(@GameID, @ProID);
END;
GO

GRANT EXECUTE
  ON dbo.RegisterProducerGame
  TO [ArcadeIQApp];
GO
