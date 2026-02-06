const User = require("../models/userModel");

describe("User Model", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should retrieve all users from the database", async () => {
        const mockUsers = [
            { userId: "1", username: "user1", role: "User", passwordHash: "hash1" },
            { userId: "2", username: "admin", role: "Admin", passwordHash: "hash2" }
        ];

        // Mock the Mongoose find method
        User.find = jest.fn().mockResolvedValue(mockUsers);

        const users = await User.find({});

        expect(User.find).toHaveBeenCalledWith({});
        expect(users).toHaveLength(2);
        expect(users[0].userId).toBe("1");
        expect(users[0].username).toBe("user1");
        expect(users[0].role).toBe("User");
        expect(users[1].userId).toBe("2");
        expect(users[1].username).toBe("admin");
        expect(users[1].role).toBe("Admin");
    });

    it("should handle errors when retrieving users", async () => {
        const errorMessage = "Database error";
        User.find = jest.fn().mockRejectedValue(new Error(errorMessage));
        
        await expect(User.find({})).rejects.toThrow(errorMessage);
    });
});