package gameRateUI.Components.Login;

import javax.swing.JButton;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JPasswordField;
import javax.swing.JTextField;
import javax.swing.SwingConstants;

import gameRateUI.Services.DataBaseService;
import gameRateUI.Services.UserAuthenticationService;

import java.awt.*;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;
import java.awt.event.WindowListener;
import java.awt.event.MouseListener;

public abstract class LoginWindow extends JFrame {
    private static final int FIELD_WIDTH = 200;
    private static final int FIELD_HEIGHT = 25;
    private static final int WINDOW_WIDTH = 400;
    private static final int WINDOW_HEIGHT = 500;
    private static final int BUTTON_WIDTH = 30;
    protected final DataBaseService dBaseService;
    protected final JFrame parentFrame;
    protected final UserAuthenticationService authService;

    public LoginWindow(String loginType, JFrame parentFrame, DataBaseService dBaseService) {
        // Get database connection
        this.dBaseService = dBaseService;
        // Get parent frame
        this.parentFrame = parentFrame;
        // Get authentication service
        this.authService = new UserAuthenticationService(dBaseService);

        // Window setup
        this.setTitle(loginType + " Login");
        this.setSize(WINDOW_WIDTH, WINDOW_HEIGHT);
        this.setLocationRelativeTo(null);
        this.setDefaultCloseOperation(JFrame.DISPOSE_ON_CLOSE);

        // If this window is closed, reopen the original
        final WindowListener returnWcl = new WindowAdapter() {
            @Override
            public void windowClosing(WindowEvent e) {
                parentFrame.setVisible(true);
            }
        };
        this.addWindowListener(returnWcl);

        // Window content
        JPanel loginPanel = new JPanel(new GridBagLayout());
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(10, 10, 10, 10); // spacing between elements
        gbc.fill = GridBagConstraints.HORIZONTAL;

        // Go back button
        gbc.gridx = 0;
        gbc.gridy = 0;
        gbc.anchor = GridBagConstraints.WEST;
        JButton goBack = new JButton("Go Back");
        goBack.setFont(new Font("Arial", Font.BOLD, 12));
        goBack.setMargin(new Insets(0, 0, 0, 0)); // Remove padding
        goBack.setPreferredSize(new Dimension(50, 20)); // 80px wide, 25px tall

        goBack.addActionListener(e -> {
            this.dispose();
            parentFrame.setVisible(true);
        });

        loginPanel.add(goBack, gbc);
        gbc.gridy++;

        // Title
        JLabel loginHeader = new JLabel(loginType + " Login", SwingConstants.CENTER);
        loginHeader.setFont(new Font("Arial", Font.BOLD, 20));
        gbc.gridwidth = 2; // header spans two columns
        loginPanel.add(loginHeader, gbc);

        gbc.gridwidth = 1; // reset for next rows
        gbc.gridy++;

        // Add vertical spacer
        JPanel spacer = new JPanel();
        spacer.setPreferredSize(new Dimension(0, 15)); // 30px tall empty space
        loginPanel.add(spacer, gbc);
        gbc.gridy++;

        // Username label
        JLabel usernameLabel = new JLabel("Username:");
        gbc.gridx = 0;
        loginPanel.add(usernameLabel, gbc);

        // Username entry
        JTextField usernameField = new JTextField();
        gbc.gridx = 1;
        usernameField.setPreferredSize(new Dimension(FIELD_WIDTH, FIELD_HEIGHT));
        loginPanel.add(usernameField, gbc);

        // Password label
        gbc.gridy++;
        JLabel passwordLabel = new JLabel("Password:");
        gbc.gridx = 0;
        loginPanel.add(passwordLabel, gbc);

        // Password entry
        JTextField passwordField = new JPasswordField();
        gbc.gridx = 1;
        passwordField.setPreferredSize(new Dimension(FIELD_WIDTH, FIELD_HEIGHT));
        loginPanel.add(passwordField, gbc);

        // Button
        gbc.gridy++;
        gbc.gridx = 0;
        gbc.gridwidth = 2; // button spans two columns
        JButton submitLogin = new JButton("Login");
        gbc.anchor = GridBagConstraints.CENTER; // center the button
        gbc.fill = GridBagConstraints.NONE; // do not stretch the button
        gbc.ipadx = BUTTON_WIDTH;
        loginPanel.add(submitLogin, gbc);
        gbc.ipadx = 0;

        // Login functionality
        submitLogin.addActionListener(e -> {
            this.login(usernameField.getText(), passwordField.getText());
        });

        gbc.gridy++;

        // Registration label
        JLabel registerLabel = new JLabel("<html>Don't have an account? <a href=''>Register here</a></html>");
        registerLabel.setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        registerLabel.addMouseListener(new MouseListener() {

            @Override
            public void mouseClicked(java.awt.event.MouseEvent e) {
                LoginWindow.this.register();
                LoginWindow.this.dispose();
            }

            @Override
            public void mousePressed(java.awt.event.MouseEvent e) {
            }

            @Override
            public void mouseReleased(java.awt.event.MouseEvent e) {
            }

            @Override
            public void mouseEntered(java.awt.event.MouseEvent e) {
            }

            @Override
            public void mouseExited(java.awt.event.MouseEvent e) {
            }

        });
        loginPanel.add(registerLabel, gbc);

        // Add the panel to window
        this.add(loginPanel);

        // Open new window and hide original
        parentFrame.setVisible(false);
        this.setVisible(true);
    }

    protected abstract void login(String username, String password);

    protected abstract void register();
}
