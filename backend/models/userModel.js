const sql = require("mssql");
const dbConfig = require("../dbConfig");
const bcrypt = require("bcrypt");

// Get all users
async function getAllUsers(){
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const query="SELECT UserId, Username, Role FROM Users";
        const result = await connection.request().query(query);
        return result.recordset;

    } catch (error){
        console.error("Database error in getAllUsers: ", error);
        throw error;
    } finally{
        if(connection){
            try{
                await connection.close();
            } catch(err){
                console.error("Error closing connection: ", err);
            }
        }
    }
}

// Get user by username
async function getUserByUsername(username){
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const query="SELECT * FROM Users WHERE Username = @Username";
        const request = connection.request();
        request.input("Username", username);
        const result = await request.query(query);
        return result.recordset[0];
    } catch (error){
        console.error("Database error in getUserByUsername: ", error);
        throw error;
    } finally{
        if(connection){
            try{
                await connection.close();
            } catch(err){
                console.error("Error closing connection: ", err);
            }
        }
    }
}  

// Create user
async function createUser(user){
    let connection;
    try{
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(user.Password, saltRounds);

        connection = await sql.connect(dbConfig);
        const query=`
            INSERT INTO Users (Username, PasswordHash, Role) 
            VALUES (@Username, @PasswordHash, @Role)
            SELECT SCOPE_IDENTITY() AS UserId
        `;

        const request = connection.request();
        request.input("Username", user.Username);
        request.input("PasswordHash", passwordHash);
        request.input("Role", user.Role);
        
        const result = await request.query(query);

        if(!result.recordset || result.recordset.length === 0){
            return null;
        }

        const newUserId = result.recordset[0].UserId;
        const newQuery = "SELECT UserId, Username, Role FROM Users WHERE UserId = @UserId";
        const newRequest = connection.request();
        newRequest.input("UserId", newUserId);
        const newResult = await newRequest.query(newQuery);
        return newResult.recordset[0];

    } catch (error){
        console.error("Database error in createUser: ", error);
        throw error;
    } finally{
        if(connection){
            try{
                await connection.close();
            } catch(err){
                console.error("Error closing connection: ", err);
            }   
        }
    }
}

// Delete user by UserId
async function deleteUser(userId){
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const query="DELETE FROM Users WHERE UserId = @UserId";
        const request = connection.request();
        request.input("UserId", userId);
        const result = await request.query(query);
        return result.rowsAffected[0] > 0;

    } catch (error){
        console.error("Database error in deleteUser: ", error);
        throw error;
    } finally{
        if(connection){
            try{
                await connection.close();
            } catch(err){
                console.error("Error closing connection: ", err);
            }   
        }   
    }
}

module.exports = {
    getAllUsers,
    getUserByUsername,
    createUser,
    deleteUser
}