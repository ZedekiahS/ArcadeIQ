CREATE PROC DeleteAllDevs(@gameId int) AS
BEGIN

IF(@gameId is null)
	THROW 52000, 'Game id cannot be null.', 1

DELETE FROM Develops
WHERE GameID = @gameId
END