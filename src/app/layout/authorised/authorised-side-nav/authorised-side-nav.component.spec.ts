import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { AuthorisedSideNavComponent } from './authorised-side-nav.component';
import { AuthService } from 'src/app/core/auth.service';
import { AboutAppInfoService } from 'src/app/about-app-info.service';
import { SelfOnboardingService } from '../../../shared-services/self-onboarding.service';

describe('AuthorisedSideNavComponent', () => {
  let component: AuthorisedSideNavComponent;
  let fixture: ComponentFixture<AuthorisedSideNavComponent>;
  let mockAuthService: any;
  let mockActivatedRoute: any;
  let mockRouter: any;
  let mockAboutAppInfoService: any;
  let mockSelfOnboardingService: any;

  beforeEach(async(() => {
    // Mock services
    mockAuthService = {
      getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue({}),
      logout: jasmine.createSpy('logout')
    };

    mockActivatedRoute = {
      snapshot: {
        data: {}
      }
    };
    
    mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };
    
    mockAboutAppInfoService = {
      getAboutAppInfo: jasmine.createSpy('getAboutAppInfo').and.returnValue(of({}))
    };
    
    mockSelfOnboardingService = {
      getSelfOnboardingStatus: jasmine.createSpy('getSelfOnboardingStatus').and.returnValue(of({}))
    };

    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule
      ],
      declarations: [ AuthorisedSideNavComponent ],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        { provide: AboutAppInfoService, useValue: mockAboutAppInfoService },
        { provide: SelfOnboardingService, useValue: mockSelfOnboardingService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AuthorisedSideNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
