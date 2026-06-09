ALTER   PROC [dbo].[AddTag](
	@TagName VARCHAR(30),
	@NewTagID INT OUTPUT
)
AS
BEGIN
	--Validate params
	IF  EXISTS (SELECT 1 FROM Tag WHERE TagName = @TagName)
		THROW 51001, 'tag already exists', 1


	--Insert into Tag
	INSERT INTO Tag (TagName)
    VALUES (@TagName);

	SET @NewTagID = SCOPE_IDENTITY()

	RETURN 0;
END
GO

ALTER TABLE Tag
DROP COLUMN [Description]