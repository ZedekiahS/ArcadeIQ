CREATE PROC GetReviews(@GameID int) AS
SELECT *
FROM GameReviews
WHERE [Game ID] = @GameID

GRANT EXEC ON GetReviews TO ArcadeIQApp