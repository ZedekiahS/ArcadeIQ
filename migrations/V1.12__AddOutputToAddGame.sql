-------------------------------------------------
--Adds a entry to the Game table
--with the specified name, price and release date
--
--Price and release date are optional
--
--Outputs the new game ID
-------------------------------------------------
--Created by Brett Hixon 4/13/2025
-------------------------------------------------

ALTER PROC [dbo].[AddGame](
	@name varchar(30),
	@price decimal(10, 2),
	@releasedate date,
	@NewGameID int output
)
AS
BEGIN
	--Validate params
	IF(@name is null)
		THROW 53000, 'Game name must be provided.', 2
	IF(EXISTS(SELECT * FROM Game g WHERE g.[Name] = @name))
		THROW 53001, 'Game with that title already exists.', 2
	
	--Insert into Game
	INSERT INTO Game([Name], Price, [ReleaseDate])
	VALUES(@name, @price, @releasedate)

	SET @NewGameID = SCOPE_IDENTITY()

	RETURN 0;
END