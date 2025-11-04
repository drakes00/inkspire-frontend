import {Component, ViewChild, ElementRef, OnInit, OnDestroy} from '@angular/core';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {ModalComponent} from '../modal/modal.component';
import {SharedFilesService} from '../../services/shared-files.service';
import {Subscription, forkJoin} from 'rxjs';
import {FilesManagerService} from '../../services/files-manager.service';
import {OllamaService} from '../../services/ollama.service';
import {MarkdownEditorComponent} from '../markdown-editor/markdown-editor.component';
import {ErrorModalComponent} from '../error-modal/error-modal.component';


@Component({
  selector: 'app-text-page',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    ModalComponent,
    MarkdownEditorComponent,
    ErrorModalComponent
  ],
  templateUrl: './text-component.component.html',
  styleUrl: './text-component.component.css'
})

export class TextComponent implements OnInit, OnDestroy {

    isModalVisibleAdd = false;
    title = "What should I generate?"
    text: string = ""
    generatedText: string = ""
    fileName = ""
    @ViewChild('prompt') promptTextarea!: ElementRef<HTMLTextAreaElement>;
    currentFileID: number = 0;
    pendingValidation: boolean = false;
    errorVisible = false;
    errorMessage = 'An unexpected error occurred';

    textForm: FormGroup = new FormGroup({
        text: new FormControl(this.text, Validators.required)
    });

    private subscription: Subscription = new Subscription();
    private autoSaveTimer?: number;
    private isDestroyed = false;

    constructor(
        private shareFiles: SharedFilesService,
        private filesManager: FilesManagerService,
        private ollamaService: OllamaService
    ) {}

    ngOnInit() {
        this.subscription = this.shareFiles.selectedFile$.subscribe(file => {
            if (file && !this.isDestroyed) {
                this.currentFileID = file;
                this.updateText(this.currentFileID);
            }
        });

        this.startAutoSave();
    }

    /**
     * NOUVEAU: Démarrer l'auto-save avec un timer nettoyable
     */
    private startAutoSave() {
        // Sauvegarder toutes les 5 secondes
        this.autoSaveTimer = window.setInterval(() => {
            if (!this.isDestroyed) {
                this.save().catch(error => {
                    console.error('Auto-save failed:', error);
                    this.showErrorModal('Auto-save failed');
                });
            }
        }, 5000);
    }

    /**
     * Function to update the text in the textarea when the user select a file
     * @param currentFile
     */
    updateText(currentFile: number) {
        const userToken = localStorage.getItem("token")
        if (userToken) {
            forkJoin({
                info: this.filesManager.getFileInfo(currentFile, userToken),
                content: this.filesManager.getFileContent(currentFile, userToken)
            }).subscribe({
                next: ({info, content}) => {
                    if (!this.isDestroyed) {
                        this.fileName = info.name;
                        this.text = content;
                    }
                },
                error: (error) => {
                    console.error('Error loading file:', error);
                    this.showErrorModal('Failed to load the file');
                }
            });
        }
    }

    /**
     * AMÉLIORATION: Méthode appelée quand le contenu du markdown editor change
     */
    onContentChange(newContent: string) {
        this.text = newContent;

        // Optionnel: Réinitialiser le timer d'auto-save après chaque modification
        if (this.autoSaveTimer) {
            window.clearInterval(this.autoSaveTimer);
            this.startAutoSave();
        }
    }

    /**
     * Function to handle the save in DB
     * AMÉLIORATION: Retourner une Promise et gérer les erreurs
     */
    async save(): Promise<void> {
        const userToken = localStorage.getItem("token");
        if (userToken && this.currentFileID !== 0) {
            try {
                await this.filesManager.saveFile(
                    this.currentFileID,
                    userToken,
                    this.fileName,
                    this.text
                );
                // console.log('File saved successfully');
            } catch (error) {
                console.error('Error saving file:', error);
                this.showErrorModal('Failed to save the file');
            }
        }
    }

    /**
     * Function called when add button is pressed to get the user query.
     */
    showModalAdd() {
        this.isModalVisibleAdd = true;
    }

    /**
     * Function called when the modal is closed
     */
    hideModal() {
        this.isModalVisibleAdd = false;
    }

    showErrorModal(message?: string) {
        this.errorMessage = message ?? 'An unexpected error occurred';
        this.errorVisible = true;
    }

    /**
     * AMÉLIORATION: Nettoyage complet des ressources
     */
    ngOnDestroy(): void {
        this.isDestroyed = true;

        // Nettoyer la subscription
        if (this.subscription) {
            this.subscription.unsubscribe();
        }

        // Nettoyer le timer d'auto-save
        if (this.autoSaveTimer) {
            window.clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = undefined;
        }

        // Sauvegarder une dernière fois avant de quitter
        this.save().catch(error => {
            console.error('Final save failed:', error);
            this.showErrorModal('Failed to save the file');
        });
    }

    /**
     * async function to handle the modal add submit and send text to ollama
     * @param data
     * AMÉLIORATION: Meilleure gestion d'erreurs
     */
    async handleModalAddSubmit(data: { name: string, context: string }) {
        // Validation
        if (!this.text) {
            console.error("Text is empty");
            return;
        }

        if (!data.name || data.name.trim() === "") {
            console.error("Prompt is empty");
            return;
        }

        const tokenUser = localStorage.getItem('token');
        if (!tokenUser) {
            console.error("No authentication token found");
            return;
        }

        try {
            // Récupérer le contexte
            const getContext = await this.filesManager.getDirContent(
                this.currentFileID,
                tokenUser
            ).toPromise();

            if (!getContext) {
                console.error("Failed to get context");
                this.showErrorModal('Failed to get context');
                return;
            }

            const context = JSON.parse(getContext);

            // Appeler Ollama
            const result = await this.ollamaService.addButtonOllama(
                this.currentFileID,
                tokenUser,
                data.name,
                context,
                this.text
            );

            if (result) {
                const res = JSON.parse(result);
                if (res.param?.response && res.param.response.length > 0) {
                    const rawText = res.param.response;
                    if (rawText !== '') {
                        this.generatedText = rawText;
                        this.pendingValidation = true;
                    } else {
                        console.warn("Answer is empty after processing.");
                    }
                }
            }
        } catch (error) {
            console.error("Error generating text with Ollama:", error);
            this.showErrorModal('Error generating text with Ollama');
        }
    }

    /**
     * This function is called when the user apply to the generated text.
     */
    applyGeneratedText() {
        this.text += this.generatedText;
        this.generatedText = '';
        this.pendingValidation = false;

        // AMÉLIORATION: Sauvegarder automatiquement après application
        this.save().catch(error => {
            console.error('Error saving after applying generated text:', error);
            this.showErrorModal('Error saving after applying generated text');
        });
    }

    /**
     * This function manage values of generatedText and pendingValidation if the user decline the generated response.
     */
    rejectGeneratedText() {
        this.generatedText = '';
        this.pendingValidation = false;
    }
}
