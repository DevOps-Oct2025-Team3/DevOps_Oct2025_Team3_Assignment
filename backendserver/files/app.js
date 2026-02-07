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

// Ensure uploads directory exists
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
        // keep original name (could also add timestamp/uid here)
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Routes
app.get("/dashboard", authenticateToken, fileController.getAllFiles);
app.post("/dashboard/upload", authenticateToken, upload.single('file'), fileController.uploadFile);
app.delete("/dashboard/delete/:id", authenticateToken, fileController.deleteFile);
app.get("/dashboard/download/:id", authenticateToken, fileController.downloadFile);

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
