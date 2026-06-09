-------------------------------------------------
--deleteUser
-------------------------------------------------
--Created by Zed She 4/24/2025
-------------------------------------------------

Create or alter Procedure DeleteUser (
    @UserID INT
)
AS
BEGIN
	
	--Validate params
	IF NOT EXISTS (SELECT 1 FROM [User] WHERE ID = @UserID)
	BEGIN
		THROW 51001, 'Did not find User', 1
	END

	--delete
	DELETE FROM [User]
    WHERE ID = @UserID;

    RETURN 0;
END