import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Template, TemplateDraft, TemplatePage } from '../models/template.model';
import { environment } from '../../environments/environment';

export interface TemplateQuery {
  page: number;
  pageSize: number;
  search?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

@Injectable({ providedIn: 'root' })
export class TemplateService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/templates`;

  getTemplates(params: TemplateQuery) {
    let httpParams = new HttpParams()
      .set('page', String(params.page))
      .set('pageSize', String(params.pageSize));

    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }

    if (params.sortField) {
      httpParams = httpParams.set('sortField', params.sortField);
    }

    if (params.sortDirection) {
      httpParams = httpParams.set('sortDirection', params.sortDirection);
    }

    return this.http.get<TemplatePage>(this.baseUrl, { params: httpParams });
  }

  createTemplate(payload: TemplateDraft) {
    return this.http.post<Template>(this.baseUrl, payload);
  }

  updateTemplate(id: number, payload: TemplateDraft) {
    return this.http.put<Template>(`${this.baseUrl}/${id}`, payload);
  }

  deleteTemplate(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
