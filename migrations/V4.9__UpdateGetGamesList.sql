CREATE TYPE DeveloperInputType AS TABLE (
    Developer nvarchar(100)
);
GO
ALTER PROC [dbo].[GetGamesList](@NameFilter nvarchar(200), @HasReviews bit, @DevelopersInput DeveloperInputType READONLY)
AS
BEGIN
IF(@HasReviews is null)
	SET @HasReviews = 0

SELECT g.ID, g.[Name], g.Price, g.ReleaseDate
FROM Game g
WHERE (@NameFilter is null OR g.[Name] LIKE @NameFilter + '%')
	  AND 
	  (@HasReviews = 0 OR EXISTS(SELECT 1 FROM Reviews r WHERE r.GameID = g.ID))
      AND
      (NOT EXISTS(SELECT 1 FROM @DevelopersInput) OR 
        NOT EXISTS(
            SELECT 1
            FROM @DevelopersInput di
            WHERE di.Developer NOT IN(
                SELECT [Name] FROM Developer d JOIN Develops ds ON ds.DevID = d.ID AND ds.GameID = g.ID
            )
        )
      )
END