package gameRateUI.Components.Models;

import java.math.BigDecimal;
import java.sql.Date;

public class GameInFolder {
    private final int id;
    private final String name;
    private final BigDecimal price;
    private final Date releaseDate;
    private final String note;

    public GameInFolder(int id, String name, BigDecimal price, Date releaseDate, String note) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.releaseDate = releaseDate;
        this.note = note;
    }

    public int getId()               { return id; }
    public String getName()          { return name; }
    public BigDecimal getPrice()     { return price; }
    public Date getReleaseDate()     { return releaseDate; }
    public String getNote()          { return note; }
}
