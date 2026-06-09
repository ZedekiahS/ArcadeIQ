package gameRateUI.Components.Player;

import javax.swing.JFrame;

import gameRateUI.Services.DataBaseService;

import java.awt.BorderLayout;
import java.sql.CallableStatement;

import javax.swing.*;

import java.sql.*;

public class RedeemVoucher extends JFrame {

    public RedeemVoucher(DataBaseService dBaseService, String username) {
        setTitle("Redeem vouchers");
        setDefaultCloseOperation(JFrame.DISPOSE_ON_CLOSE);
        setSize(400, 150);
        setLocationRelativeTo(null);

        // Create components
        JLabel titleLabel = new JLabel("Enter your code:");
        JTextField inputField = new JTextField(20);
        JButton submitButton = new JButton("Submit");

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
        add(bottomPanel, BorderLayout.SOUTH);

        // Button actions
        submitButton.addActionListener(e -> {
            String input = inputField.getText();
            try {
                //Get user id
                String userIdQuery = "{call GetUserID(?,?,?)}";
                CallableStatement userIdCall = dBaseService.getConnection().prepareCall(userIdQuery);
                userIdCall.setString(1, username);
                userIdCall.setBoolean(2, false);
                userIdCall.registerOutParameter(3, Types.INTEGER);
                userIdCall.execute();
                int userId = userIdCall.getInt(3);

                //Redeem voucher
                String redeemVoucherQuery = "{call RedeemVoucher(?,?)}";
                CallableStatement addVoucherCall = dBaseService.getConnection().prepareCall(redeemVoucherQuery);
                addVoucherCall.setInt(1, Integer.parseInt(input));
                addVoucherCall.setInt(2, userId);
                addVoucherCall.execute();
                JOptionPane.showMessageDialog(null, "Voucher redeemed!");
            } catch(SQLException ex) {
                JOptionPane.showMessageDialog(null, "Error redeeming voucher: " + ex.getMessage());
            } catch(Exception ex) {
                JOptionPane.showMessageDialog(null, "A different error occured when redeeming the voucher: " + ex.getMessage());
            }
        });

        setVisible(true);
    }
}
