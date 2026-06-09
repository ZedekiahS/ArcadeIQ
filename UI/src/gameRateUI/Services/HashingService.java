package gameRateUI.Services;

import java.sql.*;

import at.favre.lib.crypto.bcrypt.BCrypt;

public class HashingService {
    private static final int SALTING_ROUNDS = 8;

    public static boolean comparePasswordToHash(String username, String passwordInput, DataBaseService dataBaseService,
            boolean dev) {
        if (username.length() > 30) {
            return false;
        }
        if(username.isBlank() || passwordInput.isBlank()) {
            return false;
        }
        Connection connection = dataBaseService.getConnection();
        String userIdQuery = "{call GetUserID(?, ?, ?)}";
        String userHashQuery = "{call GetUserPassHash(?, ?, ?)}";
        try {
            // Get user id from username
            CallableStatement userIdCall = connection.prepareCall(userIdQuery);
            userIdCall.setString(1, username);
            userIdCall.setBoolean(2, dev);
            userIdCall.registerOutParameter(3, Types.INTEGER);
            userIdCall.execute();
            int userId = userIdCall.getInt(3);

            // Get stored hash
            CallableStatement userHashCall = connection.prepareCall(userHashQuery);
            userHashCall.setInt(1, userId);
            userHashCall.setBoolean(2, dev);
            userHashCall.registerOutParameter(3, Types.VARCHAR);
            userHashCall.execute();
            String userHash = userHashCall.getString(3);

            // Check the hash
            return BCrypt.verifyer().verify(passwordInput.toCharArray(), userHash.toCharArray()).verified;
        } catch (SQLException e) {
            return false;
        }
    }

    public static String hashPassword(String passwordInput) {
        if(passwordInput == null) return null;
        return BCrypt.withDefaults().hashToString(SALTING_ROUNDS, passwordInput.toCharArray());
    }
}
