CREATE or ALTER PROCEDURE AddBundle(
	@BundleName        VARCHAR(30),
    @BundleType        VARCHAR(10)   = NULL,
    @BundlePrice       DECIMAL(10,2) = NULL,
    @BundleDescription TEXT          = NULL,
    @NewBundleID       INT           OUTPUT
)
AS 
BEGIN
	IF @BundleName IS NULL 
		THROW 51001, 'Bundle name need be provided', 1;

	IF EXISTS(SELECT 1 FROM Bundle WHERE bundlename = @BundleName)
        THROW 51002, 'Bundle with that name already exists.', 1;

	INSERT INTO Bundle (bundlename, bundletype, bundleprice,bundlescription)
	VALUES (@BundleName, @BundleType, @BundlePrice, @BundleDescription);

	SET @NewBundleID = SCOPE_IDENTITY();

	RETURN 0;
END

GRANT EXECUTE ON AddBundle TO ArcadeIQApp