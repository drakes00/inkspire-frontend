import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from "@angular/core";
import { FlatTreeControl } from "@angular/cdk/tree";
import { MatTreeFlatDataSource, MatTreeFlattener, MatTreeModule } from "@angular/material/tree";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";
import { forkJoin, of } from "rxjs";
import { catchError, map, switchMap } from "rxjs/operators";
import { ModalComponent } from "../modal/modal.component";
import { FilesManagerService } from "../../services/files-manager.service";
import { SharedFilesService } from "../../services/shared-files.service";
import { ThemeService } from "../../services/theme.service";

/**
 * Represents a flattened node used by the Material tree control.
 */
interface ExampleFlatNode {
    id: number;
    expandable: boolean;
    name: string;
    level: number;
}

/**
 * Represents a node in the file system tree.
 */
interface FileSystemNode {
    id: number;
    name: string;
    type: "D" | "F"; // D for Directory, F for File
    children?: FileSystemNode[];
}

/**
 * The TreeFileComponent is responsible for displaying a hierarchical file system view.
 * It allows users to navigate through directories and select files.
 */
@Component({
    selector: "app-tree-file",
    standalone: true,
    imports: [MatTreeModule, MatButtonModule, MatIconModule, MatMenuModule, ModalComponent],
    templateUrl: "./tree-file.component.html",
    styleUrls: ["./tree-file.component.css"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeFileComponent {
    // -------------------- COMPONENT PROPERTIES --------------------

    /** The root of the file system structure. */
    FILE_SYSTEM: FileSystemNode[] = [];

    /** The currently selected node in the tree. */
    selectedNode: ExampleFlatNode | null = null;

    /** The node that the context menu is opened for. */
    contextNode: ExampleFlatNode | null = null;

    /** The ID of the node for which the menu is currently open. */
    menuOpenForNode: number | null = null;

    // --- Modal Properties ---

    /** Flag to control the visibility of the modal. */
    isModalVisible = false;

    /** The title for the modal. */
    modalTitle = "";

    /** Whether to show the context textarea in the modal. */
    modalShowContext = false;

    /** The ID of the parent directory for a new item, or null for root. */
    creationDirectoryId: number | null = null;

    /** Flag to indicate if the modal is in edit mode. */
    isEditMode = false;

    /** The node being edited. */
    editingNode: ExampleFlatNode | null = null;

    /** Initial name for the modal input field. */
    modalInputName = "";

    /** Initial context for the modal input field. */
    modalInputContext = "";

    /** Transforms a `FileSystemNode` to a `ExampleFlatNode`. This is used by the tree flattener. */
    private _transformer = (node: FileSystemNode, level: number): ExampleFlatNode => ({
        id: node.id,
        expandable: node.type === "D",
        name: node.name,
        level,
    });

    /** The tree flattener for the Material tree. It flattens the hierarchical tree structure. */
    treeFlattener = new MatTreeFlattener(
        this._transformer,
        (node) => node.level,
        (node) => node.expandable,
        (node) => node.children,
    );

    /** The tree control for the Material tree. It manages the expansion state of nodes. */
    treeControl = new FlatTreeControl<ExampleFlatNode>(
        (node) => node.level,
        (node) => node.expandable,
    );

    /** The data source for the Material tree. */
    dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    /**
     * Initializes the component, injects dependencies, and triggers the initial tree update.
     * @param filesManagerService Service to manage file and directory data.
     * @param shareFiles Service to share selected file information across components.
     * @param cdr The change detector reference for manual change detection.
     * @param themeService Service to manage the application's theme.
     */
    constructor(
        private filesManagerService: FilesManagerService,
        private shareFiles: SharedFilesService,
        private cdr: ChangeDetectorRef,
        public themeService: ThemeService,
    ) {
        this.updateTree();
    }

    // --------------------  TREE DISPLAY & NAVIGATION  --------------------

    /**
     * Checks if a node has children. Used by the tree definition.
     * @param _ The node's index in the flattened array.
     * @param node The node to check.
     * @returns True if the node is expandable (a directory).
     */
    hasChild = (_: number, node: ExampleFlatNode): boolean => node.expandable;

    /**
     * Fetches the file system structure from the server and updates the tree.
     * It first retrieves the root directories and files, then fetches the content of each directory.
     */
    updateTree(): void {
        this.showLoading();
        const token = localStorage.getItem("token");

        if (!token) {
            this.dataSource.data = [];
            this.removeLoading();
            return;
        }

        this.filesManagerService
            .getTree(token)
            .pipe(
                map((response) => {
                    const jsonResponse = JSON.parse(response);
                    const files = jsonResponse.files || {};
                    const dirs = jsonResponse.dirs || {};

                    const rootNodes: FileSystemNode[] = [];
                    const dirRequests = Object.entries(dirs).map(([dirId, dir]) => {
                        const dirNode: FileSystemNode = {
                            id: parseInt(dirId, 10),
                            name: (dir as any).name,
                            type: "D",
                            children: [],
                        };

                        rootNodes.push(dirNode);

                        // Request content for each directory
                        return this.filesManagerService.getDirContent(dirNode.id, token).pipe(
                            map((res) => {
                                const jsonRes = JSON.parse(res);
                                const files = jsonRes.files || {};
                                const children: FileSystemNode[] = [];

                                for (const fileId in files) {
                                    if (Object.prototype.hasOwnProperty.call(files, fileId)) {
                                        const file = files[fileId];
                                        children.push({
                                            id: parseInt(fileId, 10),
                                            name: file.name,
                                            type: "F",
                                        });
                                    }
                                }
                                dirNode.children = children;
                                return dirNode;
                            }),
                            catchError((err) => {
                                console.error("Error loading directory content for:", dirNode.name, err);
                                // Return the directory node even if content loading fails
                                return of(dirNode);
                            }),
                        );
                    });

                    // Add root-level files
                    for (const fileId in files) {
                        if (Object.prototype.hasOwnProperty.call(files, fileId)) {
                            const file = files[fileId];
                            rootNodes.push({
                                id: parseInt(fileId, 10),
                                name: file.name,
                                type: "F",
                            });
                        }
                    }

                    return { rootNodes, dirRequests };
                }),
                // Wait for all directory content requests to complete
                switchMap(({ rootNodes, dirRequests }) => {
                    const allRequests = dirRequests.length > 0 ? forkJoin(dirRequests) : of([]);
                    return allRequests.pipe(map(() => rootNodes));
                }),
            )
            .subscribe({
                next: (rootNodes) => {
                    this.FILE_SYSTEM = rootNodes;
                    this.dataSource.data = this.FILE_SYSTEM;
                    this.removeLoading();
                    this.cdr.markForCheck(); // Trigger change detection
                },
                error: (err) => {
                    this.removeLoading();
                    // The auth interceptor should handle 401 errors and redirect.
                    console.error("An error occurred while updating the tree:", err);
                },
            });
    }

    /**
     * Generates a unique key for a node based on its type and ID.
     * @param node The node to generate a key for.
     * @returns A unique string key.
     */
    private getNodeKey(node: ExampleFlatNode): string {
        return `${node.expandable ? "D" : "F"}-${node.id}`;
    }

    /**
     * Checks if a node is currently selected.
     * @param node The node to check.
     * @returns True if the node is the currently selected one.
     */
    isSelected(node: ExampleFlatNode): boolean {
        if (!this.selectedNode) return false;
        return this.getNodeKey(this.selectedNode) === this.getNodeKey(node);
    }

    /**
     * Handles the selection of a node in the tree.
     * If a directory is clicked, it toggles its expansion state.
     * If a file is clicked, it marks it as selected and notifies the `SharedFilesService`.
     * @param node The node that was clicked.
     * @param event The mouse event, used to stop propagation.
     */
    selectNode(node: ExampleFlatNode, event?: MouseEvent): void {
        if (event) {
            event.stopPropagation();
        }

        if (node.expandable) {
            // If it's a directory, toggle its expansion.
            this.treeControl.toggle(node);
        } else {
            // It's a file, so select it.
            if (!this.isSelected(node)) {
                this.shareFiles.setSelectedFile(node.id);
            }
            this.selectedNode = node;
        }
        this.cdr.markForCheck();
    }

    // --------------------  ACTIONS & MODAL HANDLING  --------------------

    /**
     * Toggles the application's theme between light and dark mode.
     */
    toggleTheme(): void {
        this.themeService.toggleTheme();
    }

    /**
     * Opens the creation modal for a new file.
     * @param directoryId The ID of the parent directory. If null, the file is created at the root.
     */
    handleCreateFile(directoryId: number | null = null): void {
        this.isEditMode = false;
        this.modalTitle = "Create New File";
        this.modalShowContext = false;
        this.creationDirectoryId = directoryId;
        this.modalInputName = "";
        this.modalInputContext = "";
        this.isModalVisible = true;
        this.cdr.markForCheck();
    }

    /**
     * Opens the creation modal for a new directory.
     * @param directoryId The ID of the parent directory. If null, the directory is created at the root.
     */
    handleCreateDirectory(directoryId: number | null = null): void {
        this.isEditMode = false;
        this.modalTitle = "Create New Directory";
        this.modalShowContext = true;
        this.creationDirectoryId = directoryId;
        this.modalInputName = "";
        this.modalInputContext = "";
        this.isModalVisible = true;
        this.cdr.markForCheck();
    }

    /**
     * Sets the context node and open state for the directory actions menu.
     * @param node The node for which the menu is opened.
     * @param event The mouse event.
     */
    onDirMenuOpen(node: ExampleFlatNode, event: MouseEvent): void {
        event.stopPropagation();
        this.contextNode = node;
        this.menuOpenForNode = node.id;
        this.cdr.markForCheck();
    }

    /**
     * Opens the modal for editing an existing file or directory.
     * @param node The node to be edited.
     */
    handleEdit(node: ExampleFlatNode): void {
        const token = localStorage.getItem("token");
        if (!token) return;

        this.isEditMode = true;
        this.editingNode = node;
        this.modalInputName = node.name;

        if (node.expandable) {
            // Directory: fetch summary and show context field
            this.modalTitle = "Edit Directory";
            this.modalShowContext = true;
            this.filesManagerService.getDirContent(node.id, token).subscribe((response) => {
                const dirDetails = JSON.parse(response);
                this.modalInputContext = dirDetails.summary || "";
                this.isModalVisible = true;
                this.cdr.markForCheck();
            });
        } else {
            // File: no context field needed
            this.modalTitle = "Edit File";
            this.modalShowContext = false;
            this.modalInputContext = "";
            this.isModalVisible = true;
            this.cdr.markForCheck();
        }
    }

    /**
     * Handles the deletion of a file or directory.
     * @param node The node to be deleted.
     */
    handleDelete(node: ExampleFlatNode): void {
        const token = localStorage.getItem("token");
        if (!token) {
            console.error("No token found, cannot perform action.");
            return;
        }

        const confirmation = confirm(`Are you sure you want to delete "${node.name}"?`);
        if (!confirmation) {
            return;
        }

        if (node.expandable) {
            // Directory
            this.filesManagerService.delDir(token, node.id).subscribe({
                next: () => this.updateTree(),
                error: (err) => console.error("Error deleting directory:", err),
            });
        } else {
            // File
            this.filesManagerService.delFile(token, node.id).subscribe({
                next: () => {
                    if (this.isSelected(node)) {
                        this.shareFiles.setSelectedFile(null);
                        this.selectedNode = null;
                    }
                    this.updateTree();
                },
                error: (err) => console.error("Error deleting file:", err),
            });
        }
    }

    /**
     * Clears the open menu state when a menu is closed.
     */
    onDirMenuClose(): void {
        this.menuOpenForNode = null;
        this.cdr.markForCheck();
    }

    /**
     * Closes the modal and resets any edit-related state.
     */
    closeModal(): void {
        this.isModalVisible = false;
        this.editingNode = null;
        this.isEditMode = false;
    }

    /**
     * Handles the validation event from the modal, delegating to the appropriate
     * handler based on whether the modal is in create or edit mode.
     * @param event The event payload from the modal.
     */
    onModalValidate(event: { name: string; context: string }): void {
        this.isModalVisible = false;
        const token = localStorage.getItem("token");
        if (!token) {
            console.error("No token found, cannot perform action.");
            return;
        }

        if (this.isEditMode) {
            this.handleEditValidation(token, event);
        } else {
            this.handleCreateValidation(token, event);
        }

        this.editingNode = null;
        this.isEditMode = false;
    }

    /**
     * Handles the logic for creating a new file or directory.
     * @param token The authentication token.
     * @param event The event payload from the modal.
     */
    private handleCreateValidation(token: string, event: { name: string; context: string }): void {
        const type = this.modalShowContext ? "directory" : "file";

        if (type === "file") {
            this.filesManagerService.addFile(token, event.name, this.creationDirectoryId).subscribe({
                next: () => this.updateTree(),
                error: (err) => console.error("Error creating file:", err),
            });
        } else {
            // type === 'directory'
            this.filesManagerService.addDir(token, event.name, event.context, this.creationDirectoryId).subscribe({
                next: () => this.updateTree(),
                error: (err) => console.error("Error creating directory:", err),
            });
        }
    }

    /**
     * Handles the logic for editing an existing file or directory.
     * @param token The authentication token.
     * @param event The event payload from the modal.
     */
    private handleEditValidation(token: string, event: { name: string; context: string }): void {
        if (!this.editingNode) return;

        if (this.editingNode.expandable) {
            // Directory
            this.filesManagerService.editDir(token, this.editingNode.id, event.name, event.context).subscribe({
                next: () => this.updateTree(),
                error: (err) => console.error("Error editing directory:", err),
            });
        } else {
            // File
            this.filesManagerService.editFile(token, this.editingNode.id, event.name).subscribe({
                next: () => this.updateTree(),
                error: (err) => console.error("Error editing file:", err),
            });
        }
    }

    // --------------------  UTILITIES  ---------------------------------

    /**
     * Adds a 'loading' class to the body to indicate a pending operation.
     * This is useful for providing visual feedback to the user.
     */
    showLoading(): void {
        document.body.classList.add("loading");
    }

    /**
     * Removes the 'loading' class from the body.
     */
    removeLoading(): void {
        document.body.classList.remove("loading");
    }
}
