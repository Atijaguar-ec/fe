import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbModalImproved } from 'src/app/core/ngb-modal-improved/ngb-modal-improved.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { convertToParamMap } from '@angular/router';
import { of, Subject } from 'rxjs';
import { ProductControllerService } from 'src/api/api/productController.service';
import { GlobalEventManagerService } from 'src/app/core/global-event-manager.service';
import { AuthService } from 'src/app/core/auth.service';

import { ProductLabelStatisticsPageComponent } from './product-label-statistics-page.component';

describe('ProductLabelStatisticsPageComponent', () => {
  let component: ProductLabelStatisticsPageComponent;
  let fixture: ComponentFixture<ProductLabelStatisticsPageComponent>;
  
  // Mock NgbModalImproved
  const mockNgbModalImproved = {
    open: jasmine.createSpy('open').and.returnValue({
      componentInstance: {},
      result: Promise.resolve()
    })
  };

  // Mock ProductControllerService
  const mockProductController = {
    getProductLabel: jasmine.createSpy('getProductLabel').and.returnValue(of({ status: 'OK', data: { uuid: 'uuid-1' } })),
    getProductLabelAnalytics: jasmine.createSpy('getProductLabelAnalytics').and.returnValue(of({ status: 'OK', data: {} }))
  } as Partial<ProductControllerService> as ProductControllerService;

  // Mock GlobalEventManagerService
  const loadedGoogleMapsEmitter = new Subject<boolean>();
  const mockGlobalEventManager: Partial<GlobalEventManagerService> = {
    showLoading: jasmine.createSpy('showLoading'),
    loadedGoogleMapsEmitter,
    push: jasmine.createSpy('push'),
    openMessageModal: jasmine.createSpy('openMessageModal').and.returnValue(Promise.resolve('cancel'))
  } as any;

  // Mock AuthService to avoid constructor logic accessing route snapshot children
  const mockAuthService: Partial<AuthService> = {
    userProfile$: of({ role: 'USER' }) as any,
    login: jasmine.createSpy('login'),
    logout: jasmine.createSpy('logout'),
    register: jasmine.createSpy('register')
  } as any;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        ToastrModule.forRoot(),
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule
      ],
      declarations: [ ProductLabelStatisticsPageComponent ],
      providers: [
        { provide: NgbModalImproved, useValue: mockNgbModalImproved },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ labelId: '1' }), params: { id: '1' }, children: [], url: [] } } },
        { provide: ProductControllerService, useValue: mockProductController },
        { provide: GlobalEventManagerService, useValue: mockGlobalEventManager },
        { provide: AuthService, useValue: mockAuthService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
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
