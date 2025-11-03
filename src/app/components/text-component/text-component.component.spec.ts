import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TextComponent } from './text-component.component';
import { SharedFilesService } from '../../services/shared-files.service';
import { FilesManagerService } from '../../services/files-manager.service';
import { Subject, of } from 'rxjs';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ModalComponent } from '../modal/modal.component';
import { fakeAsync, tick } from '@angular/core/testing';

// Mock du MarkdownEditorComponent
@Component({
  selector: 'app-markdown-editor',
  template: '<div></div>',
  standalone: true
})
class MockMarkdownEditorComponent {
  @Input() content: string = '';
  @Output() contentChange = new EventEmitter<string>();
}

// Mock services
class MockSharedFilesService {
  private selectedFileSubject = new Subject<number>();
  selectedFile$ = this.selectedFileSubject.asObservable();

  emitFile(fileId: number) {
    this.selectedFileSubject.next(fileId);
  }
}

class MockFilesManagerService {
  getFileInfo(fileId: number, token: string) {
    return of({ name: 'test.txt' });
  }

  getFileContent(fileId: number, token: string) {
    return of('file content');
  }

  saveFile(fileId: number, token: string, fileName: string, content: string): Promise<string> {
    return Promise.resolve(JSON.stringify({}));
  }

  getDirContent(fileId: number, token: string) {
    return of('{}');
  }
}

describe('TextComponent', () => {
  let component: TextComponent;
  let fixture: ComponentFixture<TextComponent>;
  let filesManagerService: FilesManagerService;
  let sharedFilesService: MockSharedFilesService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        TextComponent,
        ModalComponent,
        MockMarkdownEditorComponent,
        MatFormFieldModule,
        MatInputModule
      ],
      providers: [
        { provide: SharedFilesService, useClass: MockSharedFilesService },
        { provide: FilesManagerService, useClass: MockFilesManagerService },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TextComponent);
    component = fixture.componentInstance;
    filesManagerService = TestBed.inject(FilesManagerService);
    sharedFilesService = TestBed.inject(SharedFilesService) as any;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update text on init', fakeAsync(() => {
    localStorage.setItem('token', 'test-token');

    spyOn(filesManagerService, 'getFileInfo').and.returnValue(of({ name: 'test.txt' }));
    spyOn(filesManagerService, 'getFileContent').and.returnValue(of('file content'));

    fixture.detectChanges();
    sharedFilesService.emitFile(1);
    tick();

    expect(filesManagerService.getFileInfo).toHaveBeenCalledWith(1, 'test-token');
    expect(filesManagerService.getFileContent).toHaveBeenCalledWith(1, 'test-token');
    expect(component.fileName).toBe('test.txt');
    expect(component.text).toBe('file content');
    expect(component.currentFileID).toBe(1);

    localStorage.removeItem('token');
  }));

  it('should save a file', async () => {
    localStorage.setItem('token', 'test-token');

    // Option 1 : callThrough
    const saveSpy = spyOn(filesManagerService, 'saveFile').and.callThrough();

    component.currentFileID = 1;
    component.fileName = 'test.txt';
    component.text = 'some content';

    await component.save();

    expect(saveSpy).toHaveBeenCalledWith(
      1,
      'test-token',
      'test.txt',
      'some content'
    );

    localStorage.removeItem('token');
  });

  // Option 2 : Si vous voulez tester la valeur de retour
  it('should save a file and handle response', async () => {
    localStorage.setItem('token', 'test-token');

    const mockResponse = JSON.stringify({ success: true });
    spyOn(filesManagerService, 'saveFile').and.returnValue(Promise.resolve(mockResponse));

    component.currentFileID = 1;
    component.fileName = 'test.txt';
    component.text = 'some content';

    const result = await component.save();

    expect(filesManagerService.saveFile).toHaveBeenCalledWith(
      1,
      'test-token',
      'test.txt',
      'some content'
    );

    // Si save() retournait la valeur, vous pourriez tester :
    // expect(result).toBe(mockResponse);

    localStorage.removeItem('token');
  });
});
