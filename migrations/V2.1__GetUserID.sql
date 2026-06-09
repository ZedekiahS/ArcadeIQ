-------------------------------------------------
--Retrieves the matching user id from the User
--table by username
-------------------------------------------------
--Created by Brett Hixon 4/26/2025
-------------------------------------------------
CREATE OR ALTER PROC GetUserID(
	@Username varchar(30),
	@UserID int output
)
AS
BEGIN
--Validate params
IF(@Username is null)
	THROW 58000, 'Username cannot be null.', 8
IF(NOT EXISTS(SELECT * FROM [User] WHERE Username = @Username))
	THROW 58001, 'User with that username does not exist.', 8

--Return the ID
SET @UserID = (SELECT ID FROM [User] WHERE Username = @Username)
RETURN 0
END