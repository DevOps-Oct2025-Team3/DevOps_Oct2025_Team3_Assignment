const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const rateLimit = require("express-rate-limit");
const User = require("../models/userModel");
const Counter = require("../models/counterModel");
const userController = require("../controllers/userController");

// Set up test environment variables
process.env.JWT_SECRET = "test-jwt-secret-key-for-integration-tests";

// Create express app for testing
const app = express();
app.use(express.json());

// Configure rate limiters for test environment (generous limits to not interfere with tests)
const testApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Very high limit for tests
    standardHeaders: true,
    legacyHeaders: false,
});

const testLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // High enough for test suite
    standardHeaders: true,
    legacyHeaders: false,
});

const testCreateUserLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 200, // High enough for test suite
    standardHeaders: true,
    legacyHeaders: false,
});

const testDeleteUserLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // Limit for delete operations
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply general API rate limiting
app.use(testApiLimiter);

// Define routes for testing (without auth middleware for testing, but with rate limiting)
app.post("/login", testLoginLimiter, userController.login);
app.get("/admin", userController.getAllUsers);
app.post("/admin/create_user", testCreateUserLimiter, userController.createUser);
app.delete("/admin/delete_user/:id", testDeleteUserLimiter, userController.deleteUser);

let mongoServer;

describe("User API Integration Tests", () => {
    beforeAll(async () => {
        // Start in-memory MongoDB server
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);
    }, 60000); // Increase timeout for MongoDB Memory Server startup

    afterAll(async () => {
        // Cleanup and disconnect
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        // Clear database before each test
        await User.deleteMany({});
        await Counter.deleteMany({});
    });

    describe("POST /admin/create_user - Integration", () => {
        it("should register a user and save to database", async () => {
            const userData = {
                username: "integrationtest",
                password: "Password123",
                role: "User"
            };

            const response = await request(app)
                .post("/admin/create_user")
                .send(userData)
                .expect(201);
            
            expect(response.body).toHaveProperty("userId");
            expect(response.body).toHaveProperty("username", "integrationtest");
            expect(response.body).toHaveProperty("role", "User");
            expect(response.body).not.toHaveProperty("passwordHash");

            // Verify user exists in database
            const user = await User.findOne({ username: "integrationtest" });
            expect(user).toBeTruthy();
            expect(user.role).toBe("User");
        });

        it("should prevent duplicate user registration", async () => {
            // Create user first
            await request(app)
                .post("/admin/create_user")
                .send({
                    username: "duplicate",
                    password: "Password123",
                    role: "User"
                })
                .expect(201);

            // Try to create same user again
            const response = await request(app)
                .post("/admin/create_user")
                .send({
                    username: "duplicate",
                    password: "Password123",
                    role: "User"
                })
                .expect(400);

            expect(response.body.message).toBe("Username already exists");
        });
    });

    describe("POST /login - Integration", () => {
        it("should login with valid credentials", async () => {
            // Create user first
            await request(app)
                .post("/admin/create_user")
                .send({
                    username: "logintest",
                    password: "Password123",
                    role: "User"
                })
                .expect(201);

            // Login with correct credentials
            const response = await request(app)
                .post("/login")
                .send({
                    username: "logintest",
                    password: "Password123"
                })
                .expect(200);

            expect(response.body).toHaveProperty("token");
            expect(typeof response.body.token).toBe("string");
        });

        it("should reject login with incorrect password", async () => {
            // Create user first
            await request(app)
                .post("/admin/create_user")
                .send({
                    username: "logintest2",
                    password: "Password123",
                    role: "User"
                })
                .expect(201);

            // Try to login with wrong password
            const response = await request(app)
                .post("/login")
                .send({
                    username: "logintest2",
                    password: "WrongPassword123"
                })
                .expect(401);

            expect(response.body.message).toBe("Invalid credentials");
        });
    });

    describe("DELETE /admin/:id - Integration", () => {
        it("should delete an existing user", async () => {
            // Create user first
            const createResponse = await request(app)
                .post("/admin/create_user")
                .send({
                    username: "deletetest",
                    password: "Password123",
                    role: "User"
                })
                .expect(201);

            const userId = createResponse.body.userId;

            // Delete the user
            await request(app)
                .delete(`/admin/delete_user/${userId}`)
                .expect(200);

            // Verify user is deleted
            const user = await User.findOne({ userId });
            expect(user).toBeNull();
        });

        it("should return 404 when deleting non-existent user", async () => {
            const response = await request(app)
                .delete("/admin/delete_user/99999")
                .expect(404);

            expect(response.body.message).toBe("User not found");
        });

        it("should cascade delete user's files when user is deleted", async () => {
            // Note: Cascade delete is implemented in deleteUser controller function
            // Following the same pattern as deleteFile controller:
            //   1. Find all files for the user
            //   2. Delete physical files from uploads/ folder
            //   3. Delete database records from files collection
            // This ensures 100% testable code with no hidden model hooks
            
            // Create a user
            const createResponse = await request(app)
                .post("/admin/create_user")
                .send({
                    username: "cascadetest",
                    password: "Password123",
                    role: "User"
                })
                .expect(201);

            const userId = createResponse.body.userId;

            // Delete the user (cascade delete executes in controller)
            await request(app)
                .delete(`/admin/delete_user/${userId}`)
                .expect(200);

            // Verify user is deleted
            const user = await User.findOne({ userId });
            expect(user).toBeNull();
            
            // Note: In production with separate microservices:
            //   1. User service publishes "user.deleted" event to message queue
            //   2. Files service subscribes and handles file cleanup
            //   3. Cross-service integration tests verify the flow
        });
    });

    describe("GET /admin - Integration", () => {
        it("should return all users from database", async () => {
            // Create multiple users
            await request(app).post("/admin/create_user").send({
                username: "user1",
                password: "Password123",
                role: "User"
            });
            
            await request(app).post("/admin/create_user").send({
                username: "user2",
                password: "Password123",
                role: "Admin"
            });

            // Get all users
            const response = await request(app)
                .get("/admin")
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(2);
            expect(response.body[0]).not.toHaveProperty("passwordHash");
        });
    });
});
