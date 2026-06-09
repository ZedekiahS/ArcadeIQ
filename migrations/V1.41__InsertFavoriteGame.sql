-------------------------------------------------
--insert FavoriteGame
-------------------------------------------------
--Created by Zed She 4/24/2025
-------------------------------------------------

CREATE OR ALTER PROC AddReview(
    @UserID INT,
    @GameID INT,
    @FolderID INT,
    @note VARCHAR(MAX) = NULL
)
AS
BEGIN
	--Validate params
	IF NOT EXISTS (SELECT 1 FROM [User] WHERE ID = @UserID)
		THROW 51001, 'User should exist', 1
	IF NOT EXISTS (SELECT 1 FROM Game WHERE ID = @GameID)
        THROW 51002, 'Game should exist.', 1
	IF NOT EXISTS (SELECT 1 FROM Game WHERE ID = @FolderID)
        THROW 51003, 'Folder should exist.', 1
	
	IF EXISTS (
        SELECT 1 FROM FavoriteGame
        WHERE UserID = @UserID AND GameID = @GameID AND FolderID = @FolderID
    )
        THROW 51004, 'game is already in the folder for this user.', 1

	--Insert into FavoriteGame
	INSERT INTO FavoriteGame (UserID, GameID, FolderID, note)
    VALUES (@UserID, @GameID, @FolderID, @note);

    RETURN 0;
END