import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { CompanyListComponent } from './company-list.component';
import { CompanyControllerService } from 'src/api/api/companyController.service';
import { GlobalEventManagerService } from '../../core/global-event-manager.service';
import { AuthService } from '../../core/auth.service';
import { NgbModalImproved } from '../../core/ngb-modal-improved/ngb-modal-improved.service';

describe('CompanyListComponent', () => {
  let component: CompanyListComponent;
  let fixture: ComponentFixture<CompanyListComponent>;
  let mockGlobalEventManagerService: any;
  let mockAuthService: any;
  let mockNgbModalImproved: any;

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

    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        ReactiveFormsModule,
        NgbModule
      ],
      declarations: [ CompanyListComponent ],
      providers: [
        CompanyControllerService,
        { provide: GlobalEventManagerService, useValue: mockGlobalEventManagerService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: NgbModalImproved, useValue: mockNgbModalImproved }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompanyListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
