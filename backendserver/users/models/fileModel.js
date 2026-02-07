const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function getAllFiles(userId = null){
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        let query = `
            SELECT f.FileName, f.FileSize, f.UploadedAt
            FROM Files f
            INNER JOIN Users u ON f.UserId = u.UserId
        `;
        
        const request = connection.request();
        
        if(userId){
            query += " WHERE f.UserId = @UserId";
            request.input("UserId", userId);
        }
        
        query += " ORDER BY f.UploadedAt DESC";
        
        const result = await request.query(query);
        return result.recordset;

    } catch (error){
        console.error("Database error in getAllFiles: ", error);
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

async function uploadFile(fileData){
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const query = `
            INSERT INTO Files (UserId, FileName, FilePath, FileSize, FileType)
            VALUES (@UserId, @FileName, @FilePath, @FileSize, @FileType);
            SELECT SCOPE_IDENTITY() AS FileId;
        `;
        
        const request = connection.request();
        request.input("UserId", fileData.UserId);
        request.input("FileName", fileData.FileName);
        request.input("FilePath", fileData.FilePath);
        request.input("FileSize", fileData.FileSize);
        request.input("FileType", fileData.FileType);
        
        const result = await request.query(query);
        
        if(!result.recordset || result.recordset.length === 0){
            return null;
        }
        
        const newFileId = result.recordset[0].FileId;
        const newQuery = `
            SELECT f.FileId, f.UserId, f.FileName, f.FilePath, f.FileSize, f.FileType, f.UploadedAt
            FROM Files f
            WHERE f.FileId = @FileId
        `;
        const newRequest = connection.request();
        newRequest.input("FileId", newFileId);
        const newResult = await newRequest.query(newQuery);
        return newResult.recordset[0];
        
    } catch (error){
        console.error("Database error in uploadFile: ", error);
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

async function deleteFile(fileId){
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const query = "DELETE FROM Files WHERE FileId = @FileId";
        const request = connection.request();
        request.input("FileId", fileId);
        const result = await request.query(query);
        return result.rowsAffected[0] > 0;

    } catch (error){
        console.error("Database error in deleteFile: ", error);
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

async function downloadFile(fileId){
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const query = `
            SELECT f.FilePath
            FROM Files f
            WHERE f.FileId = @FileId
        `;
        const request = connection.request();
        request.input("FileId", fileId);
        const result = await request.query(query);
        return result.recordset[0];

    } catch (error){
        console.error("Database error in downloadFile: ", error);
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
    getAllFiles,
    uploadFile,
    deleteFile,
    downloadFile
}