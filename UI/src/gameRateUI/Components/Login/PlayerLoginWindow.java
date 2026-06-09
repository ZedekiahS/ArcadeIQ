package gameRateUI.Components.Login;

import java.sql.SQLException;

import javax.swing.JFrame;
import javax.swing.JOptionPane;

import gameRateUI.Components.Player.PlayerHub;
import gameRateUI.Components.Registration.PlayerRegistrationWindow;
import gameRateUI.Services.DataBaseService;

public class PlayerLoginWindow extends LoginWindow {
    public PlayerLoginWindow(JFrame parentFrame, DataBaseService dBaseService) {
        super("Player", parentFrame, dBaseService);
    }

    @Override
    protected void login(String username, String password) {
         if (super.authService.authenticateUser(username, password)) {
            try {
                    int uid = super.dBaseService.getUserIdByUsername(username);
                    super.dBaseService.setCurrentUserId(uid);
                } catch (SQLException ex) {
                    JOptionPane.showMessageDialog(
                        this,
                        "Unable to fetch your user ID:\n" + ex.getMessage(),
                        "Login Failed",
                        JOptionPane.ERROR_MESSAGE);
                    return;
                }

                JOptionPane.showMessageDialog(
                        this,
                        "Login successful.",
                        "Success",
                        JOptionPane.INFORMATION_MESSAGE);
                new PlayerHub(super.dBaseService, username, super.parentFrame);
                this.dispose();
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
        new PlayerRegistrationWindow(parentFrame, dBaseService);
    }
}
