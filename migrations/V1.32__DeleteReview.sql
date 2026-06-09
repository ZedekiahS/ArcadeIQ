-------------------------------------------------
--deleteReivew
-------------------------------------------------
--Created by Zed She 4/24/2025
-------------------------------------------------

Create or alter Procedure DeleteReview (
    @ReviewID INT
)
AS
BEGIN
	
	--Validate params
	IF NOT EXISTS (SELECT 1 FROM Reviews WHERE ReviewID = @ReviewID)
	BEGIN
		THROW 51001, 'Did not find Review', 1
	END

	--delete
	DELETE FROM Reviews
    WHERE ReviewID = @ReviewID;

    RETURN 0;
END