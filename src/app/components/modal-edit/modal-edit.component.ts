import { Component, EventEmitter, Output, Input  } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-modal-edit',
    imports: [FormsModule],
    templateUrl: './modal-edit.component.html',
    styleUrl: './modal-edit.component.css'
})
export class ModalEditComponent {

  @Input() titleFile: string = '';
  @Input() context: string = '';

  @Output() close = new EventEmitter<void>();
  @Input() title: string = 'Title';
  @Input() isVisible: boolean = false;
  @Output() validate = new EventEmitter<{text: string, type: string, context: string , titleFile: string}>();
  @Input() confirmText: string = 'Validate';
  @Input() cancelText: string = 'Cancel';
  @Input() showTextarea: boolean = true;
  

  /*
    Validate the modal
  */
  validateModal(): void {
      this.validate.emit({
        text:"",
        type:"",
        context: this.context,
        titleFile: this.titleFile,
    });
      this.isVisible = false;
      this.close.emit()

    }
    
    closeModal(): void {
      this.close.emit();
    }

}
