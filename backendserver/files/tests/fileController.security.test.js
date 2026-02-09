const fileController = require("../controller/fileController");
const File = require("../model/fileModel");

jest.mock("../model/fileModel");

describe("Security Tests - File Controller", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should use userId from JWT when uploading", async () => {
        const saveMock = jest.fn().mockResolvedValue({ FileName: "test.txt" });
        File.mockImplementation(() => ({ save: saveMock }));

        const req = {
            user: { userId: "1" },
            body: { UserId: "99" },
            file: {
                originalname: "test.txt",
                path: "uploads/test.txt",
                size: 10,
                mimetype: "text/plain"
            }
        };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await fileController.uploadFile(req, res);

        expect(File).toHaveBeenCalledWith(
            expect.objectContaining({ UserId: "1" })
        );
    });

    it("should deny delete when user is not owner or admin", async () => {
        File.findById.mockResolvedValue({ UserId: "2" });

        const req = { params: { id: "abc" }, user: { userId: "1", role: "User" } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await fileController.deleteFile(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: "Access denied" });
    });

    it("should allow delete when user is admin", async () => {
        File.findById.mockResolvedValue({ UserId: "2" });
        File.findByIdAndDelete.mockResolvedValue({});

        const req = { params: { id: "abc" }, user: { userId: "1", role: "Admin" } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await fileController.deleteFile(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should deny download when user is not owner or admin", async () => {
        File.findById.mockResolvedValue({ UserId: "2" });

        const req = { params: { id: "abc" }, user: { userId: "1", role: "User" } };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await fileController.downloadFile(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: "Access denied" });
    });
});
