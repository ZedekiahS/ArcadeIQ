package gameRateUI.Components.Registration;

import javax.swing.JFrame;

import gameRateUI.Components.Login.DevLoginWindow;
import gameRateUI.Services.DataBaseService;
import gameRateUI.Services.UserRegistrationService;

public class DevRegistrationWindow extends RegistrationWindow {

    public DevRegistrationWindow(JFrame parentFrame, DataBaseService dBaseService) {
        super("Developer", parentFrame, dBaseService, true);
    }

    @Override
    protected void login() {
        new DevLoginWindow(super.parentFrame, dBaseService);
    }

    @Override
    protected String register(String username, String password, String email, String companyName) {
        return UserRegistrationService.registerDevUser(username, password, email, companyName, dBaseService);
    }
}
