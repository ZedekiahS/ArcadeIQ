ALTER PROC [dbo].[GetGamesList](@NameFilter nvarchar(200), @HasReviews bit)
AS
BEGIN
IF(@HasReviews is null)
	SET @HasReviews = 0
SELECT g.ID, g.[Name], g.Price, g.ReleaseDate
FROM Game g
WHERE (@NameFilter is null OR g.[Name] LIKE @NameFilter + '%')
	  AND 
	  (@HasReviews = 0 OR EXISTS(SELECT 1 FROM Reviews r WHERE r.GameID = g.ID))
END