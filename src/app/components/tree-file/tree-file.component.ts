import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener, MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { FlatTreeControl } from '@angular/cdk/tree';
import { CommonModule } from '@angular/common';
import { ModalChoiceComponent } from '../modal-choice/modal-choice.component';
import { ModalEditComponent } from '../modal-edit/modal-edit.component';
import { FilesManagerService } from '../../services/files-manager.service';
import { SharedFilesService } from '../../services/shared-files.service';

interface ExampleFlatNode {
    id: number;
    expandable: boolean;
    name: string;
    level: number;
}

interface FileSystemNode {
    id: number;
    name: string;
    type: string;
    children?: FileSystemNode[];
}


@Component({
    selector: 'app-tree-file',
    standalone: true,
    imports: [
        CommonModule, MatTreeModule, MatButtonModule,
        MatIconModule, MatMenuModule, ModalChoiceComponent,
        ModalEditComponent],
    templateUrl: './tree-file.component.html',
    styleUrls: ['./tree-file.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})


export class TreeFileComponent {

    title = "";
    isModalVisible = false;
    isEditModalVisible = false;
    isDirectoryEditing = false;
    contextOfDir = "";
    nameOfNode = "";
    selectedNode: ExampleFlatNode | null = null;
    filesManagerService = new FilesManagerService();
    FILE_SYSTEM: FileSystemNode[] = []

    private _transformer = (node: FileSystemNode, level: number) => {
        return {
            id: node.id,
            expandable: node.type == "D",
            name: node.name,
            level: level,
        };
    };

    treeControl = new FlatTreeControl<ExampleFlatNode>(
        node => node.level,
        node => node.expandable,
    );

    treeFlattener = new MatTreeFlattener(
        this._transformer,
        node => node.level,
        node => node.expandable,
        node => node.children,
    );

    dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);


    async updateTree() {
        this.showLoading()
        let token = localStorage.getItem("token");
        if (token) {
            let response = await this.filesManagerService.getTree(token);
            let jsonResponse = JSON.parse(response);
            this.FILE_SYSTEM = jsonResponse.param;
        }
        this.dataSource.data = this.FILE_SYSTEM;
        this.removeLoading()
    }

    constructor(private shareFiles: SharedFilesService) {
        this.updateTree();
    }

    hasChild = (_: number, node: ExampleFlatNode) => node.expandable;

    // Check if node is selected
    isSelected(node: ExampleFlatNode): boolean {
        return this.selectedNode?.id === node.id && this.selectedNode?.name === node.name;
    }

    // Select any node (file or directory)
    selectNode(node: ExampleFlatNode): void {
        if (this.isSelected(node)) {
            this.selectedNode = null; // Deselect if already selected
            this.shareFiles.setSelectedFile(undefined);
            return;
        }
        this.selectedNode = node;
        if (!node.expandable) {
            this.shareFiles.setSelectedFile(node.id);
        }
    }

    showLoading() {
        var containeur = document.body
        containeur?.classList.add("loading");
    }

    removeLoading() {
        var containeur = document.body
        containeur?.classList.remove("loading");
    }


    /*
        Get the parent directory of a file or a directory.
        It helps display the tree.
    */
    getTargetDirectory(node: ExampleFlatNode): ExampleFlatNode | null {
        if (node.expandable) {
            return node; // It's already a directory
        }

        // Find the parent directory
        const flattenedNodes = this.treeControl.dataNodes;
        const currentLevel = node.level;

        for (let i = flattenedNodes.indexOf(node) - 1; i >= 0; i--) {
            const potentialParent = flattenedNodes[i];
            if (potentialParent.level < currentLevel && potentialParent.expandable) {
                return potentialParent;
            }
        }

        return null;
    }


    /*
        Handle the edit file or directory action when clicked
    */
    async handleEditAction() {
        let userToken = localStorage.getItem("token");
        if (this.selectedNode && userToken) {
            this.nameOfNode = this.selectedNode.name;
            this.isEditModalVisible = true;
            //case where we want to edit a file
            if (!this.selectedNode.expandable) {
                this.title = "Edit a file";
                this.isDirectoryEditing = false;
            }
            //case where we want to edit a diretory
            else {
                this.title = "Edit a directory"
                this.isDirectoryEditing = true;
                let response = await this.filesManagerService.getContextDirById(this.selectedNode.id, userToken);
                this.contextOfDir = JSON.parse(response).param.context;
            }
        }

    }


    /*
        Handle the remove file or directory action when clicked
    */
    async handleRemoveAction() {
        if (this.selectedNode) {
            let userToken = localStorage.getItem("token")
            let result = null
            if (this.selectedNode.expandable && userToken) {
                result = await this.filesManagerService.delDir(userToken, this.selectedNode.id)
            } else if (userToken) {
                result = await this.filesManagerService.delFile(userToken, this.selectedNode.id)
            }
            if (result) {
                let res = JSON.parse(result);
                this.selectedNode = null;
                await this.updateTree();

            }
        }
    }

    hideModal() {
        this.isModalVisible = false;
        this.isEditModalVisible = false;
    }


    handleAddAction(): void {
        if (this.selectedNode) {
            const targetDir = this.getTargetDirectory(this.selectedNode);
            if (targetDir) {
                this.title = "Add a file / directory"
                this.isModalVisible = true;
            }
        } else {
            this.title = "Add a file / directory"
            this.isModalVisible = true;
        }
    }

    /*
        Handle the modal validation for adding or editing files/directories.
        This method is called when the user click on the three points.
    */
    async handleModalValidate(data: { text: string, type: string, context: string , titleFile: string}) {
        // case where the action was to add a file or a directory
        if (this.title === "Add a file / directory") {
            let targetDir = null
            if (this.selectedNode) {
                targetDir = this.getTargetDirectory(this.selectedNode);
            }

            const userToken = localStorage.getItem("token");
            const dirId = targetDir?.id || null;
            let result = null;

            if (data.type === "directory" && userToken) {
                this.showLoading()
                result = await this.filesManagerService.addDir(userToken, data.text, data.context, dirId)
                this.removeLoading()
            } else if (data.type === "file" && userToken) {
                this.showLoading()
                result = await this.filesManagerService.addFile(userToken, data.text, dirId);
                this.removeLoading()
            }

            if (result) {
                let res = JSON.parse(result);
                await this.updateTree();
            }
        }
        else if (this.title.substring(0,4) === "Edit") {
            if (this.selectedNode && data.titleFile && data.titleFile.trim() !== "") {
                let userToken = localStorage.getItem("token");
                //file saving
                if (userToken && !this.selectedNode.expandable) {
                    this.showLoading()
                    let result = await this.filesManagerService.renameFile(this.selectedNode.id, userToken, data.titleFile);
                    this.removeLoading()
                    if (result) {
                        let res = JSON.parse(result);
                        await this.updateTree();
                    }
                }
                //dir saving
                else if (userToken && this.selectedNode.expandable) {
                    this.showLoading()
                    let result = await this.filesManagerService.renameDir(this.selectedNode.id, userToken, data.titleFile);
                    let contextResult = await this.filesManagerService.updateDirContext(this.selectedNode.id, userToken, data.context);
                    this.removeLoading()
                    if (result && contextResult) {
                        await this.updateTree();
                    }
            }
            this.contextOfDir = "";
        }
    }

}
}
