CREATE OR ALTER PROC GetGamesList
AS
BEGIN
SELECT g.ID, g.[Name], g.Price, g.ReleaseDate
FROM Game g
END

GRANT EXEC ON GetGamesList TO ArcadeIQApp