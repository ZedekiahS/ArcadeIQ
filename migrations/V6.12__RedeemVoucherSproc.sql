CREATE PROC RedeemVoucher(@ActivationCode int, @userId int) AS
BEGIN
	IF(@ActivationCode is null)
		THROW 52003, 'Activation code must not be null', 1
	IF(@userId is null)
		THROW 52002, 'User id must be provided.', 1
	IF(NOT EXISTS(SELECT 1 FROM Voucher WHERE ActivationCode = @ActivationCode))
		THROW 52000, 'No such voucher with that code exists.', 1
	IF((SELECT used FROM Voucher WHERE ActivationCode = @ActivationCode) = 1)
		THROW 52001, 'That voucher has been redeemed.', 1

	--Attempt to add to user's inventory
	DECLARE @gameId int
	SET @gameId = (SELECT GameID FROM Voucher WHERE ActivationCode = @ActivationCode)
	EXEC RegisterGameToUser @userId, @gameId

	--Set the voucher as used
	UPDATE Voucher
	SET used = 1
	WHERE ActivationCode = @ActivationCode
END
GO
GRANT EXECUTE ON RedeemVoucher TO ArcadeIQApp