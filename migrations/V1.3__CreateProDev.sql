CREATE TABLE Producer (
	 ID int IDENTITY(0,1) PRIMARY KEY,
     [Name] varchar(30),
	 CONSTRAINT UQ_Prod UNIQUE([Name])
	 )


CREATE TABLE Developer (
	 ID int IDENTITY(0,1) PRIMARY KEY,
     [Name] varchar(30),
	 CONSTRAINT UQ_Dev UNIQUE([Name])
	 )