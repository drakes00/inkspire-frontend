import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-error-modal',
  standalone: true,
  imports: [NgIf, MatCardModule, MatButtonModule],
  templateUrl: './error-modal.component.html',
  styleUrls: ['./error-modal.component.css']
})
export class ErrorModalComponent {
  @Input() visible = false;
  @Input() message = 'An unexpected error occurred';
  @Output() close = new EventEmitter<void>();

  // ESC key closes modal
  @HostListener('document:keydown.escape', ['$event'])
  onEsc(): void {
    if (this.visible) this.close.emit();
  }

  // Backdrop click closes modal
  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }
}

