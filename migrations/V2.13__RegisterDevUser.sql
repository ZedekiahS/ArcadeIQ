CREATE OR ALTER Procedure RegisterDeveloperUser(
@Username varchar(30),
@Email varchar(30) NULL, 
@Password varchar(60),
@DOB date NULL,
@CardNumber int NULL,
@ExpirationDate date NULL,
@CVV smallint NULL,
@NameOnCard varchar(50) NULL,
@DeveloperName nvarchar(100)
)
AS
BEGIN
IF @Username IS NULL 
THROW 520010, 'User cannot be null', 1;
IF @Password IS NULL
THROW 52011, 'Password cannot be null', 1;
IF @DeveloperName IS NULL
THROW 52012, 'Developer name cannot be null', 1;

DECLARE @DevUserID int
SET @DevUserID = (SELECT[User].ID FROM [User] WHERE Username = @Username)

DECLARE @DevNameID int
SET @DevNameID = (SELECT Developer.ID FROM Developer WHERE [Name] = @DeveloperName)

IF @DevNameID IS NULL
THROW 52013, 'DevNameID cannot be null', 1;


IF EXISTS(SELECT 1 FROM DevUser WHERE DevUser.ID = @DevUserID)
THROW 52014, 'DevUser already exists.', 1;

IF NOT EXISTS(SELECT 1 FROM [User] Where [User].Username = @Username)
BEGIN
EXEC RegisterUser @Username, @Email, @Password, @DOB, @CardNumber, @ExpirationDate, @CVV,@NameOnCard
SET @DevUserID = (SELECT[User].ID FROM [User] WHERE Username = @Username)
END

INSERT INTO [DevUser](ID, DeveloperID)
VALUES(@DevUserID, @DevNameID)

RETURN 0;
END
GO

GRANT EXECUTE ON RegisterUser to ArcadeIQApp;
