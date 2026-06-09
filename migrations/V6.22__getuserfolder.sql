CREATE OR ALTER PROCEDURE dbo.GetUserFolders
  @UserID INT
AS
BEGIN
  SELECT
    f.ID         AS FolderID,
    f.Name       AS FolderName,
    f.Description,
    f.ispublic,
    f.createdate
  FROM dbo.Folder f
  WHERE f.UserID = @UserID
  ORDER BY f.createdate DESC;
END