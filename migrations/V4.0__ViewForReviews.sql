CREATE VIEW GameReviews AS
SELECT r.ReviewID, r.Star, r.Content as [Review Content], r.[Date] as [Review Date], g.ID as [Game ID], u.Username
FROM Reviews r
JOIN Game g ON g.ID = r.GameID
JOIN [User] u ON u.ID = r.UserID