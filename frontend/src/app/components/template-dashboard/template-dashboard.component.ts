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
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subject, Subscription, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { Template, TemplateDraft, TemplatePage } from '../../models/template.model';
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
  data: Template[] = [];
  totalRecords = 0;
  readonly pageSizeOptions = [50];
  pageSize = 50;
  pageIndex = 0;
  sortActive = 'templateId';
  sortDirection: 'asc' | 'desc' = 'asc';
  filterValue = '';
  isLoading = false;
  private readonly destroy$ = new Subject<void>();
  private loadSubscription?: Subscription;
  private readonly filterChange$ = new Subject<string>();

  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;

  constructor(
    private readonly templateService: TemplateService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.filterChange$
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term) => {
        this.filterValue = term;
        this.pageIndex = 0;
        if (this.paginator) {
          this.paginator.pageIndex = 0;
        }
        this.loadTemplates();
      });
  }

  ngOnInit(): void {
    this.loadTemplates();
  }

  ngAfterViewInit(): void {
    if (this.sort) {
      this.sort.sortChange.pipe(takeUntil(this.destroy$)).subscribe((sort) => {
        this.sortActive = sort.active;
        this.sortDirection = sort.direction === 'desc' ? 'desc' : 'asc';
        this.pageIndex = 0;
        if (this.paginator) {
          this.paginator.pageIndex = 0;
        }
        this.loadTemplates();
      });
    }

    if (this.paginator) {
      this.paginator.page.pipe(takeUntil(this.destroy$)).subscribe((event) => {
        if (event.pageSize !== this.pageSize) {
          this.pageSize = event.pageSize;
          this.pageIndex = 0;
          this.paginator!.pageIndex = 0;
        } else {
          this.pageIndex = event.pageIndex;
        }
        this.loadTemplates();
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.loadSubscription?.unsubscribe();
  }

  applyFilter(value: string): void {
    this.filterChange$.next((value ?? '').trim());
    this.cdr.markForCheck();
  }

  get rangeStart(): number {
    if (!this.totalRecords) {
      return 0;
    }
    return this.pageIndex * this.pageSize + 1;
  }

  get rangeEnd(): number {
    if (!this.totalRecords) {
      return 0;
    }
    return this.pageIndex * this.pageSize + this.data.length;
  }

  loadTemplates(): void {
    this.loadSubscription?.unsubscribe();
    this.isLoading = true;
    this.cdr.markForCheck();

    this.loadSubscription = this.templateService
      .getTemplates({
        page: this.pageIndex + 1,
        pageSize: this.pageSize,
        search: this.filterValue || undefined,
        sortField: this.sortActive,
        sortDirection: this.sortDirection
      })
      .subscribe({
        next: (response: TemplatePage) => this.handleLoadSuccess(response),
        error: () => this.handleLoadError()
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
          this.loadTemplates();
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

    // afterClosed() completes automatically — no takeUntil here
    dialogRef.afterClosed().subscribe((draft?: TemplateDraft) => {
      if (!draft) {
        return;
      }

      if (data.mode === 'create') {
        this.templateService
          .createTemplate(draft)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (created: Template) => {
              this.snackBar.open('Template created successfully.', 'Dismiss', { duration: 4000 });
              this.pageIndex = 0;
              if (this.paginator) {
                this.paginator.pageIndex = 0;
              }
              this.loadTemplates();
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
          next: (updated: Template) => {
            this.snackBar.open('Template updated successfully.', 'Dismiss', { duration: 4000 });
            this.loadTemplates();
          },
          error: () => this.snackBar.open('Failed to update template.', 'Dismiss', { duration: 5000 })
        });
    });
  }

  private handleLoadSuccess(response: TemplatePage): void {
    const total = response.total ?? 0;
    this.totalRecords = total;
    const totalPages = total === 0 ? 1 : Math.ceil(total / this.pageSize);

    if (total > 0 && this.pageIndex >= totalPages) {
      this.pageIndex = Math.max(0, totalPages - 1);
      if (this.paginator) {
        this.paginator.pageIndex = this.pageIndex;
      }
      this.loadSubscription = undefined;
      this.loadTemplates();
      return;
    }

    this.data = Array.isArray(response.items) ? response.items : [];
    this.isLoading = false;

    if (this.paginator) {
      this.paginator.length = this.totalRecords;
      this.paginator.pageIndex = this.pageIndex;
    }

    this.loadSubscription = undefined;
    this.cdr.markForCheck();
  }

  private handleLoadError(): void {
    this.isLoading = false;
    this.loadSubscription = undefined;
    this.cdr.markForCheck();
    this.snackBar.open('Unable to load templates.', 'Dismiss', { duration: 5000 });
  }
}
