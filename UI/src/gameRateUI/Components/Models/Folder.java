package gameRateUI.Components.Models;

import java.sql.Date;

public class Folder {
    private final int id;
    private final String name;
    private final String description;
    private final boolean isPublic;
    private final Date createdDate;

    public Folder(int id, String name, String description, boolean isPublic, Date createdDate) {
        this.id           = id;
        this.name         = name;
        this.description  = description;
        this.isPublic     = isPublic;
        this.createdDate  = createdDate;
    }

    public int getId()                { return id; }
    public String getName()           { return name; }
    public String getDescription()    { return description; }
    public boolean isPublic()         { return isPublic; }
    public Date getCreatedDate() { return createdDate; }

    @Override
    public String toString() {
        return name + " (" + createdDate + ")";
    }
}
