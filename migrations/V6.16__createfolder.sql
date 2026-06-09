CREATE OR ALTER PROCEDURE dbo.CreateFolder
  @UserID       INT,
  @Name         VARCHAR(30),
  @Description  TEXT        = NULL,
  @IsPublic     BIT         = 0,
  @NewFolderID  INT         OUTPUT
AS
BEGIN
  INSERT INTO dbo.Folder([Name], Description, ispublic, createdate, UserID)
  VALUES(@Name, @Description, @IsPublic, GETDATE(), @UserID);

  SET @NewFolderID = SCOPE_IDENTITY();
END
GO
