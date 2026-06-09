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
CREATE OR ALTER PROC RegisterGameProducer (
	@GameID int,
	@ProducerName varchar(30),
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