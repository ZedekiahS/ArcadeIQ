-------------------------------------------------
--Adds a tag to game entry to HasTag table
--
--If the provided tag name does not already exist,
--a new entry is added to Tag with that TagName
--
-------------------------------------------------
--Created by Brett Hixon 4/18/2025
-------------------------------------------------
CREATE OR ALTER PROC AddTagToGame(
    @TagName nvarchar(100),
    @GameID int
)
AS
BEGIN
    --Validate params
    IF(@GameID is null)
        THROW 57000, 'Game id cannot be null.', 7
    IF(NOT EXISTS(SELECT * FROM Game WHERE ID = @GameID))
        THROW 57001, 'That game does not exist.', 7
    IF(NOT EXISTS(SELECT * FROM Tag WHERE TagName = @TagName))
        INSERT INTO Tag(TagName)
        VALUES(@TagName)

    --Insert values
    DECLARE @TagID AS int
    SET @TagID = (SELECT ID FROM Tag WHERE TagName = @TagName)

    INSERT INTO HasTag(GameID, TagID)
    VALUES(@GameID, @TagID)
END