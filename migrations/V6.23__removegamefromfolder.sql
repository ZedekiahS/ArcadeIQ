CREATE OR ALTER PROCEDURE dbo.RemoveGameFromFolder
  @UserID   INT,
  @FolderID INT,
  @GameID   INT
AS
BEGIN
	IF NOT EXISTS (
    SELECT 1
      FROM dbo.FavoriteGame
     WHERE UserID = @UserID
	 AND FolderID = @FolderID
     AND GameID   = @GameID
	)
	BEGIN
		THROW 51001,'can not find the match game in the folder', 1;
	END
	DELETE FROM dbo.FavoriteGame
	WHERE UserID   = @UserID
    AND FolderID = @FolderID
    AND GameID   = @GameID;
END