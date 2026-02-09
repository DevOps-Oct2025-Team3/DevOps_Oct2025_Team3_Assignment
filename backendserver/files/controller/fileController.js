const File = require("../model/fileModel");

//get files by user 
async function getAllFiles(req, res) {
    try {
        const userId = req.user.userId;

        const files = await File.find({ UserId: userId })
            .sort({ UploadedAt: -1 });

        return res.status(200).json(files);
    } catch (error) {
        console.error("Controller error in getAllFiles:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

//post via multer
async function uploadFile(req, res) {
    try {
        if (!req.file) {
            console.error("[uploadFile] No file in request");
            return res.status(400).json({ message: "No file uploaded" });
        }

        console.log(`[uploadFile] File received: ${req.file.filename} (size: ${req.file.size} bytes)`);

        const newFile = new File({
            UserId: req.user.userId,
            FileName: req.file.originalname,
            FilePath: req.file.path,
            FileSize: req.file.size,
            FileType: req.file.mimetype,
            UploadedAt: new Date()
        });

        const savedFile = await newFile.save();
        console.log(`[uploadFile] File metadata saved to database: ${savedFile._id}`);
        
        return res.status(201).json({
            _id: savedFile._id,
            FileName: savedFile.FileName,
            FileSize: savedFile.FileSize,
            FilePath: savedFile.FilePath,
            UploadedAt: savedFile.UploadedAt,
            message: "File uploaded and saved successfully"
        });

    } catch (error) {
        console.error("[uploadFile] Error:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

//delete/:id
async function deleteFile(req, res) {
    try {
        const file = await File.findById(req.params.id);

        if (!file) {
            return res.status(404).json({ message: "File not found" });
        }

        if (file.UserId !== req.user.userId && req.user.role !== "Admin") {
            return res.status(403).json({ message: "Access denied" });
        }

        await File.findByIdAndDelete(req.params.id);
        return res.status(200).json({ message: "File deleted successfully" });

    } catch (error) {
        console.error("Controller error in deleteFile:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function downloadFile(req, res) {
    try {
        const file = await File.findById(req.params.id);

        if (!file) {
            return res.status(404).json({ message: "File not found" });
        }

        if (file.UserId !== req.user.userId && req.user.role !== "Admin") {
            return res.status(403).json({ message: "Access denied" });
        }

        // Stream the file to the client
        res.download(file.FilePath, file.FileName);

    } catch (error) {
        console.error("Controller error in downloadFile:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = {
    getAllFiles,
    uploadFile,
    deleteFile,
    downloadFile 
};
