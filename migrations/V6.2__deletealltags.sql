CREATE PROC DeleteAllTags(@gameId int) AS
BEGIN

IF(@gameId is null)
	THROW 52000, 'Game id cannot be null.', 1

DELETE FROM HasTag
WHERE GameID = @gameId
END