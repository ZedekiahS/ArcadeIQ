CREATE OR ALTER PROCEDURE dbo.GetFolderID
  @FolderName VARCHAR(30),
  @UserID     INT,
  @FolderID   INT OUTPUT
AS
BEGIN
  IF @FolderName IS NULL
    THROW 51001, 'Folder name must not be null.', 1;

  SELECT @FolderID = ID
    FROM dbo.Folder
   WHERE [Name] = @FolderName
     AND UserID = @UserID;

  IF @FolderID IS NULL
    THROW 51002, 'Folder does not exist or does not belong to you.', 1;
END