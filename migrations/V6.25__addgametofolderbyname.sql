CREATE OR ALTER PROCEDURE dbo.AddGameToFolderByName
  @UserID     INT,
  @FolderName VARCHAR(30),
  @GameName   VARCHAR(100),
  @Note       TEXT       = NULL
AS
BEGIN
  DECLARE @FolderID INT, @GameID INT;

  EXEC dbo.GetFolderID @FolderName, @UserID, @FolderID OUTPUT;
  EXEC dbo.GetGameID   @GameName,   @GameID   OUTPUT;

  EXEC dbo.AddGameToFolder
       @UserID   = @UserID,
       @FolderID = @FolderID,
       @GameID   = @GameID,
       @Note     = @Note;
END

