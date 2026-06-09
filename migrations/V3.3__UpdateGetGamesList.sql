ALTER PROC [dbo].[GetGamesList](@NameFilter nvarchar(200))
AS
BEGIN
SELECT g.ID, g.[Name], g.Price, g.ReleaseDate
FROM Game g
WHERE @NameFilter is null OR g.[Name] LIKE @NameFilter + '%'
END