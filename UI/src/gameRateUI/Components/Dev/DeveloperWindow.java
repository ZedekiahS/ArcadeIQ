package gameRateUI.Components.Dev;

import javax.swing.*;
import javax.swing.table.DefaultTableModel;

import java.awt.*;
import java.awt.event.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.*;
import java.time.format.DateTimeFormatter;

import gameRateUI.Components.Player.PlayerHub;
import gameRateUI.Components.Reviews.AddReviewWindow;
import gameRateUI.Components.Reviews.ReviewWindow;
import gameRateUI.Services.DataBaseService;

public class DeveloperWindow extends JFrame {
    private final DataBaseService dbService;
    private final String devUsername;
    private final String companyName;
    private final JTabbedPane tabs;

    public DeveloperWindow(JFrame parent, DataBaseService dbService, String devUsername, String companyName) {
        super("Developer Portal for " + companyName + " (logged in as " + devUsername + ")");
        this.dbService = dbService;
        this.devUsername = devUsername;
        this.companyName = companyName;

        setSize(600, 450);
        setLocationRelativeTo(parent);
        setDefaultCloseOperation(DISPOSE_ON_CLOSE);

        addWindowListener(new WindowAdapter() {
            @Override
            public void windowClosing(WindowEvent e) {
                parent.setVisible(true);
            }
        });

        this.tabs = initUI();
        parent.setVisible(false);
        setVisible(true);
    }

    private JTabbedPane initUI() {
        JTabbedPane tabs = new JTabbedPane();
        tabs.addTab("Add Game", createAddGamePanel());
        tabs.addTab("Create Bundle", createBundlePanel());
        tabs.addTab("Link to Bundle", createLinkPanel());
        tabs.addTab("Revenue Data", createRevenuePanel(tabs));
        tabs.addTab("My Games", createGameViewPanel(tabs));
        add(tabs, BorderLayout.CENTER);
        return tabs;
    }

    private JPanel createAddGamePanel() {
        JPanel panel = new JPanel(new GridBagLayout());
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(8, 8, 8, 8);
        gbc.fill = GridBagConstraints.HORIZONTAL;

        JTextField nameField = new JTextField();
        JTextField priceField = new JTextField();
        JTextField dateField = new JTextField("YYYY-MM-DD");
        JTextField descriptionField = new JTextField();
        JTextField tagsField = new JTextField();

        gbc.gridx = 0;
        gbc.gridy = 0;
        panel.add(new JLabel("Name:"), gbc);
        gbc.gridx = 1;
        panel.add(nameField, gbc);

        gbc.gridy++;
        gbc.gridx = 0;
        panel.add(new JLabel("Price:"), gbc);
        gbc.gridx = 1;
        panel.add(priceField, gbc);

        gbc.gridy++;
        gbc.gridx = 0;
        panel.add(new JLabel("Release Date:"), gbc);
        gbc.gridx = 1;
        panel.add(dateField, gbc);

        gbc.gridy++;
        gbc.gridx = 0;
        panel.add(new JLabel("Description:"), gbc);
        gbc.gridx = 1;
        panel.add(descriptionField, gbc);

        gbc.gridy++;
        gbc.gridx = 0;
        panel.add(new JLabel("Tags :"), gbc);
        gbc.gridx = 1;
        panel.add(tagsField, gbc);

        gbc.gridy++;
        gbc.gridx = 0;
        panel.add(new JLabel("Developers :"), gbc);
        gbc.gridx = 1;
        JTextField developersField = new JTextField();
        panel.add(developersField, gbc);

        gbc.gridy++;
        gbc.gridx = 0;
        panel.add(new JLabel("Producer :"), gbc);
        gbc.gridx = 1;
        JTextField publishersField = new JTextField();
        panel.add(publishersField, gbc);

        gbc.gridy++;
        gbc.gridx = 0;
        gbc.gridwidth = 2;
        JButton btn = new JButton("Add Game");
        btn.addActionListener(e -> {
            String name = nameField.getText().trim();
            String priceText = priceField.getText().trim();
            String dateText = dateField.getText().trim();

            try (CallableStatement cs = dbService.getConnection()
                    .prepareCall("{call AddGame(?, ?, ?, ?, ?)}")) {

                cs.setString(1, name);
                if (priceText.isEmpty()) {
                    cs.setNull(2, Types.DECIMAL);
                } else {
                    cs.setBigDecimal(2, new java.math.BigDecimal(priceText));
                }
                if (dateText.isEmpty() || dateText.equals("YYYY-MM-DD")) {
                    cs.setNull(3, Types.DATE);
                } else {
                    try {
                        cs.setDate(3, Date.valueOf(dateText));
                    } catch(IllegalArgumentException il) {
                        cs.setNull(3, Types.DATE);
                    }
                }
                if(descriptionField.getText().isEmpty()) {
                    cs.setNull(4, Types.NVARCHAR);
                } else {
                    cs.setString(4, descriptionField.getText());
                }
                cs.registerOutParameter(5, Types.INTEGER);
                cs.execute();

                int newGameId = cs.getInt(5);
                try (CallableStatement cs2 = dbService.getConnection()
                        .prepareCall("{call RegisterDeveloperGame(?, ?)}")) {
                    cs2.setInt(1, newGameId);
                    cs2.setString(2, this.companyName);
                    cs2.execute();
                }
                String devsText = developersField.getText().trim();
                if (!devsText.isEmpty()) {
                    for (String d : devsText.split(",")) {
                        try (CallableStatement csDev = dbService.getConnection()
                                .prepareCall("{call RegisterDeveloperGame(?, ?)}")) {
                            csDev.setInt(1, newGameId);
                            csDev.setString(2, d.trim());
                            csDev.execute();
                        }
                    }
                }

                String pubsText = publishersField.getText().trim();
                if (!pubsText.isEmpty()) {
                    for (String p : pubsText.split(",")) {
                        try (CallableStatement csPub = dbService.getConnection()
                                .prepareCall("{call RegisterProducerGame(?, ?)}")) {
                            csPub.setInt(1, newGameId);
                            csPub.setString(2, p.trim());
                            csPub.execute();
                        }
                    }
                }

                if(!tagsField.getText().isEmpty()) {
                    for(String tag : tagsField.getText().split(",")) {
                        try(CallableStatement cs3 = dbService.getConnection().
                        prepareCall("{call AddTagToGame(?, ?)}")) {
                            cs3.setString(1, tag);
                            cs3.setInt(2, newGameId);
                            cs3.execute();
                        }
                    }
                }


                JOptionPane.showMessageDialog(this,
                        "Game added and registered successfully! (ID=" + newGameId + ")",
                        "Success",
                        JOptionPane.INFORMATION_MESSAGE);

            } catch (SQLException ex) {
                JOptionPane.showMessageDialog(this,
                        "Error adding game:\n" + ex.getMessage(),
                        "Error",
                        JOptionPane.ERROR_MESSAGE);
            }
        });
        panel.add(btn, gbc);

        return panel;
    }

    private JPanel createBundlePanel() {
        JPanel panel = new JPanel(new GridBagLayout());
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(8, 8, 8, 8);
        gbc.fill = GridBagConstraints.HORIZONTAL;

        JTextField nameField = new JTextField(20);
        JTextField typeField = new JTextField(20);
        JTextField priceField = new JTextField(20);
        JTextField descriptionField = new JTextField(20);

        gbc.gridx = 0;
        gbc.gridy = 0;
        panel.add(new JLabel("Bundle Name:"), gbc);
        gbc.gridx = 1;
        panel.add(nameField, gbc);

        gbc.gridy++;
        gbc.gridx = 0;
        panel.add(new JLabel("Bundle Type:"), gbc);
        gbc.gridx = 1;
        panel.add(typeField, gbc);

        gbc.gridy++;
        gbc.gridx = 0;
        panel.add(new JLabel("Bundle Price:"), gbc);
        gbc.gridx = 1;
        panel.add(priceField, gbc);

        gbc.gridy++;
        gbc.gridx = 0;
        panel.add(new JLabel("Description:"), gbc);
        gbc.gridx = 1;
        panel.add(descriptionField, gbc);

        gbc.gridy++;
        gbc.gridx = 0;
        gbc.gridwidth = 2;
        JButton btn = new JButton("Create Bundle");
        btn.addActionListener(e -> {
            String name = nameField.getText().trim();
            String type = typeField.getText().trim();
            String priceText = priceField.getText().trim();
            String desc = descriptionField.getText().trim();

            try (CallableStatement cs = dbService.getConnection()
                    .prepareCall("{call AddBundle(?, ?, ?, ?, ?)}")) {

                cs.setString(1, name);
                cs.setString(2, type);

                if (priceText.isEmpty()) {
                    cs.setNull(3, Types.DECIMAL);
                } else {
                    cs.setBigDecimal(3, new java.math.BigDecimal(priceText));
                }

                cs.setString(4, desc);
                cs.registerOutParameter(5, Types.INTEGER);

                cs.execute();

                int newBundleId = cs.getInt(5);
                JOptionPane.showMessageDialog(this,
                        "Bundle created successfully! (ID=" + newBundleId + ")",
                        "Success",
                        JOptionPane.INFORMATION_MESSAGE);

            } catch (SQLException ex) {
                JOptionPane.showMessageDialog(this,
                        "Error creating bundle:\n" + ex.getMessage(),
                        "Error",
                        JOptionPane.ERROR_MESSAGE);
            }
        });
        panel.add(btn, gbc);

        return panel;
    }

    private JPanel createLinkPanel() {
        JPanel panel = new JPanel(new GridBagLayout());
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(8, 8, 8, 8);
        gbc.fill = GridBagConstraints.HORIZONTAL;

        JTextField bundleNameField = new JTextField();
        JTextField gameNameField = new JTextField();

        gbc.gridx = 0;
        gbc.gridy = 0;
        panel.add(new JLabel("Bundle Name:"), gbc);
        gbc.weightx = 1;
        gbc.gridx = 1;
        panel.add(bundleNameField, gbc);
        gbc.weightx = 0;

        gbc.gridy++;
        gbc.gridx = 0;
        panel.add(new JLabel("Game Name:"), gbc);
        gbc.weightx = 1;
        gbc.gridx = 1;
        panel.add(gameNameField, gbc);

        gbc.gridy++;
        gbc.gridx = 0;
        gbc.gridwidth = 2;
        JButton btn = new JButton("Link to Bundle");
        btn.addActionListener(e -> {
            try {
            CallableStatement getBundleId = dbService.getConnection().prepareCall("{call GetBundleID(?,?)}");
            getBundleId.setString(1, bundleNameField.getText());
            getBundleId.registerOutParameter(2, Types.INTEGER);
            getBundleId.execute();
            int bundleId = getBundleId.getInt(2);
            CallableStatement getGameId = dbService.getConnection().prepareCall("{call GetGameID(?,?)}");
            getGameId.setString(1, gameNameField.getText());
            getGameId.registerOutParameter(2, Types.INTEGER);
            getGameId.execute();
            int gameId = getGameId.getInt(2);

            CallableStatement cs = dbService.getConnection().prepareCall("{call RegisterGameBundle(?, ?)}");
            cs.setInt(1, bundleId);
            cs.setInt(2, gameId);
            cs.execute();

            JOptionPane.showMessageDialog(this,
                    "Game linked to bundle successfully.",
                    "Success",
                    JOptionPane.INFORMATION_MESSAGE);

            } catch (SQLException ex) {
                JOptionPane.showMessageDialog(this,
                        "Error linking game to bundle:\n" + ex.getMessage(),
                        "Error",
                        JOptionPane.ERROR_MESSAGE);
            }
        });
        panel.add(btn, gbc);

        return panel;
    }

    private JPanel createRevenuePanel(JTabbedPane tabs) {
        JPanel revenuePanel = new JPanel(new BorderLayout());
    
        // Total revenue and refresh
        JPanel topPanel = new JPanel(new BorderLayout());
        JLabel totalRevenueLabel = new JLabel("Total revenue: DATA NOT AVAILABLE");
        totalRevenueLabel.setFont(new Font("Arial", Font.BOLD, 16));
        totalRevenueLabel.setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
    
        JButton refreshButton = new JButton("Refresh");
        refreshButton.setFont(new Font("Arial", Font.PLAIN, 14));
        refreshButton.setMargin(new Insets(5, 15, 5, 15));
        refreshButton.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                int index = tabs.getSelectedIndex();
                tabs.setComponentAt(index, createRevenuePanel(tabs));
            }
        });
    
        topPanel.add(totalRevenueLabel, BorderLayout.WEST);
        topPanel.add(refreshButton, BorderLayout.EAST);
    
        // Revenue breakdown by game
        JPanel gameRevenueList = new JPanel();
        gameRevenueList.setLayout(new BoxLayout(gameRevenueList, BoxLayout.Y_AXIS));
    
        //Get games for company
        ResultSet results = PlayerHub.getGames(dbService, "", false, new String[] {companyName},null,null,null,null,null,null);
        try {
            BigDecimal totalRevenue = BigDecimal.ZERO;
            while(results.next()) {
                String gameName = results.getString("Name");
                //Get revenue for this game
                String revenueQuery = "{call GetRevenueForGame(?,?)}";
                CallableStatement revenueCall = dbService.getConnection().prepareCall(revenueQuery);
                revenueCall.setString(1, gameName);
                revenueCall.registerOutParameter(2, Types.DECIMAL);
                revenueCall.execute();
                BigDecimal gameRevenue = revenueCall.getBigDecimal(2);
                if(gameRevenue == null) gameRevenue = BigDecimal.ZERO;
                gameRevenue = gameRevenue.setScale(2, RoundingMode.HALF_UP);

                //Create row
                JLabel gameRevenueLabel = new JLabel(gameName + ": $" + gameRevenue);
                gameRevenueLabel.setFont(new Font("Arial", Font.PLAIN, 14));
                gameRevenueLabel.setBorder(BorderFactory.createEmptyBorder(5, 10, 5, 10));
                gameRevenueList.add(gameRevenueLabel);

                //Increase total revenue
                totalRevenue = totalRevenue.add(gameRevenue);
            }
            totalRevenue = totalRevenue.setScale(2, RoundingMode.HALF_UP);
            totalRevenueLabel.setText("Total revenue: $" + totalRevenue);
        } catch(SQLException e) {
            JOptionPane.showMessageDialog(this,
            "Could not get game revenue data: " + e.getMessage(),
            "Error",
            JOptionPane.ERROR_MESSAGE);
        }
    
        JScrollPane scrollPane = new JScrollPane(gameRevenueList);
        scrollPane.setBorder(BorderFactory.createTitledBorder("Revenue by Game"));
    
        // --- Add components to main panel ---
        revenuePanel.add(topPanel, BorderLayout.NORTH);
        revenuePanel.add(scrollPane, BorderLayout.CENTER);
    
        return revenuePanel;
    }

    private JPanel createGameViewPanel(JTabbedPane tabs) {
        JPanel gameView = new JPanel();

        JButton refreshButton = new JButton("Refresh");
        gameView.add(refreshButton);

        //Create table
         String[] columns = {"ID", "Name", "Price", "Release Date"};
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
                    if(tabs.getTabCount() == 6) {
                        tabs.remove(tabs.getTabCount() - 1);
                    }
                    tabs.addTab("Details For " + gameName, createEditGamePanel(gameId));
                    tabs.setSelectedIndex(tabs.getTabCount() - 1);
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
        gameView.add(Box.createVerticalStrut(5));
        gameView.add(scrollPane);

        PlayerHub.populateTable(tableModel, PlayerHub.getGames(this.dbService, "", false, new String[] {this.companyName}, null, null, null, null, null, null));

        refreshButton.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
               tableModel.setNumRows(0); 
               PlayerHub.populateTable(tableModel, PlayerHub.getGames(dbService, "", false, new String[] {companyName}, null, null, null, null, null, null));
            }          
        });

        return gameView;
    }

    private JPanel createEditGamePanel(int GameID) {
        return new GameEditorPanel(GameID, this.dbService, this.tabs);
    }
}
