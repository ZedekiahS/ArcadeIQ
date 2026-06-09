-------------------------------------------------
--Adds an entry to the Develops table
--with the GameID and developer name
--
--If the developer does not exist, creates
--a new developer under that name and outputs the
--new developer's ID, null otherwise
-------------------------------------------------
--Created by Brett Hixon 4/13/2025
-------------------------------------------------
CREATE OR ALTER PROC RegisterGameDeveloper (
	@GameID int,
	@DeveloperName varchar(30),
	@NewDevID int output
)
AS
BEGIN
	--Validate params
	IF(@GameID is null)
		THROW 55000, 'Game id must be provided.', 3
	IF(NOT EXISTS(SELECT * FROM Game g WHERE g.ID = @GameID))
		THROW 55001, 'That game does not exist.', 3
	IF(@DeveloperName is null)
		THROW 55002, 'Developer name must be provided.', 3
	
	--Make new developer if needed
	DECLARE @DeveloperID AS int
	SET @DeveloperID = (SELECT ID FROM Developer d WHERE d.[Name] = @DeveloperName)
	IF(@DeveloperID is null)
	BEGIN
		INSERT INTO Developer([Name])
		VALUES(@DeveloperName)
		SET @DeveloperID = SCOPE_IDENTITY()
		SET @NewDevID = @DeveloperID
	END

	--Insert values into Develops
	INSERT INTO Develops(GameID, DevID)
	VALUES(@GameID, @DeveloperID)

	RETURN 0
END