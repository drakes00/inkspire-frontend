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
import { catchError, map, switchMap } from 'rxjs/operators';

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
        ModalEditComponent,
    ],
    templateUrl: './tree-file.component.html',
    styleUrls: ['./tree-file.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
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

        this.filesManagerService
            .getTree(token)
            .pipe(
                map((response) => {
                    const jsonResponse = JSON.parse(response);
                    const files = jsonResponse.files || {};
                    const dirs = jsonResponse.dirs || {};

                    const rootNodes: FileSystemNode[] = [];
                    const dirRequests = Object.entries(dirs).map(
                        ([dirId, dir]) => {
                            const dirNode: FileSystemNode = {
                                id: parseInt(dirId, 10),
                                name: (dir as any).name,
                                type: 'D',
                                children: [],
                            };

                            rootNodes.push(dirNode);

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
                        },
                    );

                    // Add loose files
                    for (const fileId in files) {
                        if (
                            Object.prototype.hasOwnProperty.call(files, fileId)
                        ) {
                            const file = files[fileId];
                            rootNodes.push({
                                id: parseInt(fileId, 10),
                                name: file.name,
                                type: 'F',
                            });
                        }
                    }

                    return { rootNodes, dirRequests };
                }),
                switchMap(({ rootNodes, dirRequests }) => {
                    const allRequests =
                        dirRequests.length > 0 ? forkJoin(dirRequests) : of([]);
                    return allRequests.pipe(map(() => rootNodes));
                }),
            )
            .subscribe((rootNodes) => {
                this.FILE_SYSTEM = rootNodes;
                this.dataSource.data = this.FILE_SYSTEM;
                this.removeLoading();
                this.cdr.markForCheck();
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
        this.cdr.markForCheck();
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
