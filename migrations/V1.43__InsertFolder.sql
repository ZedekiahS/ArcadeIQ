-------------------------------------------------
--insert Folder
-------------------------------------------------
--Created by Zed She 4/24/2025
-------------------------------------------------

CREATE OR ALTER PROC AddFolder(
	@Name VARCHAR(30),
    @Description VARCHAR(MAX),
    @ispublic bit = 0, --we should let user set public if they want
    @createdate DATE = NULL,
    @NewFolderID INT OUTPUT
)
AS
BEGIN
	
	IF @createdate IS NULL
        SET @createdate = GETDATE();

	--Insert into Folder
	INSERT INTO [Folder] ([Name], [Description], ispublic, createdate)
    VALUES (@Name, @Description, @ispublic, @createdate);

	SET @NewFolderID = SCOPE_IDENTITY()

	RETURN 0;
END