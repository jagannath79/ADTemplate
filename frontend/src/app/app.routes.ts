import { Routes } from '@angular/router';
import { TemplateDashboardComponent } from './components/template-dashboard/template-dashboard.component';

export const routes: Routes = [
  { path: '', component: TemplateDashboardComponent },
  { path: '**', redirectTo: '' }
];
