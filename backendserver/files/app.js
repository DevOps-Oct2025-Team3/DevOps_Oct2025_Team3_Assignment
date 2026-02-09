const express = require('express');
const mongoose = require('mongoose'); 
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors"); 
const fs = require('fs');
const multer = require('multer');

dotenv.config();

const connectDB = require('./dbConfig.js');
const fileController = require("./controller/fileController.js");

const app = express();
const port = process.env.PORT || 4002;

// Middleware
app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
const { verifyJWT: authenticateToken } = require("./middlewares/userValidation.js");
connectDB();

const uploadsDir = path.join(__dirname, 'uploads');
try {
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
} catch (err) {
    console.error('Failed to create uploads directory:', err);
}

// Multer setup: store files inside the service under ./uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        cb(null, `${timestamp}-${randomString}-${file.originalname}`);
    }
});

const upload = multer({ 
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024  // 50MB limit
    },
    fileFilter: function (req, file, cb) {
        console.log(`[Multer] Receiving file: ${file.originalname} (${file.size} bytes)`);
        cb(null, true);
    }
});

// Routes
app.get("/dashboard", authenticateToken, fileController.getAllFiles);
app.post("/dashboard/upload", authenticateToken, upload.single('file'), fileController.uploadFile);
app.delete("/dashboard/delete/:id", authenticateToken, fileController.deleteFile);
app.get("/dashboard/download/:id", authenticateToken, fileController.downloadFile);

// Error handling middleware for multer
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        console.error("[Multer Error]:", error);
        return res.status(400).json({ message: `Upload error: ${error.message}` });
    } else if (error) {
        console.error("[Upload Error]:", error);
        return res.status(500).json({ message: "Upload failed", error: error.message });
    }
    next();
});

// Server
app.listen(port, () => {
    console.log(`📁 File Service running on port ${port}`);
});

// Graceful Shutdown
process.on("SIGINT", async () => {
    console.log("\nServer is gracefully shutting down...");
    try {
        await mongoose.connection.close();
        console.log("MongoDB connection closed.");
        process.exit(0);
    } catch (err) {
        console.error("Error closing MongoDB connection:", err);
        process.exit(1);
    }
});
