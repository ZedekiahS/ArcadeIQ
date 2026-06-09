ALTER TABLE Producer
DROP CONSTRAINT UQ_Prod
GO
ALTER TABLE Producer
ALTER COLUMN [Name] nvarchar(100)
GO
ALTER TABLE Producer
ADD CONSTRAINT UQ_Prod_Name UNIQUE([Name])
GO
ALTER TABLE Developer
DROP CONSTRAINT UQ_Dev
GO
ALTER TABLE Developer
ALTER COLUMN [Name] nvarchar(100)
GO
ALTER TABLE Developer
ADD CONSTRAINT UQ_Dev_Name UNIQUE([Name])
GO

/****** Object:  StoredProcedure [dbo].[RegisterGameDeveloper]    Script Date: 4/17/2025 7:28:34 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-------------------------------------------------
--Adds an entry to the Develops table
--with the GameID and developer name
--
--If the developer does not exist, creates
--a new developer under that name and outputs the
--new developer's ID, null otherwise
-------------------------------------------------
--Created by Brett Hixon 4/13/2025
-------------------------------------------------
ALTER   PROC [dbo].[RegisterGameDeveloper] (
	@GameID int,
	@DeveloperName nvarchar(100),
	@NewDevID int output
)
AS
BEGIN
	--Validate params
	IF(@GameID is null)
		THROW 55000, 'Game id must be provided.', 3
	IF(NOT EXISTS(SELECT * FROM Game g WHERE g.ID = @GameID))
		THROW 55001, 'That game does not exist.', 3
	IF(@DeveloperName is null)
		THROW 55002, 'Developer name must be provided.', 3
	
	--Make new developer if needed
	DECLARE @DeveloperID AS int
	SET @DeveloperID = (SELECT ID FROM Developer d WHERE d.[Name] = @DeveloperName)
	IF(@DeveloperID is null)
	BEGIN
		INSERT INTO Developer([Name])
		VALUES(@DeveloperName)
		SET @DeveloperID = SCOPE_IDENTITY()
		SET @NewDevID = @DeveloperID
	END

	--Insert values into Develops
	INSERT INTO Develops(GameID, DevID)
	VALUES(@GameID, @DeveloperID)

	RETURN 0
END
GO
/****** Object:  StoredProcedure [dbo].[RegisterGameProducer]    Script Date: 4/17/2025 7:29:10 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-------------------------------------------------
--Adds an entry to the Produces table
--with the GameID and producer name
--
--If the producer does not exist, creates
--a new producer under that name and outputs
--the new ID, null otherwise
-------------------------------------------------
--Created by Brett Hixon 4/13/2025
-------------------------------------------------
ALTER   PROC [dbo].[RegisterGameProducer] (
	@GameID int,
	@ProducerName nvarchar(100),
	@NewProducerID int output
)
AS
BEGIN
	--Validate params
	IF(@GameID is null)
		THROW 54000, 'Game id must be provided.', 3
	IF(NOT EXISTS(SELECT * FROM Game g WHERE g.ID = @GameID))
		THROW 54001, 'That game does not exist.', 3
	IF(@ProducerName is null)
		THROW 54002, 'Producer name must be provided.', 3
	
	--Make new producer if needed
	DECLARE @ProducerID AS int
	SET @ProducerID = (SELECT ID FROM Producer p WHERE p.[Name] = @ProducerName)
	IF(@ProducerID is null)
	BEGIN
		INSERT INTO Producer([Name])
		VALUES(@ProducerName)
		SET @ProducerID = SCOPE_IDENTITY()
		SET @NewProducerID = @ProducerID
	END

	--Insert values into Produces
	INSERT INTO Produces(GameID, ProID)
	VALUES(@GameID, @ProducerID)

	RETURN 0
END