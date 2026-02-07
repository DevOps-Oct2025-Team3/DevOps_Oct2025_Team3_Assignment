const File = require("../model/fileModel");

/**
 * GET /
 * List files belonging to logged-in user
 */
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

/**
 * POST /
 * Upload file (via multer)
 */
async function uploadFile(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const newFile = new File({
            UserId: req.user.userId,          // ✅ ONLY from JWT
            FileName: req.file.originalname,
            FilePath: req.file.path,
            FileSize: req.file.size,
            FileType: req.file.mimetype
        });

        const savedFile = await newFile.save();
        return res.status(201).json(savedFile);

    } catch (error) {
        console.error("Controller error in uploadFile:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

/**
 * DELETE /:id
 */
async function deleteFile(req, res) {
    try {
        const file = await File.findById(req.params.id);

        if (!file) {
            return res.status(404).json({ message: "File not found" });
        }

        // Optional: ownership check
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

/**
 * GET /:id/download
 * (for now returns metadata – can stream file later)
 */
async function downloadFile(req, res) {
    try {
        const file = await File.findById(req.params.id);

        if (!file) {
            return res.status(404).json({ message: "File not found" });
        }

        if (file.UserId !== req.user.userId && req.user.role !== "Admin") {
            return res.status(403).json({ message: "Access denied" });
        }

        return res.status(200).json(file);

    } catch (error) {
        console.error("Controller error in downloadFile:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = {
    getAllFiles,
    uploadFile,
    deleteFile,
    downloadFile   // ✅ FIXED
};
