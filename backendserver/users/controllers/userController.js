const User = require("../models/userModel.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

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
    try {
        const { username, password, role } = req.body;

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "Username already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            passwordHash: hashedPassword,
            role
        });

        const savedUser = await newUser.save();

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

    try {
        const deletedUser = await User.findOneAndDelete({ userId: targetUserId });
        
        if (deletedUser) {
            return res.status(200).json({ message: "User deleted successfully" });
        } else {
            return res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.error("Controller error in deleteUser: ", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function registerUser(req, res) {
    const { username, password, role } = req.body;

    try {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ message: "Password does not meet complexity requirements." });
        }

        const validRoles = ["Admin", "User"];
        if (role && !validRoles.includes(role)) {
            return res.status(400).json({ message: "Invalid user role" });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "Username already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            passwordHash: hashedPassword,
            role: role || 'User'
        });

        const savedUser = await newUser.save();

        return res.status(201).json({ message: "User registered successfully", userId: savedUser.userId });

    } catch (error) {
        console.error("Error in registerUser: ", error);
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
    registerUser,
    login,
};