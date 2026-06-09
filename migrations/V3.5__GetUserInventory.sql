CREATE OR ALTER PROCEDURE GetUserInventory
AS
BEGIN
SELECT ug.GameID, ug.UserID
FROM UserHasGame ug
END
GO

GRANT EXEC ON GetUserInventory TO ArcadeIQApp