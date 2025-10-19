import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { TemplateDashboardComponent } from '../template-dashboard.component';

describe('TemplateDashboardComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateDashboardComponent, NoopAnimationsModule],
      providers: [provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create the dashboard component', () => {
    const fixture = TestBed.createComponent(TemplateDashboardComponent);
    fixture.detectChanges();
    httpMock
      .expectOne((req) =>
        req.method === 'GET' &&
        req.url === '/api/templates' &&
        req.params.get('page') === '1' &&
        req.params.get('pageSize') === '50' &&
        req.params.get('sortField') === 'templateId' &&
        req.params.get('sortDirection') === 'asc'
      )
      .flush({ items: [], total: 0, page: 1, pageSize: 50 });
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
