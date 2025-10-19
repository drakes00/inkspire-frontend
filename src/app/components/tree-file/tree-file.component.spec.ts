import { ComponentFixture, TestBed, fakeAsync, tick } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { TreeFileComponent } from "./tree-file.component";
import { FilesManagerService } from "../../services/files-manager.service";
import { SharedFilesService } from "../../services/shared-files.service";

// Mock implementation of FilesManagerService for isolated testing.
class MockFilesManagerService {
    getTree = jasmine.createSpy("getTree").and.returnValue(
        of(
            JSON.stringify({
                dirs: { "1": { name: "DirA" } },
                files: { "2": { name: "FileRoot" } },
            }),
        ),
    );

    getDirContent = jasmine.createSpy("getDirContent").and.callFake((id: number) => {
        if (id === 1) {
            return of(
                JSON.stringify({
                    files: { "3": { name: "NestedFileA" } },
                }),
            );
        }
        return of(JSON.stringify({ files: {} }));
    });

    addFile = jasmine.createSpy("addFile").and.returnValue(of({}));
    addDir = jasmine.createSpy("addDir").and.returnValue(of({}));
    delFile = jasmine.createSpy("delFile").and.returnValue(of({}));
    delDir = jasmine.createSpy("delDir").and.returnValue(of({}));
}

// Mock implementation of SharedFilesService for isolated testing.
class MockSharedFilesService {
    setSelectedFile = jasmine.createSpy("setSelectedFile");
}

describe("TreeFileComponent", () => {
    let fixture: ComponentFixture<TreeFileComponent>;
    let component: TreeFileComponent;
    let mockFilesManagerService: MockFilesManagerService;
    let mockSharedFilesService: MockSharedFilesService;

    beforeEach(async () => {
        // Create instances of the mock services.
        mockFilesManagerService = new MockFilesManagerService();
        mockSharedFilesService = new MockSharedFilesService();

        // Configure the testing module with the component and mock providers.
        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, TreeFileComponent],
            providers: [
                {
                    provide: FilesManagerService,
                    useValue: mockFilesManagerService,
                },
                {
                    provide: SharedFilesService,
                    useValue: mockSharedFilesService,
                },
            ],
        }).compileComponents();

        // Create the component fixture and instance.
        fixture = TestBed.createComponent(TreeFileComponent);
        component = fixture.componentInstance;
        fixture.detectChanges(); // Trigger initial data binding.
    });

    it("should create the component", () => {
        expect(component).toBeTruthy();
    });

    // ------------------------------------
    // Functional tests
    // ------------------------------------

    it("should load directories and files correctly on initialization", fakeAsync(() => {
        spyOn(localStorage, "getItem").and.returnValue("FAKE_TOKEN");

        component.updateTree();
        tick(); // Simulate the passage of time for async operations.

        // Check that directories and their children are loaded.
        const data = component.dataSource.data;
        expect(data.length).toBe(2); // Expect 1 directory and 1 root file.
        const dirNode = data.find((n) => n.name === "DirA");
        expect(dirNode?.type).toBe("D");
        expect(dirNode?.children?.[0].name).toBe("NestedFileA");

        // Check that root-level files are loaded.
        const fileNode = data.find((n) => n.name === "FileRoot");
        expect(fileNode).toBeDefined();
        expect(fileNode?.type).toBe("F");
        expect(fileNode?.children).toBeUndefined(); // Files should not have children.
    }));

    it("should not load the tree if the authentication token is missing", fakeAsync(() => {
        spyOn(localStorage, "getItem").and.returnValue(null);

        component.updateTree();
        tick();

        // The data source should be empty.
        expect(component.dataSource.data).toEqual([]);
    }));

    it("should continue loading other directories even if one fails", fakeAsync(() => {
        spyOn(console, "error"); // Suppress console error for this test.

        // Simulate an error when fetching directory content.
        mockFilesManagerService.getDirContent.and.returnValue(throwError(() => new Error("Network error")));
        spyOn(localStorage, "getItem").and.returnValue("FAKE_TOKEN");

        component.updateTree();
        tick();

        // The tree should still contain other nodes.
        expect(component.dataSource.data.length).toBeGreaterThan(0);
        // Verify that the error was logged.
        expect(console.error).toHaveBeenCalledWith("Error loading directory content for:", "DirA", jasmine.any(Error));
    }));

    it("should select a file and notify SharedFilesService", () => {
        const fileNode = {
            id: 2,
            name: "FileRoot",
            expandable: false,
            level: 0,
        };

        component.selectNode(fileNode);

        // The node should be marked as selected.
        expect(component.selectedNode).toEqual(fileNode);
        // The shared service should be notified with the file ID.
        expect(mockSharedFilesService.setSelectedFile).toHaveBeenCalledWith(2);
    });

    it("should not select a directory", () => {
        const dirNode = { id: 1, name: "DirA", expandable: true, level: 0 };

        component.selectNode(dirNode);

        // Directories should not be selectable, only expandable.
        expect(component.selectedNode).toBeNull();
        expect(mockSharedFilesService.setSelectedFile).not.toHaveBeenCalled();
    });

    it("should not deselect a node when clicking on it again", () => {
        const fileNode = {
            id: 2,
            name: "FileRoot",
            expandable: false,
            level: 0,
        };

        // First selection.
        component.selectNode(fileNode);
        expect(component.selectedNode).toEqual(fileNode);
        expect(mockSharedFilesService.setSelectedFile).toHaveBeenCalledWith(2);
        expect(mockSharedFilesService.setSelectedFile).toHaveBeenCalledTimes(1);

        // Second selection of the same node.
        component.selectNode(fileNode);
        expect(component.selectedNode).toEqual(fileNode); // Still selected.
        // The service is NOT called again.
        expect(mockSharedFilesService.setSelectedFile).toHaveBeenCalledTimes(1);
    });

    it("should select a nested file and notify SharedFilesService", () => {
        const nestedFile = {
            id: 5,
            name: "Nested.txt",
            expandable: false,
            level: 2,
        };

        component.selectNode(nestedFile);

        expect(component.selectedNode).toEqual(nestedFile);
        expect(mockSharedFilesService.setSelectedFile).toHaveBeenCalledWith(5);
    });

    // ------------------------------------
    // Visual tests
    // ------------------------------------

    it("should toggle the loading class on the document body", () => {
        component.showLoading();
        expect(document.body.classList.contains("loading")).toBeTrue();

        component.removeLoading();
        expect(document.body.classList.contains("loading")).toBeFalse();
    });

    it("should call showLoading and removeLoading during a synchronous tree update", () => {
        spyOn(component, "showLoading").and.callThrough();
        spyOn(component, "removeLoading").and.callThrough();

        // Mock synchronous service calls.
        mockFilesManagerService.getTree.and.returnValue(
            of(
                JSON.stringify({
                    dirs: { "1": { name: "DirA" } },
                    files: {},
                }),
            ),
        );
        mockFilesManagerService.getDirContent.and.returnValue(of(JSON.stringify({ files: {} })));

        component.updateTree();

        // Both methods should have been called once.
        expect(component.showLoading).toHaveBeenCalledTimes(1);
        expect(component.removeLoading).toHaveBeenCalledTimes(1);
    });

    it("should render folder and file icons correctly", fakeAsync(() => {
        spyOn(localStorage, "getItem").and.returnValue("FAKE_TOKEN");
        component.updateTree();
        tick();
        fixture.detectChanges();

        const icons = fixture.nativeElement.querySelectorAll("mat-icon");
        expect(icons.length).toBeGreaterThan(0);
        // Check that node names are rendered.
        expect(fixture.nativeElement.textContent).toContain("DirA");
        expect(fixture.nativeElement.textContent).toContain("FileRoot");
    }));

    it('should apply the "selected-node" class when a node is selected', () => {
        // Set up the data source with a file node.
        component.dataSource.data = [{ id: 2, name: "FileRoot", type: "F" }];
        fixture.detectChanges();

        const flatNode = component.treeControl.dataNodes[0];
        const nodeElement = fixture.nativeElement.querySelector(".file-node");

        // Before selection.
        expect(nodeElement.classList.contains("selected-node")).toBeFalse();

        // Perform selection.
        component.selectNode(flatNode);
        fixture.detectChanges();

        // After selection.
        expect(nodeElement.classList.contains("selected-node")).toBeTrue();
    });

    it("should keep node actions menu visible when open", () => {
        // Populate data with a directory
        component.dataSource.data = [{ id: 1, name: "DirA", type: "D" }];
        fixture.detectChanges();

        const dirNodeElement = fixture.nativeElement.querySelector(".mdc-tree-node");
        const nodeActionsElement = dirNodeElement.querySelector(".node-actions");
        const dirNode = component.treeControl.dataNodes[0];

        // Initially, actions should be hidden
        expect(getComputedStyle(nodeActionsElement).visibility).toBe("hidden");

        // --- Open menu ---
        component.onDirMenuOpen(dirNode, new MouseEvent("click"));
        fixture.detectChanges();

        // Actions should become visible because of the .menu-open class
        expect(getComputedStyle(nodeActionsElement).visibility).toBe("visible");
        expect(dirNodeElement.classList.contains("menu-open")).toBeTrue();

        // --- Close menu ---
        component.onDirMenuClose();
        fixture.detectChanges();

        // Actions should become hidden again
        expect(getComputedStyle(nodeActionsElement).visibility).toBe("hidden");
        expect(dirNodeElement.classList.contains("menu-open")).toBeFalse();
    });

    // ------------------------------------
    // Creation Actions & Modal
    // ------------------------------------

    describe("Creation Actions & Modal", () => {
        beforeEach(() => {
            spyOn(localStorage, "getItem").and.returnValue("test-token");
            spyOn(component, "updateTree"); // Spy on updateTree to check if it's called
        });

        it("should open modal for root file creation", () => {
            component.handleCreateFile(null);
            expect(component.isModalVisible).toBeTrue();
            expect(component.modalTitle).toBe("Create New File");
            expect(component.modalShowContext).toBeFalse();
            expect(component.creationDirectoryId).toBe(null);
        });

        it("should open modal for file creation", () => {
            component.handleCreateFile(123);
            expect(component.isModalVisible).toBeTrue();
            expect(component.modalTitle).toBe("Create New File");
            expect(component.modalShowContext).toBeFalse();
            expect(component.creationDirectoryId).toBe(123);
        });

        it("should open modal for directory creation", () => {
            component.handleCreateDirectory(null);
            expect(component.isModalVisible).toBeTrue();
            expect(component.modalTitle).toBe("Create New Directory");
            expect(component.modalShowContext).toBeTrue();
            expect(component.creationDirectoryId).toBeNull();
        });

        it("should call addFile service and update tree when creating a root file", () => {
            component.creationDirectoryId = null;
            component.modalShowContext = false; // It's a file

            const event = { name: "new-root-file.txt", context: "" };
            component.onModalValidate(event);

            expect(mockFilesManagerService.addFile).toHaveBeenCalledWith("test-token", "new-root-file.txt", null);
            expect(component.updateTree).toHaveBeenCalled();
        });

        it("should call addFile service and update tree when creating a nested file", () => {
            component.creationDirectoryId = 42;
            component.modalShowContext = false; // It's a file

            const event = { name: "new-nested-file.txt", context: "" };
            component.onModalValidate(event);

            expect(mockFilesManagerService.addFile).toHaveBeenCalledWith("test-token", "new-nested-file.txt", 42);
            expect(component.updateTree).toHaveBeenCalled();
        });

        it("should call addDir service and update tree when creating a root directory", () => {
            component.creationDirectoryId = null;
            component.modalShowContext = true; // It's a directory

            const event = { name: "new-root-dir", context: "some context" };
            component.onModalValidate(event);

            expect(mockFilesManagerService.addDir).toHaveBeenCalledWith(
                "test-token",
                "new-root-dir",
                "some context",
                null,
            );
            expect(component.updateTree).toHaveBeenCalled();
        });

        it("should log an error if file creation fails", () => {
            mockFilesManagerService.addFile.and.returnValue(throwError(() => new Error("Creation failed")));
            spyOn(console, "error");

            component.creationDirectoryId = 1;
            component.modalShowContext = false;
            const event = { name: "fail.txt", context: "" };
            component.onModalValidate(event);

            expect(component.updateTree).not.toHaveBeenCalled();
            expect(console.error).toHaveBeenCalledWith("Error creating file:", jasmine.any(Error));
        });

        it("should log an error if directory creation fails", () => {
            mockFilesManagerService.addDir.and.returnValue(throwError(() => new Error("Creation failed")));
            spyOn(console, "error");

            component.creationDirectoryId = 1;
            component.modalShowContext = true;
            const event = { name: "fail-dir", context: "" };
            component.onModalValidate(event);

            expect(component.updateTree).not.toHaveBeenCalled();
            expect(console.error).toHaveBeenCalledWith("Error creating directory:", jasmine.any(Error));
        });

        it("should close modal", () => {
            component.isModalVisible = true;
            component.closeModal();
            expect(component.isModalVisible).toBeFalse();
        });
    });

    describe("Deletion Actions", () => {
        let fileNode: any; // Using 'any' to simplify test setup
        let dirNode: any;

        beforeEach(() => {
            spyOn(localStorage, "getItem").and.returnValue("test-token");
            spyOn(component, "updateTree");
            spyOn(window, "confirm").and.returnValue(true);

            fileNode = { id: 10, name: "file-to-delete.txt", expandable: false, level: 1 };
            dirNode = { id: 20, name: "dir-to-delete", expandable: true, level: 1 };
        });

        it("should call delFile service and update tree when deleting a file", () => {
            component.handleDelete(fileNode);

            expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete "file-to-delete.txt"?');
            expect(mockFilesManagerService.delFile).toHaveBeenCalledWith("test-token", 10);
            expect(component.updateTree).toHaveBeenCalled();
        });

        it("should call delDir service and update tree when deleting a directory", () => {
            component.handleDelete(dirNode);

            expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete "dir-to-delete"?');
            expect(mockFilesManagerService.delDir).toHaveBeenCalledWith("test-token", 20);
            expect(component.updateTree).toHaveBeenCalled();
        });

        it("should not delete if confirmation is cancelled", () => {
            (window.confirm as jasmine.Spy).and.returnValue(false);

            component.handleDelete(fileNode);

            expect(mockFilesManagerService.delFile).not.toHaveBeenCalled();
            expect(component.updateTree).not.toHaveBeenCalled();
        });

        it("should clear selection if the selected file is deleted", () => {
            component.selectedNode = fileNode; // Select the node first
            spyOn(component, "isSelected").and.returnValue(true);

            component.handleDelete(fileNode);

            expect(mockFilesManagerService.delFile).toHaveBeenCalled();
            expect(mockSharedFilesService.setSelectedFile).toHaveBeenCalledWith(null);
            expect(component.selectedNode).toBeNull();
            expect(component.updateTree).toHaveBeenCalled();
        });

        it("should log an error if file deletion fails", () => {
            mockFilesManagerService.delFile.and.returnValue(throwError(() => new Error("Deletion failed")));
            spyOn(console, "error");

            component.handleDelete(fileNode);

            expect(component.updateTree).not.toHaveBeenCalled();
            expect(console.error).toHaveBeenCalledWith("Error deleting file:", jasmine.any(Error));
        });

        it("should log an error if directory deletion fails", () => {
            mockFilesManagerService.delDir.and.returnValue(throwError(() => new Error("Deletion failed")));
            spyOn(console, "error");

            component.handleDelete(dirNode);

            expect(component.updateTree).not.toHaveBeenCalled();
            expect(console.error).toHaveBeenCalledWith("Error deleting directory:", jasmine.any(Error));
        });
    });
});
