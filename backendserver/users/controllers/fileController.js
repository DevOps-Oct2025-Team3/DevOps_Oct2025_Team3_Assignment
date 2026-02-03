const fileModel = require("../models/fileModel");

async function getAllFiles(req, res){
    try{
        const userId = req.query.userId || req.user?.UserId; // Optional: filter by user
        const files = await fileModel.getAllFiles(userId);
        return res.status(200).json(files);
    } catch (error){
        console.error("Controller error in getAllFiles: ", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function uploadFile(req, res){
    try{
        const fileData = {
            UserId: req.body.UserId || req.user?.UserId,
            FileName: req.body.FileName,
            FilePath: req.body.FilePath,
            FileSize: req.body.FileSize,
            FileType: req.body.FileType
        };
        
        const newFile = await fileModel.uploadFile(fileData);
        return res.status(201).json(newFile);
    } catch (error){
        console.error("Controller error in uploadFile: ", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function deleteFile(req, res){
    const fileId = req.params.id;
    if(isNaN(fileId)){
        return res.status(400).json({ message: "Invalid file ID" });
    }

    try{
        const deleted = await fileModel.deleteFile(fileId); 
        if(deleted){
            return res.status(200).json({ message: "File deleted successfully" });
        } else {
            return res.status(404).json({ message: "File not found" });
        }
    } catch (error){
        console.error("Controller error in deleteFile: ", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function downloadFile(req, res){
    const fileId = req.params.id;
    if(isNaN(fileId)){
        return res.status(400).json({ message: "Invalid file ID" });
    }
    
    try{
        const file = await fileModel.downloadFile(fileId);
        if(file){
            return res.status(200).json(file);
        } else {
            return res.status(404).json({ message: "File not found" });
        }
    } catch (error){
        console.error("Controller error in downloadFile: ", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = {
    getAllFiles,
    uploadFile,
    deleteFile,
    downloadFile
}