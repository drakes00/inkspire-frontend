import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { ModelComponent } from './model-component.component';
import { Model, ModelService } from '../../services/model.service';

// Create a mock for ModelService
class MockModelService {
  getModels(token: string) {
    const dummyModels: Model[] = [
      { id: 1, name: 'Llama3' },
      { id: 2, name: 'Gemma' },
    ];
    return of(dummyModels);
  }
}

describe('ModelComponent', () => {
  let component: ModelComponent;
  let fixture: ComponentFixture<ModelComponent>;
  let modelService: ModelService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ModelComponent,
        HttpClientTestingModule,
        NoopAnimationsModule // To handle animations from Angular Material components
      ],
      providers: [
        { provide: ModelService, useClass: MockModelService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModelComponent);
    component = fixture.componentInstance;
    modelService = TestBed.inject(ModelService); // Get the injected service instance
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call getModels and populate models array on successful fetch', fakeAsync(() => {
      spyOn(localStorage, 'getItem').and.returnValue('test-token');
      const getModelsSpy = spyOn(modelService, 'getModels').and.callThrough();

      fixture.detectChanges(); // Triggers ngOnInit
      tick(); // Complete the async operation

      expect(getModelsSpy).toHaveBeenCalledWith('test-token');
      expect(component.models.length).toBe(2);
      expect(component.models[0].name).toBe('Llama3');
      expect(component.selectedModelId).toBe(1); // Should select the first model by default
    }));

    it('should not call getModels if no token is present', () => {
      spyOn(localStorage, 'getItem').and.returnValue(null);
      const getModelsSpy = spyOn(modelService, 'getModels');

      fixture.detectChanges(); // Triggers ngOnInit

      expect(getModelsSpy).not.toHaveBeenCalled();
    });

    it('should handle errors when getModels fails', fakeAsync(() => {
      spyOn(localStorage, 'getItem').and.returnValue('test-token');
      spyOn(modelService, 'getModels').and.returnValue(throwError(() => new Error('Failed to fetch')));
      const consoleErrorSpy = spyOn(console, 'error');

      fixture.detectChanges(); // Triggers ngOnInit
      tick();

      expect(component.models.length).toBe(0);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load models', jasmine.any(Error));
    }));

    it('should not select a default model if the returned list is empty', fakeAsync(() => {
        spyOn(localStorage, 'getItem').and.returnValue('test-token');
        spyOn(modelService, 'getModels').and.returnValue(of([])); // Return empty array

        fixture.detectChanges();
        tick();

        expect(component.models.length).toBe(0);
        expect(component.selectedModelId).toBeNull();
    }));
  });
});
