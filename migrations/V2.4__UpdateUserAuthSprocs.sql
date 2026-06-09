-------------------------------------------------
--Retrieves the matching user password hash from 
--the User table by user id
-------------------------------------------------
--Created by Brett Hixon 4/26/2025
-------------------------------------------------
ALTER PROC GetUserPassHash(
@UserID int,
@Dev bit,
@UserHash varchar(60) output
)
AS
BEGIN
--Validate params
IF(@UserID is null)
	THROW 59000, 'UserID cannot be null.', 9
IF(@Dev is null)
    THROW 59007, 'Dev must not be null.', 9
IF(@Dev = 1) 
BEGIN
    IF(NOT EXISTS(SELECT * FROM [DevUser] d JOIN [User] u ON u.ID = d.ID WHERE d.ID = @UserID))
        THROW 58001, 'Dev with that id does not exist.', 9
END
ELSE
BEGIN
    IF(NOT EXISTS(SELECT * FROM [User] WHERE ID = @UserID))
        THROW 58001, 'User with that id does not exist.', 9
END

--Give back the password hash
SET @UserHash = (SELECT [Password] FROM [User] WHERE ID = @UserID)
RETURN 0
END
GO
-------------------------------------------------
--Retrieves the matching user id from the User
--table by username
-------------------------------------------------
--Created by Brett Hixon 4/26/2025
-------------------------------------------------
ALTER PROC GetUserID(
	@Username varchar(30),
    @Dev bit,
	@UserID int output
)
AS
BEGIN
--Validate params
IF(@Username is null)
	THROW 58000, 'Username cannot be null.', 8
IF(@Dev is null)
    THROW 58007, 'Dev must not be null.', 8
IF(@Dev = 1) 
BEGIN
    IF(NOT EXISTS(SELECT * FROM [DevUser] d JOIN [User] u ON u.ID = d.ID WHERE Username = @Username))
        THROW 58001, 'Dev with that username does not exist.', 8
END
ELSE
BEGIN
    IF(NOT EXISTS(SELECT * FROM [User] WHERE Username = @Username))
        THROW 58001, 'User with that username does not exist.', 8
END

--Return the ID
SET @UserID = (SELECT ID FROM [User] WHERE Username = @Username)
RETURN 0
END