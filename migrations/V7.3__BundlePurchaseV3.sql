ALTER PROCEDURE BuyBundle
    @UserID INT,
    @BundleName NVARCHAR(100)
AS
BEGIN
    DECLARE @BundleID INT;
    DECLARE @BundlePrice DECIMAL(10, 2);
    DECLARE @UserBalance DECIMAL(10, 2);
    DECLARE @Discount DECIMAL(10, 2) = 0;
    DECLARE @FinalPrice DECIMAL(10, 2);

    BEGIN TRY
        BEGIN TRANSACTION;

        SELECT @BundleID = ID, @BundlePrice = bundleprice
        FROM Bundle
        WHERE BundleName = @BundleName;

	IF NOT EXISTS (
    SELECT 1
    FROM InBundle ib
    WHERE ib.BundleID = @BundleID
    AND NOT EXISTS (
        SELECT 1
        FROM UserHasGame uhg
        WHERE uhg.UserID = @UserID
        AND uhg.GameID = ib.GameID
		)
	)
	BEGIN
    ;THROW 52003, 'User already owns all games in this bundle.', 1;
	END

        IF @BundleID IS NULL
            THROW 52000, 'Bundle not found.', 1;

        SELECT @UserBalance = Balance
        FROM [User]
        WHERE ID = @UserID;

        IF @UserBalance IS NULL
            THROW 52001, 'User not found.', 1;

        SELECT @Discount = ISNULL(SUM(0.10 * g.Price), 0)
        FROM InBundle ib
        JOIN Game g ON ib.GameID = g.ID
        JOIN UserHasGame uhg ON uhg.GameID = g.ID AND uhg.UserID = @UserID
        WHERE ib.BundleID = @BundleID;

        SET @FinalPrice = ROUND(@BundlePrice - @Discount, 2);

        IF @FinalPrice < 0 SET @FinalPrice = 0;

        IF @UserBalance < @FinalPrice
            THROW 52002, 'Insufficient balance after discount.', 1;

        UPDATE [User]
        SET Balance = Balance - @FinalPrice
        WHERE ID = @UserID;
        INSERT INTO UserHasGame (UserID, GameID)
        SELECT @UserID, ib.GameID
        FROM InBundle ib
        WHERE ib.BundleID = @BundleID
        AND NOT EXISTS (
            SELECT 1 FROM UserHasGame uhg
            WHERE uhg.UserID = @UserID AND uhg.GameID = ib.GameID
        );

        COMMIT TRANSACTION;
        PRINT 'Bundle purchased with discount for owned games.';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH
END;
