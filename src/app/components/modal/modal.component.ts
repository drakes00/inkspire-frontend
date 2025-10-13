import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from "@angular/core";
import { FormsModule } from "@angular/forms";

@Component({
    selector: "app-modal",
    imports: [FormsModule],
    templateUrl: "./modal.component.html",
    styleUrl: "./modal.component.css",
})
export class ModalComponent implements OnChanges {
    @Output() close = new EventEmitter<void>();
    @Input() title: string = "Enter Name";
    @Input() isVisible: boolean = false;
    @Input() showContext: boolean = false;
    @Input() name: string = "";
    @Input() context: string = "";

    @Output() validate = new EventEmitter<{ name: string; context: string }>();

    nameValue: string = "";
    contextValue: string = "";

    ngOnChanges(changes: SimpleChanges): void {
        if (changes["isVisible"] && this.isVisible) {
            // Reset fields when modal becomes visible
            this.nameValue = this.name || "";
            this.contextValue = this.context || "";
        }
    }

    validateModal(): void {
        this.validate.emit({
            name: this.nameValue,
            context: this.contextValue,
        });
    }

    closeModal(): void {
        this.close.emit();
    }
}
