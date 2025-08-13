import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbModalImproved } from 'src/app/core/ngb-modal-improved/ngb-modal-improved.service';
import { LayoutModule } from 'src/app/layout/layout.module';
import { ProductCommonModule } from 'src/app/m-product/product-common/product-common.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { GoogleMapsModule } from '@angular/google-maps';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { StatisticsCardComponent } from './statistics-card/statistics-card.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
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
        LayoutModule,
        ProductCommonModule,
        SharedModule,
        GoogleMapsModule,
        FormsModule,
        ReactiveFormsModule,
        FontAwesomeModule
      ],
      declarations: [ ProductLabelStatisticsPageComponent, StatisticsCardComponent ],
      providers: [
        { provide: NgbModalImproved, useValue: mockNgbModalImproved },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ labelId: '1' }), params: { id: '1' }, children: [], url: [] } } },
        { provide: ProductControllerService, useValue: mockProductController },
        { provide: GlobalEventManagerService, useValue: mockGlobalEventManager },
        { provide: AuthService, useValue: mockAuthService }
      ]
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
