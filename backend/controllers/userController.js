const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

async function getAllUsers(req, res){
    try{
        const users = await userModel.getAllUsers();
        return res.status(200).json(users);
    } catch (error){
        console.error("Controller error in getAllUsers: ", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function createUser(req, res){
    try{
        const newUser = await userModel.createUser(req.body);
        return res.status(201).json(newUser);
    } catch (error){
        console.error("Controller error in createUser: ", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function deleteUser(req, res){
    const userId = req.params.id;
    if(isNaN(userId)){
        return res.status(400).json({ message: "Invalid user ID" });
    }

    try{
        const deleted = await userModel.deleteUser(userId); 
        if(deleted){
            return res.status(200).json({ message: "User deleted successfully" });
        } else {
            return res.status(404).json({ message: "User not found" });
        }
    } catch (error){
        console.error("Controller error in deleteUser: ", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function registerUser(req, res){
    const { Username, Password, Role } = req.body;
    try{
        // Password strength
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!passwordRegex.test(Password)) {
            return res.status(400).json({ message: "Password must be at least 8 characters long, and include at least one uppercase letter, one lowercase letter, and one number." });
        }
        
        // role validation
        const validRoles = ["Admin", "User"];
        if (!validRoles.includes(Role)) {
            return res.status(400).json({ message: "Invalid user role" });
        }

        // Check for existing username
        const existingUser = await userModel.getUserByUsername(Username);
        if (existingUser) {
            return res.status(400).json({ message: "Username already exists" });
        }

        const newUser = await userModel.createUser(req.body);
        if(!newUser){
            return res.status(500).json({ message: "User creation failed" });
        }

        return res.status(201).json({ message: "User registered successfully", user: newUser }); 

    } catch (error){
        console.error("Error in registerUser: ", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function login(req, res){
    const { Username, Password } = req.body;
    try{
        // Validate user credentials
        const user = await userModel.getUserByUsername(Username);
        if(!user){
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Compare password with hash 
        const passwordMatch = await bcrypt.compare(Password, user.PasswordHash);
        if(!passwordMatch){
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user.UserId, role: user.Role }, process.env.JWT_SECRET, { expiresIn: "1h" });
        return res.status(200).json({ token });

    } catch (error){
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
}