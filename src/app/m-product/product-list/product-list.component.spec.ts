import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

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

  beforeEach(async(() => {
    // Mock GlobalEventManagerService
    mockGlobalEventManagerService = {
      showLoading: jasmine.createSpy('showLoading'),
      showLoadingSpinner: jasmine.createSpy('showLoadingSpinner'),
      hideLoadingSpinner: jasmine.createSpy('hideLoadingSpinner')
    };
    
    // Mock AuthService
    mockAuthService = {
      userProfile$: {
        pipe: jasmine.createSpy('pipe').and.returnValue({ subscribe: jasmine.createSpy('subscribe') })
      }
    };
    
    // Mock NgbModalImproved
    mockNgbModalImproved = {
      open: jasmine.createSpy('open').and.returnValue({
        componentInstance: {},
        result: Promise.resolve()
      })
    };
    
    // Mock SelfOnboardingService
    mockSelfOnboardingService = {};

    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        ReactiveFormsModule,
        NgbModule
      ],
      declarations: [ ProductListComponent ],
      providers: [
        ProductControllerService,
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
