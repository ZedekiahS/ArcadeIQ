ALTER PROC [dbo].[GetGamesList](@NameFilter nvarchar(200), @HasReviews bit, @DevelopersInput DeveloperInputType READONLY, @TagsInput Tagstable READONLY, @MinPrice DECIMAL(10,2), @MaxPrice DECIMAL(10,2), @ReleaseStart DATE, @ReleaseEnd DATE)
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
	  AND
      (NOT EXISTS(SELECT 1 FROM @TagsInput) OR 
        NOT EXISTS(
            SELECT 1
            FROM @TagsInput ti
            WHERE ti.TagName NOT IN(
				SELECT TagName From Tag t JOIN HasTag ht ON ht.TagID = t.ID AND ht.GameID = g.ID
			)
		)
	  )
	  AND (@MinPrice   IS NULL OR g.Price >= @MinPrice)
      AND (@MaxPrice   IS NULL OR g.Price <= @MaxPrice)
      AND (@ReleaseStart IS NULL OR g.ReleaseDate >= @ReleaseStart)
      AND (@ReleaseEnd   IS NULL OR g.ReleaseDate <= @ReleaseEnd);
END
GO
GRANT EXEC ON dbo.GetAllTags TO ArcadeIQApp
Go