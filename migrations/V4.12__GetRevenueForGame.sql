CREATE PROC GetRevenueForGame(@GameName nvarchar(200), @Revnue money output) AS
BEGIN
	IF(@GameName is null)
		THROW 52000, 'Game name must be provided.', 1
	SET @Revnue = (SELECT (COUNT(uhg.GameID) * g.Price) FROM Game g JOIN UserHasGame uhg ON g.ID = uhg.GameID WHERE g.[Name] = @GameName GROUP BY uhg.GameID, g.Price)
END

GRANT EXECUTE ON GetRevenueForGame TO ArcadeIQApp