-------------------------------------------------
--deleteTag
-------------------------------------------------
--Created by Zed She 4/24/2025
-------------------------------------------------

Create or alter Procedure DeleteTag (
    @TagID INT
)
AS
BEGIN
	
	--Validate params
	IF NOT EXISTS (SELECT 1 FROM Tag WHERE ID = @TagID)
	BEGIN
		THROW 51001, 'Did not find Tag', 1
	END

	--delete
	DELETE FROM Tag
    WHERE ID = @TagID;

    RETURN 0;
END