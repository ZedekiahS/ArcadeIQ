CREATE OR ALTER VIEW GameInfo AS
SELECT g.Name AS Game, g.Price, g.ReleaseDate, d.Name AS Developer, p.Name AS Producer, t.TagName AS Tag
FROM Game g
JOIN Develops dvs ON dvs.GameID = g.ID
JOIN Developer d ON d.ID = dvs.DevID
JOIN Produces pds ON pds.GameID = g.ID
JOIN Producer p ON pds.ProID = p.ID
JOIN HasTag hs ON hs.GameID = g.ID
JOIN Tag t ON t.ID = hs.TagID