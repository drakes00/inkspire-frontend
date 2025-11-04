import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
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
    // Simuler le comportement de Toast UI Editor
    this.contentChange.emit(value);
  }
  get content(): string {
    return this._content;
  }

  private _content: string = '';
  @Output() contentChange = new EventEmitter<string>();

  // Méthodes utiles pour les tests
  simulateUserEdit(newContent: string) {
    this._content = newContent;
    this.contentChange.emit(newContent);
  }
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

  beforeEach(async () => {
    // Nettoyer localStorage avant chaque test
    localStorage.clear();

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
    // Pas de token dans localStorage
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

    component.currentFileID = 0; // Pas de fichier sélectionné
    component.text = 'some content';

    await component.save();

    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('should handle save errors gracefully', async () => {
    localStorage.setItem('token', 'test-token');

    const consoleErrorSpy = spyOn(console, 'error');
    spyOn(filesManagerService, 'saveFile').and.returnValue(
      Promise.reject(new Error('Network error'))
    );

    component.currentFileID = 1;
    component.fileName = 'test.txt';
    component.text = 'some content';

    try {
      await component.save();
    } catch (error) {
      expect(error).toBeDefined();
    }
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
  }));

  it('should not generate text when prompt is empty', fakeAsync(() => {
    localStorage.setItem('token', 'test-token');
    const consoleErrorSpy = spyOn(console, 'error');
    const ollamaSpy = spyOn(ollamaService, 'addButtonOllama');

    component.text = 'Some text';
    component.handleModalAddSubmit({ name: '', context: '' });
    tick();

    expect(consoleErrorSpy).toHaveBeenCalledWith('Prompt is empty');
    expect(ollamaSpy).not.toHaveBeenCalled();
  }));

  it('should not generate text when text is null or undefined', fakeAsync(() => {
    localStorage.setItem('token', 'test-token');
    const consoleErrorSpy = spyOn(console, 'error');
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

    expect(ollamaSpy).not.toHaveBeenCalled();
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

    expect(component.text).toBe('Initial text'); // Texte original inchangé
    expect(component.generatedText).toBe('');
    expect(component.pendingValidation).toBeFalse();
  });

  // ========== Tests de l'intégration avec MarkdownEditor ==========

  it('should pass content to markdown editor', fakeAsync(() => {
    localStorage.setItem('token', 'test-token');

    spyOn(filesManagerService, 'getFileInfo').and.returnValue(of({ name: 'test.txt' }));
    spyOn(filesManagerService, 'getFileContent').and.returnValue(of('# Markdown Content'));

    fixture.detectChanges();
    sharedFilesService.emitFile(1);
    tick();

    expect(component.text).toBe('# Markdown Content');

    // Vérifier que le binding fonctionne
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

    // Simuler un changement depuis le composant parent
    component.text = '# Title\nContent';
    fixture.detectChanges();
    tick();

    // Simuler un changement depuis l'éditeur
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

    // Ne devrait pas lancer d'erreur
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  // ========== Tests de gestion des erreurs ==========

  it('should handle file loading errors', fakeAsync(() => {
    localStorage.setItem('token', 'test-token');

    spyOn(filesManagerService, 'getFileInfo').and.returnValue(
      throwError(() => new Error('File not found'))
    );
    spyOn(filesManagerService, 'getFileContent').and.returnValue(of(''));

    fixture.detectChanges();
    sharedFilesService.emitFile(999); // Fichier inexistant
    tick();

    // Le composant devrait gérer l'erreur sans crash
    expect(component.currentFileID).toBe(999);
  }));

  it('should handle Ollama generation errors', fakeAsync(() => {
    localStorage.setItem('token', 'test-token');

    spyOn(filesManagerService, 'getDirContent').and.returnValue(of('{}'));
    spyOn(ollamaService, 'addButtonOllama').and.returnValue(
      Promise.reject(new Error('Ollama service unavailable'))
    );

    component.currentFileID = 1;
    component.text = 'Some text';

    component.handleModalAddSubmit({ name: 'Generate', context: '' });
    tick();

    // Vérifier que le composant reste stable après l'erreur
    expect(component.pendingValidation).toBeFalse();
  }));

  // ========== Tests d'intégration complets ==========

  it('should complete full workflow: load, edit, save', fakeAsync(() => {
    localStorage.setItem('token', 'test-token');

    // 1. Charger un fichier
    spyOn(filesManagerService, 'getFileInfo').and.returnValue(of({ name: 'doc.md' }));
    spyOn(filesManagerService, 'getFileContent').and.returnValue(of('# Original'));
    const saveSpy = spyOn(filesManagerService, 'saveFile').and.callThrough();

    fixture.detectChanges();
    sharedFilesService.emitFile(5);
    tick();

    expect(component.text).toBe('# Original');
    expect(component.fileName).toBe('doc.md');

    // 2. Éditer via markdown editor
    component.onContentChange('# Original\n\nNew paragraph');
    expect(component.text).toBe('# Original\n\nNew paragraph');

    // 3. Sauvegarder
    component.save();
    tick();

    expect(saveSpy).toHaveBeenCalledWith(
      5,
      'test-token',
      'doc.md',
      '# Original\n\nNew paragraph'
    );
  }));

  it('should complete AI generation workflow', fakeAsync(() => {
    localStorage.setItem('token', 'test-token');

    spyOn(filesManagerService, 'getDirContent').and.returnValue(of('{}'));
    spyOn(ollamaService, 'addButtonOllama').and.callThrough();
    const saveSpy = spyOn(filesManagerService, 'saveFile').and.callThrough();

    component.currentFileID = 1;
    component.fileName = 'story.md';
    component.text = 'Once upon a time, ';

    // 1. Générer du texte
    component.handleModalAddSubmit({ name: 'Continue the story', context: '' });
    tick();

    expect(component.generatedText).toBe('Generated AI text from Ollama');
    expect(component.pendingValidation).toBeTrue();

    // 2. Appliquer le texte généré
    component.applyGeneratedText();
    expect(component.text).toBe('Once upon a time, Generated AI text from Ollama');
    expect(component.pendingValidation).toBeFalse();

    // 3. Sauvegarder
    component.save();
    tick();

    expect(saveSpy).toHaveBeenCalled();
  }));
});
