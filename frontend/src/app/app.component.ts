import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatToolbarModule, MatIconModule],
  template: `
    <mat-toolbar color="primary" class="toolbar">
      <mat-icon class="toolbar__icon">dashboard</mat-icon>
      <span>AD Template Dashboard</span>
    </mat-toolbar>
    <router-outlet></router-outlet>
  `,
  styles: [
    `
      .toolbar {
        position: sticky;
        top: 0;
        z-index: 1000;
        display: flex;
        gap: 0.75rem;
      }
      .toolbar__icon {
        font-size: 1.5rem;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {}
