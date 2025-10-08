import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-modal-choice',
    imports: [FormsModule],
    templateUrl: './modal-choice.component.html',
    styleUrl: './modal-choice.component.css'
})
export class ModalChoiceComponent {
    @Output() close = new EventEmitter<void>();
    @Input() title: string = 'Title';
    @Input() isVisible: boolean = false;
    @Output() validate = new EventEmitter<{text: string, type: string, context: string, titleFile:string}>();

    selectedType : string = 'file';
    textValue: string = '';
    context :string = "";
  
    validateModal(): void {
      this.validate.emit({
      text: this.textValue,
      type: this.selectedType,
      context: this.context,
      titleFile: ""
    });
      this.isVisible = false;
      this.close.emit()
    }
    
    closeModal(): void {
      this.close.emit();
    }

}
