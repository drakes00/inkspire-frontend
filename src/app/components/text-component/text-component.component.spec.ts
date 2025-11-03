import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TextComponent } from './text-component.component';
import { SharedFilesService } from '../../services/shared-files.service';
import { FilesManagerService } from '../../services/files-manager.service';
import { OllamaService } from '../../services/ollama.service';
import { of } from 'rxjs';
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
  selectedFile$ = of(1);
}

class MockFilesManagerService {
  getFileInfo(fileId: number, token: string) {
    return of({ name: 'test.txt' });
  }
  getFileContent(fileId: number, token: string) {
    return of('file content');
  }
  saveFile(fileId: number, token: string, fileName: string, content: string) {
    return Promise.resolve();
  }
  getDirContent(fileId: number, token: string) {
    return of('{}');
  }
}

class MockOllamaService {
  addButtonOllama(fileId: number, token: string, prompt: string, context: any, text: string) {
    return Promise.resolve(JSON.stringify({ param: { response: 'generated text' } }));
  }
}

describe('TextComponent', () => {
  let component: TextComponent;
  let fixture: ComponentFixture<TextComponent>;
  let filesManagerService: FilesManagerService;
  let ollamaService: OllamaService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        TextComponent,
        ModalComponent,
        MockMarkdownEditorComponent, // Utiliser le mock au lieu du vrai composant
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
    ollamaService = TestBed.inject(OllamaService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update text on init', fakeAsync(() => {
    spyOn(filesManagerService, 'getFileInfo').and.returnValue(of({ name: 'test.txt' }));
    spyOn(filesManagerService, 'getFileContent').and.returnValue(of('file content'));

    component.ngOnInit();
    tick(); // Avance le temps virtuel pour résoudre les observables

    expect(filesManagerService.getFileInfo).toHaveBeenCalled();
    expect(filesManagerService.getFileContent).toHaveBeenCalled();
    expect(component.fileName).toBe('test.txt');
    expect(component.text).toBe('file content');
  }));

  it('should save a file', async () => {
    spyOn(filesManagerService, 'saveFile').and.callThrough();

    component.currentFileID = 1;
    localStorage.setItem('token', 'test-token');

    await component.save();

    expect(filesManagerService.saveFile).toHaveBeenCalledWith(
      1,
      'test-token',
      component.fileName,
      component.text
    );
  });

  // it('should show and hide modal', () => {
  //   component.showModalAdd();
  //   expect(component.isModalVisibleAdd).toBeTrue();
  //   component.hideModal();
  //   expect(component.isModalVisibleAdd).toBeFalse();
  // });

  // it('should handle modal submit and generate text', async () => {
  //   spyOn(ollamaService, 'addButtonOllama').and.callThrough();
  //   localStorage.setItem('token', 'test-token');
  //   component.currentFileID = 1;
  //   component.text = 'some initial text';
  //   await component.handleModalAddSubmit({ name: 'generate something', context: '' });
  //   expect(ollamaService.addButtonOllama).toHaveBeenCalled();
  //   expect(component.generatedText).toBe('generated text');
  //   expect(component.pendingValidation).toBeTrue();
  // });

  // it('should apply generated text', () => {
  //   component.text = 'initial text. ';
  //   component.generatedText = 'generated text';
  //   component.applyGeneratedText();
  //   expect(component.text).toBe('initial text. generated text');
  //   expect(component.generatedText).toBe('');
  //   expect(component.pendingValidation).toBeFalse();
  // });

  // it('should reject generated text', () => {
  //   component.generatedText = 'generated text';
  //   component.pendingValidation = true;
  //   component.rejectGeneratedText();
  //   expect(component.generatedText).toBe('');
  //   expect(component.pendingValidation).toBeFalse();
  // });
});
