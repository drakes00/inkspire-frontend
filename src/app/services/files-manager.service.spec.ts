import { TestBed } from "@angular/core/testing";
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { FilesManagerService } from "./files-manager.service";

describe("FilesManagerService", () => {
    let service: FilesManagerService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [FilesManagerService],
        });

        service = TestBed.inject(FilesManagerService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        // Verifies that there are no outstanding HTTP requests.
        httpMock.verify();
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    describe("getTree", () => {
        it("should send GET request with correct URL and headers", () => {
            const token = "test-token-123";
            const mockResponse = {
                dirs: { "1": { name: "DirA" } },
                files: { "2": { name: "FileRoot" } },
            };

            // Subscribe to the observable
            service.getTree(token).subscribe((response) => {
                // Check that the response is a JSON string
                expect(response).toBe(JSON.stringify(mockResponse));

                // Check the parsed content
                const parsed = JSON.parse(response);
                expect(parsed.dirs["1"].name).toBe("DirA");
                expect(parsed.files["2"].name).toBe("FileRoot");
            });

            // Expect a single request to the tree API
            const req = httpMock.expectOne("/api/tree");

            // Check the HTTP method
            expect(req.request.method).toBe("GET");

            // Check the headers
            expect(req.request.headers.get("Authorization")).toBe("Bearer test-token-123");
            expect(req.request.headers.get("Accept")).toBe("application/json");

            // Simulate the server response
            req.flush(mockResponse);
        });

        it("should handle empty response", () => {
            const token = "test-token";
            const mockResponse = { dirs: {}, files: {} };

            service.getTree(token).subscribe((response) => {
                const parsed = JSON.parse(response);
                expect(parsed.dirs).toEqual({});
                expect(parsed.files).toEqual({});
            });

            const req = httpMock.expectOne("/api/tree");
            req.flush(mockResponse);
        });

        it("should handle HTTP error", () => {
            const token = "test-token";
            const errorMessage = "Network error";

            service.getTree(token).subscribe({
                next: () => fail("should have failed with 500 error"),
                error: (error) => {
                    expect(error.status).toBe(500);
                    expect(error.statusText).toBe("Server Error");
                },
            });

            const req = httpMock.expectOne("/api/tree");
            req.flush(errorMessage, {
                status: 500,
                statusText: "Server Error",
            });
        });

        it("should handle unauthorized error", () => {
            const token = "invalid-token";

            service.getTree(token).subscribe({
                next: () => fail("should have failed with 401 error"),
                error: (error) => {
                    expect(error.status).toBe(401);
                },
            });

            const req = httpMock.expectOne("/api/tree");
            req.flush("Unauthorized", {
                status: 401,
                statusText: "Unauthorized",
            });
        });
    });

    describe("getDirContent", () => {
        it("should send GET request with correct URL and headers", () => {
            const dirId = 5;
            const token = "test-token-456";
            const mockResponse = {
                files: {
                    "10": { name: "file1.txt" },
                    "11": { name: "file2.txt" },
                },
            };

            service.getDirContent(dirId, token).subscribe((response) => {
                expect(response).toBe(JSON.stringify(mockResponse));

                const parsed = JSON.parse(response);
                expect(parsed.files["10"].name).toBe("file1.txt");
                expect(parsed.files["11"].name).toBe("file2.txt");
            });

            // Check that the URL contains the directory ID
            const req = httpMock.expectOne("/api/dir/5");

            expect(req.request.method).toBe("GET");
            expect(req.request.headers.get("Authorization")).toBe("Bearer test-token-456");
            expect(req.request.headers.get("Accept")).toBe("application/json");

            req.flush(mockResponse);
        });

        it("should handle directory with no files", () => {
            const dirId = 3;
            const token = "test-token";
            const mockResponse = { files: {} };

            service.getDirContent(dirId, token).subscribe((response) => {
                const parsed = JSON.parse(response);
                expect(parsed.files).toEqual({});
            });

            const req = httpMock.expectOne("/api/dir/3");
            req.flush(mockResponse);
        });

        it("should construct correct URLs for different directory IDs", () => {
            const token = "test-token";
            const testCases = [
                { id: 1, expectedUrl: "/api/dir/1" },
                { id: 42, expectedUrl: "/api/dir/42" },
                { id: 999, expectedUrl: "/api/dir/999" },
            ];

            testCases.forEach(({ id, expectedUrl }) => {
                service.getDirContent(id, token).subscribe((response) => {
                    expect(response).toBeDefined();
                });

                const req = httpMock.expectOne(expectedUrl);
                expect(req.request.method).toBe("GET");
                expect(req.request.headers.get("Authorization")).toBe("Bearer test-token");

                req.flush({ files: {} });
            });
        });

        it("should handle HTTP error", () => {
            const dirId = 999;
            const token = "test-token";

            service.getDirContent(dirId, token).subscribe({
                next: () => fail("should have failed with 404 error"),
                error: (error) => {
                    expect(error.status).toBe(404);
                    expect(error.statusText).toBe("Not Found");
                },
            });

            const req = httpMock.expectOne("/api/dir/999");
            expect(req.request.method).toBe("GET");
            expect(req.request.headers.get("Authorization")).toBe("Bearer test-token");

            req.flush("Directory not found", {
                status: 404,
                statusText: "Not Found",
            });
        });
    });

    describe("getFileInfo", () => {
        it("should send GET request with correct URL and headers", () => {
            const fileId = 1;
            const token = "test-token";
            const mockResponse = { id: 1, name: "test.txt" };

            service.getFileInfo(fileId, token).subscribe((response) => {
                expect(response).toEqual(mockResponse);
            });

            const req = httpMock.expectOne("/api/file/1");
            expect(req.request.method).toBe("GET");
            expect(req.request.headers.get("Authorization")).toBe("Bearer test-token");
            expect(req.request.headers.get("Accept")).toBe("application/json");

            req.flush(mockResponse);
        });
    });

    describe("getFileContent", () => {
        it("should send GET request with correct URL and headers and return file content", () => {
            const fileId = 123;
            const token = "test-token-789";
            const mockFileContent = "This is the content of the file.";

            service.getFileContent(fileId, token).subscribe((response) => {
                expect(response).toBe(mockFileContent);
            });

            const req = httpMock.expectOne(`/api/file/${fileId}/contents`);
            expect(req.request.method).toBe("GET");
            expect(req.request.headers.get("Authorization")).toBe("Bearer test-token-789");
            expect(req.request.headers.get("Accept")).toBe("text/plain");

            req.flush(mockFileContent);
        });

        it("should handle HTTP error", () => {
            const fileId = 404;
            const token = "test-token";

            service.getFileContent(fileId, token).subscribe({
                next: () => fail("should have failed with 404 error"),
                error: (error) => {
                    expect(error.status).toBe(404);
                    expect(error.statusText).toBe("Not Found");
                },
            });

            const req = httpMock.expectOne(`/api/file/${fileId}/contents`);
            expect(req.request.method).toBe("GET");
            expect(req.request.headers.get("Authorization")).toBe("Bearer test-token");

            req.flush("File not found", {
                status: 404,
                statusText: "Not Found",
            });
        });

        it("should handle unauthorized error", () => {
            const fileId = 1;
            const token = "invalid-token";

            service.getFileContent(fileId, token).subscribe({
                next: () => fail("should have failed with 401 error"),
                error: (error) => {
                    expect(error.status).toBe(401);
                },
            });

            const req = httpMock.expectOne(`/api/file/${fileId}/contents`);
            req.flush("Unauthorized", {
                status: 401,
                statusText: "Unauthorized",
            });
        });

        it("should handle forbidden error", () => {
            const fileId = 2;
            const token = "valid-token";

            service.getFileContent(fileId, token).subscribe({
                next: () => fail("should have failed with 403 error"),
                error: (error) => {
                    expect(error.status).toBe(403);
                },
            });

            const req = httpMock.expectOne(`/api/file/${fileId}/contents`);
            req.flush("Forbidden", {
                status: 403,
                statusText: "Forbidden",
            });
        });
    });

    describe("addFile", () => {
        it("should send POST request to create a root file", () => {
            const token = "test-token";
            const fileName = "new-root-file.txt";
            const mockResponse = { id: 100, name: fileName };

            service.addFile(token, fileName, null).subscribe((response) => {
                expect(response).toEqual(mockResponse);
            });

            const req = httpMock.expectOne("/api/file");
            expect(req.request.method).toBe("POST");
            expect(req.request.headers.get("Authorization")).toBe("Bearer " + token);
            expect(req.request.body).toEqual({ name: fileName });

            req.flush(mockResponse);
        });

        it("should send POST request to create a nested file", () => {
            const token = "test-token";
            const fileName = "new-nested-file.txt";
            const dirId = 42;
            const mockResponse = { id: 101, name: fileName, dir: dirId };

            service.addFile(token, fileName, dirId).subscribe((response) => {
                expect(response).toEqual(mockResponse);
            });

            const req = httpMock.expectOne("/api/file");
            expect(req.request.method).toBe("POST");
            expect(req.request.headers.get("Authorization")).toBe("Bearer " + token);
            expect(req.request.body).toEqual({ name: fileName, dir: dirId });

            req.flush(mockResponse);
        });

        it("should handle HTTP error on file creation", () => {
            const token = "test-token";
            const fileName = "error-file.txt";

            service.addFile(token, fileName, null).subscribe({
                next: () => fail("should have failed with 500 error"),
                error: (error) => {
                    expect(error.status).toBe(500);
                },
            });

            const req = httpMock.expectOne("/api/file");
            req.flush("Error", { status: 500, statusText: "Server Error" });
        });
    });

    describe("addDir", () => {
        it("should send POST request to create a root directory", () => {
            const token = "test-token";
            const dirName = "New Root Dir";
            const dirContext = "New Dir Context";
            const mockResponse = { id: 200, name: dirName };

            service.addDir(token, dirName, dirContext, null).subscribe((response) => {
                expect(response).toEqual(mockResponse);
            });

            const req = httpMock.expectOne("/api/dir");
            expect(req.request.method).toBe("POST");
            expect(req.request.headers.get("Authorization")).toBe("Bearer " + token);
            // Per user instruction, body should only contain the name
            expect(req.request.body).toEqual({ name: dirName, summary: dirContext });

            req.flush(mockResponse);
        });
    });

    describe("delFile", () => {
        it("should send DELETE request to delete a file", () => {
            const token = "test-token";
            const fileId = 123;
            const mockResponse = { message: "File deleted successfully" };

            service.delFile(token, fileId).subscribe((response) => {
                expect(response).toEqual(mockResponse);
            });

            const req = httpMock.expectOne(`/api/file/${fileId}`);
            expect(req.request.method).toBe("DELETE");
            expect(req.request.headers.get("Authorization")).toBe("Bearer " + token);

            req.flush(mockResponse);
        });

        it("should handle HTTP error on file deletion", () => {
            const token = "test-token";
            const fileId = 404;

            service.delFile(token, fileId).subscribe({
                next: () => fail("should have failed with 404 error"),
                error: (error) => {
                    expect(error.status).toBe(404);
                },
            });

            const req = httpMock.expectOne(`/api/file/${fileId}`);
            req.flush("Error", { status: 404, statusText: "Not Found" });
        });
    });

    describe("delDir", () => {
        it("should send DELETE request to delete a directory", () => {
            const token = "test-token";
            const dirId = 456;
            const mockResponse = { message: "Directory deleted successfully" };

            service.delDir(token, dirId).subscribe((response) => {
                expect(response).toEqual(mockResponse);
            });

            const req = httpMock.expectOne(`/api/dir/${dirId}`);
            expect(req.request.method).toBe("DELETE");
            expect(req.request.headers.get("Authorization")).toBe("Bearer " + token);

            req.flush(mockResponse);
        });

        it("should handle HTTP error on directory deletion", () => {
            const token = "test-token";
            const dirId = 404;

            service.delDir(token, dirId).subscribe({
                next: () => fail("should have failed with 404 error"),
                error: (error) => {
                    expect(error.status).toBe(404);
                },
            });

            const req = httpMock.expectOne(`/api/dir/${dirId}`);
            req.flush("Error", { status: 404, statusText: "Not Found" });
        });
    });
});