-------------------------------------------------
--insert tag
-------------------------------------------------
--Created by Zed She 4/24/2025
-------------------------------------------------

CREATE OR ALTER PROC AddTag(
	@TagName VARCHAR(30),
	@Description VARCHAR(MAX),
	@NewTagID INT OUTPUT
)
AS
BEGIN
	--Validate params
	IF  EXISTS (SELECT 1 FROM Tag WHERE TagName = @TagName)
		THROW 51001, 'tag already exists', 1


	--Insert into Tag
	INSERT INTO Tag (TagName, [Description])
    VALUES (@TagName, @Description);

	SET @NewTagID = SCOPE_IDENTITY()

	RETURN 0;
END