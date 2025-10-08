import { Component, EventEmitter, Output, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-modal',
    imports: [FormsModule],
    templateUrl: './modal.component.html',
    styleUrl: './modal.component.css'
})
export class ModalComponent {
  @Output() close = new EventEmitter<void>();
  @Input() title: string = 'Title';
  @Input() isVisible: boolean = false;
  @Output() validate = new EventEmitter<{text: string}>();
  @Input() confirmText: string = 'Validate';
  @Input() cancelText: string = 'Cancel';
  @Input() showTextarea: boolean = true;
  textValue: string = '';

  validateModal(): void {
      this.validate.emit({
      text: this.textValue
    });
      this.isVisible = false;
      this.close.emit()

    }
    
    closeModal(): void {
      this.close.emit();
    }

}
