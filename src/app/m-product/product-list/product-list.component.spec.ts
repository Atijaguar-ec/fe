import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { LayoutModule } from 'src/app/layout/layout.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { of } from 'rxjs';
import { SharedModule } from 'src/app/shared/shared.module';

import { ProductListComponent } from './product-list.component';
import { ProductControllerService } from 'src/api/api/productController.service';
import { GlobalEventManagerService } from '../../core/global-event-manager.service';
import { AuthService } from '../../core/auth.service';
import { NgbModalImproved } from '../../core/ngb-modal-improved/ngb-modal-improved.service';
import { SelfOnboardingService } from '../../shared-services/self-onboarding.service';

describe('ProductListComponent', () => {
  let component: ProductListComponent;
  let fixture: ComponentFixture<ProductListComponent>;
  let mockGlobalEventManagerService: any;
  let mockAuthService: any;
  let mockNgbModalImproved: any;
  let mockSelfOnboardingService: any;
  let mockProductControllerService: any;

  beforeEach(async(() => {
    // Mock GlobalEventManagerService
    mockGlobalEventManagerService = {
      showLoading: jasmine.createSpy('showLoading'),
      showLoadingSpinner: jasmine.createSpy('showLoadingSpinner'),
      hideLoadingSpinner: jasmine.createSpy('hideLoadingSpinner')
    };
    
    // Mock AuthService
    mockAuthService = {
      userProfile$: of({ role: 'USER' })
    };
    
    // Mock NgbModalImproved
    mockNgbModalImproved = {
      open: jasmine.createSpy('open').and.returnValue({
        componentInstance: {},
        result: Promise.resolve()
      })
    };
    
    // Mock SelfOnboardingService
    mockSelfOnboardingService = {
      addProductCurrentStep$: of(0),
      setAddProductCurrentStep: jasmine.createSpy('setAddProductCurrentStep')
    };

    // Mock ProductControllerService
    mockProductControllerService = {
      listProductsByMap: jasmine.createSpy('listProductsByMap').and.returnValue(of({ data: { count: 0 } })),
      listProductsAdminByMap: jasmine.createSpy('listProductsAdminByMap').and.returnValue(of({ data: { count: 0 } })),
      listProducts: jasmine.createSpy('listProducts').and.returnValue(of({ status: 'OK', data: { count: 0 } })),
      listProductsAdmin: jasmine.createSpy('listProductsAdmin').and.returnValue(of({ status: 'OK', data: { count: 0 } }))
    };

    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        ReactiveFormsModule,
        NgbModule,
        LayoutModule,
        FontAwesomeModule,
        SharedModule
      ],
      declarations: [ ProductListComponent ],
      providers: [
        { provide: ProductControllerService, useValue: mockProductControllerService },
        { provide: GlobalEventManagerService, useValue: mockGlobalEventManagerService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: NgbModalImproved, useValue: mockNgbModalImproved },
        { provide: SelfOnboardingService, useValue: mockSelfOnboardingService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
