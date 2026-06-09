ALTER PROC CreateVoucher(@activationCode int, @gameId int) AS
BEGIN
	IF(@activationCode is null)
		THROW 52000, 'You must provide an activation code.', 1
	IF(@gameId is null)
		THROW 52001, 'You must provide the id for the game.', 1
	IF(NOT EXISTS(SELECT 1 FROM Game WHERE ID = @gameId))
		THROW 52002, 'That game does not exist.', 1
	IF(EXISTS(SELECT 1 FROM Voucher WHERE ActivationCode = @activationCode))
		THROW 52003, 'A voucher with that code already exists.', 1

	INSERT INTO Voucher(ActivationCode, GameID, used)
	VALUES(@activationCode, @gameId, 0)
END