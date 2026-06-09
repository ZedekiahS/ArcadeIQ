-------------------------------------------------
--deleteFolder
-------------------------------------------------
--Created by Zed She 4/24/2025
-------------------------------------------------

Create or alter Procedure DeleteFolder (
    @FolderID INT
)
AS
BEGIN
	
	--Validate params
	IF NOT EXISTS (SELECT 1 FROM Folder WHERE ID = @FolderID)
	BEGIN
		THROW 51001, 'Did not find Folder', 1
	END

	--delete
	DELETE FROM Folder
    WHERE ID = @FolderID;

    RETURN 0;
END