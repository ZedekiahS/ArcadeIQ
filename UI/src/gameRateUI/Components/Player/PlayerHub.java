package gameRateUI.Components.Player;

import javax.swing.*;
import javax.swing.event.DocumentEvent;
import javax.swing.event.DocumentListener;
import javax.swing.event.ListSelectionEvent;
import javax.swing.event.ListSelectionListener;
import javax.swing.table.DefaultTableModel;
import javax.swing.text.DateFormatter;
import javax.swing.text.DefaultFormatterFactory;

import com.microsoft.sqlserver.jdbc.SQLServerCallableStatement;
import com.microsoft.sqlserver.jdbc.SQLServerDataTable;

import java.awt.*;
import java.awt.event.*;
import java.math.BigDecimal;
import java.sql.*;
import java.text.DateFormat;
import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.Set;
import java.util.LinkedHashSet;
import java.util.List;
import javax.swing.text.DateFormatter;
import javax.swing.text.DefaultFormatterFactory;
import java.text.SimpleDateFormat;

import gameRateUI.Components.Models.Folder;
import gameRateUI.Components.Models.GameInFolder;
import gameRateUI.Components.Reviews.ReviewWindow;
import gameRateUI.Services.DataBaseService;

public class PlayerHub extends JFrame {
    private final DataBaseService dbService;
    private final String playerUsername;

    public PlayerHub(DataBaseService dbService, String playerUsername, JFrame parent) {
        //Init window vars
        this.dbService = dbService;
        this.playerUsername = playerUsername;
        //Window setup
        setTitle("Player Hub");
        setSize(600, 475);
        setLocationRelativeTo(parent);
        setDefaultCloseOperation(DISPOSE_ON_CLOSE);

        //Window close behavior
        addWindowListener(new WindowAdapter() {
            @Override
            public void windowClosing(WindowEvent e) {
                parent.setVisible(true);
            }
        });

        //Add tabs
        JTabbedPane tabs = new JTabbedPane();
        tabs.addTab("All Games", createGameScrollPane(tabs, playerUsername));
        tabs.addTab("My Inventory", createInventoryPanel());
        tabs.addTab("Available Bundles", createBundlesPanel());
        tabs.addTab("Folders", createFoldersPanel());
        //tabs.addTab("Game Details", createGameDetailsPanel(0,playerUsername));
        add(tabs, BorderLayout.CENTER);

        //Show the frame
        setVisible(true);
    }

    private JPanel createBundlesPanel() {
        JPanel panel = new JPanel(new BorderLayout());

        String[] columnNames = {"Bundle Name", "Price", "Description", "Type", "ID"};
        DefaultTableModel tableModel = new DefaultTableModel(columnNames, 0) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false; // Prevent editing for all cells
            }
        };
        JTable table = new JTable(tableModel);
        JScrollPane scrollPane = new JScrollPane(table);
        panel.add(scrollPane, BorderLayout.CENTER);
        
        table.addMouseListener(new MouseAdapter() {
            @Override
            public void mouseClicked(MouseEvent e) {
                int row = table.rowAtPoint(e.getPoint());
                if (row >= 0) {
                    // Extract bundle info from the selected row
                    String bundleName = table.getValueAt(row, 0).toString();
                    int bundleId = (int) table.getValueAt(row, 4);

                    // Show the bundle details page/panel
                    showBundleDetails(playerUsername, false, bundleId, bundleName);
                }
            }
        });
        
     // Refresh Button
        JButton refreshButton = new JButton("Refresh");
        refreshButton.addActionListener(e -> loadBundles(tableModel));

        // Top panel for controls
        JPanel botPanel = new JPanel(new FlowLayout(FlowLayout.CENTER));
        botPanel.add(refreshButton);
        
     // Username label at top-left
        JLabel usernameLabel = new JLabel(playerUsername);
        usernameLabel.setFont(new Font("SansSerif", Font.BOLD, 12));
        JPanel topPanel = new JPanel(new FlowLayout(FlowLayout.LEFT));
        topPanel.add(usernameLabel);
        panel.add(topPanel, BorderLayout.NORTH);

        panel.add(botPanel, BorderLayout.SOUTH);
        panel.add(scrollPane, BorderLayout.CENTER);

        // Initial data load
        //loadBundles(tableModel);

        try (CallableStatement stmt = dbService.getConnection().prepareCall("{call GetBundlesView}")) {
            boolean hasResults = stmt.execute();
            if (hasResults) {
                try (ResultSet rs = stmt.getResultSet()) {
                    while (rs.next()) {
                        String name = rs.getString("bundlename");
                        double price = rs.getDouble("bundleprice");
                        String description = rs.getString("bundlescription");
                        String type = rs.getString("bundletype");
                        int id = rs.getInt("ID");

                        Object[] row = {name, price, description, type, id};
                        tableModel.addRow(row);
                    }
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
            JOptionPane.showMessageDialog(panel, "Error loading bundles: " + e.getMessage(), "Database Error", JOptionPane.ERROR_MESSAGE);
        }

        return panel;
    }
    
    private void showBundleDetails(String username, boolean isDev, int bundleId, String bundleName) {
        JDialog detailsDialog = new JDialog((Frame) null, "Bundle Details", true);
        detailsDialog.setSize(400, 400);
        detailsDialog.setLocationRelativeTo(null);

        JPanel panel = new JPanel(new BorderLayout());

        JLabel titleLabel = new JLabel("Bundle: " + bundleName);
        titleLabel.setFont(new Font("SansSerif", Font.BOLD, 16));
        panel.add(titleLabel, BorderLayout.NORTH);

        String[] gameColumns = {"Game ID", "Game Name"};
        DefaultTableModel gamesModel = new DefaultTableModel(gameColumns, 0) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false;
            }
        };
        JTable gamesTable = new JTable(gamesModel);
        panel.add(new JScrollPane(gamesTable), BorderLayout.CENTER);

        // Load games from stored proc
        try (CallableStatement stmt = dbService.getConnection().prepareCall("{call GetGamesInBundle(?)}")) {
            stmt.setInt(1, bundleId);
            boolean hasResults = stmt.execute();

            if (hasResults) {
                try (ResultSet rs = stmt.getResultSet()) {
                    while (rs.next()) {
                        int gameId = rs.getInt("ID");
                        String gameName = rs.getString("Name");
                        gamesModel.addRow(new Object[]{gameId, gameName});
                    }
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
            JOptionPane.showMessageDialog(panel, "Error loading games: " + e.getMessage(), "Database Error", JOptionPane.ERROR_MESSAGE);
        }

        JButton purchaseButton = new JButton("Purchase Bundle");
        purchaseButton.addActionListener(ev -> {
            try {
                int userId = getUserIdFromUsername(username, isDev);
                purchaseBundle(userId, bundleName);
                JOptionPane.showMessageDialog(detailsDialog, "Purchase successful!", "Success", JOptionPane.INFORMATION_MESSAGE);
                detailsDialog.dispose();
            } catch (Exception ex) {
                ex.printStackTrace();
                JOptionPane.showMessageDialog(detailsDialog, "Purchase failed: " + ex.getMessage(), "Error", JOptionPane.ERROR_MESSAGE);
            }
        });

        JPanel bottomPanel = new JPanel();
        bottomPanel.add(purchaseButton);
        panel.add(bottomPanel, BorderLayout.SOUTH);

        detailsDialog.setContentPane(panel);
        detailsDialog.setVisible(true);
    }

    
    
    
    private void loadBundles(DefaultTableModel tableModel) {
        // Clear existing data
        tableModel.setRowCount(0);

        try (CallableStatement stmt = dbService.getConnection().prepareCall("{call GetBundlesView}")) {
            boolean hasResults = stmt.execute();
            if (hasResults) {
                try (ResultSet rs = stmt.getResultSet()) {
                    while (rs.next()) {
                        String name = rs.getString("bundlename");
                        double price = rs.getDouble("bundleprice");
                        String description = rs.getString("bundlescription");
                        String type = rs.getString("bundletype");
                        int id = rs.getInt("ID");

                        Object[] row = {name, price, description, type, id};
                        tableModel.addRow(row);
                    }
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
            JOptionPane.showMessageDialog(null, "Error loading bundles: " + e.getMessage(), "Database Error", JOptionPane.ERROR_MESSAGE);
        }
    }

    private void purchaseBundle(int userId, String bundleName) throws SQLException {
        try (CallableStatement stmt = dbService.getConnection().prepareCall("{call BuyBundle(?, ?)}")) {
            stmt.setInt(1, userId);
            stmt.setString(2, bundleName);
            stmt.execute();
        }
    }
    
    private int getUserIdFromUsername(String username, boolean isDev) throws SQLException {
        try (CallableStatement stmt = dbService.getConnection().prepareCall("{call GetUserID(?, ?, ?)}")) {
            stmt.setString(1, username);
            stmt.setBoolean(2, isDev);
            stmt.registerOutParameter(3, Types.INTEGER); // @UserID OUTPUT

            stmt.execute();
            return stmt.getInt(3);
        }
    }

	private JPanel createInventoryPanel() {
    	JPanel panel = new JPanel(new BorderLayout());

        // Username label at top-left
        JLabel usernameLabel = new JLabel(playerUsername);
        usernameLabel.setFont(new Font("SansSerif", Font.BOLD, 12));
        JPanel topPanel = new JPanel(new FlowLayout(FlowLayout.LEFT));
        topPanel.add(usernameLabel);
        panel.add(topPanel, BorderLayout.NORTH);

        // Column names (UserID and Username removed)
        String[] columnNames = {"GameID", "Game Title", "Price", "Release Date"};
        DefaultTableModel tableModel = new DefaultTableModel(columnNames, 0) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false;
            }
        };

        JTable table = new JTable(tableModel);
        table.setFillsViewportHeight(true);
        table.setAutoResizeMode(JTable.AUTO_RESIZE_ALL_COLUMNS);

        JScrollPane scrollPane = new JScrollPane(table);
        panel.add(scrollPane, BorderLayout.CENTER);

        // Auto-resize row height when resized
        scrollPane.addComponentListener(new ComponentAdapter() {
            @Override
            public void componentResized(ComponentEvent e) {
                resizeRowHeights(table, scrollPane.getViewport().getHeight());
            }
        });

        // Refresh button
        JButton refreshButton = new JButton("Refresh");
        JPanel bottomPanel = new JPanel(new FlowLayout(FlowLayout.CENTER));
        bottomPanel.add(refreshButton);
        panel.add(bottomPanel, BorderLayout.SOUTH);

        // Load data
        refreshButton.addActionListener(e -> {
            tableModel.setRowCount(0); // Clear table
            try (CallableStatement stmt = dbService.getConnection().prepareCall("{call GetUserInventory(?)}")) {
                stmt.setString(1, playerUsername);

                boolean hasResult = stmt.execute();
                if (hasResult) {
                    try (ResultSet rs = stmt.getResultSet()) {
                        while (rs.next()) {
                            Object[] row = {
                                rs.getInt("GameID"),
                                rs.getString("GameTitle"),
                                String.format("$%.2f", rs.getFloat("Price")),
                                rs.getDate("ReleaseDate")
                            };
                            tableModel.addRow(row);
                        }
                        resizeRowHeights(table, scrollPane.getViewport().getHeight()); // Adjust row heights after loading
                    }
                }
            } catch (SQLException ex) {
                ex.printStackTrace();
                JOptionPane.showMessageDialog(panel, "Error loading inventory: " + ex.getMessage(), "Database Error", JOptionPane.ERROR_MESSAGE);
            }
        });

        refreshButton.doClick(); // Auto-load

        return panel;

    }
    
 // Helper to resize rows based on available height
    private void resizeRowHeights(JTable table, int availableHeight) {
        int rowCount = table.getRowCount();
        if (rowCount > 0) {
            int newRowHeight = Math.max(25, availableHeight / rowCount); // 25 is a sane minimum
            table.setRowHeight(newRowHeight);
        }
    }

    public static void populateTable(DefaultTableModel table, ResultSet results) {
        //Iterate over games and add to table
        try {
            while(results.next()) {
                table.addRow(new Object[]{results.getString("ID"), results.getString("Name"), 
                "$" + String.format("%.2f", results.getFloat("Price")), results.getDate("ReleaseDate")});
            }
        } catch(SQLException e) {

        }
    }

    //Utility to update games based on filtering
    // private void updateGameList(DefaultTableModel tableModel, JTextField searchField, JCheckBox reviewsCheckBox) {
    //     String searchName = searchField.getText();
    //     boolean hasReviews = reviewsCheckBox.isSelected();
        
    //     // Call the filtering method to update the table
    //     filterGamesList(tableModel, searchName, hasReviews, null, null);
    // }
    private void updateGameList(DefaultTableModel tableModel,
                            JTextField searchField,
                            JCheckBox reviewsCheckBox, String[] developers,
                            String[] tags, String[] producers,BigDecimal minPrice, BigDecimal maxPrice, Date releaseStart, Date releaseEnd) {
    String searchName = searchField.getText();
    boolean hasReviews = reviewsCheckBox.isSelected();
    filterGamesList(tableModel, searchName, hasReviews, developers, tags, producers, minPrice, maxPrice, releaseStart, releaseEnd);
    }

    //Utility to filter games
    private void filterGamesList(DefaultTableModel tableModel, String searchName, boolean hasReviews, String[] developers, String[] Tags, String[] producers, BigDecimal minPrice, BigDecimal maxPrice, Date releaseStart, Date releaseEnd) {
        //Clear the model
        tableModel.setRowCount(0);
        //Get new results and populate
        populateTable(tableModel, getGames(dbService, searchName, hasReviews, developers, Tags, producers, minPrice, maxPrice, releaseStart, releaseEnd));
    }

    //Get games based on filter from DB
    public static ResultSet getGames(DataBaseService dbService, String searchName, boolean hasReviews, String[] developers, String[] Tags, String[] producers, BigDecimal minPrice, BigDecimal maxPrice, Date releaseStart, Date releaseEnd) {
        String query = "{call GetGamesList(?, ?, ?, ?, ?, ?, ?, ?, ?)}";
        try {
            SQLServerCallableStatement call = (SQLServerCallableStatement) dbService.getConnection().prepareCall(query);
            if(searchName.isBlank()) searchName = null;
            call.setString(1, searchName);
            call.setBoolean(2,hasReviews);
            //Create input table
            SQLServerDataTable developersInput = new SQLServerDataTable();
            developersInput.addColumnMetadata("Developer", Types.NVARCHAR);
            if(developers != null) {
                for(String developer : developers) {
                    developersInput.addRow(developer);
                }
            }
            call.setStructured(3, "DeveloperInputType", developersInput);
            //Create tag table
            SQLServerDataTable Taginput = new SQLServerDataTable();
            Taginput.addColumnMetadata("TagName", Types.NVARCHAR);
            if(Tags != null) {
                for(String Tag : Tags) {
                    Taginput.addRow(Tag);
                }
            }
            call.setStructured(4, "Tagstable", Taginput);

            SQLServerDataTable prodInput = new SQLServerDataTable();
            prodInput.addColumnMetadata("ProducerName", Types.NVARCHAR);
            if (producers != null) {
                for (String p : producers) prodInput.addRow(p);
            }
            call.setStructured(5, "ProducerInputT", prodInput);
            if (minPrice != null) call.setBigDecimal(6, minPrice);
            else                  call.setNull(6, Types.DECIMAL);
            if (maxPrice != null) call.setBigDecimal(7, maxPrice);
            else                  call.setNull(7, Types.DECIMAL);
            if (releaseStart != null) call.setDate(8, releaseStart);
            else                      call.setNull(8, Types.DATE);
            if (releaseEnd != null)   call.setDate(9, releaseEnd);
            else                      call.setNull(9, Types.DATE);
            ResultSet results = call.executeQuery();
            return results;
        } catch(SQLException e) {
            JOptionPane.showMessageDialog(null, "Could not filter games: " + e.getMessage(), "Database Error", JOptionPane.ERROR_MESSAGE);
            return null;
        }
        
    };

    private JScrollPane createGameScrollPane(JTabbedPane tabs, String username) {
        String[] columns = {"ID", "Name", "Price", "Release Date"};
        //Create the outer panel with centered content
        JPanel gamesList = new JPanel(new FlowLayout(FlowLayout.CENTER,0,0));
        gamesList.setFocusable(true);

        //Create inner panel with left-aligned content
        JPanel inner = new JPanel();
        inner.setFocusable(true);
        inner.setLayout(new BoxLayout(inner, BoxLayout.Y_AXIS));
        inner.setBorder(BorderFactory.createEmptyBorder(10,10,10,10));

        //Create header with refresh, search, and title
        JPanel header = new JPanel();
        header.setLayout(new BoxLayout(header, BoxLayout.X_AXIS));
        header.setAlignmentX(Component.LEFT_ALIGNMENT);
        // Create title label
        JLabel gamesLabel = new JLabel("Available games");
        header.add(gamesLabel);
        //Small gap
        header.add(Box.createHorizontalGlue());
        //Search field
        JTextField searchField = new JTextField() {
            @Override
            protected void paintComponent(Graphics g) {
                super.paintComponent(g);
                if (getText().isEmpty() && !hasFocus()) {
                    Graphics2D g2 = (Graphics2D) g.create();
                    g2.setColor(Color.GRAY);
                    Insets ins = getInsets();
                    FontMetrics fm = g2.getFontMetrics();
                    int x = ins.left;
                    int y = getHeight() / 2 + fm.getAscent() / 2 - 2;
                    g2.drawString("Search by name...", x, y);
                    g2.dispose();
                }
            }
        };
        searchField.setPreferredSize(new Dimension(200,20));
        searchField.setMaximumSize(searchField.getPreferredSize());
        searchField.setToolTipText("Filter games by name…");
        header.add(searchField);
        //Create refresh button
        header.add(Box.createHorizontalGlue()); //push to right
        JButton refreshButton = new JButton("Refresh");
        refreshButton.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                tabs.setComponentAt(0, createGameScrollPane(tabs, playerUsername));
            }
        });
        JButton voucherBtn = new JButton("Redeem a voucher");
        voucherBtn.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                new RedeemVoucher(dbService, username);
            }    
        });

        header.add(refreshButton);
        header.add(voucherBtn);
        inner.add(header);

        //Create table
        DefaultTableModel tableModel = new DefaultTableModel(columns, 0) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false;    // all cells non-editable
            }  
        };
        JTable gamesTable = new JTable(tableModel);
        gamesTable.addMouseListener(new MouseAdapter() {
            @Override
            public void mouseClicked(MouseEvent e) {
                int row = gamesTable.rowAtPoint(e.getPoint());
                if (row >= 0) {
                    //Get game info from clicked row
                    int idColumnIndex = gamesTable.getColumnModel().getColumnIndex("ID");
                    int nameColumnIndex = gamesTable.getColumnModel().getColumnIndex("Name");
                    int gameId = Integer.parseInt(tableModel.getValueAt(row, idColumnIndex).toString());
                    String gameName = tableModel.getValueAt(row, nameColumnIndex).toString();

                    //Take to the details tab
                    if(tabs.getTabCount() == 5) {
                        tabs.remove(4);
                    }
                    tabs.addTab("Details For " + gameName, createGameDetailsPanel(gameId, playerUsername));
                    tabs.setSelectedIndex(4);
                }
            }
        });
        gamesTable.addMouseMotionListener(new MouseMotionAdapter() {
            @Override
            public void mouseMoved(MouseEvent e) {
                int row = gamesTable.rowAtPoint(e.getPoint());
                if (row >= 0) {
                    gamesTable.setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
                } else {
                    gamesTable.setCursor(Cursor.getDefaultCursor());
                }
            }
        });

        //Add table to scroll pane
        JScrollPane scrollPane = new JScrollPane(gamesTable);
        scrollPane.setPreferredSize(new Dimension(400, 325));

        //Add scroll pane to inner
        scrollPane.setAlignmentX(Component.LEFT_ALIGNMENT); 
        inner.add(Box.createVerticalStrut(5));
        inner.add(scrollPane);

        // Add checkbox below the table scroll pane on the left side
        JCheckBox reviewsCheckBox = new JCheckBox("Has reviews?");
        inner.add(Box.createVerticalStrut(5));
        inner.add(reviewsCheckBox);

        JPanel pricePanel = new JPanel(new FlowLayout(FlowLayout.LEFT));
        pricePanel.setAlignmentX(Component.LEFT_ALIGNMENT);
        pricePanel.add(new JLabel("Min Price:"));
        JFormattedTextField minPriceField =
            new JFormattedTextField(NumberFormat.getNumberInstance());
        minPriceField.setColumns(6);
        pricePanel.add(minPriceField);
        pricePanel.add(new JLabel("Max Price:"));
        JFormattedTextField maxPriceField =
            new JFormattedTextField(NumberFormat.getNumberInstance());
        maxPriceField.setColumns(6);
        pricePanel.add(maxPriceField);
        inner.add(Box.createVerticalStrut(5));
        inner.add(pricePanel);

        JPanel datePanel = new JPanel(new FlowLayout(FlowLayout.LEFT));
        datePanel.setAlignmentX(Component.LEFT_ALIGNMENT);

        datePanel.add(new JLabel("Release after"));
        JFormattedTextField startDateField = new JFormattedTextField();
        startDateField.setFormatterFactory(new DefaultFormatterFactory(
            new DateFormatter(new SimpleDateFormat("MM/dd/yyyy"))
        ));
        startDateField.setColumns(8);
        startDateField.setToolTipText("MM/dd/yyyy");
        datePanel.add(startDateField);

        datePanel.add(new JLabel("Release before"));
        JFormattedTextField endDateField = new JFormattedTextField();
        endDateField.setFormatterFactory(new DefaultFormatterFactory(
            new DateFormatter(new SimpleDateFormat("MM/dd/yyyy"))
        ));
        endDateField.setColumns(8);
        endDateField.setToolTipText("MM/dd/yyyy");
        datePanel.add(endDateField);

        inner.add(Box.createVerticalStrut(5));
        inner.add(datePanel);

                JPanel tagChipsPanel = new JPanel(new FlowLayout(FlowLayout.LEFT, 5, 0));
        tagChipsPanel.setAlignmentX(Component.LEFT_ALIGNMENT);

        JPanel devChipsPanel = new JPanel(new FlowLayout(FlowLayout.LEFT, 5, 0));
        devChipsPanel.setAlignmentX(Component.LEFT_ALIGNMENT);

        JPanel prodChipsPanel = new JPanel(new FlowLayout(FlowLayout.LEFT, 5, 0));
        prodChipsPanel.setAlignmentX(Component.LEFT_ALIGNMENT);
        
        Set<String> selectedTags = new LinkedHashSet<>();
        Set<String> selectedDevelopers = new LinkedHashSet<>();
        Set<String> selectedProducers  = new LinkedHashSet<>();
        Runnable doFilter = () -> {
            String searchName  = searchField.getText();
            boolean hasReviews = reviewsCheckBox.isSelected();
            String[] devArray  = selectedDevelopers.isEmpty()
                        ? null
                        : selectedDevelopers.toArray(new String[0]);
            String[] tagsArray = selectedTags.isEmpty()
                         ? null
                         : selectedTags.toArray(new String[0]);

            String[] prodArray = selectedProducers.isEmpty()
                        ? null
                        : selectedProducers.toArray(new String[0]);
            BigDecimal minPrice = null, maxPrice = null;
            try {
                String t = minPriceField.getText().trim();
                if (!t.isEmpty()) minPrice = new BigDecimal(t);
                t = maxPriceField.getText().trim();
                if (!t.isEmpty()) maxPrice = new BigDecimal(t);
            } catch (NumberFormatException ex) {
                ex.getStackTrace();
            }
            Date releaseStart = null, releaseEnd = null;
            try {
                DateTimeFormatter dtf = DateTimeFormatter.ofPattern("MM/dd/yyyy");
                String s = startDateField.getText().trim();
                if (!s.isEmpty())
                    releaseStart = Date.valueOf(LocalDate.parse(s, dtf));
                s = endDateField.getText().trim();
                if (!s.isEmpty())
                    releaseEnd   = Date.valueOf(LocalDate.parse(s, dtf));
            } catch (Exception ex) {
                ex.getStackTrace();
            }
            filterGamesList(tableModel, searchName, hasReviews, devArray, tagsArray, prodArray, minPrice,maxPrice,releaseStart,releaseEnd);
        };

        minPriceField.getDocument()
                     .addDocumentListener(new SimpleDocListener(doFilter));
        maxPriceField.getDocument()
                     .addDocumentListener(new SimpleDocListener(doFilter));
        startDateField.getDocument()
                      .addDocumentListener(new SimpleDocListener(doFilter));
        endDateField.getDocument()
                    .addDocumentListener(new SimpleDocListener(doFilter));


        //Selected tags display (chips)

        //Actual dropdown
        JButton tagDropdownButton = new JButton("Select Tags ▾");
        tagDropdownButton.setAlignmentX(Component.LEFT_ALIGNMENT);

        //Dropdown body
        JPanel tagMenuPanel = new JPanel();
        tagMenuPanel.setLayout(new BoxLayout(tagMenuPanel, BoxLayout.Y_AXIS));
        List<String> allTags = dbService.getAllTags();
        for (String tag : allTags) {
            JCheckBoxMenuItem mi = new JCheckBoxMenuItem(tag);
            tagMenuPanel.add(mi);
            mi.addActionListener(e -> {
                if (mi.isSelected()) selectedTags.add(tag);
                else                 selectedTags.remove(tag);
                updateChipsPanel(tagChipsPanel, tagMenuPanel, selectedTags, doFilter);
                doFilter.run();
            });
        }

        //Make dropdown scrollable
        JScrollPane menuScroll = new JScrollPane(tagMenuPanel);
        menuScroll.setBorder(null);
        menuScroll.setPreferredSize(new Dimension(200, Math.min(allTags.size() * 20, 300)));
        menuScroll.setFocusable(true);

        //Add scroller to the dialog
        JDialog tagDialog = new JDialog((Frame) null, false); // modeless, undecorated popup
        tagDialog.setUndecorated(true);
        tagDialog.getContentPane().add(menuScroll);
        tagDialog.pack();
        tagDialog.setFocusableWindowState(false); // prevents it from stealing focus

        //Toggle body visibility when clicking button
        tagDropdownButton.addActionListener(e -> {
            if (tagDialog.isVisible()) {
                tagDialog.setVisible(false);
            } else {
                Point location = tagDropdownButton.getLocationOnScreen();
                tagDialog.setLocation(location.x, location.y + tagDropdownButton.getHeight());
                tagDialog.setVisible(true);
            }
        });
        
        inner.add(Box.createVerticalStrut(5));
        inner.add(new JLabel("Filter by Tags:"));
        inner.add(tagDropdownButton);
        inner.add(tagChipsPanel);

        searchField.getDocument().addDocumentListener(new SimpleDocListener(doFilter));
        reviewsCheckBox.addActionListener(e -> doFilter.run());

        JPanel devMenuPanel = new JPanel();
        devMenuPanel.setLayout(new BoxLayout(devMenuPanel, BoxLayout.Y_AXIS));
        for (String dev : dbService.getAllDevelopers()) {
            JCheckBoxMenuItem mi = new JCheckBoxMenuItem(dev);
            devMenuPanel.add(mi);
            mi.addActionListener(e -> {
                if (mi.isSelected()) selectedDevelopers.add(dev);
                else                 selectedDevelopers.remove(dev);
                updateChipsPanel(devChipsPanel, devMenuPanel, selectedDevelopers, doFilter);
                doFilter.run();
            });
        }
        JScrollPane devScrollPane = new JScrollPane(devMenuPanel);
        devScrollPane.setPreferredSize(new Dimension(200, Math.min(dbService.getAllDevelopers().size() * 20, 300)));
        JDialog devDialog = new JDialog(PlayerHub.this, false);
        devDialog.setUndecorated(true);
        devDialog.getContentPane().add(devScrollPane);
        devDialog.pack();  

        JButton devDropdownButton = new JButton("Select Developers ▾");
        devDropdownButton.setAlignmentX(Component.LEFT_ALIGNMENT);
        devDropdownButton.addActionListener(e -> {
            if (devDialog.isVisible()) devDialog.setVisible(false);
            else {
                Point p = devDropdownButton.getLocationOnScreen();
                devDialog.setLocation(p.x, p.y + devDropdownButton.getHeight());
                devDialog.setVisible(true);
            }
        });
        inner.add(Box.createVerticalStrut(5));
        inner.add(new JLabel("Filter by Developers:"));
        inner.add(devDropdownButton);
        inner.add(devChipsPanel);


        JPanel prodMenuPanel = new JPanel();
        prodMenuPanel.setLayout(new BoxLayout(prodMenuPanel, BoxLayout.Y_AXIS));
        for (String prod : dbService.getAllProducers()) {
            JCheckBoxMenuItem mi = new JCheckBoxMenuItem(prod);
            prodMenuPanel.add(mi);
            mi.addActionListener(e -> {
                if (mi.isSelected()) selectedProducers.add(prod);
                else                  selectedProducers.remove(prod);
                updateChipsPanel(prodChipsPanel, prodMenuPanel, selectedProducers, doFilter);
                doFilter.run();
            });
        }
        JScrollPane prodScrollPane = new JScrollPane(prodMenuPanel);
        prodScrollPane.setPreferredSize(new Dimension(200, Math.min(dbService.getAllProducers().size() * 20, 300)));

        JDialog prodDialog = new JDialog(PlayerHub.this, false);
        prodDialog.setUndecorated(true);
        prodDialog.getContentPane().add(prodScrollPane);
        prodDialog.pack();

        JButton prodDropdownButton = new JButton("Select Producers ▾");
        prodDropdownButton.setAlignmentX(Component.LEFT_ALIGNMENT);
        prodDropdownButton.addActionListener(e -> {
            if (prodDialog.isVisible()) prodDialog.setVisible(false);
            else {
                Point p = prodDropdownButton.getLocationOnScreen();
                prodDialog.setLocation(p.x, p.y + prodDropdownButton.getHeight());
                prodDialog.setVisible(true);
            }
        });

        inner.add(Box.createVerticalStrut(5));
        inner.add(new JLabel("Filter by Producers:"));
        inner.add(prodDropdownButton);
        inner.add(prodChipsPanel);

        //Populate initial games
        //updateGameList(tableModel, searchField, reviewsCheckBox);
        updateChipsPanel(tagChipsPanel, tagMenuPanel, selectedTags, doFilter);
        updateChipsPanel(devChipsPanel, devMenuPanel, selectedDevelopers, doFilter);
        updateChipsPanel(prodChipsPanel, prodMenuPanel, selectedProducers, doFilter);
        doFilter.run();
        //Create outer
        gamesList.add(inner);

        //Add outer to a scroll pane
        JScrollPane scrollablePanel = new JScrollPane(gamesList);
        scrollablePanel.setBorder(BorderFactory.createEmptyBorder()); // optional: remove border
        scrollablePanel.getVerticalScrollBar().setUnitIncrement(16); // smoother scrolling
        return scrollablePanel;
    }

     private void updateChipsPanel(JPanel ChipsPanel,
                                 JPanel MenuPanel,
                                 Set<String> selectedTags,Runnable doFilter) {ChipsPanel.removeAll();
        for (String tag : selectedTags) {
            JPanel chip = new JPanel(new BorderLayout(4,0));
            chip.setBorder(BorderFactory.createLineBorder(Color.GRAY,1,true));
            JLabel lbl = new JLabel(tag);
            JButton close = new JButton("×");
            close.setMargin(new Insets(0,0,0,0));
            close.setBorder(null);
            close.setContentAreaFilled(false);
            close.addActionListener(e -> {
                selectedTags.remove(tag);
                for (Component c : MenuPanel.getComponents()) {
                    if (c instanceof JCheckBoxMenuItem mi && mi.getText().equals(tag)) {
                        mi.setSelected(false);
                        break;
                    }
                }
                updateChipsPanel(ChipsPanel, MenuPanel, selectedTags, doFilter);
                doFilter.run();
            });
            chip.add(lbl, BorderLayout.CENTER);
            chip.add(close, BorderLayout.EAST);
            ChipsPanel.add(chip);
        }
        ChipsPanel.revalidate();
        ChipsPanel.repaint();
    }


    private JPanel createGameDetailsPanel(int GameID, String username) {
        String basicProc = "{ call dbo.GetGameBasic(?) }";
        String devProc   = "{ call dbo.GetGameDevelopers(?) }";
        String prodProc  = "{ call dbo.GetGameProducers(?) }";
        String tagProc   = "{ call dbo.GetGameTags(?) }";
    
        JPanel panel = new JPanel(new BorderLayout());
        panel.setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));

        JLabel titleLabel = new JLabel("", SwingConstants.CENTER);
        titleLabel.setFont(new Font("Arial", Font.BOLD, 18));
        panel.add(titleLabel, BorderLayout.NORTH);

        JPanel inner = new JPanel();
        inner.setLayout(new BoxLayout(inner, BoxLayout.Y_AXIS));
        inner.setBorder(BorderFactory.createEmptyBorder(5, 5, 5, 5));

        String[] gameName    = {""};
        String price       = "";
        String releaseDate = "";
        List<String> developers = new ArrayList<>();
        List<String> producers  = new ArrayList<>();
        List<String> tags       = new ArrayList<>();

        try {
            Connection conn = dbService.getConnection();

            try (CallableStatement cs = conn.prepareCall(basicProc)) {
                cs.setInt(1, GameID);
                try (ResultSet rs = cs.executeQuery()) {
                    if (rs.next()) {
                        gameName[0]    = rs.getString("Name");
                        price       = rs.getBigDecimal("Price").toString();
                        releaseDate = rs.getDate("ReleaseDate").toString();
                    }
                }
            }

            try (CallableStatement cs = conn.prepareCall(devProc)) {
                cs.setInt(1, GameID);
                try (ResultSet rs = cs.executeQuery()) {
                    while (rs.next()) {
                        developers.add(rs.getString("Developer"));
                    }
                }
            }

            try (CallableStatement cs = conn.prepareCall(prodProc)) {
                cs.setInt(1, GameID);
                try (ResultSet rs = cs.executeQuery()) {
                    while (rs.next()) {
                        producers.add(rs.getString("Producer"));
                    }
                }
            }

            try (CallableStatement cs = conn.prepareCall(tagProc)) {
                cs.setInt(1, GameID);
                try (ResultSet rs = cs.executeQuery()) {
                    while (rs.next()) {
                        tags.add(rs.getString("Tag"));
                    }
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        titleLabel.setText(gameName[0].isEmpty() ? "Unknown Game" : gameName[0]);

        inner.add(new JLabel("Price: $" + price));
        inner.add(Box.createVerticalStrut(5));
        inner.add(new JLabel("Release Date: " + releaseDate));
        inner.add(Box.createVerticalStrut(5));
        inner.add(new JLabel("Developers: " + String.join(", ", developers)));
        inner.add(Box.createVerticalStrut(5));
        inner.add(new JLabel("Producers: "  + String.join(", ", producers)));
        inner.add(Box.createVerticalStrut(5));
        inner.add(new JLabel("Tags: "       + String.join(", ", tags)));

        JButton reviewButton = new JButton("View Reviews");
        reviewButton.addActionListener(e -> new ReviewWindow(GameID, gameName[0], dbService, username));
        inner.add(Box.createVerticalStrut(10));
        inner.add(reviewButton);
        
        JButton purchaseButton = new JButton("Purchase Game");
        purchaseButton.addActionListener(e -> {
            int confirm = JOptionPane.showConfirmDialog(
                panel,
                "Are you sure you want to purchase \"" + gameName[0] + "\"?",
                "Confirm Purchase",
                JOptionPane.YES_NO_OPTION
            );
            if (confirm == JOptionPane.YES_OPTION) {
                Connection conn = dbService.getConnection();
                try(CallableStatement cs = conn.prepareCall("{ call PurchaseGameByName(?, ?) }")) {

                    cs.setString(1, username);
                    cs.setString(2, gameName[0]);
                    cs.execute();

                    JOptionPane.showMessageDialog(panel, "Game purchased successfully!", "Success", JOptionPane.INFORMATION_MESSAGE);

                } catch (SQLException ex) {
                    // Show error message returned from THROW
                    String msg = ex.getMessage();
                    if (msg == null || msg.isBlank()) {
                        msg = "An unknown error occurred during purchase.";
                    }
                    JOptionPane.showMessageDialog(panel, msg, "Purchase Failed", JOptionPane.ERROR_MESSAGE);
                    ex.printStackTrace();
                }
            }
        });

        inner.add(Box.createVerticalStrut(10));
        inner.add(purchaseButton);

        JPanel centerWrapper = new JPanel(new FlowLayout(FlowLayout.CENTER));
        centerWrapper.add(inner);

        JScrollPane scroll = new JScrollPane(centerWrapper);
        scroll.setBorder(null);
        panel.add(scroll, BorderLayout.CENTER);

        return panel;
    }
    private class SimpleDocListener implements javax.swing.event.DocumentListener {
        private final Runnable callback;
        public SimpleDocListener(Runnable callback) {
            this.callback = callback;
        }
        @Override
        public void insertUpdate(javax.swing.event.DocumentEvent e) {
            callback.run();
        }
        @Override
        public void removeUpdate(javax.swing.event.DocumentEvent e) {
            callback.run();
        }
        @Override
        public void changedUpdate(javax.swing.event.DocumentEvent e) {
            callback.run();
        }
    }

    private JPanel createFoldersPanel() {
        JPanel panel = new JPanel(new BorderLayout(5,5));

        DefaultListModel<Folder> folderModel = new DefaultListModel<>();
        JList<Folder> folderList = new JList<>(folderModel);
        folderList.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        panel.add(new JScrollPane(folderList), BorderLayout.WEST);

        String[] cols = {"ID", "Name", "Price", "ReleaseDate", "Note"};
        DefaultTableModel tableModel = new DefaultTableModel(cols, 0);
        JTable gamesTable = new JTable(tableModel);
        panel.add(new JScrollPane(gamesTable), BorderLayout.CENTER);

        JPanel btns = new JPanel(new FlowLayout(FlowLayout.CENTER));
        JButton newF = new JButton("New Folder");
        JButton addG = new JButton("Add Game");
        JButton remG = new JButton("Remove Game");
        btns.add(newF);
        btns.add(addG);
        btns.add(remG);
        panel.add(btns, BorderLayout.SOUTH);

        try {
            for (Folder f : dbService.getUserFolders()) {
                folderModel.addElement(f);
            }
        } catch (SQLException ex) {
            JOptionPane.showMessageDialog(this, "Load folders failed:\n" + ex.getMessage(),
                                        "Error", JOptionPane.ERROR_MESSAGE);
        }

        folderList.addListSelectionListener(e -> {
            if (!e.getValueIsAdjusting()) {
                tableModel.setRowCount(0);
                Folder f = folderList.getSelectedValue();
                if (f != null) {
                    try {
                        for (GameInFolder g : dbService.getGamesInFolder(f.getId())) {
                            tableModel.addRow(new Object[]{
                            g.getId(), g.getName(), g.getPrice(),
                            g.getReleaseDate(), g.getNote()
                            });
                        }
                    } catch (SQLException ex) {
                        JOptionPane.showMessageDialog(this, "Load games failed:\n"+ex.getMessage(),
                                                    "Error", JOptionPane.ERROR_MESSAGE);
                    }
                }
            }
        });

        newF.addActionListener(e -> {
            String name = JOptionPane.showInputDialog(this, "Folder name:");
            if (name != null && !name.isBlank()) {
                try {
                    int id = dbService.createFolder(name, "", false);
                    Folder f = new Folder(id, name, "", false,
                                        new Date(System.currentTimeMillis()));
                    folderModel.addElement(f);
                } catch (SQLException ex) {
                    JOptionPane.showMessageDialog(this, "Create folder failed:\n"+ex.getMessage(),
                                                "Error", JOptionPane.ERROR_MESSAGE);
                }
            }
        });

        addG.addActionListener(e -> {
            Folder f = folderList.getSelectedValue();
            if (f == null) return;
            String gameName = JOptionPane.showInputDialog(this, "Game name to add:");
            if (gameName != null && !gameName.isBlank()) {
                try {
                    dbService.addGameToFolderByName(f.getName(), gameName, null);
                    folderList.clearSelection();
                    folderList.setSelectedValue(f, true);
                } catch (SQLException ex) {
                    JOptionPane.showMessageDialog(this, "Add game failed:\n"+ex.getMessage(),
                                                "Error", JOptionPane.ERROR_MESSAGE);
                }
            }
        });

        remG.addActionListener(e -> {
            int row = gamesTable.getSelectedRow();
            Folder f = folderList.getSelectedValue();
            if (row < 0 || f == null) return;
            int gameId = (int) tableModel.getValueAt(row, 0);
            try {
                dbService.removeGameFromFolder(f.getId(), gameId);
                tableModel.removeRow(row);
            } catch (SQLException ex) {
                JOptionPane.showMessageDialog(this, "Remove game failed:\n"+ex.getMessage(),
                                            "Error", JOptionPane.ERROR_MESSAGE);
            }
        });

        return panel;
    }
}
