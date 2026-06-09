ALTER TABLE Game
ALTER COLUMN [Name] nvarchar(200)
GO
/****** Object:  StoredProcedure [dbo].[AddGame]    Script Date: 4/17/2025 7:16:16 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
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
	@name nvarchar(200),
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
GO
/****** Object:  StoredProcedure [dbo].[GetGameID]    Script Date: 4/17/2025 7:17:23 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
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
ALTER   PROC [dbo].[GetGameID](
	@GameName nvarchar(200),
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
GO
