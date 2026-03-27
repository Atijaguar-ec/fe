import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ToastrModule } from 'ngx-toastr';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { GlobalEventManagerService } from '../../core/global-event-manager.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { ProductLabelStatisticsPageComponent } from './product-label-statistics-page.component';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

describe('ProductLabelStatisticsPageComponent', () => {
  let component: ProductLabelStatisticsPageComponent;
  let fixture: ComponentFixture<ProductLabelStatisticsPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      declarations: [ProductLabelStatisticsPageComponent],
      imports: [ToastrModule.forRoot()],
      providers: [
        {
          provide: GlobalEventManagerService,
          useValue: { showLoading: () => {}, loadedGoogleMapsEmitter: of({}) },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: '1' }),
            snapshot: { params: { id: '1' }, paramMap: { get: () => '1' } },
          },
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductLabelStatisticsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
