CREATE OR ALTER PROCEDURE GetUserInventory
    @Username NVARCHAR(100)
AS
BEGIN
    SELECT 
        g.ID AS GameID,
        g.Name AS GameTitle,
        g.Price,
        g.ReleaseDate,
        u.ID AS UserID,
        u.Username
    FROM UserHasGame uhg
    JOIN [Game] g ON uhg.GameID = g.ID
    JOIN [User] u ON uhg.UserID = u.ID
    WHERE u.Username = @Username
END

GRANT EXEC ON GetUserInventory TO ArcadeIQApp

