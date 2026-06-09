CREATE PROCEDURE GetGamesInBundle
@BundleID INT
AS
SELECT g.ID, g.[Name]
FROM Game g 
INNER JOIN InBundle ib ON g.ID = ib.GameID
WHERE ib.BundleID = @BundleID
