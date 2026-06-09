package gameRateUI.Services;

import java.sql.*;

import gameRateUI.Components.Models.Folder;
import gameRateUI.Components.Models.GameInFolder;
import java.util.ArrayList;
import java.util.List;

public class DataBaseService {
    private Connection connection = null;
    private int currentUserId;

    public DataBaseService(String connectionInfo, String user, String password) {
        try {
            connection = DriverManager.getConnection(connectionInfo, user, password);
            System.out.println("Success! Connection is " + connection.toString());
        } catch (SQLException e) {
            System.out.println("ERROR: Could not establish connection.\nMessage: " + e.getMessage());
        }
    }

    public Connection getConnection() {
        return connection;
    }

    public void closeConnection() {
        if (connection != null) {
            try {
                connection.close();
            } catch (SQLException e) {
                System.err.println("Error closing connection: " + e.getMessage());
            }
        }
    }

        public List<String> getAllTags() {
        List<String> tags = new ArrayList<>();
        String sql = "{ call dbo.GetAllTags }";
        try (CallableStatement cs = connection.prepareCall(sql)) {
            boolean hasResult = cs.execute();
            if (hasResult) {
                try (ResultSet rs = cs.getResultSet()) {
                    while (rs.next()) {
                        tags.add(rs.getString("TagName"));
                    }
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return tags;
    }

    public int getUserIdByUsername(String username, boolean isDev) throws SQLException {
        String sql = "{ CALL dbo.GetUserID(?, ?, ?) }";
        try (CallableStatement cs = connection.prepareCall(sql)) {
            cs.setString(1, username);
             cs.setBoolean(2, isDev);
            cs.registerOutParameter(3, Types.INTEGER);
            cs.execute();
            return cs.getInt(3);
        }
    }

    public void setCurrentUserId(int userId) {
        this.currentUserId = userId;
    }

    public int getUserIdByUsername(String username) throws SQLException {
        return getUserIdByUsername(username, false);
    }

        public List<String> getAllProducers() {
        List<String> prods = new ArrayList<>();
        String sql = "{ call dbo.GetAllProducers }";
        try (CallableStatement cs = connection.prepareCall(sql)) {
            boolean hasResult = cs.execute();
            if (hasResult) {
                try (ResultSet rs = cs.getResultSet()) {
                    while (rs.next()) {
                        prods.add(rs.getString("Producer"));
                    }
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return prods;
    }

    public List<String> getAllDevelopers() {
        List<String> devs = new ArrayList<>();
        String sql = "{ call dbo.GetAllDevelopers }";
        try (CallableStatement cs = connection.prepareCall(sql)) {
            boolean hasResult = cs.execute();
            if (hasResult) {
                try (ResultSet rs = cs.getResultSet()) {
                    while (rs.next()) {
                        devs.add(rs.getString("Developer"));
                    }
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return devs;
    }
    public int createFolder(int userId, String name, String description, boolean isPublic) throws SQLException {
        String sql = "{ CALL dbo.CreateFolder(?, ?, ?, ?, ?) }";
        try (CallableStatement cs = connection.prepareCall(sql)) {
            cs.setInt(1, userId);
            cs.setString(2, name);
            if (description != null) cs.setString(3, description);
            else cs.setNull(3, Types.NVARCHAR);
            cs.setBoolean(4, isPublic);
            cs.registerOutParameter(5, Types.INTEGER);
            cs.execute();
            return cs.getInt(5);
        }
    }

    public void updateFolder(int folderId, String name, String description, boolean isPublic) throws SQLException {
        String sql = "{ CALL dbo.UpdateFolder(?, ?, ?, ?) }";
        try (CallableStatement cs = connection.prepareCall(sql)) {
            cs.setInt(1, folderId);
            cs.setString(2, name);
            if (description != null) cs.setString(3, description);
            else cs.setNull(3, Types.NVARCHAR);
            cs.setBoolean(4, isPublic);
            cs.execute();
        }
    }

    public void deleteFolder(int folderId) throws SQLException {
        String sql = "{ CALL dbo.DeleteFolder(?) }";
        try (CallableStatement cs = connection.prepareCall(sql)) {
            cs.setInt(1, folderId);
            cs.execute();
        }
    }

public void addGameToFolderByName(String folderName, String gameName, String note) throws SQLException {
        String sql = "{ CALL dbo.AddGameToFolderByName(?, ?, ?, ?) }";
        try (CallableStatement cs = connection.prepareCall(sql)) {
            cs.setInt(1, currentUserId);
            cs.setString(2, folderName);
            cs.setString(3, gameName);
            if (note != null) cs.setString(4, note);
            else              cs.setNull(4, Types.NVARCHAR);
            cs.execute();
        }
    }

    public List<GameInFolder> getGamesInFolder(int folderId) throws SQLException {
        List<GameInFolder> list = new ArrayList<>();
        String sql = "{ CALL dbo.GetGamesInFolder(?, ?) }";
        try (CallableStatement cs = connection.prepareCall(sql)) {
            cs.setInt(1, currentUserId);
            cs.setInt(2, folderId);
            try (ResultSet rs = cs.executeQuery()) {
                while (rs.next()) {
                    list.add(new GameInFolder(
                      rs.getInt("ID"),
                      rs.getString("Name"),
                      rs.getBigDecimal("Price"),
                      rs.getDate("ReleaseDate"),
                      rs.getString("note")
                    ));
                }
            }
        }
        return list;
    }

        public void removeGameFromFolder(int folderId, int gameId) throws SQLException {
        String sql = "{ CALL dbo.RemoveGameFromFolder(?, ?, ?) }";
        try (CallableStatement cs = connection.prepareCall(sql)) {
            cs.setInt(1, currentUserId);
            cs.setInt(2, folderId);
            cs.setInt(3, gameId);
            cs.execute();
        }
    }
    public List<Folder> getUserFolders() throws SQLException {
        List<Folder> list = new ArrayList<>();
        String sql = "{ CALL dbo.GetUserFolders(?) }";
        try (CallableStatement cs = connection.prepareCall(sql)) {
            cs.setInt(1, currentUserId);
            boolean has = cs.execute();
            if (has) {
                try (ResultSet rs = cs.getResultSet()) {
                    while (rs.next()) {
                        list.add(new Folder(
                            rs.getInt("FolderID"),
                            rs.getString("FolderName"),
                            rs.getString("Description"),
                            rs.getBoolean("ispublic"),
                            rs.getDate("createdate")   
                        ));
                    }
                }
            }
        }
        return list;
    }
    public int createFolder(String name, String description, boolean isPublic) throws SQLException {
        return createFolder(currentUserId, name, description, isPublic);
    }
}
