import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { ModalComponent } from "./modal.component";
import { SimpleChange } from "@angular/core";

describe("ModalComponent", () => {
    let component: ModalComponent;
    let fixture: ComponentFixture<ModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FormsModule, ModalComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("when showContext is false", () => {
        it("should not show the context textarea", () => {
            component.showContext = false;
            fixture.detectChanges();
            expect(fixture.nativeElement.textContent).not.toContain("Context (optional):");
        });
    });

    describe("when showContext is true", () => {
        it("should show the context textarea", () => {
            component.showContext = true;
            fixture.detectChanges();
            expect(fixture.nativeElement.textContent).toContain("Context (optional):");
        });
    });

    it('should emit "validate" with correct payload', () => {
        spyOn(component.validate, "emit");

        component.nameValue = "MyNewItem";
        component.contextValue = "My context";
        fixture.detectChanges();

        const validateButton = fixture.nativeElement.querySelector(".dialog-actions button:last-child");
        // Add a check to ensure the button was found, for robustness
        expect(validateButton).toBeTruthy();
        validateButton.click();

        expect(component.validate.emit).toHaveBeenCalledWith({
            name: "MyNewItem",
            context: "My context",
        });
    });

    it("should reset form fields when it becomes visible", () => {
        component.name = "Old Name";
        component.context = "Old Context";

        component.isVisible = true;
        component.ngOnChanges({
            isVisible: new SimpleChange(false, true, false),
        });
        fixture.detectChanges();

        expect(component.nameValue).toBe("Old Name");
        expect(component.contextValue).toBe("Old Context");

        // Reset for the next test
        component.name = "";
        component.context = "";
    });
});
