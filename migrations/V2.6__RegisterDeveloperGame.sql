CREATE OR ALTER PROC RegisterDeveloperGame
(
    @GameID   INT,
    @Username VARCHAR(30)
)
AS
BEGIN
    IF @GameID IS NULL
        THROW 51001, 'GameID must be provided.', 1;
    IF NOT EXISTS(SELECT 1 FROM Game WHERE ID = @GameID)
        THROW 51002, 'That game does not exist.', 1;

    DECLARE @UserID INT
      = (SELECT ID FROM [User] WHERE Username = @Username);
    IF @UserID IS NULL
        THROW 51003, 'Username not found.', 1;

    DECLARE @DevID INT
      = (SELECT DeveloperID 
           FROM DevUser
           WHERE ID = @UserID);
    IF @DevID IS NULL
        THROW 51004, 'User is not a registered developer.', 1;

    IF EXISTS(
      SELECT 1 
        FROM Develops 
       WHERE GameID = @GameID 
         AND DevID  = @DevID
    )
        THROW 51005, 'Game already registered by this developer.', 1;

    INSERT INTO Develops(GameID, DevID)
    VALUES(@GameID, @DevID);

    RETURN 0;
END
GO

GRANT EXECUTE ON RegisterDeveloperGame TO ArcadeIQApp;