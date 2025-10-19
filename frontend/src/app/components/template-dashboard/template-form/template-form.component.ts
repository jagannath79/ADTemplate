import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TemplateDraft, Template } from '../../../models/template.model';

export type TemplateDialogData = {
  mode: 'create' | 'edit';
  template?: Template;
};

@Component({
  selector: 'app-template-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './template-form.component.html',
  styleUrls: ['./template-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TemplateFormComponent {
  readonly title = this.data.mode === 'create' ? 'Create Template' : 'Update Template';
  readonly actionLabel = this.data.mode === 'create' ? 'Create' : 'Save';

  readonly fields = [
    { key: 'region', label: 'Region' },
    { key: 'country', label: 'Country' },
    { key: 'jobFamily', label: 'Job Family' },
    { key: 'locationName', label: 'Location Name' },
    { key: 'locationId', label: 'Location ID' },
    { key: 'company', label: 'Company' },
    { key: 'costCenterDivision', label: 'Cost Center Division' },
    { key: 'templateId', label: 'Template ID' },
    { key: 'templateObjectGuid', label: 'Template Object GUID' },
    { key: 'movePath', label: 'Move Path' }
  ] as const;

  readonly form: FormGroup = this.fb.group({
    region: [this.data.template?.region ?? '', [Validators.required, Validators.maxLength(120)]],
    country: [this.data.template?.country ?? '', [Validators.required, Validators.maxLength(120)]],
    jobFamily: [this.data.template?.jobFamily ?? '', [Validators.required, Validators.maxLength(120)]],
    locationName: [this.data.template?.locationName ?? '', [Validators.required, Validators.maxLength(120)]],
    locationId: [this.data.template?.locationId ?? '', [Validators.required, Validators.maxLength(120)]],
    company: [this.data.template?.company ?? '', [Validators.required, Validators.maxLength(120)]],
    costCenterDivision: [
      this.data.template?.costCenterDivision ?? '',
      [Validators.required, Validators.maxLength(120)]
    ],
    templateId: [this.data.template?.templateId ?? '', [Validators.required, Validators.maxLength(120)]],
    templateObjectGuid: [
      this.data.template?.templateObjectGuid ?? '',
      [Validators.required, Validators.maxLength(120)]
    ],
    movePath: [this.data.template?.movePath ?? '', [Validators.required, Validators.maxLength(255)]]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<TemplateFormComponent, TemplateDraft>,
    @Inject(MAT_DIALOG_DATA) private readonly data: TemplateDialogData
  ) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.dialogRef.close(this.form.value as TemplateDraft);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
