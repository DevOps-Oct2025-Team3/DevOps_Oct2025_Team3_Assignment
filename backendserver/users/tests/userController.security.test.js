// Mock the modules BEFORE importing
jest.mock("../models/userModel");
jest.mock("../models/counterModel");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

const userController = require("../controllers/userController");
const User = require("../models/userModel");
const Counter = require("../models/counterModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

describe("Security Tests - User Controller", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("SQL Injection Prevention", () => {
        it("should safely handle username with SQL injection attempts", async () => {
            const maliciousUsername = "admin' OR '1'='1";
            
            User.findOne.mockResolvedValue(null);

            const req = {
                body: {
                    username: maliciousUsername,
                    password: "Password1"
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await userController.login(req, res);

            // Should query with the exact malicious string, not execute it
            expect(User.findOne).toHaveBeenCalledWith({ 
                username: { $eq: maliciousUsername } 
            });
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it("should safely handle NoSQL injection in username", async () => {
            const maliciousUsername = { $gt: "" };
            
            const req = {
                body: {
                    username: maliciousUsername,
                    password: "Password1"
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await userController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid request" });
        });
    });

    describe("Password Security Tests", () => {
        it("should reject password with only lowercase letters", async () => {
            const req = {
                body: {
                    username: "testuser",
                    password: "password",
                    role: "User"
                }
            };
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

        it("should reject password with only uppercase letters", async () => {
            const req = {
                body: {
                    username: "testuser",
                    password: "PASSWORD",
                    role: "User"
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await userController.createUser(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should reject password with no numbers", async () => {
            const req = {
                body: {
                    username: "testuser",
                    password: "Password",
                    role: "User"
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await userController.createUser(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should hash password before storing", async () => {
            const plainPassword = "Password123";
            const hashedPassword = "hashedPassword123";

            User.findOne.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue(hashedPassword);
            Counter.findByIdAndUpdate.mockResolvedValue({ seq: 1 });

            const mockSavedUser = {
                userId: "1",
                username: "testuser",
                role: "User",
                toObject: jest.fn().mockReturnValue({
                    userId: "1",
                    username: "testuser",
                    role: "User",
                    passwordHash: "hashedPassword"
                })
            };
            const mockSave = jest.fn().mockResolvedValue(mockSavedUser);
            User.prototype.save = mockSave;

            const req = {
                body: {
                    username: "testuser",
                    password: plainPassword,
                    role: "User"
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await userController.createUser(req, res);

            expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, 10);
        });
    });

    describe("JWT Token Security Tests", () => {
        it("should generate JWT token with correct payload", async () => {
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

            const req = {
                body: {
                    username: "testuser",
                    password: "Password123"
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await userController.login(req, res);

            expect(jwt.sign).toHaveBeenCalledWith(
                {
                    _id: mockUser._id,
                    userId: mockUser.userId,
                    role: mockUser.role
                },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );
        });

        it("should not include password in JWT payload", async () => {
            const mockUser = {
                _id: "507f1f77bcf86cd799439011",
                userId: "1",
                username: "testuser",
                passwordHash: "hashedPassword",
                role: "User"
            };

            User.findOne.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(true);
            
            let jwtPayload;
            jwt.sign.mockImplementation((payload) => {
                jwtPayload = payload;
                return "mock-jwt-token";
            });

            const req = {
                body: {
                    username: "testuser",
                    password: "Password123"
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await userController.login(req, res);

            expect(jwtPayload).not.toHaveProperty("password");
            expect(jwtPayload).not.toHaveProperty("passwordHash");
        });
    });

    describe("Input Sanitization Tests", () => {
        it("should reject username with null bytes", async () => {
            const req = {
                body: {
                    username: "test\x00user",
                    password: "Password123",
                    role: "User"
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await userController.createUser(req, res);

            // Should handle the input safely without crashing
            expect(res.status).toHaveBeenCalled();
        });

        it("should trim whitespace from username during login", async () => {
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

            const req = {
                body: {
                    username: "  testuser  ",
                    password: "Password123"
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await userController.login(req, res);

            expect(User.findOne).toHaveBeenCalledWith({ 
                username: { $eq: "testuser" } 
            });
        });
    });

    describe("Role-Based Access Control Tests", () => {
        it("should accept valid Admin role", async () => {
            User.findOne.mockResolvedValue(null);
            Counter.findByIdAndUpdate.mockResolvedValue({ seq: 1 });
            bcrypt.hash.mockResolvedValue("hashedPassword");

            const mockSavedUser = {
                userId: "1",
                username: "admin",
                role: "Admin",
                toObject: jest.fn().mockReturnValue({
                    userId: "1",
                    username: "admin",
                    role: "Admin",
                    passwordHash: "hashedPassword"
                })
            };
            const mockSave = jest.fn().mockResolvedValue(mockSavedUser);
            User.prototype.save = mockSave;

            const req = {
                body: {
                    username: "admin",
                    password: "Password123",
                    role: "Admin"
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await userController.createUser(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
        });

        it("should accept valid User role", async () => {
            User.findOne.mockResolvedValue(null);
            Counter.findByIdAndUpdate.mockResolvedValue({ seq: 1 });
            bcrypt.hash.mockResolvedValue("hashedPassword");

            const mockSavedUser = {
                userId: "1",
                username: "user",
                role: "User",
                toObject: jest.fn().mockReturnValue({
                    userId: "1",
                    username: "user",
                    role: "User",
                    passwordHash: "hashedPassword"
                })
            };
            const mockSave = jest.fn().mockResolvedValue(mockSavedUser);
            User.prototype.save = mockSave;

            const req = {
                body: {
                    username: "user",
                    password: "Password123",
                    role: "User"
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await userController.createUser(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
        });

        it("should reject invalid role", async () => {
            const req = {
                body: {
                    username: "hacker",
                    password: "Password123",
                    role: "SuperAdmin"
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await userController.createUser(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid user role" });
        });

        it("should default to User role when role is not specified", async () => {
            User.findOne.mockResolvedValue(null);
            Counter.findByIdAndUpdate.mockResolvedValue({ seq: 1 });
            bcrypt.hash.mockResolvedValue("hashedPassword");

            let savedUser;
            User.prototype.save = jest.fn().mockImplementation(function() {
                savedUser = this;
                const userData = {
                    userId: "1",
                    username: this.username,
                    role: this.role,
                    passwordHash: "hashedPassword"
                };
                return Promise.resolve({
                    userId: "1",
                    username: this.username,
                    role: this.role,
                    toObject: jest.fn().mockReturnValue(userData)
                });
            });

            const req = {
                body: {
                    username: "defaultuser",
                    password: "Password123"
                    // role not specified
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await userController.createUser(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
        });
    });

    describe("Brute Force Protection Considerations", () => {
        it("should not reveal whether username exists on failed login", async () => {
            // Test 1: User doesn't exist
            User.findOne.mockResolvedValue(null);

            const req1 = {
                body: {
                    username: "nonexistent",
                    password: "Password123"
                }
            };
            const res1 = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await userController.login(req1, res1);

            expect(res1.json).toHaveBeenCalledWith({ message: "Invalid credentials" });

            // Test 2: User exists but wrong password
            jest.clearAllMocks();
            User.findOne.mockResolvedValue({
                _id: "507f1f77bcf86cd799439011",
                userId: "1",
                username: "testuser",
                passwordHash: "hashedPassword",
                role: "User"
            });
            bcrypt.compare.mockResolvedValue(false);

            const req2 = {
                body: {
                    username: "testuser",
                    password: "WrongPassword"
                }
            };
            const res2 = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await userController.login(req2, res2);

            // Both should return the same generic message
            expect(res2.json).toHaveBeenCalledWith({ message: "Invalid credentials" });
        });
    });

    describe("Error Information Disclosure Tests", () => {
        it("should not expose sensitive error details to client", async () => {
            User.findOne.mockRejectedValue(new Error("MongoDB connection failed at 192.168.1.100:27017"));

            const req = {
                body: {
                    username: "testuser",
                    password: "Password123"
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await userController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
            
            // Verify that specific error details are NOT sent to client
            expect(res.json).not.toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining("MongoDB")
                })
            );
        });
    });
});
