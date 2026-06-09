IF COL_LENGTH('dbo.Folder','UserID') IS NULL
BEGIN
  ALTER TABLE dbo.Folder
    ADD UserID INT NOT NULL
      CONSTRAINT FK_Folder_User REFERENCES dbo.[User](ID);
END