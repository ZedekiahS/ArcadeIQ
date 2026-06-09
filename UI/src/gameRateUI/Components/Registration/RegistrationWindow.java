package gameRateUI.Components.Registration;

import javax.swing.JButton;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
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

public abstract class RegistrationWindow extends JFrame {
    private static final int FIELD_WIDTH = 200;
    private static final int FIELD_HEIGHT = 25;
    private static final int WINDOW_WIDTH = 400;
    private static final int WINDOW_HEIGHT = 500;
    private static final int BUTTON_WIDTH = 30;
    protected final DataBaseService dBaseService;
    protected final UserAuthenticationService authService;
    protected final JFrame parentFrame;

    public RegistrationWindow(String registrationType, JFrame parentFrame, DataBaseService dBaseService,
            boolean isDev) {
        // Get database connection
        this.dBaseService = dBaseService;
        this.parentFrame = parentFrame;
        // Get authentication service
        this.authService = new UserAuthenticationService(dBaseService);

        // Window setup
        this.setTitle(registrationType + " Registration");
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
        JPanel registrationPanel = new JPanel(new GridBagLayout());
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

        registrationPanel.add(goBack, gbc);
        gbc.gridy++;

        // Title
        JLabel registrationHeader = new JLabel(registrationType + " Registration", SwingConstants.CENTER);
        registrationHeader.setFont(new Font("Arial", Font.BOLD, 20));
        gbc.gridwidth = 2; // header spans two columns
        registrationPanel.add(registrationHeader, gbc);

        gbc.gridwidth = 1; // reset for next rows
        gbc.gridy++;

        // Add vertical spacer
        JPanel spacer = new JPanel();
        spacer.setPreferredSize(new Dimension(0, 15)); // 30px tall empty space
        registrationPanel.add(spacer, gbc);
        gbc.gridy++;

        // Username label
        JLabel usernameLabel = new JLabel("Username:");
        gbc.gridx = 0;
        registrationPanel.add(usernameLabel, gbc);

        // Username entry
        JTextField usernameField = new JTextField();
        gbc.gridx = 1;
        usernameField.setPreferredSize(new Dimension(FIELD_WIDTH, FIELD_HEIGHT));
        registrationPanel.add(usernameField, gbc);

        // Password label
        gbc.gridy++;
        JLabel passwordLabel = new JLabel("Password:");
        gbc.gridx = 0;
        registrationPanel.add(passwordLabel, gbc);

        // Password entry
        JTextField passwordField = new JPasswordField();
        gbc.gridx = 1;
        passwordField.setPreferredSize(new Dimension(FIELD_WIDTH, FIELD_HEIGHT));
        registrationPanel.add(passwordField, gbc);

        // Password label
        gbc.gridy++;
        JLabel confirmPasswordLabel = new JLabel("Confirm Password:");
        gbc.gridx = 0;
        registrationPanel.add(confirmPasswordLabel, gbc);

        // Password entry
        JTextField confirmPasswordField = new JPasswordField();
        gbc.gridx = 1;
        confirmPasswordField.setPreferredSize(new Dimension(FIELD_WIDTH, FIELD_HEIGHT));
        registrationPanel.add(confirmPasswordField, gbc);

        // email label
        gbc.gridy++;
        JLabel emailLabel = new JLabel("Email:");
        gbc.gridx = 0;
        registrationPanel.add(emailLabel, gbc);

        // email entry
        JTextField emailField = new JTextField();
        gbc.gridx = 1;
        emailField.setPreferredSize(new Dimension(FIELD_WIDTH, FIELD_HEIGHT));
        registrationPanel.add(emailField, gbc);

        final JTextField[] devField = { null };
        if (isDev) {
            // Dev label
            gbc.gridy++;
            JLabel devLabel = new JLabel("Company Name:");
            gbc.gridx = 0;
            registrationPanel.add(devLabel, gbc);

            // Dev entry
            devField[0] = new JTextField();
            gbc.gridx = 1;
            devField[0].setPreferredSize(new Dimension(FIELD_WIDTH, FIELD_HEIGHT));
            registrationPanel.add(devField[0], gbc);
        }

        // Button
        gbc.gridy++;
        gbc.gridx = 0;
        gbc.gridwidth = 2; // button spans two columns
        JButton submitRegistration = new JButton("Register");
        gbc.anchor = GridBagConstraints.CENTER; // center the button
        gbc.fill = GridBagConstraints.NONE; // do not stretch the button
        gbc.ipadx = BUTTON_WIDTH;
        registrationPanel.add(submitRegistration, gbc);
        gbc.ipadx = 0;

        // Registration functionality
        submitRegistration.addActionListener(e -> {
            if (!passwordField.getText().equals(confirmPasswordField.getText())) {
                JOptionPane.showMessageDialog(null, "Your passwords don't match");
                return;
            }
            if (isDev) {
                String message = this.register(usernameField.getText(), passwordField.getText(), emailField.getText(),
                        devField[0].getText());
                if (message.isEmpty()) {
                    JOptionPane.showMessageDialog(
                            this,
                            "Registration successful.",
                            "Success",
                            JOptionPane.INFORMATION_MESSAGE);
                } else {
                    JOptionPane.showMessageDialog(
                            this,
                            "Error registering. Message from server: " + message,
                            "Registration Failed",
                            JOptionPane.ERROR_MESSAGE);
                }
            } else {
                String message = this.register(usernameField.getText(), passwordField.getText(), emailField.getText(),
                        " ");
                if (message.isEmpty()) {
                    JOptionPane.showMessageDialog(
                            this,
                            "Registration successful.",
                            "Success",
                            JOptionPane.INFORMATION_MESSAGE);
                } else {
                    JOptionPane.showMessageDialog(
                            this,
                            "Error registering. Message from server: " + message,
                            "Registration Failed",
                            JOptionPane.ERROR_MESSAGE);
                }
            }
        });

        gbc.gridy++;

        // Login label
        JLabel loginLabel = new JLabel("<html>Already have an account? <a href=''>Login here</a></html>");
        loginLabel.setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        loginLabel.addMouseListener(new MouseListener() {

            @Override
            public void mouseClicked(java.awt.event.MouseEvent e) {
                RegistrationWindow.this.login();
                RegistrationWindow.this.dispose();
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
        registrationPanel.add(loginLabel, gbc);

        // Add the panel to window
        this.add(registrationPanel);

        // Open new window and hide original
        parentFrame.setVisible(false);
        this.setVisible(true);
    }

    protected abstract void login();

    protected abstract String register(String username, String password, String email, String companyName);
}
