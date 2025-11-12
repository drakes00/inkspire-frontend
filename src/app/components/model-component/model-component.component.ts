import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Model, ModelService } from '../../services/model.service';

@Component({
  selector: 'app-model-component',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  templateUrl: './model-component.component.html',
  styleUrl: './model-component.component.css',
})
export class ModelComponent implements OnInit {
  models: Model[] = [];
  selectedModelId: number | null = null;

  constructor(private modelService: ModelService) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (token) {
      this.modelService.getModels(token).subscribe({
        next: (data) => {
          this.models = data;
          if (this.models.length > 0) {
            this.selectedModelId = this.models[0].id;
          }
        },
        error: (err) => {
          console.error('Failed to load models', err);
        }
      });
    }
  }
}
