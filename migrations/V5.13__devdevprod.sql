CREATE OR ALTER PROCEDURE RegisterProducerGame
    @GameID     INT,
    @ProducerID INT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO Produces(GameID, ProID)
    VALUES(@GameID, @ProducerID);
END
GO
Grant EXEC ON RegisterProducerGame TO ArcadeIQApp
GO

CREATE OR ALTER PROCEDURE RegisterDeveloperGame
    @GameID INT,
    @DevID  INT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO Develops(GameID, DevID)
    VALUES(@GameID, @DevID);
END
GO

Grant EXEC ON RegisterDeveloperGame TO ArcadeIQApp
GO
