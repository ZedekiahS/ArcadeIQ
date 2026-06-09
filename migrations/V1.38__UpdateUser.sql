-------------------------------------------------
--update User
-------------------------------------------------
--Created by Zed She 4/24/2025
-------------------------------------------------

Create or alter Procedure UpdateUser (
    @ID INT,
    @NewUsername VARCHAR(30) = NULL,
    @NewEmail VARCHAR(30) = NULL,
    @NewPassword VARCHAR(50) = NULL,
    @NewRegistrationDate DATE = NULL, --I'm not sure whether we should allow update this
    @NewDOB DATE = NULL
)
AS
BEGIN
	
	DECLARE @OldUsername VARCHAR(30),
            @OldEmail VARCHAR(30),
            @OldPassword VARCHAR(50),
            @OldRegistrationDate DATE,
            @OldDOB DATE;

	--Validate params
	IF NOT EXISTS (SELECT 1 FROM [User] WHERE ID = @ID)
		THROW 51001, 'Did not find User', 1

	--getcurrent
	SELECT @OldUsername = Username,
           @OldEmail = Email,
           @OldPassword = [Password],
           @OldRegistrationDate = RegistrationDate,
           @OldDOB = DOB
    FROM [User]
    WHERE ID = @ID;

	--put in new values
	IF @NewUsername IS NULL
        SET @NewUsername = @OldUsername;

    IF @NewEmail IS NULL
        SET @NewEmail = @OldEmail;

    IF @NewPassword IS NULL
        SET @NewPassword = @OldPassword;

    IF @NewRegistrationDate IS NULL
        SET @NewRegistrationDate = @OldRegistrationDate;

    IF @NewDOB IS NULL
        SET @NewDOB = @OldDOB;

	--Updateuser
	UPDATE [User]
    SET Username = @NewUsername,
        Email = @NewEmail,
        [Password] = @NewPassword,
        RegistrationDate = @NewRegistrationDate,
        DOB = @NewDOB
    WHERE ID = @ID;

    RETURN 0;
END