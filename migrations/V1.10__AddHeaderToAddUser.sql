-------------------------------------------------
--Adds a user to the User table
--with the specified username, email, password,
--and DOB
--
--Email must be unique to all other users
--DOB is optional
-------------------------------------------------
--Created by Brett Hixon 4/13/2025
-------------------------------------------------
CREATE OR ALTER PROC AddUser(
	@username varchar(30),
	@email varchar(30),
	@password varchar(30),
	@DOB date
)
AS
BEGIN
	--Validate params
	IF(@username is null)
		THROW 52000, 'A username must be provided.', 1
	IF(EXISTS(SELECT * FROM [User] u WHERE u.Username = @username))
		THROW 52001, 'This user already exists.', 1
	IF(@email is null)
		THROW 52002, 'An email must be provided.', 1
	IF(EXISTS(SELECT * FROM [User] u WHERE u.Email = @email))
		THROW 52003, 'A user with that email already exists.', 1
	IF(@password is null)
		THROW 52004, 'A password for this user must be provided.', 1

	--Insert new user into the table
	INSERT INTO [User](Username, Email, [Password], DOB, RegistrationDate)
	VALUES(@username, @email, @password, @DOB, GETDATE())

	RETURN 0
END