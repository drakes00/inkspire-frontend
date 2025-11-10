import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ComponentFixture, TestBed, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';
import { TextComponent } from './text-component.component';
import { SharedFilesService } from '../../services/shared-files.service';
import { FilesManagerService } from '../../services/files-manager.service';
import { OllamaService } from '../../services/ollama.service';
import { Subject, of, throwError } from 'rxjs';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ModalComponent } from '../modal/modal.component';

// Mock MarkdownEditorComponent with realistic behavior
@Component({
  selector: 'app-markdown-editor',
  template: '<div #editor></div>',
  standalone: true
})
class MockMarkdownEditorComponent {
  @Input()
  set content(value: string) {
    this._content = value;
    this.contentChange.emit(value);
  }
  get content(): string {
    return this._content;
  }

  private _content: string = '';
  @Output() contentChange = new EventEmitter<string>();

  simulateUserEdit(newContent: string) {
    this._content = newContent;
    this.contentChange.emit(newContent);
  }
}

// Mock ErrorModalComponent
@Component({
  selector: 'app-error-modal',
  template: '<div></div>',
  standalone: true
})
class MockErrorModalComponent {
  @Input() visible: boolean = false;
  @Input() message: string = '';
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

  updateFileContent(fileId: number, token: string, content: string) {
    return of(null);
  }

  getDirContent(fileId: number, token: string) {
    return of('{}');
  }
}

class MockOllamaService {
  addButtonOllama(fileId: number, token: string, prompt: string, context: any, text: string): Promise<string> {
    return Promise.resolve(JSON.stringify({
      param: {
        response: 'Generated AI text from Ollama'
      }
    }));
  }
}

describe('TextComponent', () => {
  let component: TextComponent;
  let fixture: ComponentFixture<TextComponent>;
  let filesManagerService: FilesManagerService;
  let sharedFilesService: MockSharedFilesService;
  let ollamaService: OllamaService;

  // Spy on console.error to avoid polluting test output
  let consoleErrorSpy: jasmine.Spy;

  beforeEach(async () => {
    localStorage.clear();

    // Spy on console.error to avoid polluting test output
    consoleErrorSpy = spyOn(console, 'error');

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        TextComponent,
        ModalComponent,
        MockMarkdownEditorComponent,
        MockErrorModalComponent,
        MatFormFieldModule,
        MatInputModule
      ],
      providers: [
        { provide: SharedFilesService, useClass: MockSharedFilesService },
        { provide: FilesManagerService, useClass: MockFilesManagerService },
        { provide: OllamaService, useClass: MockOllamaService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TextComponent);
    component = fixture.componentInstance;
    filesManagerService = TestBed.inject(FilesManagerService);
    sharedFilesService = TestBed.inject(SharedFilesService) as any;
    ollamaService = TestBed.inject(OllamaService);
  });

  afterEach(() => {
    localStorage.clear();
    fixture.destroy();
  });

  // ========== Basic Tests ========== 

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.text).toBe('');
    expect(component.fileName).toBe('');
    expect(component.currentFileID).toBe(0);
    expect(component.isModalVisibleAdd).toBeFalse();
    expect(component.pendingValidation).toBeFalse();
    expect(component.generatedText).toBe('');
    expect(component.errorVisible).toBeFalse();
  });

  // ========== File Loading Tests ========== 

  it('should update text when a file is selected', fakeAsync(() => {
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
  }));

  it('should not update text when no token is available', fakeAsync(() => {
    spyOn(filesManagerService, 'getFileInfo');
    spyOn(filesManagerService, 'getFileContent');

    fixture.detectChanges();
    sharedFilesService.emitFile(1);
    tick();

    expect(filesManagerService.getFileInfo).not.toHaveBeenCalled();
    expect(filesManagerService.getFileContent).not.toHaveBeenCalled();
  }));

  it('should handle multiple file selections', fakeAsync(() => {
    localStorage.setItem('token', 'test-token');

    const getFileInfoSpy = spyOn(filesManagerService, 'getFileInfo').and.returnValues(
      of({ name: 'file1.txt' }),
      of({ name: 'file2.txt' })
    );
    const getFileContentSpy = spyOn(filesManagerService, 'getFileContent').and.returnValues(
      of('content 1'),
      of('content 2')
    );

    fixture.detectChanges();

    sharedFilesService.emitFile(1);
    tick();
    expect(component.text).toBe('content 1');
    expect(component.fileName).toBe('file1.txt');

    sharedFilesService.emitFile(2);
    tick();
    expect(component.text).toBe('content 2');
    expect(component.fileName).toBe('file2.txt');

    expect(getFileInfoSpy).toHaveBeenCalledTimes(2);
    expect(getFileContentSpy).toHaveBeenCalledTimes(2);
  }));

  // ========== Save Tests ========== 

  it('should save a file successfully', async () => {
    localStorage.setItem('token', 'test-token');

    const saveSpy = spyOn(filesManagerService, 'updateFileContent').and.callThrough();

    component.currentFileID = 1;
    component.fileName = 'test.txt';
    component.text = 'some content';

    await component.save();

    expect(saveSpy).toHaveBeenCalledWith(1, 'test-token', 'some content');
    expect(component.errorVisible).toBeFalse();
  });

  it('should not save when no token is available', async () => {
    const saveSpy = spyOn(filesManagerService, 'updateFileContent');

    component.currentFileID = 1;
    component.fileName = 'test.txt';
    component.text = 'some content';

    await component.save();

    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('should not save when currentFileID is 0', async () => {
    localStorage.setItem('token', 'test-token');
    const saveSpy = spyOn(filesManagerService, 'updateFileContent');

    component.currentFileID = 0;
    component.text = 'some content';

    await component.save();

    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('should handle save errors gracefully and show error modal', async () => {
    localStorage.setItem('token', 'test-token');

    spyOn(filesManagerService, 'updateFileContent').and.returnValue(
      throwError(() => new Error('Network error'))
    );

    component.currentFileID = 1;
    component.fileName = 'test.txt';
    component.text = 'some content';

    // The method should not throw, but handle the error internally
    await component.save();

    // Check that the error is logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error saving file:',
      jasmine.any(Error)
    );

    // Check that the error modal is displayed
    expect(component.errorVisible).toBeTrue();
    expect(component.errorMessage).toBe('Failed to save the file');
  });

  // ========== Modal Tests ========== 

  it('should show modal when showModalAdd is called', () => {
    expect(component.isModalVisibleAdd).toBeFalse();
    component.showModalAdd();
    expect(component.isModalVisibleAdd).toBeTrue();
  });

  it('should hide modal when hideModal is called', () => {
    component.isModalVisibleAdd = true;
    component.hideModal();
    expect(component.isModalVisibleAdd).toBeFalse();
  });

  it('should show error modal with custom message', () => {
    component.showErrorModal('Custom error message');
    expect(component.errorVisible).toBeTrue();
    expect(component.errorMessage).toBe('Custom error message');
  });

  it('should show error modal with default message', () => {
    component.showErrorModal();
    expect(component.errorVisible).toBeTrue();
    expect(component.errorMessage).toBe('An unexpected error occurred');
  });

  // ========== Ollama / Text Generation Tests ========== 

  it('should generate text with Ollama', fakeAsync(() => {
    localStorage.setItem('token', 'test-token');

    const ollamaSpy = spyOn(ollamaService, 'addButtonOllama').and.callThrough();
    spyOn(filesManagerService, 'getDirContent').and.returnValue(of('{}'));

    component.currentFileID = 1;
    component.text = 'Initial text';

    component.handleModalAddSubmit({ name: 'Generate summary', context: '' });
    tick();

    expect(ollamaSpy).toHaveBeenCalled();
    expect(component.generatedText).toBe('Generated AI text from Ollama');
    expect(component.pendingValidation).toBeTrue();
    expect(component.errorVisible).toBeFalse();
  }));

  it('should not generate text when prompt is empty', fakeAsync(() => {
    localStorage.setItem('token', 'test-token');
    const ollamaSpy = spyOn(ollamaService, 'addButtonOllama');

    component.text = 'Some text';
    component.handleModalAddSubmit({ name: '', context: '' });
    tick();

    expect(consoleErrorSpy).toHaveBeenCalledWith('Prompt is empty');
    expect(ollamaSpy).not.toHaveBeenCalled();
  }));

  it('should not generate text when text is null or undefined', fakeAsync(() => {
    localStorage.setItem('token', 'test-token');
    const ollamaSpy = spyOn(ollamaService, 'addButtonOllama');

    component.text = null as any;
    component.handleModalAddSubmit({ name: 'Generate', context: '' });
    tick();

    expect(consoleErrorSpy).toHaveBeenCalledWith('Text is empty');
    expect(ollamaSpy).not.toHaveBeenCalled();
  }));

  it('should not generate text when no token is available', fakeAsync(() => {
    const ollamaSpy = spyOn(ollamaService, 'addButtonOllama');

    component.text = 'Some text';
    component.handleModalAddSubmit({ name: 'Generate', context: '' });
    tick();

    expect(consoleErrorSpy).toHaveBeenCalledWith('No authentication token found');
    expect(ollamaSpy).not.toHaveBeenCalled();
  }));

  it('should handle Ollama generation errors and show error modal', fakeAsync(() => {
    localStorage.setItem('token', 'test-token');

    spyOn(filesManagerService, 'getDirContent').and.returnValue(of('{}'));
    spyOn(ollamaService, 'addButtonOllama').and.returnValue(
      Promise.reject(new Error('Ollama service unavailable'))
    );

    component.currentFileID = 1;
    component.text = 'Some text';

    component.handleModalAddSubmit({ name: 'Generate', context: '' });
    tick();

    // Check that the error is logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error generating text with Ollama:',
      jasmine.any(Error)
    );

    // Check that the error modal is displayed
    expect(component.errorVisible).toBeTrue();
    expect(component.errorMessage).toBe('Error generating text with Ollama');

    // Check that the component remains stable
    expect(component.pendingValidation).toBeFalse();
  }));

  it('should handle error when getDirContent fails', fakeAsync(() => {
    localStorage.setItem('token', 'test-token');

    spyOn(filesManagerService, 'getDirContent').and.returnValue(
      throwError(() => new Error('Failed to get directory content'))
    );
    const ollamaSpy = spyOn(ollamaService, 'addButtonOllama');

    component.currentFileID = 1;
    component.text = 'Some text';

    component.handleModalAddSubmit({ name: 'Generate', context: '' });
    tick();

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(ollamaSpy).not.toHaveBeenCalled();
    expect(component.errorVisible).toBeTrue();
  }));

  // ========== Generated Text Application/Rejection Tests ========== 

  it('should apply generated text to existing text', () => {
    component.text = 'Initial text. ';
    component.generatedText = 'Generated text.';
    component.pendingValidation = true;

    component.applyGeneratedText();

    expect(component.text).toBe('Initial text. Generated text.');
    expect(component.generatedText).toBe('');
    expect(component.pendingValidation).toBeFalse();
  });

  it('should reject generated text', () => {
    component.text = 'Initial text';
    component.generatedText = 'Generated text';
    component.pendingValidation = true;

    component.rejectGeneratedText();

    expect(component.text).toBe('Initial text');
    expect(component.generatedText).toBe('');
    expect(component.pendingValidation).toBeFalse();
  });

  it('should handle save error when applying generated text', fakeAsync(() => {
    localStorage.setItem('token', 'test-token');

    spyOn(filesManagerService, 'updateFileContent').and.returnValue(
      throwError(() => new Error('Save failed'))
    );

    component.currentFileID = 1;
    component.fileName = 'test.txt';
    component.text = 'Initial text. ';
    component.generatedText = 'Generated text.';
    component.pendingValidation = true;

    component.applyGeneratedText();
    tick();

    // Check that the text is applied even if the save fails
    expect(component.text).toBe('Initial text. Generated text.');
    expect(component.generatedText).toBe('');
    expect(component.pendingValidation).toBeFalse();

    // Check that the error is handled
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(component.errorVisible).toBeTrue();
  }));

  // ========== MarkdownEditor Integration Tests ========== 

  it('should pass content to markdown editor', fakeAsync(() => {
    localStorage.setItem('token', 'test-token');

    spyOn(filesManagerService, 'getFileInfo').and.returnValue(of({ name: 'test.txt' }));
    spyOn(filesManagerService, 'getFileContent').and.returnValue(of('# Markdown Content'));

    fixture.detectChanges();
    sharedFilesService.emitFile(1);
    tick();

    expect(component.text).toBe('# Markdown Content');

    fixture.detectChanges();
    const editorElement = fixture.nativeElement.querySelector('app-markdown-editor');
    expect(editorElement).toBeTruthy();
  }));

  it('should update component text when markdown editor content changes', () => {
    fixture.detectChanges();

    const newContent = '# New Markdown\n\nSome text';
    component.onContentChange(newContent);

    expect(component.text).toBe(newContent);
  });

  it('should handle bidirectional binding with markdown editor', fakeAsync(() => {
    fixture.detectChanges();

    component.text = '# Title\nContent';
    fixture.detectChanges();
    tick();

    component.onContentChange('# Updated Title\nUpdated content');
    expect(component.text).toBe('# Updated Title\nUpdated content');
  }));

  // ========== Lifecycle (Cleanup) Tests ========== 

  it('should unsubscribe on destroy', () => {
    fixture.detectChanges();

    const subscription = (component as any).subscription;
    spyOn(subscription, 'unsubscribe');

    component.ngOnDestroy();

    expect(subscription.unsubscribe).toHaveBeenCalled();
  });

  it('should handle destroy when subscription is null', () => {
    (component as any).subscription = null;

    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('should clear autoSave timer on destroy', fakeAsync(() => {
    fixture.detectChanges();

    const timer = (component as any).autoSaveTimer;
    expect(timer).toBeDefined();

    component.ngOnDestroy();
    tick();

    expect((component as any).autoSaveTimer).toBeUndefined();
  }));

  // ========== Load Error Handling Tests ========== 

  it('should show error modal when file loading fails', fakeAsync(() => {
    localStorage.setItem('token', 'test-token');

    spyOn(filesManagerService, 'getFileInfo').and.returnValue(
      throwError(() => new Error('File not found'))
    );
    spyOn(filesManagerService, 'getFileContent').and.returnValue(of(''));

    fixture.detectChanges();
    sharedFilesService.emitFile(999);
    tick();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error loading file:',
      jasmine.any(Error)
    );
    expect(component.errorVisible).toBeTrue();
    expect(component.errorMessage).toBe('Failed to load the file');
  }));

it('should handle auto-save errors and show error modal', fakeAsync(() => {
    localStorage.setItem('token', 'test-token');

    // 1. Start component lifecycle.
    fixture.detectChanges();

    // 2. Set a file ID so that save() will execute.
    component.currentFileID = 1;
    component.fileName = 'test.txt';
    component.text = 'content';

    // 3. Spy on updateFileContent to reject the promise.
    const saveSpy = spyOn(filesManagerService, 'updateFileContent').and.returnValue(
      throwError(() => new Error('Network error'))
    );

    // 4. Manually trigger save() to simulate the auto-save interval's action.
    component.save();

    // 5. Flush microtasks to process the rejected promise from save().
    flushMicrotasks();

    // Check that save was called and failed.
    expect(saveSpy).toHaveBeenCalled();

    // Check that the error is logged and the modal is displayed.
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error saving file:', jasmine.any(Error));
    expect(component.errorVisible).toBeTrue();
    expect(component.errorMessage).toBe('Failed to save the file');
}));

  // ========== Full Workflow Integration Tests ========== 

  it('should complete full workflow: load, edit, save', fakeAsync(() => {
    localStorage.setItem('token', 'test-token');

    spyOn(filesManagerService, 'getFileInfo').and.returnValue(of({ name: 'doc.md' }));
    spyOn(filesManagerService, 'getFileContent').and.returnValue(of('# Original'));
    const saveSpy = spyOn(filesManagerService, 'updateFileContent').and.callThrough();

    fixture.detectChanges();
    sharedFilesService.emitFile(5);
    tick();

    expect(component.text).toBe('# Original');
    expect(component.fileName).toBe('doc.md');

    component.onContentChange('# Original\n\nNew paragraph');
    expect(component.text).toBe('# Original\n\nNew paragraph');

    component.save();
    tick();

    expect(saveSpy).toHaveBeenCalledWith(
      5,
      'test-token',
      '# Original\n\nNew paragraph'
    );
    expect(component.errorVisible).toBeFalse();
  }));

  it('should complete AI generation workflow', fakeAsync(() => {
    localStorage.setItem('token', 'test-token');

    spyOn(filesManagerService, 'getDirContent').and.returnValue(of('{}'));
    spyOn(ollamaService, 'addButtonOllama').and.callThrough();
    const saveSpy = spyOn(filesManagerService, 'updateFileContent').and.callThrough();

    component.currentFileID = 1;
    component.fileName = 'story.md';
    component.text = 'Once upon a time, ';

    component.handleModalAddSubmit({ name: 'Continue the story', context: '' });
    tick();

    expect(component.generatedText).toBe('Generated AI text from Ollama');
    expect(component.pendingValidation).toBeTrue();

    component.applyGeneratedText();
    expect(component.text).toBe('Once upon a time, Generated AI text from Ollama');
    expect(component.pendingValidation).toBeFalse();

    tick(); // Wait for auto-save

    expect(saveSpy).toHaveBeenCalled();
    expect(component.errorVisible).toBeFalse();
  }));

  it('should handle complete workflow with errors', fakeAsync(() => {
    localStorage.setItem('token', 'test-token');

    // Simulate a loading error
    spyOn(filesManagerService, 'getFileInfo').and.returnValue(
      throwError(() => new Error('Load failed'))
    );

    fixture.detectChanges();
    sharedFilesService.emitFile(1);
    tick();

    expect(component.errorVisible).toBeTrue();
    expect(component.errorMessage).toBe('Failed to load the file');

    // The component should remain functional despite the error
    expect(component.currentFileID).toBe(1);
  }));
});
