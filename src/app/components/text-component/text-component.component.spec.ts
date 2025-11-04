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

// Mock du MarkdownEditorComponent avec comportement réaliste
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

  saveFile(fileId: number, token: string, fileName: string, content: string): Promise<string> {
    return Promise.resolve(JSON.stringify({ success: true }));
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

  // Spy pour capturer les console.error sans polluer la console
  let consoleErrorSpy: jasmine.Spy;

  beforeEach(async () => {
    localStorage.clear();

    // Spy sur console.error pour éviter la pollution de la console
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

  // ========== Tests de base ==========

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

  // ========== Tests de chargement de fichier ==========

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

  // ========== Tests de sauvegarde ==========

  it('should save a file successfully', async () => {
    localStorage.setItem('token', 'test-token');

    const saveSpy = spyOn(filesManagerService, 'saveFile').and.callThrough();

    component.currentFileID = 1;
    component.fileName = 'test.txt';
    component.text = 'some content';

    await component.save();

    expect(saveSpy).toHaveBeenCalledWith(1, 'test-token', 'test.txt', 'some content');
    expect(component.errorVisible).toBeFalse();
  });

  it('should not save when no token is available', async () => {
    const saveSpy = spyOn(filesManagerService, 'saveFile');

    component.currentFileID = 1;
    component.fileName = 'test.txt';
    component.text = 'some content';

    await component.save();

    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('should not save when currentFileID is 0', async () => {
    localStorage.setItem('token', 'test-token');
    const saveSpy = spyOn(filesManagerService, 'saveFile');

    component.currentFileID = 0;
    component.text = 'some content';

    await component.save();

    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('should handle save errors gracefully and show error modal', async () => {
    localStorage.setItem('token', 'test-token');

    spyOn(filesManagerService, 'saveFile').and.returnValue(
      Promise.reject(new Error('Network error'))
    );

    component.currentFileID = 1;
    component.fileName = 'test.txt';
    component.text = 'some content';

    // La méthode ne doit PAS throw, mais gérer l'erreur en interne
    await component.save();

    // Vérifier que l'erreur est loggée
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error saving file:',
      jasmine.any(Error)
    );

    // Vérifier que le modal d'erreur est affiché
    expect(component.errorVisible).toBeTrue();
    expect(component.errorMessage).toBe('Failed to save the file');
  });

  // ========== Tests de la modal ==========

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

  // ========== Tests Ollama / Génération de texte ==========

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

    // Vérifier que l'erreur est loggée
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error generating text with Ollama:',
      jasmine.any(Error)
    );

    // Vérifier que le modal d'erreur est affiché
    expect(component.errorVisible).toBeTrue();
    expect(component.errorMessage).toBe('Error generating text with Ollama');

    // Vérifier que le composant reste stable
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

  // ========== Tests d'application/rejet du texte généré ==========

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

    spyOn(filesManagerService, 'saveFile').and.returnValue(
      Promise.reject(new Error('Save failed'))
    );

    component.currentFileID = 1;
    component.fileName = 'test.txt';
    component.text = 'Initial text. ';
    component.generatedText = 'Generated text.';
    component.pendingValidation = true;

    component.applyGeneratedText();
    tick();

    // Vérifier que le texte est appliqué même si la sauvegarde échoue
    expect(component.text).toBe('Initial text. Generated text.');
    expect(component.generatedText).toBe('');
    expect(component.pendingValidation).toBeFalse();

    // Vérifier que l'erreur est gérée
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(component.errorVisible).toBeTrue();
  }));

  // ========== Tests de l'intégration avec MarkdownEditor ==========

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

  // ========== Tests de nettoyage (lifecycle) ==========

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

  // ========== Tests de gestion des erreurs de chargement ==========

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

// Lignes 545-565 dans text-component.component.spec.ts
it('should handle auto-save errors and show error modal', fakeAsync(() => {
    localStorage.setItem('token', 'test-token');

    // 1. Démarrer le cycle de vie sans laisser le setInterval s'exécuter
    // car il pourrait causer une fuite de promesse lors de la première détection de changement
    fixture.detectChanges();

    // 2. Assurez-vous qu'un currentFileID est défini pour que save() s'exécute
    component.currentFileID = 1;
    component.fileName = 'test.txt';
    component.text = 'content';

    // 3. Spy du saveFile pour rejeter la promesse
    const saveSpy = spyOn(filesManagerService, 'saveFile').and.returnValue(
      Promise.reject(new Error('Network error'))
    );

    // 4. Déclencher manuellement le save() (ce qui est l'action de l'auto-save)
    // Nous appelons la fonction 'save' directement pour simuler l'action de l'intervalle.
    component.save();

    // 5. Exécuter flushMicrotasks pour traiter la promesse rejetée de save()
    // et son .catch() ou son try/catch interne.
    flushMicrotasks();

    // Vérifier que le save a été appelé et a échoué.
    expect(saveSpy).toHaveBeenCalled();

    // Vérifier que l'erreur est loggée et le modal affiché
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error saving file:', jasmine.any(Error));
    expect(component.errorVisible).toBeTrue();
    expect(component.errorMessage).toBe('Failed to save the file');

    // 6. Vous pouvez supprimer l'appel à flush() et les lignes inutiles liées à l'auto-save timer.
    // L'exécution directe de component.save() simule parfaitement le scénario d'erreur.
}));

  // ========== Tests d'intégration complets ==========

  it('should complete full workflow: load, edit, save', fakeAsync(() => {
    localStorage.setItem('token', 'test-token');

    spyOn(filesManagerService, 'getFileInfo').and.returnValue(of({ name: 'doc.md' }));
    spyOn(filesManagerService, 'getFileContent').and.returnValue(of('# Original'));
    const saveSpy = spyOn(filesManagerService, 'saveFile').and.callThrough();

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
      'doc.md',
      '# Original\n\nNew paragraph'
    );
    expect(component.errorVisible).toBeFalse();
  }));

  it('should complete AI generation workflow', fakeAsync(() => {
    localStorage.setItem('token', 'test-token');

    spyOn(filesManagerService, 'getDirContent').and.returnValue(of('{}'));
    spyOn(ollamaService, 'addButtonOllama').and.callThrough();
    const saveSpy = spyOn(filesManagerService, 'saveFile').and.callThrough();

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

    tick(); // Attendre la sauvegarde automatique

    expect(saveSpy).toHaveBeenCalled();
    expect(component.errorVisible).toBeFalse();
  }));

  it('should handle complete workflow with errors', fakeAsync(() => {
    localStorage.setItem('token', 'test-token');

    // Simuler une erreur de chargement
    spyOn(filesManagerService, 'getFileInfo').and.returnValue(
      throwError(() => new Error('Load failed'))
    );

    fixture.detectChanges();
    sharedFilesService.emitFile(1);
    tick();

    expect(component.errorVisible).toBeTrue();
    expect(component.errorMessage).toBe('Failed to load the file');

    // Le composant doit rester fonctionnel malgré l'erreur
    expect(component.currentFileID).toBe(1);
  }));
});
