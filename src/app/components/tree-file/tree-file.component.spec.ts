import {
    ComponentFixture,
    TestBed,
    fakeAsync,
    tick,
} from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TreeFileComponent } from './tree-file.component';
import { FilesManagerService } from '../../services/files-manager.service';
import { SharedFilesService } from '../../services/shared-files.service';

class MockFilesManagerService {
    getTree = jasmine.createSpy().and.returnValue(
        of(
            JSON.stringify({
                dirs: { '1': { name: 'DirA' } },
                files: { '2': { name: 'FileRoot' } },
            }),
        ),
    );

    getDirContent = jasmine.createSpy().and.callFake((id: number) => {
        if (id === 1) {
            return of(
                JSON.stringify({
                    files: { '3': { name: 'NestedFileA' } },
                }),
            );
        }
        return of(JSON.stringify({ files: {} }));
    });
}

class MockSharedFilesService {
    setSelectedFile = jasmine.createSpy();
}

describe('TreeFileComponent', () => {
    let fixture: ComponentFixture<TreeFileComponent>;
    let component: TreeFileComponent;
    let mockFilesManagerService: MockFilesManagerService;
    let mockSharedFilesService: MockSharedFilesService;

    beforeEach(async () => {
        mockFilesManagerService = new MockFilesManagerService();
        mockSharedFilesService = new MockSharedFilesService();

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

        fixture = TestBed.createComponent(TreeFileComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    // ------------------------------------
    // Functional tests
    // ------------------------------------
    it('should load directories and files correctly', fakeAsync(() => {
        spyOn(localStorage, 'getItem').and.returnValue('FAKE_TOKEN');

        component.updateTree();
        tick();

        // Check directory loading.
        const data = component.dataSource.data;
        expect(data.length).toBe(2); // 1 dir + 1 file
        const dirNode = data.find((n) => n.name === 'DirA');
        expect(dirNode?.type).toBe('D');

        // With their children files.
        expect(dirNode?.children?.[0].name).toBe('NestedFileA');

        // Check loose files loading.
        const fileNode = data.find((n) => n.name === 'FileRoot');
        expect(fileNode).toBeDefined();
        expect(fileNode?.type).toBe('F');
        expect(fileNode?.children).toBeUndefined(); // or []
    }));

    it('should not load tree if token missing', fakeAsync(() => {
        spyOn(localStorage, 'getItem').and.returnValue(null);

        component.updateTree();
        tick();

        expect(component.dataSource.data).toEqual([]);
    }));

    it('should continue loading even if one directory errors', fakeAsync(() => {
        spyOn(console, 'error'); // Ignore console.error

        mockFilesManagerService.getDirContent.and.returnValue(
            throwError(() => new Error('Network error')),
        );
        spyOn(localStorage, 'getItem').and.returnValue('FAKE_TOKEN');

        component.updateTree();
        tick();

        expect(component.dataSource.data.length).toBeGreaterThan(0);
        expect(console.error).toHaveBeenCalledWith(
            'Error loading dir',
            'DirA',
            jasmine.any(Error),
        ); // Check that error was logged.
    }));

    it('should select file and notify SharedFilesService', () => {
        const fileNode = {
            id: 2,
            name: 'FileRoot',
            expandable: false,
            level: 0,
        };

        component.selectNode(fileNode);

        expect(component.selectedNode).toEqual(fileNode);
        expect(mockSharedFilesService.setSelectedFile).toHaveBeenCalledWith(2);
    });

    it('should NOT select directory and NOT notify SharedFilesService', () => {
        const dirNode = { id: 1, name: 'DirA', expandable: true, level: 0 };

        component.selectNode(dirNode);

        expect(component.selectedNode).toBeNull();
        expect(mockSharedFilesService.setSelectedFile).not.toHaveBeenCalled();
    });

    it('should NOT deselect node when clicking on it again', () => {
        const fileNode = {
            id: 2,
            name: 'FileRoot',
            expandable: false,
            level: 0,
        };

        // Select once
        component.selectNode(fileNode);
        expect(component.selectedNode).toEqual(fileNode);
        expect(mockSharedFilesService.setSelectedFile).toHaveBeenCalledWith(2);
        expect(mockSharedFilesService.setSelectedFile).toHaveBeenCalledTimes(1);

        // Select again (should still be selected)
        component.selectNode(fileNode);
        expect(component.selectedNode).toEqual(fileNode);
        expect(mockSharedFilesService.setSelectedFile).toHaveBeenCalledWith(2);
        expect(mockSharedFilesService.setSelectedFile).toHaveBeenCalledTimes(2);
    });

    it('should select nested file and notify SharedFilesService', () => {
        const nestedFile = {
            id: 5,
            name: 'Nested.txt',
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
    it('should toggle loading class on body', () => {
        component.showLoading();
        expect(document.body.classList.contains('loading')).toBeTrue();

        component.removeLoading();
        expect(document.body.classList.contains('loading')).toBeFalse();
    });

    it('should call showLoading and removeLoading at correct times (sync)', () => {
        spyOn(component, 'showLoading').and.callThrough();
        spyOn(component, 'removeLoading').and.callThrough();

        mockFilesManagerService.getTree.and.returnValue(
            of(
                JSON.stringify({
                    dirs: { '1': { name: 'DirA' } },
                    files: {},
                }),
            ),
        );
        mockFilesManagerService.getDirContent.and.returnValue(
            of(JSON.stringify({ files: {} })),
        );

        component.updateTree();

        expect(component.showLoading).toHaveBeenCalledTimes(1);
        expect(component.removeLoading).toHaveBeenCalledTimes(1);
    });

    it('should render folder and file icons correctly', fakeAsync(() => {
        spyOn(localStorage, 'getItem').and.returnValue('FAKE_TOKEN');
        component.updateTree();
        tick();
        fixture.detectChanges();

        const folderIcons = fixture.nativeElement.querySelectorAll('mat-icon');
        expect(folderIcons.length).toBeGreaterThan(0);
        expect(fixture.nativeElement.textContent).toContain('DirA');
        expect(fixture.nativeElement.textContent).toContain('FileRoot');
    }));

    it('should apply selected-node class when node is selected', () => {
        component.dataSource.data = [{ id: 2, name: 'FileRoot', type: 'F' }];
        fixture.detectChanges();

        const flatNode = component.treeControl.dataNodes[0];
        const nodeElement = fixture.nativeElement.querySelector('.file-node');

        // Avant sélection
        expect(nodeElement.classList.contains('selected-node')).toBeFalse();

        // Sélection
        component.selectNode(flatNode);
        fixture.detectChanges();

        // Après sélection
        expect(nodeElement.classList.contains('selected-node')).toBeTrue();
    });
});
