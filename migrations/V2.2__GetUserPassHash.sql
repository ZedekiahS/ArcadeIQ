-------------------------------------------------
--Retrieves the matching user password hash from 
--the User table by user id
-------------------------------------------------
--Created by Brett Hixon 4/26/2025
-------------------------------------------------
CREATE OR ALTER PROC GetUserPassHash(
@UserID int,
@UserHash varchar(60) output
)
AS
BEGIN
--Validate params
IF(@UserID is null)
	THROW 59000, 'UserID cannot be null.', 9
IF(NOT EXISTS(SELECT * FROM [User] WHERE ID = @UserID))
	THROW 59001, 'A user with that ID does not exist.', 9

--Give back the password hash
SET @UserHash = (SELECT [Password] FROM [User] WHERE ID = @UserID)
RETURN 0
END