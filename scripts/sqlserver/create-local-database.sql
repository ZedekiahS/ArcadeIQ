:setvar DB_NAME "ArcadeIQ"
:setvar APP_LOGIN "ArcadeIQApp"
:setvar APP_PASSWORD "change-me"

IF DB_ID(N'$(DB_NAME)') IS NULL
BEGIN
    DECLARE @createDbSql nvarchar(max) = N'CREATE DATABASE ' + QUOTENAME(N'$(DB_NAME)');
    EXEC sys.sp_executesql @createDbSql;
END
GO

USE [$(DB_NAME)];
GO

IF SUSER_ID(N'$(APP_LOGIN)') IS NULL
BEGIN
    DECLARE @createLoginSql nvarchar(max) =
        N'CREATE LOGIN ' + QUOTENAME(N'$(APP_LOGIN)') +
        N' WITH PASSWORD = ' + QUOTENAME(N'$(APP_PASSWORD)', '''') +
        N', CHECK_POLICY = OFF, CHECK_EXPIRATION = OFF';
    EXEC sys.sp_executesql @createLoginSql;
END
GO

IF USER_ID(N'$(APP_LOGIN)') IS NULL
BEGIN
    DECLARE @createUserSql nvarchar(max) =
        N'CREATE USER ' + QUOTENAME(N'$(APP_LOGIN)') +
        N' FOR LOGIN ' + QUOTENAME(N'$(APP_LOGIN)');
    EXEC sys.sp_executesql @createUserSql;
END
GO

ALTER ROLE db_datareader ADD MEMBER [$(APP_LOGIN)];
ALTER ROLE db_datawriter ADD MEMBER [$(APP_LOGIN)];
GO
