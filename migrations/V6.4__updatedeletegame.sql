-------------------------------------------------
--deleteGame
-------------------------------------------------
--Created by Zed She 4/24/2025
--Updated by Brett Hixon 5/19/2025
-------------------------------------------------

ALTER   Procedure [dbo].[DeleteGame] (
    @GameID INT
)
AS
BEGIN
	
	--Validate params
	IF NOT EXISTS (SELECT 1 FROM Game WHERE ID = @GameID)
	BEGIN 
		;THROW 51001, 'Did not find Game', 1
	END

	--delete
	DELETE FROM Game
    WHERE ID = @GameID;

    RETURN 0;
END