import {Component, ViewChild, ElementRef, OnInit, OnDestroy} from '@angular/core';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {ModalComponent} from '../modal/modal.component';
import {SharedFilesService} from '../../services/shared-files.service';
import {Subscription} from 'rxjs';
import {FilesManagerService} from '../../services/files-manager.service';
import {OllamaService} from '../../services/ollama.service';

@Component({
    selector: 'app-text-page',
    imports: [MatFormFieldModule, MatInputModule, FormsModule, ReactiveFormsModule, ModalComponent],
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

    textForm: FormGroup = new FormGroup({
        text: new FormControl(this.text, Validators.required)
    });
    private subscription: Subscription = new Subscription();


    constructor(private shareFiles: SharedFilesService, private filesManager: FilesManagerService, private ollamaService: OllamaService) {
    }


    ngOnInit() {
        this.subscription = this.shareFiles.selectedFile$.subscribe(file => {
            if (file) {
                this.currentFileID = file;
                this.updateText(this.currentFileID);
            }
        });

        // Save the text every 5 sec
        var text_save_timer = window.setInterval(() => {
            this.save()
        }, 5000)

        var text_element = document.getElementById("prompt");

        // Save the text when 'change' event append
        if (text_element != null) {
            text_element.addEventListener('change', event => {
                this.save();
            })
        }
        // Reset the time interval if input
        if (text_element != null) {
            text_element.addEventListener('keypress', event => {
                clearInterval(text_save_timer);
                text_save_timer = window.setInterval(() => {
                    this.save()
                }, 5000)
            })
        }
    }


    /**
     * Function to update the text in the textarea when the user select a file
     * @param currentFile
     */
    async updateText(currentFile: number) {
        const userToken = localStorage.getItem("token")
        if (userToken) {
            let response = await this.filesManager.getFileContent(currentFile, userToken)
            let res = JSON.parse(response);
            this.fileName = res.name;
            this.text = res.param.content;
        }
    }


    /**
     * Function to handle the save in DB
     */
    async save() {
        const userToken = localStorage.getItem("token");
        if (userToken && this.currentFileID !== 0) {
            await this.filesManager.saveFile(this.currentFileID, userToken, this.fileName, this.text)
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


    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    /**
     * async function to handle the modal add submit and send text to ollama
     * @param data
     */
    async handleModalAddSubmit(data: { name: string, context: string }) {
        if (this.text === undefined || this.text === null) {
            console.error("Text is empty");
            return;
        }

        const tokenUser = localStorage.getItem('token');
        if (!tokenUser) return;

        this.filesManager.getDirContent(this.currentFileID, tokenUser).subscribe(async (getContext) => {
            let context = JSON.parse(getContext);
            let result = null;

            if (data.name === undefined || data.name === null || data.name === "") {
                console.error("Prompt is empty");
                return;
            }

            result = await this.ollamaService.addButtonOllama(this.currentFileID, tokenUser, data.name, context, this.text);

            if (result) {
                let res = JSON.parse(result);
                if (res.param.response.length > 0) {
                    let rawText = res.param.response;
                    if (rawText !== '') {
                        this.generatedText = rawText;
                        this.pendingValidation = true;
                    } else {
                        console.warn("Answer is empty after processing.");
                    }
                }
            }
        });
    }

    /**
     * This function is called when the user apply to the generated text.
     */
    applyGeneratedText() {
        this.text += this.generatedText;
        this.generatedText = '';
        this.pendingValidation = false;
    }

    /**
     * This function manage values of generatedText and pendingValidation if the user decline the generated response.
     */
    rejectGeneratedText() {
        this.generatedText = '';
        this.pendingValidation = false;
    }
}