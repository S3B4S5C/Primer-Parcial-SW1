import { Component, Input, booleanAttribute } from "@angular/core"
import { CommonModule } from "@angular/common"

@Component({
  selector: "app-form-field",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="form-field" [class.form-field-error]="error">
      <label *ngIf="label" class="form-label">
        {{ label }}
        <span *ngIf="required" class="required">*</span>
      </label>
      <ng-content></ng-content>
      <div *ngIf="error" class="form-error">{{ error }}</div>
      <div *ngIf="hint && !error" class="form-hint">{{ hint }}</div>
    </div>
  `,
  styleUrl: "./form-field.scss",
})
export class FormFieldComponent {
  @Input() label?: string
  @Input() error?: string
  @Input() hint?: string
  @Input({ transform: booleanAttribute }) required = false;
}
