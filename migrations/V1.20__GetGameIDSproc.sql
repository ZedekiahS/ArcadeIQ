-------------------------------------------------
--Returns the id of thefirst game to match the 
--provided name
--
--GameName must be provided
--
--Outputs the game's ID
-------------------------------------------------
--Created by Brett Hixon 4/17/2025
-------------------------------------------------
CREATE OR ALTER PROC GetGameID(
	@GameName varchar(30),
	@GameID int output
)
AS
BEGIN
	--Validate params
	IF(@GameID is null)
		THROW 56000, 'Game id cannot be null.', 6
	IF(NOT EXISTS(SELECT * FROM Game g WHERE g.[Name] = @GameName))
		THROW 56001, 'Game does not exist.', 6

	--Give back the ID
	SELECT @GameID = g.ID FROM Game g WHERE g.[Name] = @GameName

	RETURN 0
END