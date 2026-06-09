package gameRateUI.Components.Reviews;

import javax.swing.*;

import gameRateUI.Services.DataBaseService;

import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.sql.CallableStatement;
import java.sql.SQLException;
import java.sql.Types;
import java.sql.Date;
import java.time.LocalDate;

public class AddReviewWindow extends JFrame {
    private final String gameName;
    private final DataBaseService dbService;
    private final String username;

    public AddReviewWindow(String gameName, DataBaseService dbService, String username, ReviewWindow reviewWindow) {
        //Properties
        this.gameName = gameName;
        this.dbService = dbService;
        this.username = username;

        // Set up the JFrame properties
        setTitle("Add Review For " + gameName);
        setSize(400, 300);
        setLocationRelativeTo(null); // Center the window
        setDefaultCloseOperation(JFrame.DISPOSE_ON_CLOSE); // Close the window without quitting the app

        // Create a panel to hold the content with GridBagLayout
        JPanel panel = new JPanel(new GridBagLayout());
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(5, 5, 5, 5); // Add space between components

        // Create and add a label for the stars selection
        JLabel starsLabel = new JLabel("Select stars:");
        gbc.gridx = 0;
        gbc.gridy = 0;
        gbc.anchor = GridBagConstraints.WEST;
        panel.add(starsLabel, gbc);

        // Create a combo box for star selection (1 to 5 stars)
        Integer[] starsOptions = {1, 2, 3, 4, 5};
        JComboBox<Integer> starsComboBox = new JComboBox<>(starsOptions);
        gbc.gridx = 1;
        gbc.gridy = 0;
        gbc.fill = GridBagConstraints.HORIZONTAL;
        panel.add(starsComboBox, gbc);

        // Create and add a label for the review content
        JLabel reviewLabel = new JLabel("Review Content:");
        gbc.gridx = 0;
        gbc.gridy = 1;
        gbc.fill = GridBagConstraints.NONE;
        panel.add(reviewLabel, gbc);

        // Create a text area for entering the review content
        JTextArea reviewTextArea = new JTextArea(5, 20); // 5 rows, 20 columns
        reviewTextArea.setLineWrap(true);
        reviewTextArea.setWrapStyleWord(true);
        reviewTextArea.setBorder(BorderFactory.createLineBorder(Color.GRAY));
        reviewTextArea.setAlignmentX(Component.LEFT_ALIGNMENT);
        gbc.gridx = 1;
        gbc.gridy = 1;
        gbc.gridwidth = 2;
        gbc.fill = GridBagConstraints.BOTH;
        panel.add(new JScrollPane(reviewTextArea), gbc); // Wrap in a scroll pane for better usability

        // Create and add a submit button
        JButton submitButton = new JButton("Submit Review");
        gbc.gridx = 1;
        gbc.gridy = 2;
        gbc.gridwidth = 1;
        gbc.fill = GridBagConstraints.HORIZONTAL;
        panel.add(submitButton, gbc);

        // Action listener for the submit button
        submitButton.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                // Get the selected stars and review content
                int selectedStars = (int) starsComboBox.getSelectedItem();
                String reviewContent = reviewTextArea.getText();

                try {
                    // Get user/game ids
                    String userQuery = "{call GetUserID(?,?,?)}";
                    CallableStatement userCall = dbService.getConnection().prepareCall(userQuery);
                    userCall.setString(1, username);
                    userCall.setBoolean(2, false);
                    userCall.registerOutParameter(3, Types.INTEGER);
                    String gameQuery = "{call GetGameID(?,?)}";
                    CallableStatement gameCall = dbService.getConnection().prepareCall(gameQuery);
                    gameCall.setString(1, gameName);
                    gameCall.registerOutParameter(2, Types.INTEGER);
                    gameCall.execute();
                    userCall.execute();
                    int userID = userCall.getInt(3);
                    int gameID = gameCall.getInt(2);

                    //Call the add review proc
                    String addReviewQuery = "{call AddReview(?,?,?,?,?,?)}";
                    CallableStatement reviewCall = dbService.getConnection().prepareCall(addReviewQuery);
                    reviewCall.setInt(1, userID);
                    reviewCall.setInt(2, gameID);
                    reviewCall.setInt(3, selectedStars);
                    reviewCall.setString(4, reviewContent);
                    Date today = Date.valueOf(LocalDate.now());
                    reviewCall.setDate(5, today);
                    reviewCall.registerOutParameter(6, Types.INTEGER);
                    reviewCall.execute();
                    JOptionPane.showMessageDialog(
                        null,
                        "Successfully posted the review!",
                        "Success",
                    JOptionPane.INFORMATION_MESSAGE);

                    //Add locally
                    reviewWindow.addReview(username, selectedStars, today, reviewContent);
                } catch(SQLException ex) {
                    JOptionPane.showMessageDialog(
                    null,
                    "Could not add the review.\nMessage from server: " + ex.getMessage(),
                    "Review Failed To Post",
                    JOptionPane.ERROR_MESSAGE);
                }
                
                // Clear the text fields after submission
                reviewTextArea.setText("");
                dispose();
            }
        });

        // Add the panel to the frame and make the frame visible
        add(panel);
        setVisible(true);
    }
}