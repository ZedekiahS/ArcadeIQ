CREATE PROCEDURE BuyBundle
    @UserID INT,
    @BundleName NVARCHAR(100)
AS
BEGIN

    DECLARE @BundleID INT;
    DECLARE @Price DECIMAL(10, 2);
    DECLARE @UserBalance DECIMAL(10, 2);

    BEGIN TRY
        BEGIN TRANSACTION;

        SELECT @BundleID = ID, @Price = bundleprice
        FROM Bundle
        WHERE BundleName = @BundleName;

        IF @BundleID IS NULL
            THROW 51000, 'Bundle not found.', 1;

        SELECT @UserBalance = Balance
        FROM [User]
        WHERE ID = @UserID;

        IF @UserBalance IS NULL
            THROW 51001, 'User not found.', 1;

        IF @UserBalance < @Price
            THROW 51002, 'Insufficient balance.', 1;

        UPDATE [User]
        SET Balance = Balance - @Price
        WHERE ID = @UserID;

        INSERT INTO UserHasGame (UserID, GameID)
        SELECT @UserID, ib.GameID
        FROM InBundle ib
        LEFT JOIN UserHasGame ug ON ug.UserID = @UserID AND ug.GameID = ib.GameID
        WHERE ib.BundleID = @BundleID AND ug.GameID IS NULL;

        COMMIT TRANSACTION;

        PRINT 'Bundle purchased and games registered.';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH
END;


