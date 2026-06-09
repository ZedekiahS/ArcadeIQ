CREATE PROC GetBundleID(@bundleName VARCHAR(30), @bundleId int output) AS
BEGIN
	IF(@bundleName is null)
		THROW 52000, 'Bundle name must not be null.', 1
	IF(NOT EXISTS(SELECT 1 FROM Bundle WHERE bundlename = @bundleName))
		THROW 52001, 'Bundle does not exist.', 1

	SET @bundleId = (SELECT ID FROM Bundle WHERE bundlename = @bundleName)
END
GO
GRANT EXECUTE ON GetBundleID TO ArcadeIQApp