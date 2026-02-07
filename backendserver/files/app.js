const express = require('express');
const mongoose = require('mongoose'); 
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors"); 

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
const authenticateToken = require("./middleware/auth");
connectDB();

// Routes
app.get("/", authenticateToken, fileController.getAllFiles);
app.post("/", authenticateToken,fileController.uploadFile);
app.delete("/:id", authenticateToken, fileController.deleteFile);
app.get("/:id/download", authenticateToken, fileController.downloadFile);

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
