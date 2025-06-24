import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreeFileComponent } from './tree-file.component';

describe('TreeFileComponent', () => {
  let component: TreeFileComponent;
  let fixture: ComponentFixture<TreeFileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreeFileComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TreeFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
