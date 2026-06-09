ALTER   PROCEDURE [dbo].[GetGameBasic]
    @GameID INT
AS
BEGIN
    SELECT
        g.Name,
        g.Price,
        g.ReleaseDate,
        g.[Description]
    FROM dbo.Game AS g
    WHERE g.ID = @GameID;
END;