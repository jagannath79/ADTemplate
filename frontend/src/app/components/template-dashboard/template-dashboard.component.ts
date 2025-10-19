import { AsyncPipe, NgIf } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subject, finalize, takeUntil } from 'rxjs';
import { Template, TemplateDraft } from '../../models/template.model';
import { TemplateService } from '../../services/template.service';
import { TemplateFormComponent, TemplateDialogData } from './template-form/template-form.component';

@Component({
  selector: 'app-template-dashboard',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    AsyncPipe,
    NgIf
  ],
  templateUrl: './template-dashboard.component.html',
  styleUrls: ['./template-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TemplateDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns = [
    'region',
    'country',
    'jobFamily',
    'locationName',
    'locationId',
    'company',
    'costCenterDivision',
    'templateId',
    'templateObjectGuid',
    'movePath',
    'actions'
  ];
  readonly dataSource = new MatTableDataSource<Template>([]);
  isLoading = false;
  private readonly destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;

  constructor(
    private readonly templateService: TemplateService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.dataSource.filterPredicate = (data: Template, filter: string) => {
      const normalizedFilter = filter.trim().toLowerCase();
      return Object.values(data)
        .map((value) => String(value ?? '').toLowerCase())
        .some((value) => value.includes(normalizedFilter));
    };
    this.dataSource.sortingDataAccessor = (item: Template, property: string) =>
      String((item as Record<string, unknown>)[property] ?? '').toLowerCase();
  }

  ngOnInit(): void {
    this.loadTemplates();
  }

  ngAfterViewInit(): void {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.dataSource.disconnect();
  }

  applyFilter(value: string): void {
    this.dataSource.filter = (value ?? '').trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
    this.cdr.markForCheck();
  }

  loadTemplates(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.templateService
      .getTemplates()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (templates) => {
          this.dataSource.data = templates;
          this.cdr.markForCheck();
        },
        error: () => this.snackBar.open('Unable to load templates.', 'Dismiss', { duration: 5000 })
      });
  }

  handleCreate(): void {
    this.openFormDialog({ mode: 'create' });
  }

  handleEdit(template: Template): void {
    this.openFormDialog({ mode: 'edit', template });
  }

  handleDelete(template: Template): void {
    if (!confirm(`Delete template ${template.templateId}?`)) {
      return;
    }
    this.templateService
      .deleteTemplate(template.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Template removed successfully.', 'Dismiss', { duration: 4000 });
          this.dataSource.data = this.dataSource.data.filter((item) => item.id !== template.id);
          this.cdr.markForCheck();
        },
        error: () => this.snackBar.open('Failed to delete template.', 'Dismiss', { duration: 5000 })
      });
  }

  private openFormDialog(data: TemplateDialogData): void {
    const dialogRef = this.dialog.open(TemplateFormComponent, {
      width: '960px',
      maxWidth: '95vw',
      data,
      disableClose: true
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((draft?: TemplateDraft) => {
      if (!draft) {
        return;
      }

      if (data.mode === 'create') {
        this.templateService
          .createTemplate(draft)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (created) => {
              this.snackBar.open('Template created successfully.', 'Dismiss', { duration: 4000 });
              this.dataSource.data = [...this.dataSource.data, created];
              this.cdr.markForCheck();
            },
            error: () => this.snackBar.open('Failed to create template.', 'Dismiss', { duration: 5000 })
          });
        return;
      }

      if (!data.template) {
        return;
      }

      this.templateService
        .updateTemplate(data.template.id, draft)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updated) => {
            this.snackBar.open('Template updated successfully.', 'Dismiss', { duration: 4000 });
            this.dataSource.data = this.dataSource.data.map((item) =>
              item.id === updated.id ? updated : item
            );
            this.cdr.markForCheck();
          },
          error: () => this.snackBar.open('Failed to update template.', 'Dismiss', { duration: 5000 })
        });
    });
  }
}
