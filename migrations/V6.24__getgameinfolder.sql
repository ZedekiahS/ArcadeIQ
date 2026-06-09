CREATE OR ALTER PROCEDURE dbo.GetGamesInFolder
  @UserID   INT,
  @FolderID INT
AS
BEGIN
  SELECT 
    g.ID,
    g.Name,
    g.Price,
    g.ReleaseDate,
    fg.note
  FROM dbo.FavoriteGame fg
  JOIN dbo.Game g
    ON fg.GameID = g.ID
  WHERE fg.UserID   = @UserID
    AND fg.FolderID = @FolderID
  ORDER BY g.Name;
END