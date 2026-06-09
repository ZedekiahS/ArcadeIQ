CREATE PROCEDURE PurchaseGameByName
    @Username NVARCHAR(100),
    @GameTitle NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @UserID INT;
        DECLARE @GameID INT;
        DECLARE @Balance DECIMAL(10, 2);
        DECLARE @Price DECIMAL(10, 2);

        SELECT @UserID = u.ID, @Balance = u.Balance
        FROM [User] u
        WHERE Username = @Username;

        IF @UserID IS NULL
        BEGIN
            ;THROW 50001, 'User not found.', 1;
        END

        SELECT @GameID = ID, @Price = Price
        FROM Game
        WHERE Game.[Name] = @GameTitle;

        IF @GameID IS NULL
        BEGIN
            ;THROW 50002, 'Game not found.', 1;
        END

        IF EXISTS (
            SELECT 1 FROM UserHasGame uhg
            WHERE uhg.UserID = @UserID AND uhg.GameID = @GameID
        )
        BEGIN
            ;THROW 50003, 'User already owns this game.', 1;
        END

        IF @Balance < @Price
        BEGIN
            ;THROW 50004, 'Insufficient balance.', 1;
        END

        UPDATE [User]
        SET Balance = Balance - @Price
        WHERE ID = @UserID;

        EXEC RegisterGameToUser @UserID, @gameID

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH
END;
