CREATE OR ALTER PROCEDURE dbo.UpdateFolder
  @FolderID    INT,
  @Name        VARCHAR(30),
  @Description TEXT = NULL,
  @IsPublic    BIT
AS
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM dbo.Folder
     WHERE ID = @FolderID
  )
  BEGIN
    THROW 51001,'folder does not exist', 1;
  END
  UPDATE Folder 
     SET [Name]       = @Name,
         [Description]  = @Description,
         ispublic     = @IsPublic
   WHERE ID = @FolderID;
   RETURN 0;
END