CREATE OR ALTER PROCEDURE dbo.GetGameID
  @GameName VARCHAR(100),
  @GameID   INT OUTPUT
AS
BEGIN
  IF @GameName IS NULL
    THROW 51001, 'Game name must not be null.', 1;

  SELECT @GameID = ID
    FROM dbo.Game
   WHERE Name = @GameName;

  IF @GameID IS NULL
    THROW 51002, 'Game does not exist.', 1;
END