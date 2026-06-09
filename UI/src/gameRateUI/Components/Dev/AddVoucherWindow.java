package gameRateUI.Components.Dev;

import java.awt.BorderLayout;
import java.sql.CallableStatement;
import java.sql.SQLException;
import java.util.UUID;

import javax.swing.JButton;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JTextField;

import gameRateUI.Services.DataBaseService;

public class AddVoucherWindow extends JFrame {

    public AddVoucherWindow(int gameId, DataBaseService dBaseService) {
        setTitle("Add vouchers");
        setDefaultCloseOperation(JFrame.DISPOSE_ON_CLOSE);
        setSize(400, 150);
        setLocationRelativeTo(null);

        // Create components
        JLabel titleLabel = new JLabel("Enter your code:");
        JTextField inputField = new JTextField(20);
        JButton submitButton = new JButton("Submit");
        JButton randomButton = new JButton("Generate Random");

        // Set layout
        setLayout(new BorderLayout());

        // Top label
        JPanel topPanel = new JPanel();
        topPanel.add(titleLabel);
        add(topPanel, BorderLayout.NORTH);

        // Center input
        JPanel centerPanel = new JPanel();
        centerPanel.add(inputField);
        add(centerPanel, BorderLayout.CENTER);

        // Bottom buttons
        JPanel bottomPanel = new JPanel();
        bottomPanel.add(submitButton);
        bottomPanel.add(randomButton);
        add(bottomPanel, BorderLayout.SOUTH);

        // Button actions
        submitButton.addActionListener(e -> {
            String input = inputField.getText();
            try {
                String addVoucherQuery = "{call CreateVoucher(?,?)}";
                CallableStatement addVoucherCall = dBaseService.getConnection().prepareCall(addVoucherQuery);
                addVoucherCall.setInt(1, Integer.parseInt(input));
                addVoucherCall.setInt(2, gameId);
                addVoucherCall.execute();
                JOptionPane.showMessageDialog(null, "You submitted voucher: " + input);
            } catch(SQLException ex) {
                JOptionPane.showMessageDialog(null, "Error adding voucher: " + ex.getMessage());
            } catch(Exception ex) {
                JOptionPane.showMessageDialog(null, "A different error occured when adding the voucher: " + ex.getMessage());
            }
        });

        randomButton.addActionListener(e -> {
            int randomCode = (int)(Math.random() * 900_000) + 100_000;
            inputField.setText(String.valueOf(randomCode));
        });

        setVisible(true);
    }
}
