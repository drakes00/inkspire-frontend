import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
} from '@angular/core';
import { FlatTreeControl } from '@angular/cdk/tree';
import {
    MatTreeFlatDataSource,
    MatTreeFlattener,
    MatTreeModule,
} from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';

import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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
    type: 'D' | 'F';
    children?: FileSystemNode[];
}

@Component({
    selector: 'app-tree-file',
    imports: [
    MatTreeModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    ModalChoiceComponent,
    ModalEditComponent
],
    templateUrl: './tree-file.component.html',
    styleUrls: ['./tree-file.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TreeFileComponent {
    title = '';
    isModalVisible = false;
    isEditModalVisible = false;
    isDirectoryEditing = false;
    contextOfDir = '';
    nameOfNode = '';
    selectedNode: ExampleFlatNode | null = null;
    FILE_SYSTEM: FileSystemNode[] = [];

    private _transformer = (node: FileSystemNode, level: number) => ({
        id: node.id,
        expandable: node.type === 'D',
        name: node.name,
        level,
    });

    treeControl = new FlatTreeControl<ExampleFlatNode>(
        (node) => node.level,
        (node) => node.expandable,
    );

    treeFlattener = new MatTreeFlattener(
        this._transformer,
        (node) => node.level,
        (node) => node.expandable,
        (node) => node.children,
    );

    dataSource = new MatTreeFlatDataSource(
        this.treeControl,
        this.treeFlattener,
    );

    constructor(
        private filesManagerService: FilesManagerService,
        private shareFiles: SharedFilesService,
        private cdr: ChangeDetectorRef,
    ) {
        this.updateTree();
    }

    hasChild = (_: number, node: ExampleFlatNode) => node.expandable;

    /** --------------------  TREE BUILDING  ---------------------- **/
    updateTree() {
        this.showLoading();
        const token = localStorage.getItem('token');

        if (!token) {
            this.dataSource.data = [];
            this.removeLoading();
            return;
        }

        // Step 1: Get the list of root-level dirs + files
        this.filesManagerService.getTree(token).subscribe((response) => {
            const jsonResponse = JSON.parse(response);
            const files = jsonResponse.files || {};
            const dirs = jsonResponse.dirs || {};

            const rootNodes: FileSystemNode[] = [];

            // Step 2: build directory placeholders
            const dirRequests = Object.entries(dirs).map(([dirId, dir]) => {
                const dirNode: FileSystemNode = {
                    id: parseInt(dirId, 10),
                    name: (dir as any).name,
                    type: 'D',
                    children: [],
                };

                rootNodes.push(dirNode);

                // Fetch contents of each directory
                return this.filesManagerService
                    .getDirContent(dirNode.id, token)
                    .pipe(
                        map((res) => {
                            const jsonRes = JSON.parse(res);
                            const files = jsonRes.files || {};
                            const children: FileSystemNode[] = [];

                            for (const fileId in files) {
                                if (
                                    Object.prototype.hasOwnProperty.call(
                                        files,
                                        fileId,
                                    )
                                ) {
                                    const file = files[fileId];
                                    children.push({
                                        id: parseInt(fileId, 10),
                                        name: file.name,
                                        type: 'F',
                                    });
                                }
                            }
                            dirNode.children = children;
                            return dirNode;
                        }),
                        catchError((err) => {
                            console.error(
                                'Error loading dir',
                                dirNode.name,
                                err,
                            );
                            return of(dirNode);
                        }),
                    );
            });

            // Step 3: add loose files
            for (const fileId in files) {
                if (Object.prototype.hasOwnProperty.call(files, fileId)) {
                    const file = files[fileId];
                    rootNodes.push({
                        id: parseInt(fileId, 10),
                        name: file.name,
                        type: 'F',
                    });
                }
            }

            // Step 4: Wait for all directories to finish loading
            if (dirRequests.length === 0) {
                this.FILE_SYSTEM = rootNodes;
                this.dataSource.data = this.FILE_SYSTEM;
                this.removeLoading();
                this.cdr.markForCheck();
            } else {
                forkJoin(dirRequests).subscribe(() => {
                    this.FILE_SYSTEM = rootNodes;
                    this.dataSource.data = this.FILE_SYSTEM;
                    this.removeLoading();
                    this.cdr.markForCheck();
                });
            }
        });
    }

    /** --------------------  NODE SELECTION  ---------------------- **/
    isSelected(node: ExampleFlatNode): boolean {
        return this.selectedNode?.id === node.id;
    }

    selectNode(node: ExampleFlatNode): void {
        if (this.isSelected(node)) {
            this.selectedNode = null;
            this.shareFiles.setSelectedFile(undefined);
            return;
        }
        this.selectedNode = node;
        if (!node.expandable) {
            this.shareFiles.setSelectedFile(node.id);
        }
    }

    /** --------------------  UTILITIES  ---------------------- **/
    showLoading() {
        document.body.classList.add('loading');
    }
    removeLoading() {
        document.body.classList.remove('loading');
    }

    // Keep your edit/add/remove modal logic as before
}
