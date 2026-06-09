CREATE PROC GetCompanyName(@DevUsername varchar(30), @CompanyName nvarchar(100) output)
AS
BEGIN
	--Validate params
	IF(@DevUsername is null)
		THROW 52000, 'A developer username must be provided.', 1
	--Get dev user id
	DECLARE @UserID int
	EXEC GetUserID @DevUsername, 1, @UserID
	
	--Return the company name
	SET @CompanyName = (SELECT d.[Name] FROM DevUser du JOIN Developer d ON d.ID = du.DeveloperID WHERE du.ID = @UserID)
END