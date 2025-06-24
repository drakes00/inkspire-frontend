import {Component, ViewChild, ElementRef, OnInit, OnDestroy} from '@angular/core';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {ModalComponent} from '../modal/modal.component';
import {SharedFilesService} from '../../services/shared-files.service';
import {Subscription} from 'rxjs';
import {FilesManagerService} from '../../services/files-manager.service';
import {getLocaleCurrencyCode} from '@angular/common';
import {OllamaService} from '../../services/ollama.service';

@Component({
    selector: 'app-text-page',
    standalone: true,
    imports: [MatFormFieldModule, MatInputModule, FormsModule, ReactiveFormsModule, ModalComponent],
    templateUrl: './text-component.component.html',
    styleUrl: './text-component.component.css'
})

export class TextComponent implements OnInit, OnDestroy {

    isModalVisibleAdd = false;
    isModalVisibleTranslate = false;
    title = "Title"
    text: string = ""
    generatedText: string = ""
    fileName = ""
    selectedText?: string
    @ViewChild('contextMenu') contextMenu!: ElementRef;
    @ViewChild('prompt') promptTextarea!: ElementRef<HTMLTextAreaElement>;
    contextMenuX: number = 0;
    contextMenuY: number = 0;
    isContextMenuVisible: boolean = false;
    currentFileID: number = 0;
    ollamaService = new OllamaService();
    fileService = new FilesManagerService();
    addYesButton = "Add";
    rephraseNoButton = "Rephrase";
    pendingValidation: boolean = false;
    role: string = "";
    true: boolean = true;
    evalcount = 0;
    loadduration = 0;
    tokenpsecond = 0;
    totalduration = 0;
    startSelection: number = 0;
    endSelection: number = 0;
    savedSelection: string = "";
    isSelectedHere: boolean = false;

    textForm: FormGroup = new FormGroup({
        text: new FormControl(this.text, Validators.required)
    });
    private subscription: Subscription = new Subscription();


    constructor(private shareFiles: SharedFilesService, private filesManager: FilesManagerService) {
    }


    ngOnInit() {
        this.subscription = this.shareFiles.selectedFile$.subscribe(file => {
            if (file) {
                this.currentFileID = file;
                this.updateText(this.currentFileID);
            }
        });

        document.addEventListener('selectionchange', e => {
            if ((e.target as HTMLInputElement).value !== undefined) {
                this.selectedText = (e.target as HTMLInputElement).value.substring(
                    (e.target as HTMLInputElement).selectionStart ?? 0,
                    (e.target as HTMLInputElement).selectionEnd ?? 0
                );
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
     * @param event 
     */
    async save() {
        const userToken = localStorage.getItem("token");
        if (userToken) {
            let response = await this.filesManager.saveFile(this.currentFileID, userToken, this.fileName, this.text)
            let res = JSON.parse(response);
        }
    }


    /**
     * Function that display the loading screen
     * @param event 
     */
    showLoading() {
        var containeur = document.body
        containeur?.classList.add("loading");
    }


    /**
     * Function that remove the loading screen
     * @param event 
     */
    removeLoading() {
        var containeur = document.body
        containeur?.classList.remove("loading");
    }

    /**
     * Function called when add button is pressed to get the user query. It sets a title to call the right function
     * @param specTitle title of the modal
     */
    showModalAdd(specTitle: string = "Please specify how we should add some text") {
        this.saveSelectedRangeAndValue();
        this.title = specTitle;
        this.isModalVisibleAdd = true;
        if (this.generatedText != "") {
            this.text = this.generatedText;
            this.generatedText = '';
        }
        this.pendingValidation = false;
    }
    /**
     * Function called when traduction button is pressed to get the user query. It sets a title to call the right function
     * @param specTitle title of the modal  
     */
    showModalTranslation(specTitle: string = "Please specify the language to translate to") {
        this.saveSelectedRangeAndValue();
        this.title = specTitle;
        this.isModalVisibleTranslate = true;
    }

    /**
     * Function called when the modal is closed
     */
    hideModal() {
    //     if (!this.isSelectedHere){
    //         this.savedSelection = "";
    //     }
        this.isModalVisibleAdd = false;
        this.isModalVisibleTranslate = false;
        this.isSelectedHere = false;
    }


    ngOnDestroy(): void {

        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    /**
     * Save the selected range and value from the textarea to avoid losing it when the modal is opened.
     */
    saveSelectedRangeAndValue() {
        const textarea = this.promptTextarea?.nativeElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        if (start !== end) {
            this.startSelection = start;
            this.endSelection = end;
            this.savedSelection = this.selectedText || textarea.value.substring(start, end);
            this.isSelectedHere = true;
        }
    }

    /**
     * Function called to generate a response from Ollama application. It takes the id of the current file to retrieve the context of the parent document. 
     */
    async rephraseText() {
        this.role = "rephrase";
        const tokenUser = localStorage.getItem('token');
        let getContext = await this.fileService.getDirContext(this.currentFileID, tokenUser!);
        let cont = JSON.parse(getContext);
        let context = cont.param.context;

        let result = null;

        if (this.text == undefined || this.text == null || this.text == "") {
            console.error("Text is empty");
            return;
        } else if (tokenUser) {
            let textToProcess = "";
            if (this.selectedText != null && this.selectedText != "") {
                textToProcess = this.selectedText;
            } else if (this.text != null && this.text != "" && (this.selectedText == null || this.selectedText == "")) {
                textToProcess = this.text;
            }
            this.showLoading()
            result = await this.ollamaService.rephraseButtonOllama(this.currentFileID, tokenUser!, context, textToProcess);
            this.removeLoading()
            if (result) {
                let res = JSON.parse(result);
                if (res.param.response.length > 0) {
                    // Récupérer le premier élément du tableau param
                    let rawText = res.param.response; // Accéder au premier élément du tableau
                    this.evalcount = res.param.eval_count;
                    this.loadduration = res.param.load_duration*Math.pow(10,-9);
                    this.tokenpsecond = res.param.tokenpersecond;
                    this.totalduration = res.param.total_duration*Math.pow(10,-9);

                    if (rawText !== '') {
                        this.generatedText = rawText;
                        this.pendingValidation = true;
                    } else {
                        console.warn("Ansmer is empty after processing.");
                    }
                }
            

            }


        }
    }

    /**
     * async function that handle the user query and call ollama to translate the text accordingly to the language choosen 
     * @param data 
     */
    async handleModalTranslationSubmit(data: { text: string }) {
        if (this.text == undefined || this.text == null || this.text == "") {
            console.error("Text is empty");
            return;
        }
        this.role = "translate";
        if (this.title === "Please specify the language to translate to") {

            const tokenUser = localStorage.getItem('token');
            let getContext = await this.fileService.getDirContext(this.currentFileID, tokenUser!);
            let context = JSON.parse(getContext);
            let result = null;

            if (data.text == undefined || data.text == null || data.text == "") {
                console.error("Text is empty");
                return;
            } else if (tokenUser) {
                let textToProcess = "";
                if (this.savedSelection != null && this.savedSelection != "") {
                    textToProcess = this.savedSelection;
                } else if (this.text != null && this.text != "" && (this.savedSelection == null || this.savedSelection == "")) {
                    textToProcess = this.text;
                }
                this.showLoading()
                result = await this.ollamaService.translateButtonOllama(this.currentFileID, tokenUser!, data.text, context, textToProcess);
                this.removeLoading()
                if (result) {
                    let res = JSON.parse(result);
                    if (res.param.response.length > 0) {
                        // Récupérer le premier élément du tableau param
                        let rawText = res.param.response; // Accéder au premier élément du tableau
                        this.evalcount = res.param.eval_count;
                        this.loadduration = res.param.load_duration*Math.pow(10,-9);
                        this.tokenpsecond = res.param.tokenpersecond;
                        this.totalduration = res.param.total_duration*Math.pow(10,-9)
                        if (rawText !== '') {
                            this.generatedText = rawText;
                            this.pendingValidation = true;
                        } else {
                            console.warn("Ansmer is empty after processing.");
                        }
                    
                    }
                }
            }
        }
    }


    /**
     * async function to handle the modal add submit and send text to ollama
     * @param data
     */
    async handleModalAddSubmit(data: { text: string }) {
        if (this.text == undefined || this.text == null || this.text == "") {
            console.error("Text is empty");
            return;
        }
        this.role = "add";
        if (this.title === "Please specify how we should add some text") {

            const tokenUser = localStorage.getItem('token');
            let getContext = await this.fileService.getDirContext(this.currentFileID, tokenUser!);
            let context = JSON.parse(getContext);
            let result = null;

            if (data.text == undefined || data.text == null || data.text == "") {
                console.error("Text is empty");
                return;
            } else if (tokenUser) {
                let textToProcess = "";
                if (this.savedSelection != null && this.savedSelection != "") {
                    textToProcess = this.savedSelection;
                } else if (this.text != null && this.text != "" && (this.savedSelection == null || this.savedSelection == "")) {
                    textToProcess = this.text;
                }
                this.showLoading()
                result = await this.ollamaService.addButtonOllama(this.currentFileID, tokenUser!, data.text, context, textToProcess);
                this.removeLoading()
                if (result) {
                    let res = JSON.parse(result);
                    if (res.param.response.length > 0) {
                        // Récupérer le premier élément du tableau param
                        let rawText = res.param.response; // Accéder au premier élément du tableau
                        this.evalcount = res.param.eval_count;
                        this.loadduration = res.param.load_duration*Math.pow(10,-9);
                        this.tokenpsecond = res.param.tokenpersecond;
                        this.totalduration = res.param.total_duration*Math.pow(10,-9)

                        if (rawText !== '') {
                            this.generatedText = rawText;
                            this.pendingValidation = true;
                        } else {
                            console.warn("Answer is empty after processing.");
                        }
                        
                    }
                }
            }
        }
    }

    /**
     * This function is called when the user apply to the generated text. It applies the logic (change all the text for the translation and the rephrase
     * or just add the generated text if the user want to add some text)
     */
    applyGeneratedText() {
        if (this.role === "rephrase" || this.role === "translate") {
            // management of the selected text to replace only the selcted text in the original text
            // if (this.savedSelection !== null || this.savedSelection !== ""){
            //     let firstPart = (this.text.substring(0, this.startSelection));
            //     console.log(firstPart)
            //     let lastPart = (this.text.substring(this.endSelection, this.text.length));
            //     console.log(firstPart)
            //     this.text = firstPart.concat(this.generatedText,  lastPart);
            //     console.log("new text :", this.text)
            // } 
            this.text = this.generatedText
        } else if (this.role === "add") {
            // management of the selected text to replace only the selcted text in the original text
            // if (this.savedSelection !== null || this.savedSelection !== "")
            // {
            //     let firstPart = (this.text.substring(0, this.endSelection));
            //     let lastPart = (this.text.substring(this.endSelection, this.text.length));
            //     this.text = firstPart.concat(this.generatedText, lastPart);
            //     console.log("new text :", this.text)
            // }
            this.text += this.generatedText;
        }
        this.savedSelection = "";
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
