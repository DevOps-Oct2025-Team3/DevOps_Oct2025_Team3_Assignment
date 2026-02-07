const { validateUser, validateId, verifyJWT } = require("../middlewares/userValidation");
const jwt = require("jsonwebtoken");

// Mock jwt
jest.mock("jsonwebtoken");

describe("userValidation Middleware", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = "test-secret";
    });

    afterEach(() => {
        delete process.env.JWT_SECRET;
    });

    describe("validateUser", () => {
        it("should call next() when valid user data is provided", () => {
            const req = {
                body: {
                    username: "testuser",
                    password: "Password123",
                    role: "User"
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            validateUser(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it("should return 400 when username is missing", () => {
            const req = {
                body: {
                    password: "Password123",
                    role: "User"
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            validateUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: expect.stringContaining("Username is required")
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("should return 400 when username is empty string", () => {
            const req = {
                body: {
                    username: "",
                    password: "Password123",
                    role: "User"
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            validateUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: expect.stringContaining("Username cannot be empty")
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("should return 400 when username exceeds 50 characters", () => {
            const req = {
                body: {
                    username: "a".repeat(51),
                    password: "Password123",
                    role: "User"
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            validateUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: expect.stringContaining("Username cannot exceed 50 characters")
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("should return 400 when password is missing", () => {
            const req = {
                body: {
                    username: "testuser",
                    role: "User"
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            validateUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: expect.stringContaining("Password is required")
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("should return 400 when password is less than 8 characters", () => {
            const req = {
                body: {
                    username: "testuser",
                    password: "short",
                    role: "User"
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            validateUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: expect.stringContaining("Password must be at least 8 characters long")
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("should return 400 when role is missing", () => {
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
            const next = jest.fn();

            validateUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: expect.stringContaining("Role is required")
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("should return 400 when role is invalid", () => {
            const req = {
                body: {
                    username: "testuser",
                    password: "Password123",
                    role: "SuperAdmin"
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            validateUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: expect.stringContaining("Role must be either 'Admin' or 'User'")
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("should return 400 with multiple error messages when multiple fields are invalid", () => {
            const req = {
                body: {
                    username: "",
                    password: "short",
                    role: "Invalid"
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            validateUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            const errorMessage = res.json.mock.calls[0][0].error;
            expect(errorMessage).toContain("Username cannot be empty");
            expect(errorMessage).toContain("Password must be at least 8 characters long");
            expect(errorMessage).toContain("Role must be either 'Admin' or 'User'");
            expect(next).not.toHaveBeenCalled();
        });

        it("should accept Admin role", () => {
            const req = {
                body: {
                    username: "adminuser",
                    password: "Password123",
                    role: "Admin"
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            validateUser(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it("should accept User role", () => {
            const req = {
                body: {
                    username: "regularuser",
                    password: "Password123",
                    role: "User"
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            validateUser(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
    });

    describe("validateId", () => {
        it("should call next() when valid positive integer ID is provided", () => {
            const req = { params: { id: "123" } };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            validateId(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it("should call next() when ID is 1", () => {
            const req = { params: { id: "1" } };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            validateId(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it("should return 400 when ID is not a number", () => {
            const req = { params: { id: "abc" } };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            validateId(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: "Invalid user ID. ID must be a positive number"
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("should return 400 when ID is zero", () => {
            const req = { params: { id: "0" } };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            validateId(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: "Invalid user ID. ID must be a positive number"
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("should return 400 when ID is negative", () => {
            const req = { params: { id: "-5" } };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            validateId(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: "Invalid user ID. ID must be a positive number"
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("should accept ID with decimal (parseInt truncates to integer)", () => {
            // Note: parseInt("12.5") returns 12, which is valid
            const req = { params: { id: "12.5" } };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            validateId(req, res, next);

            // parseInt truncates to 12, which is a valid positive number
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it("should return 400 when ID is empty string", () => {
            const req = { params: { id: "" } };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            validateId(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: "Invalid user ID. ID must be a positive number"
            });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe("verifyJWT", () => {
        it("should call next() when valid token with Admin role is provided for admin route", () => {
            const req = {
                method: "GET",
                url: "/admin",
                headers: {
                    authorization: "Bearer valid-token"
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            const decodedToken = { role: "Admin", userId: "1" };
            jwt.verify.mockImplementation((token, secret, callback) => {
                callback(null, decodedToken);
            });

            verifyJWT(req, res, next);

            expect(jwt.verify).toHaveBeenCalledWith("valid-token", "test-secret", expect.any(Function));
            expect(req.user).toEqual(decodedToken);
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it("should call next() when valid token with User role is provided for login route", () => {
            const req = {
                method: "GET",
                url: "/login",
                headers: {
                    authorization: "Bearer valid-token"
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            const decodedToken = { role: "User", userId: "2" };
            jwt.verify.mockImplementation((token, secret, callback) => {
                callback(null, decodedToken);
            });

            verifyJWT(req, res, next);

            expect(req.user).toEqual(decodedToken);
            expect(next).toHaveBeenCalled();
        });

        it("should return 401 when no token is provided", () => {
            const req = {
                method: "GET",
                url: "/admin",
                headers: {}
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            verifyJWT(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
            expect(next).not.toHaveBeenCalled();
        });

        it("should return 401 when authorization header is missing Bearer prefix", () => {
            const req = {
                method: "GET",
                url: "/admin",
                headers: {
                    authorization: "invalid-token"
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            verifyJWT(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
            expect(next).not.toHaveBeenCalled();
        });

        it("should return 403 when token is invalid", () => {
            const req = {
                method: "GET",
                url: "/admin",
                headers: {
                    authorization: "Bearer invalid-token"
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            jwt.verify.mockImplementation((token, secret, callback) => {
                callback(new Error("Invalid token"), null);
            });

            verifyJWT(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
            expect(next).not.toHaveBeenCalled();
        });

        it("should return 403 when token is expired", () => {
            const req = {
                method: "GET",
                url: "/admin",
                headers: {
                    authorization: "Bearer expired-token"
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            jwt.verify.mockImplementation((token, secret, callback) => {
                const error = new Error("jwt expired");
                error.name = "TokenExpiredError";
                callback(error, null);
            });

            verifyJWT(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
            expect(next).not.toHaveBeenCalled();
        });

        it("should return 403 when User role tries to access Admin route", () => {
            const req = {
                method: "GET",
                url: "/admin",
                headers: {
                    authorization: "Bearer valid-token"
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            const decodedToken = { role: "User", userId: "2" };
            jwt.verify.mockImplementation((token, secret, callback) => {
                callback(null, decodedToken);
            });

            verifyJWT(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
            expect(next).not.toHaveBeenCalled();
        });

        it("should allow Admin to create user", () => {
            const req = {
                method: "POST",
                url: "/admin/create_user",
                headers: {
                    authorization: "Bearer valid-token"
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            const decodedToken = { role: "Admin", userId: "1" };
            jwt.verify.mockImplementation((token, secret, callback) => {
                callback(null, decodedToken);
            });

            verifyJWT(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it("should allow Admin to delete user with numeric ID", () => {
            const req = {
                method: "DELETE",
                url: "/admin/delete_user/123",
                headers: {
                    authorization: "Bearer valid-token"
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            const decodedToken = { role: "Admin", userId: "1" };
            jwt.verify.mockImplementation((token, secret, callback) => {
                callback(null, decodedToken);
            });

            verifyJWT(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it("should return 403 when User tries to delete user", () => {
            const req = {
                method: "DELETE",
                url: "/admin/delete_user/123",
                headers: {
                    authorization: "Bearer valid-token"
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            const decodedToken = { role: "User", userId: "2" };
            jwt.verify.mockImplementation((token, secret, callback) => {
                callback(null, decodedToken);
            });

            verifyJWT(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
            expect(next).not.toHaveBeenCalled();
        });

        it("should return 403 for unauthorized endpoint", () => {
            const req = {
                method: "GET",
                url: "/unauthorized/endpoint",
                headers: {
                    authorization: "Bearer valid-token"
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            const decodedToken = { role: "User", userId: "2" };
            jwt.verify.mockImplementation((token, secret, callback) => {
                callback(null, decodedToken);
            });

            verifyJWT(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
            expect(next).not.toHaveBeenCalled();
        });

        it("should allow both Admin and User to access logout route", () => {
            const req = {
                method: "GET",
                url: "/logout",
                headers: {
                    authorization: "Bearer valid-token"
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            const decodedToken = { role: "User", userId: "2" };
            jwt.verify.mockImplementation((token, secret, callback) => {
                callback(null, decodedToken);
            });

            verifyJWT(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
    });
});
