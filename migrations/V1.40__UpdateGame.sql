-------------------------------------------------
--update game 
-------------------------------------------------
--Created by Zed She 4/24/2025
-------------------------------------------------

Create or alter Procedure UpdateGame (
    @ID INT,
    @NewName VARCHAR(30) = NULL,
    @NewPrice DECIMAL(10,2) = NULL,
    @NewReleaseDate DATE = NULL
)
AS
BEGIN
	
	DECLARE @OldName VARCHAR(30),
            @OldPrice DECIMAL(10,2),
            @OldReleaseDate DATE;

	--Validate params
	IF NOT EXISTS (SELECT 1 FROM Game WHERE ID = @ID)
		THROW 51001, 'Did not find game', 1

	--getcurrent
	SELECT @OldName = [Name],
           @OldPrice = Price,
           @OldReleaseDate = ReleaseDate
    FROM Game
    WHERE ID = @ID;

	--put in new values
	IF @NewName IS NULL
        SET @NewName = @OldName;

    IF @NewPrice IS NULL
        SET @NewPrice = @OldPrice;

    IF @NewReleaseDate IS NULL
        SET @NewReleaseDate = @OldReleaseDate;

	--UpdateGame
	UPDATE Game
    SET [Name] = @NewName,
        Price = @NewPrice,
        ReleaseDate = @NewReleaseDate
    WHERE ID = @ID;

    RETURN 0;
END