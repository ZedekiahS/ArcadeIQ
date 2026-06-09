CREATE OR ALTER PROC RegisterGameToUser(
	@UserID int,
	@GameID int
)
AS
BEGIN
	--Validate params
	IF(@UserID is null)
		THROW 55000, 'User id cannot be null.', 5
	IF(@GameID is null)
		THROW 55001, 'Game id cannot be null.', 5
	IF(NOT EXISTS(SELECT * FROM [User] u WHERE u.ID = @UserID))
		THROW 55003, 'That user does not exist.', 5
	IF(NOT EXISTS(SELECT * FROM Game g WHERE g.ID = @GameID))
		THROW 55004, 'That game does not exist.', 5
	IF(EXISTS(SELECT * FROM UserHasGame ug WHERE ug.GameID = @GameID AND ug.UserID = @UserID))
		THROW 55002, 'User already has that game.', 5

	--Add game to user
	INSERT INTO UserHasGame(GameID, UserID)
	VALUES(@GameID, @UserID)

	RETURN 0
END