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
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './template-form.component.html',
  styleUrls: ['./template-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TemplateFormComponent {
  readonly title: string;
  readonly actionLabel: string;
  readonly form: FormGroup;

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

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<TemplateFormComponent, TemplateDraft>,
    @Inject(MAT_DIALOG_DATA) private readonly data: TemplateDialogData
  ) {
    // Safe to reference DI values here (avoids "used before initialization")
    this.title = data.mode === 'create' ? 'Create Template' : 'Update Template';
    this.actionLabel = data.mode === 'create' ? 'Create' : 'Save';

    this.form = this.fb.group({
      region: [data.template?.region ?? '', [Validators.required, Validators.maxLength(120)]],
      country: [data.template?.country ?? '', [Validators.required, Validators.maxLength(120)]],
      jobFamily: [data.template?.jobFamily ?? '', [Validators.required, Validators.maxLength(120)]],
      locationName: [data.template?.locationName ?? '', [Validators.required, Validators.maxLength(120)]],
      locationId: [data.template?.locationId ?? '', [Validators.required, Validators.maxLength(120)]],
      company: [data.template?.company ?? '', [Validators.required, Validators.maxLength(120)]],
      // Optional fields (keep max length constraints)
      costCenterDivision: [data.template?.costCenterDivision ?? '', [Validators.maxLength(120)]],
      templateId: [data.template?.templateId ?? '', [Validators.required, Validators.maxLength(120)]],
      templateObjectGuid: [data.template?.templateObjectGuid ?? '', [Validators.maxLength(120)]],
      movePath: [data.template?.movePath ?? '', [Validators.required, Validators.maxLength(255)]]
    });
  }

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
