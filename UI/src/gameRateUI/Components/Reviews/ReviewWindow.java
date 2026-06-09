package gameRateUI.Components.Reviews;

import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.format.DateTimeFormatter;

import javax.swing.BorderFactory;
import javax.swing.Box;
import javax.swing.BoxLayout;
import javax.swing.JButton;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTextArea;

import gameRateUI.Services.DataBaseService;

public class ReviewWindow extends JFrame {
    private final DataBaseService dbService;
    private final int gameId;
    private final String gameName;
    private final JPanel reviewListPanel;
    private final JScrollPane reviewsScrollPane;
    private JLabel noReviewsLabel;

    private int numReviews = 1;

    public ReviewWindow(int gameId, String gameName, DataBaseService dbService, String username) {
        this.dbService = dbService;
        this.gameName = gameName;
        this.gameId = gameId;
        setSize(500, 400);
        setLocationRelativeTo(null);
        setTitle("Reviews for " + gameName);

        // Main panel with BorderLayout
        JPanel mainPanel = new JPanel(new BorderLayout());
        
        // Create the panel for displaying reviews
        JPanel reviewListPanel = new JPanel();
        this.reviewListPanel = reviewListPanel;
        reviewListPanel.setLayout(new BoxLayout(reviewListPanel, BoxLayout.Y_AXIS));
        reviewListPanel.setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
        
        try {
            Connection dbConnection = dbService.getConnection();
            String reviewQuery = "{call GetReviews(?)}";
            CallableStatement reviewCall = dbConnection.prepareCall(reviewQuery);
            reviewCall.setInt(1, gameId);
            ResultSet reviews = reviewCall.executeQuery();

            // Check if there are reviews
            if (!reviews.next()) {
                this.noReviewsLabel = new JLabel("No reviews available.");
                reviewListPanel.add(this.noReviewsLabel);
            } else {
                this.noReviewsLabel = null;
                do {
                    JPanel reviewPanel = new JPanel();
                    reviewPanel.setLayout(new BorderLayout());
                    reviewPanel.setPreferredSize(new Dimension(450, 100));
                    reviewPanel.setMaximumSize(new Dimension(Short.MAX_VALUE, 100));
                    reviewPanel.setBorder(BorderFactory.createCompoundBorder(
                        BorderFactory.createLineBorder(Color.LIGHT_GRAY),
                        BorderFactory.createEmptyBorder(5, 10, 5, 10)
                    ));

                    String user = reviews.getString("Username");
                    int stars = reviews.getInt("Star");
                    Date date = reviews.getDate("Review Date");
                    JLabel header = new JLabel(String.format(
                        "#%d - %s  -  %d★  -  %s", this.numReviews, user, stars, date.toLocalDate().format(DateTimeFormatter.ofPattern("MMMM d, yyyy"))
                    ));
                    header.setFont(new Font("SansSerif", Font.BOLD, 14));

                    JTextArea reviewArea = new JTextArea(reviews.getString("Review Content"));
                    reviewArea.setLineWrap(true);
                    reviewArea.setWrapStyleWord(true);
                    reviewArea.setEditable(false);
                    reviewArea.setBackground(null);
                    reviewArea.setFont(new Font("Serif", Font.PLAIN, 13));

                    reviewPanel.add(header, BorderLayout.NORTH);
                    reviewPanel.add(reviewArea, BorderLayout.CENTER);

                    reviewListPanel.add(reviewPanel);
                    reviewListPanel.add(Box.createVerticalStrut(10));
                    this.numReviews++;
                } while (reviews.next());
            }
        } catch (SQLException e) {
            e.printStackTrace();  
            this.noReviewsLabel = null;     
        } finally {
            // Add the review list panel to a scroll pane
            JScrollPane scrollPane = new JScrollPane(reviewListPanel);
            this.reviewsScrollPane = scrollPane;
            scrollPane.getVerticalScrollBar().setUnitIncrement(16); // smoother scrolling
            mainPanel.add(scrollPane, BorderLayout.CENTER);
        }

        // Create the "Add Review" button at the bottom
        JPanel footerPanel = new JPanel();
        footerPanel.setLayout(new BorderLayout());
        JButton addReviewButton = new JButton("Add Review");
        addReviewButton.setPreferredSize(new Dimension(150, 40));

        // Action for adding review
        addReviewButton.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                new AddReviewWindow(gameName, dbService, username, ReviewWindow.this);
            }
        });
        
        footerPanel.add(addReviewButton, BorderLayout.CENTER);

        // Add the footer panel to the bottom of the main panel
        mainPanel.add(footerPanel, BorderLayout.SOUTH);

        // Add the main panel to the frame
        add(mainPanel);
        
        setVisible(true);
    }

    public void addReview(String user, int stars, Date date, String reviewContent) {
        JPanel reviewPanel = new JPanel();
        reviewPanel.setLayout(new BorderLayout());
        reviewPanel.setPreferredSize(new Dimension(450, 100));
        reviewPanel.setMaximumSize(new Dimension(Short.MAX_VALUE, 100));
        reviewPanel.setBorder(BorderFactory.createCompoundBorder(
            BorderFactory.createLineBorder(Color.LIGHT_GRAY),
            BorderFactory.createEmptyBorder(5, 10, 5, 10)
        ));

        JLabel header = new JLabel(String.format(
            "#%d - %s  -  %d★  -  %s", this.numReviews, user, stars, date.toLocalDate().format(DateTimeFormatter.ofPattern("MMMM d, yyyy"))
        ));
        header.setFont(new Font("SansSerif", Font.BOLD, 14));

        JTextArea reviewArea = new JTextArea(reviewContent);
        reviewArea.setLineWrap(true);
        reviewArea.setWrapStyleWord(true);
        reviewArea.setEditable(false);
        reviewArea.setBackground(null);
        reviewArea.setFont(new Font("Serif", Font.PLAIN, 13));

        reviewPanel.add(header, BorderLayout.NORTH);
        reviewPanel.add(reviewArea, BorderLayout.CENTER);

        this.reviewListPanel.add(reviewPanel);
        this.reviewListPanel.add(Box.createVerticalStrut(10));
        this.numReviews++;

        //Remove no reviews label if applicable
        if(this.noReviewsLabel != null) {
            this.reviewListPanel.remove(this.noReviewsLabel);
            this.noReviewsLabel = null;
        }

        // Revalidate and repaint the panel to reflect the new review
        this.reviewListPanel.revalidate();
        this.reviewListPanel.repaint();

        // Scroll to the bottom to see new review
        this.reviewsScrollPane.revalidate();
        this.reviewsScrollPane.repaint();
        this.reviewsScrollPane.getVerticalScrollBar().setValue(this.reviewsScrollPane.getVerticalScrollBar().getMaximum());
    }
}