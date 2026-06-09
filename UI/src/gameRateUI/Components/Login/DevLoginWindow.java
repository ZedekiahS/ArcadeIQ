package gameRateUI.Components.Login;

import java.sql.CallableStatement;
import java.sql.SQLException;
import java.sql.Types;

import javax.swing.JFrame;
import javax.swing.JOptionPane;


import gameRateUI.Components.Registration.DevRegistrationWindow;
import gameRateUI.Components.Dev.DeveloperWindow;
import gameRateUI.Services.DataBaseService;

public class DevLoginWindow extends LoginWindow {

    private final JFrame parentFrame;

    public DevLoginWindow(JFrame parentFrame, DataBaseService dBaseService) {
        super("Developer", parentFrame, dBaseService);
        this.parentFrame = parentFrame;
    }

    @Override
    protected void login(String username, String password) {
        try {
            int uid = super.dBaseService.getUserIdByUsername(username,true);
            super.dBaseService.setCurrentUserId(uid);
        } catch (SQLException ex) {
            JOptionPane.showMessageDialog(
                this,
                "Unable to fetch your user ID:\n" + ex.getMessage(),
                "Login Failed",
                JOptionPane.ERROR_MESSAGE);
            return;
        }
        if (super.authService.authenticateDeveloper(username, password)) {
            JOptionPane.showMessageDialog(
                    this,
                    "Login successful.",
                    "Success",
                    JOptionPane.INFORMATION_MESSAGE);
            this.dispose();
            try{
                String companyNameQuery = "{call GetCompanyName(?,?)}";
                CallableStatement companyNameCall = dBaseService.getConnection().prepareCall(companyNameQuery);
                companyNameCall.setString(1, username);
                companyNameCall.registerOutParameter(2, Types.NVARCHAR);
                companyNameCall.execute();
                new DeveloperWindow(parentFrame, dBaseService, username, companyNameCall.getNString(2));
            } catch(SQLException e) {
                JOptionPane.showMessageDialog(
                    this,
                    "Could not open the developer window: " + e.getMessage(),
                    "Erorr",
                    JOptionPane.ERROR_MESSAGE);
            }
        } else {
            JOptionPane.showMessageDialog(
                    this,
                    "Error logging in. Please check your credentials and try again.",
                    "Login Failed",
                    JOptionPane.ERROR_MESSAGE);
        }
    }

    @Override
    protected void register() {
        new DevRegistrationWindow(parentFrame, dBaseService);
    }
}
