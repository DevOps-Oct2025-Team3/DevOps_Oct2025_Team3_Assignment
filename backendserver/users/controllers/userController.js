const User = require("../models/userModel.js");
const Counter = require("../models/counterModel.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

async function getNextSequence(sequenceName) {
    const counter = await Counter.findByIdAndUpdate(
        { _id: sequenceName },
        { $inc: { seq: 1 } },
        { new: true, upsert: true } // Create the counter if it doesn't exist yet
    );
    return counter.seq.toString();
}

async function getAllUsers(req, res) {
    try {
        const users = await User.find({}, '-passwordHash');
        return res.status(200).json(users);
    } catch (error) {
        console.error("Controller error in getAllUsers: ", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function createUser(req, res) {
    const { username, password, role } = req.body;

    try {
        // Validate username
        if (typeof username !== "string" || username.trim() === "") {
            return res.status(400).json({ message: "Invalid username" });
        }

        // Validate password complexity (8+ chars, 1 uppercase, 1 lowercase, 1 number)
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ message: "Password has to be at least 8 characters long, include one uppercase letter, one lowercase letter, and one number." });
        }

        // Validate role
        const validRoles = ["Admin", "User"];
        if (role && !validRoles.includes(role)) {
            return res.status(400).json({ message: "Invalid user role" });
        }

        // Check if username already exists
        const existingUser = await User.findOne({ username: username.trim() });
        if (existingUser) {
            return res.status(400).json({ message: "Username already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Get next user ID
        const nextId = await getNextSequence("userId");

        // Create new user
        const newUser = new User({
            userId: nextId,
            username: username.trim(),
            passwordHash: hashedPassword,
            role: role || 'User'
        });

        const savedUser = await newUser.save();

        // Return user without password
        const responseUser = savedUser.toObject();
        delete responseUser.passwordHash;

        return res.status(201).json(responseUser);
    } catch (error) {
        console.error("Controller error in createUser: ", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function deleteUser(req, res) {
    const targetUserId = req.params.id; 
    const safeTargetUserId = String(targetUserId).replace(/[\r\n]/g, "");

    try {
        // Find the user first
        const user = await User.findOne({ userId: safeTargetUserId });
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Cascade delete: Delete all files associated with this user
        try {
            const mongoose = require('mongoose');
            const fs = require('fs').promises;
            
            // Check if Files model exists (shared database scenario)
            try {
                const FilesModel = mongoose.model('files');
                
                // Get all files for this user
                const userFiles = await FilesModel.find({ UserId: safeTargetUserId });
                
                // Delete physical files from uploads folder
                for (const file of userFiles) {
                    try {
                        await fs.unlink(file.FilePath);
                        console.log(`[deleteUser] Deleted physical file: ${file.FilePath}`);
                    } catch (fsError) {
                        console.error(`[deleteUser] Error deleting physical file ${file.FilePath}: ${fsError.message}`);
                    }
                }
                
                // Delete file database records
                const deleteResult = await FilesModel.deleteMany({ UserId: safeTargetUserId });
                console.log(`[deleteUser] Cascade delete: Removed ${deleteResult.deletedCount} file(s) for user ${safeTargetUserId}`);
            } catch (modelError) {
                // Files model not registered - expected in microservices mode
                console.log(`[deleteUser] Files model not available (microservices mode)`);
            }
        } catch (cascadeError) {
            console.error(`[deleteUser] Error in cascade delete: ${cascadeError.message}`);
            // Continue with user deletion even if cascade fails
        }

        // Delete the user
        await User.deleteOne({ userId: safeTargetUserId });
        return res.status(200).json({ message: "User deleted successfully" });

    } catch (error) {
        console.error("Controller error in deleteUser: ", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function login(req, res) {
    const { username, password } = req.body;
    try {
        if (typeof username !== "string" || typeof password !== "string") {
            return res.status(400).json({ message: "Invalid request" });
        }

        const normalizedUsername = username.trim();
        if (!normalizedUsername) {
            return res.status(400).json({ message: "Invalid request" });
        }

        const user = await User.findOne({ username: { $eq: normalizedUsername } });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { 
                _id: user._id,       
                userId: user.userId, 
                role: user.role 
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: "1h" }
        );
        
        return res.status(200).json({ token });

    } catch (error) {
        console.error("Error in login: ", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = {
    getAllUsers,
    createUser,
    deleteUser,
    login,
};