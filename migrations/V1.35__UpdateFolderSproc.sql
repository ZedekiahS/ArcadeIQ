-------------------------------------------------
--update Folder
-------------------------------------------------
--Created by Zed She 4/24/2025
-------------------------------------------------

Create or alter Procedure UpdateFolder (
    @FolderID INT,
    @NewName VARCHAR(30) = NULL,
    @NewDescription VARCHAR(MAX) = NULL,
    @NewIsPublic bit = 0,
    @NewCreateDate DATE = NULL
)
AS
BEGIN
	
	DECLARE @OldName VARCHAR(30),
            @OldDescription VARCHAR(MAX),
            @OldIsPublic bit,
            @OldCreateDate DATE;

	--Validate params
	IF NOT EXISTS (SELECT 1 FROM Folder WHERE ID = @FolderID)
		THROW 51001, 'Did not find Folder', 1

	--getcurrent
	SELECT @OldName = Name,
           @OldDescription = Description,
           @OldIsPublic = ispublic,
           @OldCreateDate = createdate
    FROM Folder
    WHERE ID = @FolderID;

	--put in new values
	IF @NewName IS NULL
        SET @NewName = @OldName;

    IF @NewDescription IS NULL
        SET @NewDescription = @OldDescription;

    IF @NewIsPublic IS NULL
        SET @NewIsPublic = @OldIsPublic;

    IF @NewCreateDate IS NULL
        SET @NewCreateDate = @OldCreateDate;

	--Updateuser
	UPDATE Folder
    SET Name = @NewName,
        Description = @NewDescription,
        ispublic = @NewIsPublic,
        createdate = @NewCreateDate
    WHERE ID = @FolderID;

    RETURN 0;
END