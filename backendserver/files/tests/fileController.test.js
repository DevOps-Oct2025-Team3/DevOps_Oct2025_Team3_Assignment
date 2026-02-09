const fileController = require("../controller/fileController");
const File = require("../model/fileModel");

jest.mock("../model/fileModel");

describe("fileController.getAllFiles", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return files for the logged-in user", async () => {
        const mockFiles = [{ FileName: "a.txt" }, { FileName: "b.txt" }];
        const sortMock = jest.fn().mockResolvedValue(mockFiles);
        File.find.mockReturnValue({ sort: sortMock });

        const req = { user: { userId: "1" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await fileController.getAllFiles(req, res);

        expect(File.find).toHaveBeenCalledWith({ UserId: "1" });
        expect(sortMock).toHaveBeenCalledWith({ UploadedAt: -1 });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockFiles);
    });

    it("should return 500 on error", async () => {
        File.find.mockImplementation(() => {
            throw new Error("DB error");
        });

        const req = { user: { userId: "1" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await fileController.getAllFiles(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
    });

    it("should return 500 when sorting fails", async () => {
        const sortMock = jest.fn().mockRejectedValue(new Error("Sort error"));
        File.find.mockReturnValue({ sort: sortMock });

        const req = { user: { userId: "1" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await fileController.getAllFiles(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
    });
});

describe("fileController.uploadFile", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return 400 when no file is uploaded", async () => {
        const req = { user: { userId: "1" }, file: null };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await fileController.uploadFile(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "No file uploaded" });
    });

    it("should save file metadata and return 201", async () => {
        const savedFile = {
            _id: "abc123",
            FileName: "report.pdf",
            FileSize: 1234,
            FilePath: "uploads/report.pdf",
            UploadedAt: new Date("2024-01-01T00:00:00.000Z")
        };
        const saveMock = jest.fn().mockResolvedValue(savedFile);
        File.mockImplementation(() => ({ save: saveMock }));

        const req = {
            user: { userId: "1" },
            file: {
                originalname: "report.pdf",
                path: "uploads/report.pdf",
                size: 1234,
                mimetype: "application/pdf"
            }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await fileController.uploadFile(req, res);

        expect(File).toHaveBeenCalledWith({
            UserId: "1",
            FileName: "report.pdf",
            FilePath: "uploads/report.pdf",
            FileSize: 1234,
            FileType: "application/pdf",
            UploadedAt: expect.any(Date)
        });
        expect(saveMock).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            _id: savedFile._id,
            FileName: savedFile.FileName,
            FileSize: savedFile.FileSize,
            FilePath: savedFile.FilePath,
            UploadedAt: savedFile.UploadedAt,
            message: "File uploaded and saved successfully"
        });
    });

    it("should return 500 on error", async () => {
        const saveMock = jest.fn().mockRejectedValue(new Error("DB error"));
        File.mockImplementation(() => ({ save: saveMock }));

        const req = {
            user: { userId: "1" },
            file: {
                originalname: "report.pdf",
                path: "uploads/report.pdf",
                size: 1234,
                mimetype: "application/pdf"
            }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await fileController.uploadFile(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            message: "Internal server error",
            error: "DB error"
        });
    });
});

describe("fileController.deleteFile", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return 404 if file is not found", async () => {
        File.findById.mockResolvedValue(null);

        const req = { params: { id: "abc" }, user: { userId: "1", role: "User" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await fileController.deleteFile(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: "File not found" });
    });

    it("should return 403 if user is not owner or admin", async () => {
        File.findById.mockResolvedValue({ UserId: "2" });

        const req = { params: { id: "abc" }, user: { userId: "1", role: "User" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await fileController.deleteFile(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: "Access denied" });
    });

    it("should delete file when owner", async () => {
        File.findById.mockResolvedValue({ UserId: "1" });
        File.findByIdAndDelete.mockResolvedValue({});

        const req = { params: { id: "abc" }, user: { userId: "1", role: "User" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await fileController.deleteFile(req, res);

        expect(File.findByIdAndDelete).toHaveBeenCalledWith("abc");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: "File deleted successfully" });
    });

    it("should delete file when admin", async () => {
        File.findById.mockResolvedValue({ UserId: "2" });
        File.findByIdAndDelete.mockResolvedValue({});

        const req = { params: { id: "abc" }, user: { userId: "1", role: "Admin" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await fileController.deleteFile(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: "File deleted successfully" });
    });

    it("should return 500 on error", async () => {
        File.findById.mockRejectedValue(new Error("DB error"));

        const req = { params: { id: "abc" }, user: { userId: "1", role: "User" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await fileController.deleteFile(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
    });
});

describe("fileController.downloadFile", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return 404 if file is not found", async () => {
        File.findById.mockResolvedValue(null);

        const req = { params: { id: "abc" }, user: { userId: "1", role: "User" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await fileController.downloadFile(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: "File not found" });
    });

    it("should return 403 if user is not owner or admin", async () => {
        File.findById.mockResolvedValue({ UserId: "2" });

        const req = { params: { id: "abc" }, user: { userId: "1", role: "User" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await fileController.downloadFile(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: "Access denied" });
    });

    it("should download file when owner", async () => {
        const file = { UserId: "1", FileName: "report.pdf", FilePath: "uploads/report.pdf" };
        File.findById.mockResolvedValue(file);

        const req = { params: { id: "abc" }, user: { userId: "1", role: "User" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            download: jest.fn()
        };

        await fileController.downloadFile(req, res);

        expect(res.download).toHaveBeenCalledWith(file.FilePath, file.FileName);
    });

    it("should download file when admin", async () => {
        const file = { UserId: "2", FileName: "report.pdf", FilePath: "uploads/report.pdf" };
        File.findById.mockResolvedValue(file);

        const req = { params: { id: "abc" }, user: { userId: "1", role: "Admin" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            download: jest.fn()
        };

        await fileController.downloadFile(req, res);

        expect(res.download).toHaveBeenCalledWith(file.FilePath, file.FileName);
    });

    it("should return 500 on error", async () => {
        File.findById.mockRejectedValue(new Error("DB error"));

        const req = { params: { id: "abc" }, user: { userId: "1", role: "User" } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await fileController.downloadFile(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
    });
});
