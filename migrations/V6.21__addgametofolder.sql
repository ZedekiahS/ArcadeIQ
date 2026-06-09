CREATE OR ALTER PROCEDURE dbo.AddGameToFolder
  @UserID   INT,
  @FolderID INT,
  @GameID   INT,
  @Note     TEXT = NULL
AS
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM dbo.FavoriteGame
     WHERE UserID   = @UserID
       AND FolderID = @FolderID
       AND GameID   = @GameID
  )
  BEGIN
    INSERT INTO dbo.FavoriteGame(UserID, FolderID, GameID, note)
    VALUES(@UserID, @FolderID, @GameID, @Note);
  END
END