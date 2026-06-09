-------------------------------------------------
--insert review
-------------------------------------------------
--Created by Zed She 4/24/2025
-------------------------------------------------

CREATE OR ALTER PROC AddReview(
	@UserID INT,
    @GameID INT,
    @Star INT,
    @Content VARCHAR(MAX),
    @ReviewDate DATE = NULL,
    @NewReviewID INT OUTPUT
)
AS
BEGIN
	--Validate params
	IF @Star NOT BETWEEN 1 AND 5
		THROW 51001, 'star should be in valid range', 1
	IF NOT EXISTS (SELECT 1 FROM [User] WHERE ID = @UserID)
		THROW 51002, 'User should exist', 1
	IF NOT EXISTS (SELECT 1 FROM Game WHERE ID = @GameID)
        THROW 51003, 'Game should exist.', 1
	
	IF @ReviewDate IS NULL
        SET @ReviewDate = GETDATE();

	--Insert into Review
	INSERT INTO Reviews (Content, Star, UserID, GameID, [Date])
    VALUES (@Content, @Star, @UserID, @GameID, @ReviewDate);

	SET @NewReviewID = SCOPE_IDENTITY()

	RETURN 0;
END