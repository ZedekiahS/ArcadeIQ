package gameRateUI.Components.Dev;

import javax.swing.*;

import gameRateUI.Services.DataBaseService;

import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.math.BigDecimal;
import java.sql.CallableStatement;
import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.time.*;

public class GameEditorPanel extends JPanel {
    private JTextField nameField;
    private JTextField priceField;
    private JTextField releaseDateField;
    private JTextField tagsField;
    private JTextField developersField;
    private JTextField producersField;
    private JTextField descriptionField;

    public GameEditorPanel(int gameId, DataBaseService dBaseService, JTabbedPane tabs) {
        setLayout(new BorderLayout());
        setBorder(BorderFactory.createTitledBorder("Edit Game Info - ID: " + gameId));

        try {
            //Query definitions
            String basicProc = "{ call dbo.GetGameBasic(?) }";
            String devProc   = "{ call dbo.GetGameDevelopers(?) }";
            String prodProc  = "{ call dbo.GetGameProducers(?) }";
            String tagProc   = "{ call dbo.GetGameTags(?) }";

            //Calls
            CallableStatement basicCall = dBaseService.getConnection().prepareCall(basicProc);
            basicCall.setInt(1, gameId);
            ResultSet basicResults = basicCall.executeQuery();
            CallableStatement devCall = dBaseService.getConnection().prepareCall(devProc);
            devCall.setInt(1, gameId);
            ResultSet devResults = devCall.executeQuery();
            CallableStatement prodCall = dBaseService.getConnection().prepareCall(prodProc);
            prodCall.setInt(1, gameId);
            ResultSet prodResults = prodCall.executeQuery();
            CallableStatement tagCall = dBaseService.getConnection().prepareCall(tagProc);
            tagCall.setInt(1, gameId);
            ResultSet tagResults = tagCall.executeQuery();

            //Create the game with info
            if(!basicResults.next()) {
                throw new SQLException("Basic results had no return value");
            }
            Game game = new Game(basicResults.getString("Name"), basicResults.getBigDecimal("Price").toString(), 
            basicResults.getDate("ReleaseDate").toString(), basicResults.getNString("Description"));
            while(tagResults.next()) {
                if(game.tags.isBlank()) {
                    game.tags = tagResults.getNString("Tag");
                } else {
                    game.tags = game.tags + ", " + tagResults.getNString("Tag");
                }
            }
            while(devResults.next()) {
                if(game.developers.isBlank()) {
                    game.developers = devResults.getNString("Developer");
                } else {
                    game.developers = game.developers + ", " + devResults.getNString("Developer");
                }
            }
            while(prodResults.next()) {
                if(game.producers.isBlank()) {
                    game.producers = prodResults.getString("Producer");
                } else {
                    game.producers = game.producers + ", " + prodResults.getString("Producer");
                }
            }

            JPanel formPanel = new JPanel(new GridLayout(0, 2, 5, 5));

            nameField = new JTextField(game.name);
            priceField = new JTextField(game.price);
            releaseDateField = new JTextField(game.releaseDate);
            tagsField = new JTextField(game.tags);
            developersField = new JTextField(game.developers);
            producersField = new JTextField(game.producers);
            descriptionField = new JTextField(game.description);

            formPanel.add(new JLabel("Name:"));
            formPanel.add(nameField);

            formPanel.add(new JLabel("Description:"));
            formPanel.add(descriptionField);

            formPanel.add(new JLabel("Price:"));
            formPanel.add(priceField);

            formPanel.add(new JLabel("Release Date (YYYY-MM-DD):"));
            formPanel.add(releaseDateField);

            formPanel.add(new JLabel("Tags (comma-separated):"));
            formPanel.add(tagsField);

            formPanel.add(new JLabel("Developers (comma-separated):"));
            formPanel.add(developersField);

            formPanel.add(new JLabel("Producers (comma-separated):"));
            formPanel.add(producersField);

            add(formPanel, BorderLayout.CENTER);

            // Buttons panel
            JPanel buttonPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT));
            JButton saveButton = new JButton("Save Changes");
            JButton deleteButton = new JButton("Delete Game");
            JButton addVoucher = new JButton("Add Voucher");

            //Button logic
            saveButton.addActionListener(new ActionListener() {
                @Override
                public void actionPerformed(ActionEvent e) {
                    try {
                        //Update basic game info
                        String updateGameBasicQuery = "{call UpdateGame(?,?,?,?,?)}";
                        CallableStatement updateGameBasicCall = dBaseService.getConnection().prepareCall(updateGameBasicQuery);
                        updateGameBasicCall.setInt(1, gameId);
                        updateGameBasicCall.setNString(2, nameField.getText());
                        updateGameBasicCall.setBigDecimal(3, new BigDecimal(priceField.getText()));
                        updateGameBasicCall.setDate(4, Date.valueOf(LocalDate.parse(releaseDateField.getText())));
                        updateGameBasicCall.setNString(5, descriptionField.getText());
                        updateGameBasicCall.execute();

                        //Delete current game producers
                        String deleteGameProdQuery = "{call DeleteAllProds(?)}";
                        CallableStatement deleteGameProdCall = dBaseService.getConnection().prepareCall(deleteGameProdQuery);
                        deleteGameProdCall.setInt(1, gameId);
                        deleteGameProdCall.execute();

                        //Register new game producers
                        String registerGameProdQuery = "{call RegisterGameProducer(?,?,?)}";
                        for(String producer : producersField.getText().split(", ")) {
                            CallableStatement registerGameProdCall = dBaseService.getConnection().prepareCall(registerGameProdQuery);
                            registerGameProdCall.setInt(1, gameId);
                            registerGameProdCall.setNString(2, producer);
                            registerGameProdCall.registerOutParameter(3, Types.INTEGER);
                            registerGameProdCall.execute();
                        }

                        //Delete current game developers
                        String deleteGameDevQuery = "{call DeleteAllDevs(?)}";
                        CallableStatement deleteGameDevCall = dBaseService.getConnection().prepareCall(deleteGameDevQuery);
                        deleteGameDevCall.setInt(1, gameId);;
                        deleteGameDevCall.execute();

                        //Register new game developers
                        String registerGameDevQuery = "{call RegisterGameDeveloper(?,?,?)}";
                        for(String developer : developersField.getText().split(", ")) {
                            CallableStatement registerGameDevCall = dBaseService.getConnection().prepareCall(registerGameDevQuery);
                            registerGameDevCall.setInt(1, gameId);
                            registerGameDevCall.setNString(2, developer);
                            registerGameDevCall.registerOutParameter(3, Types.INTEGER);
                            registerGameDevCall.execute();
                        }

                        //Delete current game tags
                        String deleteGameTagQuery = "{call DeleteAllTags(?)}";
                        CallableStatement deleteGameTagCall = dBaseService.getConnection().prepareCall(deleteGameTagQuery);
                        deleteGameTagCall.setInt(1, gameId);
                        deleteGameTagCall.execute();

                        //Register new game tags
                        String registerGameTagQuery = "{call AddTagToGame(?,?)}";
                        for(String tag : tagsField.getText().split(", ")) {
                            CallableStatement registerGameTagCall = dBaseService.getConnection().prepareCall(registerGameTagQuery);
                            registerGameTagCall.setNString(1, tag);
                            registerGameTagCall.setInt(2, gameId);
                            registerGameTagCall.execute();
                        }
                        JOptionPane.showMessageDialog(null, "Game updated!");
                    } catch(SQLException ex) {
                        JOptionPane.showMessageDialog(null, "Error saving the game: " + ex.getMessage());
                    }
                }
            });

            deleteButton.addActionListener(new ActionListener() {
                @Override
                public void actionPerformed(ActionEvent e) {
                    try {
                        String deletionQuery = "{call DeleteGame(?)}";
                        CallableStatement deletionCall = dBaseService.getConnection().prepareCall(deletionQuery);
                        deletionCall.setInt(1, gameId);
                        deletionCall.execute();
                        int prevTabs = tabs.getSelectedIndex();
                        tabs.remove(tabs.getSelectedIndex());
                        tabs.setSelectedIndex(prevTabs - 1);
                    } catch(SQLException ex) {
                        JOptionPane.showMessageDialog(null, "Error editing the game: " + ex.getMessage());
                    }
                }     
            });
            addVoucher.addActionListener(new ActionListener() {
                @Override
                public void actionPerformed(ActionEvent e) {
                    new AddVoucherWindow(gameId, dBaseService);
                }  
            });

            buttonPanel.add(saveButton);
            buttonPanel.add(deleteButton);
            buttonPanel.add(addVoucher);
            add(buttonPanel, BorderLayout.SOUTH);
        } catch(SQLException e) {
            JOptionPane.showMessageDialog(null, "Error editing the game: " + e.getMessage());
        }
    }

    // Inner class to represent game data
    static class Game {
        String name;
        String price;
        String releaseDate;
        String description;
        String tags = "";
        String developers = "";
        String producers = "";

        Game(String name, String price, String releaseDate, String description) {
            this.name = name;
            this.price = price;
            this.releaseDate = releaseDate;
            this.description = description;
        }
    }
}