const fileController = require("../controller/fileController");
const File = require("../model/fileModel");

jest.mock("../model/fileModel");

describe("fileController", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getAllFiles", () => {
        it("should return files for the logged-in user", async () => {
            const mockFiles = [{ FileName: "a.txt" }, { FileName: "b.txt" }];
            const sortMock = jest.fn().mockResolvedValue(mockFiles);
            File.find.mockReturnValue({ sort: sortMock });

            const req = { user: { userId: "1" } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

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
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await fileController.getAllFiles(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
        });
    });

    describe("uploadFile", () => {
        it("should return 400 when no file is uploaded", async () => {
            const req = { user: { userId: "1" }, file: null };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await fileController.uploadFile(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "No file uploaded" });
        });

        it("should save file metadata and return 201", async () => {
            const savedFile = { FileName: "report.pdf" };
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
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await fileController.uploadFile(req, res);

            expect(File).toHaveBeenCalledWith({
                UserId: "1",
                FileName: "report.pdf",
                FilePath: "uploads/report.pdf",
                FileSize: 1234,
                FileType: "application/pdf"
            });
            expect(saveMock).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(savedFile);
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
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await fileController.uploadFile(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
        });
    });

    describe("deleteFile", () => {
        it("should return 404 if file is not found", async () => {
            File.findById.mockResolvedValue(null);

            const req = { params: { id: "abc" }, user: { userId: "1", role: "User" } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await fileController.deleteFile(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "File not found" });
        });

        it("should return 403 if user is not owner or admin", async () => {
            File.findById.mockResolvedValue({ UserId: "2" });

            const req = { params: { id: "abc" }, user: { userId: "1", role: "User" } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await fileController.deleteFile(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: "Access denied" });
        });

        it("should delete file when owner", async () => {
            File.findById.mockResolvedValue({ UserId: "1" });
            File.findByIdAndDelete.mockResolvedValue({});

            const req = { params: { id: "abc" }, user: { userId: "1", role: "User" } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await fileController.deleteFile(req, res);

            expect(File.findByIdAndDelete).toHaveBeenCalledWith("abc");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: "File deleted successfully" });
        });

        it("should delete file when admin", async () => {
            File.findById.mockResolvedValue({ UserId: "2" });
            File.findByIdAndDelete.mockResolvedValue({});

            const req = { params: { id: "abc" }, user: { userId: "1", role: "Admin" } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await fileController.deleteFile(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: "File deleted successfully" });
        });

        it("should return 500 on error", async () => {
            File.findById.mockRejectedValue(new Error("DB error"));

            const req = { params: { id: "abc" }, user: { userId: "1", role: "User" } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await fileController.deleteFile(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
        });
    });

    describe("downloadFile", () => {
        it("should return 404 if file is not found", async () => {
            File.findById.mockResolvedValue(null);

            const req = { params: { id: "abc" }, user: { userId: "1", role: "User" } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await fileController.downloadFile(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "File not found" });
        });

        it("should return 403 if user is not owner or admin", async () => {
            File.findById.mockResolvedValue({ UserId: "2" });

            const req = { params: { id: "abc" }, user: { userId: "1", role: "User" } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await fileController.downloadFile(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: "Access denied" });
        });

        it("should return file metadata when owner", async () => {
            const file = { UserId: "1", FileName: "report.pdf" };
            File.findById.mockResolvedValue(file);

            const req = { params: { id: "abc" }, user: { userId: "1", role: "User" } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await fileController.downloadFile(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(file);
        });

        it("should return 500 on error", async () => {
            File.findById.mockRejectedValue(new Error("DB error"));

            const req = { params: { id: "abc" }, user: { userId: "1", role: "User" } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

            await fileController.downloadFile(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
        });
    });
});
