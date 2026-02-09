// Mock the modules BEFORE importing
jest.mock("../models/userModel", () => {
    const UserMock = jest.fn().mockImplementation(function() {
        // Use 'this' to create a proper instance with prototype chain
        // This allows User.prototype.save to work properly in tests
    });
    UserMock.find = jest.fn();
    UserMock.findOne = jest.fn();
    UserMock.deleteOne = jest.fn();
    UserMock.prototype.save = jest.fn();
    return UserMock;
});
jest.mock("../models/counterModel", () => ({
    findByIdAndUpdate: jest.fn()
}));
jest.mock("bcryptjs", () => ({
    hash: jest.fn(),
    compare: jest.fn()
}));
jest.mock("jsonwebtoken", () => ({
    sign: jest.fn(),
    verify: jest.fn()
}));
jest.mock("mongoose", () => ({
    model: jest.fn()
}));
jest.mock("fs", () => ({
    promises: {
        unlink: jest.fn().mockResolvedValue()
    }
}));

const userController = require("../controllers/userController");
const User = require("../models/userModel");
const Counter = require("../models/counterModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

describe("userController.getAllUsers", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should fetch all users and return a JSON response with status 200", async () => {
        const mockUsers = [
            { userId: "1", username: "user1", role: "User" },
            { userId: "2", username: "admin", role: "Admin" }
        ];

        User.find.mockResolvedValue(mockUsers);
        const req = {};
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await userController.getAllUsers(req, res);
        
        expect(User.find).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockUsers);
    });

    it("should handle errors and return status 500 with error message", async () => {
        const errorMessage = "Database error";
        User.find.mockRejectedValue(new Error(errorMessage));

        const req = {};
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await userController.getAllUsers(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
    });
});

describe("userController.createUser", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should create a new user and return status 201", async () => {
        const reqBody = {
            username: "newuser",
            password: "Password1",
            role: "User"
        };

        const savedUser = {
            userId: "3",
            username: "newuser",
            role: "User",
            toObject: function() { 
                return { userId: this.userId, username: this.username, role: this.role }; 
            }
        };

        User.findOne.mockResolvedValue(null);
        bcrypt.hash.mockResolvedValue("hashedPassword");
        Counter.findByIdAndUpdate.mockResolvedValue({ seq: 3 });
        User.prototype.save = jest.fn().mockResolvedValue(savedUser);

        const req = { body: reqBody };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await userController.createUser(req, res);

        expect(User.findOne).toHaveBeenCalledWith({ username: reqBody.username });
        expect(bcrypt.hash).toHaveBeenCalledWith(reqBody.password, 10);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ userId: "3", username: "newuser", role: "User" });
    });

    it("should return status 400 if username already exists", async () => {
        const reqBody = {
            username: "existinguser",
            password: "Password1",
            role: "User"
        };

        User.findOne.mockResolvedValue({ userId: "1", username: "existinguser" });

        const req = { body: reqBody };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await userController.createUser(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "Username already exists" });
    });

    it("should return status 400 for invalid username", async () => {
        const reqBody = {
            username: "",
            password: "Password123",
            role: "User"
        };

        const req = { body: reqBody };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await userController.createUser(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "Invalid username" });
    });

    it("should return status 400 for weak password", async () => {
        const reqBody = {
            username: "newuser",
            password: "weak",
            role: "User"
        };

        const req = { body: reqBody };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await userController.createUser(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ 
            message: "Password has to be at least 8 characters long, include one uppercase letter, one lowercase letter, and one number." 
        });
    });

    it("should handle errors and return status 500", async () => {
        const reqBody = {
            username: "test",
            password: "Password1",
            role: "User"
        };

        User.findOne.mockRejectedValue(new Error("Database error"));

        const req = { body: reqBody };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await userController.createUser(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
    });
});

describe("userController.login", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should login successfully and return JWT token", async () => {
        const reqBody = {
            username: "testuser",
            password: "Password1"
        };

        const mockUser = {
            _id: "507f1f77bcf86cd799439011",
            userId: "1",
            username: "testuser",
            passwordHash: "hashedPassword",
            role: "User"
        };

        User.findOne.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(true);
        jwt.sign.mockReturnValue("mock-jwt-token");

        const req = { body: reqBody };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await userController.login(req, res);

        expect(User.findOne).toHaveBeenCalledWith({ username: { $eq: "testuser" } });
        expect(bcrypt.compare).toHaveBeenCalledWith(reqBody.password, mockUser.passwordHash);
        expect(jwt.sign).toHaveBeenCalledWith(
            { _id: mockUser._id, userId: mockUser.userId, role: mockUser.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ token: "mock-jwt-token" });
    });

    it("should return status 401 for non-existent user", async () => {
        const reqBody = {
            username: "nonexistent",
            password: "Password1"
        };

        User.findOne.mockResolvedValue(null);

        const req = { body: reqBody };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await userController.login(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials" });
    });

    it("should return status 401 for incorrect password", async () => {
        const reqBody = {
            username: "testuser",
            password: "WrongPassword1"
        };

        const mockUser = {
            _id: "507f1f77bcf86cd799439011",
            userId: "1",
            username: "testuser",
            passwordHash: "hashedPassword",
            role: "User"
        };

        User.findOne.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(false);

        const req = { body: reqBody };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await userController.login(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials" });
    });

    it("should return status 400 for invalid request (non-string username)", async () => {
        const reqBody = {
            username: 123,
            password: "Password1"
        };

        const req = { body: reqBody };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await userController.login(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "Invalid request" });
    });

    it("should return status 400 for empty username", async () => {
        const reqBody = {
            username: "   ",
            password: "Password1"
        };

        const req = { body: reqBody };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await userController.login(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "Invalid request" });
    });

    it("should handle errors and return status 500", async () => {
        const reqBody = {
            username: "testuser",
            password: "Password1"
        };

        User.findOne.mockRejectedValue(new Error("Database error"));

        const req = { body: reqBody };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await userController.login(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
    });
});

describe("userController.deleteUser", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should delete a user and return status 200", async () => {
        const userId = "1";
        const mockUser = { userId: "1", username: "user1", role: "User" };

        // Mock User.findOne to return a user
        User.findOne.mockResolvedValue(mockUser);
        // Mock File model not available (microservices mode)
        mongoose.model.mockImplementation(() => {
            throw new Error('Schema hasn\'t been registered');
        });
        // Mock User.deleteOne to succeed
        User.deleteOne.mockResolvedValue({ deletedCount: 1 });

        const req = { params: { id: userId } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await userController.deleteUser(req, res);
        
        expect(User.findOne).toHaveBeenCalledWith({ userId: userId });
        expect(User.deleteOne).toHaveBeenCalledWith({ userId: userId });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: "User deleted successfully" });
    });

    it("should return status 404 if user not found", async () => {
        const userId = "999";

        // Mock User.findOne to return null (user not found)
        User.findOne.mockResolvedValue(null);

        const req = { params: { id: userId } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await userController.deleteUser(req, res);
        
        expect(User.findOne).toHaveBeenCalledWith({ userId: userId });
        expect(User.deleteOne).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });

    it("should handle errors and return status 500", async () => {
        const userId = "1";

        User.findOne.mockRejectedValue(new Error("Database error"));

        const req = { params: { id: userId } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await userController.deleteUser(req, res);
        
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
    });

    it("should cascade delete user's files when Files model is available", async () => {
        const userId = "1";
        const mockUser = { userId: "1", username: "testuser" };
        const mockFiles = [
            { FilePath: "uploads/file1.txt", UserId: "1" },
            { FilePath: "uploads/file2.txt", UserId: "1" }
        ];
        const mockFilesModel = {
            find: jest.fn().mockResolvedValue(mockFiles),
            deleteMany: jest.fn().mockResolvedValue({ deletedCount: 2 })
        };

        // Mock User.findOne to return a user
        User.findOne.mockResolvedValue(mockUser);
        // Mock mongoose.model to return Files model (success path)
        mongoose.model.mockReturnValue(mockFilesModel);
        // Mock User.deleteOne to succeed
        User.deleteOne.mockResolvedValue({ deletedCount: 1 });

        const req = { params: { id: userId } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await userController.deleteUser(req, res);
        
        expect(User.findOne).toHaveBeenCalledWith({ userId: userId });
        expect(mongoose.model).toHaveBeenCalledWith('files');
        expect(mockFilesModel.find).toHaveBeenCalledWith({ UserId: userId });
        expect(mockFilesModel.deleteMany).toHaveBeenCalledWith({ UserId: userId });
        expect(User.deleteOne).toHaveBeenCalledWith({ userId: userId });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: "User deleted successfully" });
    });

    it("should handle cascade delete errors and still delete user", async () => {
        const userId = "1";
        const mockUser = { userId: "1", username: "testuser" };
        const mockFilesModel = {
            find: jest.fn().mockRejectedValue(new Error("Files database error"))
        };

        // Mock User.findOne to return a user
        User.findOne.mockResolvedValue(mockUser);
        // Mock mongoose.model to return Files model that will throw error
        mongoose.model.mockReturnValue(mockFilesModel);
        // Mock User.deleteOne to succeed
        User.deleteOne.mockResolvedValue({ deletedCount: 1 });

        const req = { params: { id: userId } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await userController.deleteUser(req, res);
        
        // Should still delete the user despite cascade error
        expect(User.deleteOne).toHaveBeenCalledWith({ userId: userId });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: "User deleted successfully" });
    });

    it("should handle physical file deletion errors during cascade delete", async () => {
        const userId = "1";
        const mockUser = { userId: "1", username: "testuser" };
        const mockFiles = [
            { FilePath: "uploads/file1.txt", UserId: "1" },
            { FilePath: "uploads/file2.txt", UserId: "1" }
        ];
        const fs = require("fs");
        const mockFilesModel = {
            find: jest.fn().mockResolvedValue(mockFiles),
            deleteMany: jest.fn().mockResolvedValue({ deletedCount: 2 })
        };

        // Mock User.findOne to return a user
        User.findOne.mockResolvedValue(mockUser);
        // Mock mongoose.model to return Files model
        mongoose.model.mockReturnValue(mockFilesModel);
        // Mock fs.unlink to fail for physical file deletion
        fs.promises.unlink.mockRejectedValue(new Error("Permission denied"));
        // Mock User.deleteOne to succeed
        User.deleteOne.mockResolvedValue({ deletedCount: 1 });

        const req = { params: { id: userId } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await userController.deleteUser(req, res);
        
        // Should still succeed despite file deletion errors
        expect(fs.promises.unlink).toHaveBeenCalled();
        expect(mockFilesModel.deleteMany).toHaveBeenCalledWith({ UserId: userId });
        expect(User.deleteOne).toHaveBeenCalledWith({ userId: userId });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: "User deleted successfully" });
    });
});
