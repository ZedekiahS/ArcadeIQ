package gameRateUI.Services;

public class UserAuthenticationService {
    private DataBaseService dBaseService = null;

    public UserAuthenticationService(DataBaseService dBaseService) {
        this.dBaseService = dBaseService;
    }

    public boolean authenticateDeveloper(String name, String password) {
        return HashingService.comparePasswordToHash(name, password, dBaseService, true);
    }

    public boolean authenticateUser(String name, String password) {
        return HashingService.comparePasswordToHash(name, password, dBaseService, false);
    }
}
