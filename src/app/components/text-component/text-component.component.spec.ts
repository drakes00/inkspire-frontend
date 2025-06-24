import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextComponent } from './text-component.component';

describe('MainPageComponent', () => {
  let component: TextComponent;
  let fixture: ComponentFixture<TextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
