CREATE TABLE Game (
    ID INT IDENTITY(0,1) PRIMARY KEY,
    [Name] VARCHAR(30) NOT NULL,
    Developer VARCHAR(30),
    Publisher VARCHAR(30),
    Price DECIMAL(10, 2),
    Realese_Date DATE
);

CREATE TABLE Tag (
    ID INT IDENTITY(0,1) PRIMARY KEY,
    TagName VARCHAR(30) NOT NULL,
    [Description] TEXT
);

CREATE TABLE Reviews (
    ReviewID INT IDENTITY(0,1) PRIMARY KEY,
    Content TEXT,
    Star INT CHECK (Star BETWEEN 1 AND 5),
    UserID INT,
    GameID INT,
    [Date] DATE,
    FOREIGN KEY (UserID) REFERENCES [User](ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (GameID) REFERENCES Game(ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE HasTag (
    GameID INT,
    TagID INT,
    PRIMARY KEY (GameID, TagID),
    FOREIGN KEY (GameID) REFERENCES Game(ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (TagID) REFERENCES Tag(ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Bundle (
    ID INT IDENTITY(0,1) PRIMARY KEY,
    bundlename VARCHAR(30),
    bundletype VARCHAR(10),
    bundleprice DECIMAL(10, 2),
    bundlescription TEXT
);

CREATE TABLE InBundle (
    BundleID INT,
    GameID INT,
    PRIMARY KEY (BundleID, GameID),
    FOREIGN KEY (BundleID) REFERENCES Bundle(ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (GameID) REFERENCES Game(ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Folder (
    ID INT IDENTITY(0,1) PRIMARY KEY,
    [Name] VARCHAR(30),
    [Description] TEXT,
    ispublic VARCHAR(3),
    createdate DATE
);

CREATE TABLE FavoriteGame (
    UserID INT,
    GameID INT,
    FolderID INT,
    note TEXT,
    PRIMARY KEY (UserID, GameID, FolderID),
    FOREIGN KEY (UserID) REFERENCES [User](ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (GameID) REFERENCES Game(ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (FolderID) REFERENCES Folder(ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);