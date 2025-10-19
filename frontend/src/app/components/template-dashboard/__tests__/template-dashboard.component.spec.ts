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
    httpMock.expectOne('/api/templates').flush([]);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
