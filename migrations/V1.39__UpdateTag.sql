-------------------------------------------------
--update tag 
-------------------------------------------------
--Created by Zed She 4/24/2025
-------------------------------------------------

Create or alter Procedure UpdateTag (
    @ID INT,
    @NewTagName VARCHAR(30) = NULL,
    @NewDescription VARCHAR(MAX) = NULL
)
AS
BEGIN
	
	DECLARE @OldTagName VARCHAR(30),
            @OldDescription VARCHAR(MAX);

	--Validate params
	IF NOT EXISTS (SELECT 1 FROM Tag WHERE ID = @ID)
		THROW 51001, 'Did not find tag', 1

	--getcurrent
	SELECT @OldTagName = TagName,
           @OldDescription = Description
    FROM Tag
    WHERE ID = @ID;

	--put in new values
	IF @NewTagName IS NULL
        SET @NewTagName = @OldTagName;

    IF @NewDescription IS NULL
        SET @NewDescription = @OldDescription;

	--UpdateTag
	Update Tag
    SET TagName = @NewTagName,
        [Description] = @NewDescription
    WHERE ID = @ID;

    RETURN 0;
END