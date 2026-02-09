const File = require("../model/fileModel");

describe("File Model", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should retrieve all files from the database", async () => {
        const mockFiles = [
            { FileName: "a.txt", FileSize: 10, FileType: "text/plain" },
            { FileName: "b.pdf", FileSize: 200, FileType: "application/pdf" }
        ];

        File.find = jest.fn().mockResolvedValue(mockFiles);

        const files = await File.find({});

        expect(File.find).toHaveBeenCalledWith({});
        expect(files).toHaveLength(2);
        expect(files[0].FileName).toBe("a.txt");
        expect(files[0].FileSize).toBe(10);
        expect(files[1].FileName).toBe("b.pdf");
        expect(files[1].FileType).toBe("application/pdf");
    });

    it("should handle errors when retrieving files", async () => {
        const errorMessage = "Database error";
        File.find = jest.fn().mockRejectedValue(new Error(errorMessage));

        await expect(File.find({})).rejects.toThrow(errorMessage);
    });
});
