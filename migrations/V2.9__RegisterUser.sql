CREATE OR ALTER Procedure RegisterUser(
@ID int,
@Username varchar(30),
@Email varchar(30) NULL, 
@Password varchar(60),
@RegistrationDate date,
@DOB date NULL,
@CardNumber int NULL,
@ExpirationDate date NULL,
@CVV smallint NULL,
@NameOnCard varchar(50) NULL
)
AS
BEGIN
IF @ID IS NULL
THROW 52000, 'ID cannot be null', 1;
IF @Username IS NULL 
THROW 52001, 'User cannot be null', 1;
IF @Password IS NULL
THROW 52002, 'Password cannot be null', 1;
IF @RegistrationDate IS NULL
THROW 52003, 'RegistrationDate cannot be null', 1;

IF EXISTS(SELECT 1 FROM [User] WHERE [User].Username = @Username)
THROW 52004, 'Username already exists, use login instead.', 1;

IF @Password NOT LIKE '$2b%' or @Password NOT LIKE '$2a%'
THROW 52005, 'PasswordHash is not correct', 1;

INSERT INTO [User](ID, Username, Email, [Password], RegistrationDate, CardNumber, ExpirationDate, CVV, NameOnCard)
VALUES(@ID, @Username, @Email, @Password, @RegistrationDate, @CardNumber, @ExpirationDate, @CVV, @NameOnCard)

RETURN 0;
END
GO

GRANT EXECUTE ON RegisterUser to ArcadeIQApp;
