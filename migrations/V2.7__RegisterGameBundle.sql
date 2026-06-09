CREATE OR ALTER PROCEDURE RegisterGameBundle
(
    @BundleID INT,
    @GameID   INT
)
AS
BEGIN
    IF @BundleID IS NULL
        THROW 50011, 'BundleID must be provided.', 1;
    IF NOT EXISTS(SELECT 1 FROM Bundle WHERE ID = @BundleID)
        THROW 50013, 'Bundle does not exist.', 1;
    IF @GameID IS NULL
        THROW 50012, 'GameID must be provided.', 1;
    IF NOT EXISTS(SELECT 1 FROM Game WHERE ID = @GameID)
        THROW 50014, 'Game does not exist.', 1;

    IF EXISTS(
        SELECT 1
          FROM InBundle ib
         WHERE ib.BundleID = @BundleID
           AND ib.GameID   = @GameID
    )
        THROW 50015, 'Game already in bundle.', 1;

    INSERT INTO InBundle(BundleID, GameID)
    VALUES(@BundleID, @GameID);

    RETURN 0;
END
GO

GRANT EXECUTE ON RegisterGameBundle TO ArcadeIQApp;
GO
