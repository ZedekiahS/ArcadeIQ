-------------------------------------------------
--update Review
-------------------------------------------------
--Created by Zed She 4/24/2025
-------------------------------------------------

Create or alter Procedure UpdateReview (
    @ReviewID INT,
    @NewContent VARCHAR(MAX) = NULL,
    @NewStar INT = 0,
    @NewDate DATE = NULL
)
AS
BEGIN
	
	DECLARE @OldContent VARCHAR(MAX),
            @OldStar INT,
            @OldDate DATE;

	--Validate params
	IF NOT EXISTS (SELECT 1 FROM Reviews WHERE ReviewID = @ReviewID)
		THROW 51001, 'Did not find review', 1

	--getcurrent
	SELECT @OldContent = Content,
           @OldStar = Star,
           @OldDate = [Date]
    FROM Reviews
    WHERE ReviewID = @ReviewID;

	--put in new values
	IF @NewStar <> 0 AND (@NewStar < 1 OR @NewStar > 5)
        THROW 51002, 'Star must be between 1 and 5.', 1;

    IF @NewContent IS NULL
        SET @NewContent = @OldContent;

    IF @NewStar = 0
        SET @NewStar = @OldStar;

    IF @NewDate IS NULL
        SET @NewDate = @OldDate;

	--Updatereivew
	UPDATE Reviews
    SET Content = @NewContent,
        Star = @NewStar,
        [Date] = @NewDate
    WHERE ReviewID = @ReviewID;

    RETURN 0;
END