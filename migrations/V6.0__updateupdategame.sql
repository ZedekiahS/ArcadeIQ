-------------------------------------------------
--update game 
-------------------------------------------------
--Created by Zed She 4/24/2025
--Updated by Brett Hixon 5/19/2025
-------------------------------------------------

ALTER   Procedure [dbo].[UpdateGame] (
    @ID INT,
    @NewName VARCHAR(30) = NULL,
    @NewPrice DECIMAL(10,2) = NULL,
    @NewReleaseDate DATE = NULL,
	@NewDescription NVARCHAR(MAX) = NULL
)
AS
BEGIN
	
	DECLARE @OldName VARCHAR(30),
            @OldPrice DECIMAL(10,2),
            @OldReleaseDate DATE,
			@OldDescription NVARCHAR(MAX);

	--Validate params
	IF NOT EXISTS (SELECT 1 FROM Game WHERE ID = @ID)
		THROW 51001, 'Did not find game', 1

	--getcurrent
	SELECT @OldName = [Name],
           @OldPrice = Price,
           @OldReleaseDate = ReleaseDate,
		   @OldDescription = [Description]
    FROM Game
    WHERE ID = @ID;

	--put in new values
	IF @NewName IS NULL
        SET @NewName = @OldName;

    IF @NewPrice IS NULL
        SET @NewPrice = @OldPrice;

    IF @NewReleaseDate IS NULL
        SET @NewReleaseDate = @OldReleaseDate;

	IF @NewDescription IS NULL
		SET @NewDescription = @OldDescription;

	--UpdateGame
	UPDATE Game
    SET [Name] = @NewName,
        Price = @NewPrice,
        ReleaseDate = @NewReleaseDate,
		[Description] = @NewDescription
    WHERE ID = @ID;

    RETURN 0;
END