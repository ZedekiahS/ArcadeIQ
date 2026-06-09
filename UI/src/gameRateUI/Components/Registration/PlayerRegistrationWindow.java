package gameRateUI.Components.Registration;

import javax.swing.JFrame;

import gameRateUI.Components.Login.PlayerLoginWindow;
import gameRateUI.Services.DataBaseService;
import gameRateUI.Services.UserRegistrationService;

public class PlayerRegistrationWindow extends RegistrationWindow {
    public PlayerRegistrationWindow(JFrame parentFrame, DataBaseService dBaseService) {
        super("Player", parentFrame, dBaseService, false);
    }

    @Override
    protected void login() {
        new PlayerLoginWindow(super.parentFrame, dBaseService);
    }

    @Override
    protected String register(String username, String password, String email, String companyName) {
        return UserRegistrationService.registerUser(username, password, email, dBaseService);
    }
}
