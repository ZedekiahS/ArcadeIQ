CREATE PROC GetBundlesView AS
BEGIN
SELECT * 
FROM BundlesView
END
GRANT EXEC ON GetBundlesView to ArcadeIQApp