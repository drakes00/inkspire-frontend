import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalChoiceComponent } from './modal-choice.component';

describe('ModalChoiceComponent', () => {
  let component: ModalChoiceComponent;
  let fixture: ComponentFixture<ModalChoiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalChoiceComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalChoiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
