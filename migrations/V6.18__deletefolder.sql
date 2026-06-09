CREATE OR ALTER PROCEDURE dbo.DeleteFolder
  @FolderID INT
AS
BEGIN
	IF NOT EXISTS (
    SELECT 1
      FROM dbo.Folder
     WHERE ID = @FolderID
	)
	BEGIN
		THROW 51001,'can not find the folder', 1;
	END
	DELETE FROM dbo.FavoriteGame
	WHERE FolderID = @FolderID;

	DELETE FROM dbo.Folder
	WHERE ID = @FolderID;
END