import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-modal-choice',
    imports: [FormsModule],
    templateUrl: './modal-choice.component.html',
    styleUrl: './modal-choice.component.css'
})
export class ModalChoiceComponent implements OnChanges {
    @Output() close = new EventEmitter<void>();
    @Input() title: string = 'Title';
    @Input() isVisible: boolean = false;
    /**
     * Determines the type of item to create.
     * 'choice': User can select between file and directory.
     * 'file': The modal is for creating a file.
     * 'directory': The modal is for creating a directory.
     */
    @Input() itemType: 'file' | 'directory' | 'choice' = 'choice';
    
    @Output() validate = new EventEmitter<{name: string, type: string, context: string}>();

    // This is now an internal state, can be derived from itemType
    selectedType : string = 'file';
    nameValue: string = '';
    context :string = "";
  
    ngOnChanges(changes: SimpleChanges): void {
        if (changes['itemType']) {
            if (this.itemType !== 'choice') {
                this.selectedType = this.itemType;
            } else {
                this.selectedType = 'file'; // default for 'choice'
            }
        }
        if(changes['isVisible'] && this.isVisible) {
            // Reset fields when modal becomes visible
            this.nameValue = '';
            this.context = '';
            if (this.itemType === 'choice') {
                this.selectedType = 'file';
            }
        }
    }

    validateModal(): void {
      this.validate.emit({
        name: this.nameValue,
        type: this.selectedType,
        context: this.context,
      });
    }
    
    closeModal(): void {
      this.close.emit();
    }
}
