package gameRateUI;

import javax.swing.*;

import gameRateUI.Components.Dev.DeveloperWindow;
import gameRateUI.Components.Login.DevLoginWindow;
import gameRateUI.Components.Login.PlayerLoginWindow;
import gameRateUI.Services.DataBaseService;

import java.awt.*;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;
import java.awt.event.WindowListener;

public class Main extends JFrame {
    private static final String DB_SERVER = getEnvOrDefault("ARCADEIQ_DB_SERVER", "localhost");
    private static final String DB_PORT = getEnvOrDefault("ARCADEIQ_DB_PORT", "1433");
    private static final String DB_NAME = getEnvOrDefault("ARCADEIQ_DB_NAME", "ArcadeIQ");
    private static final String DB_USER = getEnvOrDefault("ARCADEIQ_DB_USER", "ArcadeIQApp");
    private static final String DB_PASSWORD = System.getenv("ARCADEIQ_DB_PASSWORD");
    private static final String DB_URL = String.format(
            "jdbc:sqlserver://%s:%s;databaseName=%s;encrypt=false;",
            DB_SERVER, DB_PORT, DB_NAME);

    private static WindowListener wcl = null;

    private static DataBaseService dbService = null;

    public Main() {
        if (DB_PASSWORD == null || DB_PASSWORD.isBlank()) {
            JOptionPane.showMessageDialog(null,
                    "Missing ARCADEIQ_DB_PASSWORD environment variable.");
            this.dispose();
            System.exit(0);
        }

        dbService = new DataBaseService(DB_URL, DB_USER, DB_PASSWORD);

        if (dbService.getConnection() == null) {
            JOptionPane.showMessageDialog(null,
                    "Connection to database could not be established.\nSee error message in system output.");
            this.dispose();
            System.exit(0);
        }

        //Testing developer window stuff
        //new DeveloperWindow(new JFrame(), dbService, "test", "Re-Logic");

        // Setup stuffs
        setTitle("Game Portal Login");
        setSize(600, 250);
        setDefaultCloseOperation(EXIT_ON_CLOSE);
        setLocationRelativeTo(null);

        // Get our layout established
        setLayout(new GridBagLayout());
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.gridx = 0;
        gbc.gridy = 0;
        gbc.anchor = GridBagConstraints.CENTER; // center alignment
        gbc.insets = new Insets(4, 5, 4, 5);

        // Make sure connection is closed upon window close
        wcl = new WindowAdapter() {
            @Override
            public void windowClosing(WindowEvent e) {
                dbService.closeConnection();
            }
        };
        addWindowListener(wcl);

        // Header
        JLabel header = new JLabel("Choose how to login", SwingConstants.CENTER);
        header.setFont(new Font("Arial", Font.BOLD, 20));

        gbc.gridx = 0;
        gbc.gridy = 0;
        gbc.gridwidth = 2; // header spans two columns
        add(header, gbc);
        gbc.gridwidth = 1;
        gbc.gridy++;

        // Button settings
        gbc.anchor = GridBagConstraints.CENTER;
        gbc.fill = GridBagConstraints.NONE;
        gbc.gridwidth = 1;

        // === Player Login ===
        JButton loginPlayerBtn = new JButton("Login as Player");
        this.add(loginPlayerBtn, gbc);

        loginPlayerBtn.addActionListener(e -> {
            new PlayerLoginWindow(this, dbService);
        });

        gbc.gridx++;

        // === Developer Login ===
        JButton loginDevBtn = new JButton("Login as Developer");
        this.add(loginDevBtn, gbc);

        loginDevBtn.addActionListener(e -> {
            new DevLoginWindow(this, dbService);
        });

        // Open main UI
        setVisible(true);
    }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(Main::new);
    }

    private static String getEnvOrDefault(String name, String fallback) {
        String value = System.getenv(name);
        return value == null || value.isBlank() ? fallback : value;
    }
}
