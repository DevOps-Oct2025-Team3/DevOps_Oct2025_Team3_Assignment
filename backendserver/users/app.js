const express = require('express');
const mongoose = require('mongoose'); 
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors"); 

dotenv.config();

const userController = require("./controllers/userController.js");
const { 
    validateUser,
    validateId,
    verifyJWT 
} = require("./middlewares/userValidation.js");
const { 
    loginLimiter, 
    createUserLimiter, 
    deleteUserLimiter,
    apiLimiter 
} = require("./middlewares/rateLimiter.js");
const connectDB = require('./dbConfig.js');
const app = express();
const port = process.env.PORT || 4001;

// Middleware
app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Apply general API rate limiting to all routes
app.use(apiLimiter);

connectDB();

// --- Routes ---
app.post("/login", loginLimiter, userController.login); 
app.get("/logout", (req, res) => {return res.status(200).json({ message: "Logged out successfully" });});
app.get("/admin", verifyJWT, userController.getAllUsers);
app.post("/admin/create_user", verifyJWT, createUserLimiter, validateUser, userController.createUser);
app.delete("/admin/delete_user/:id", verifyJWT, deleteUserLimiter, validateId, userController.deleteUser);



// --- Server Start ---
app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});

// --- Graceful Shutdown ---
process.on("SIGINT", async () => {
    console.log("\nServer is gracefully shutting down...");
    try {
        await mongoose.connection.close(); // Close MongoDB connection
        console.log("MongoDB connection closed.");
        process.exit(0);
    } catch (err) {
        console.error("Error closing MongoDB connection:", err);
        process.exit(1);
    }
});