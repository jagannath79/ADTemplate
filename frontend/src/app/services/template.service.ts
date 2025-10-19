import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Template, TemplateDraft } from '../models/template.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TemplateService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/templates`;

  getTemplates(): Observable<Template[]> {
    return this.http.get<Template[]>(this.baseUrl);
  }

  createTemplate(payload: TemplateDraft): Observable<Template> {
    return this.http.post<Template>(this.baseUrl, payload);
  }

  updateTemplate(id: number, payload: TemplateDraft): Observable<Template> {
    return this.http.put<Template>(`${this.baseUrl}/${id}`, payload);
  }

  deleteTemplate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
