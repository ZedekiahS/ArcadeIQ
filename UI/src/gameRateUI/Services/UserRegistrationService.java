package gameRateUI.Services;

import java.sql.*;

public class UserRegistrationService {

	public static String registerUser(String username, String password, String email, DataBaseService dBaseService) {
		try {
			CallableStatement CS = dBaseService.getConnection()
					.prepareCall("{call RegisterUser(?, ?, ?, ?, ?, ?, ?, ?)}");
			if(username.isBlank()) username = null;
			if(password.isBlank()) password = null;
			if(email.isBlank()) email = null;
			CS.setString(1, username);
			CS.setString(2, email);
			CS.setString(3, HashingService.hashPassword(password));
			CS.setNull(4, Types.DATE);
			CS.setNull(5, Types.INTEGER);
			CS.setNull(6, Types.DATE);
			CS.setNull(7, Types.SMALLINT);
			CS.setNull(8, Types.VARCHAR);
			CS.execute();
			return "";
		} catch (SQLException e) {
			System.out.println(e.getMessage());
			return e.getMessage();
		}
	}

	public static String registerDevUser(String username, String password, String email, String companyName,
			DataBaseService dBaseService) {
		try {
			CallableStatement CS = dBaseService.getConnection()
					.prepareCall("{call RegisterDeveloperUser(?, ?, ?, ?, ?, ?, ?, ?, ?)}");
			if(username.isBlank()) username = null;
			if(password.isBlank()) password = null;
			if(email.isBlank()) email = null;
			if(companyName.isBlank()) companyName = null;
			CS.setString(1, username);
			CS.setString(2, email);
			CS.setString(3, HashingService.hashPassword(password));
			CS.setNull(4, Types.DATE);
			CS.setNull(5, Types.INTEGER);
			CS.setNull(6, Types.DATE);
			CS.setNull(7, Types.SMALLINT);
			CS.setNull(8, Types.VARCHAR);
			CS.setString(9, companyName);
			CS.execute();
			return "";
		} catch (SQLException e) {
			System.out.println(e.getMessage());
			return e.getMessage();
		}

	}
}
