import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router, RouterEvent } from '@angular/router';
import { of, Subject } from 'rxjs';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

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
      logout: jasmine.createSpy('logout'),
      userProfile$: of({ role: 'USER', status: 'ACTIVE' })
    };

    mockActivatedRoute = {
      snapshot: {
        data: {}
      }
    };
    
    // Crear un mock más completo del Router para manejar eventos y navegación
    const routerEvents = new Subject<RouterEvent>();
    mockRouter = {
      navigate: jasmine.createSpy('navigate'),
      events: routerEvents.asObservable(),
      url: '/home',
      createUrlTree: jasmine.createSpy('createUrlTree').and.returnValue({}),
      serializeUrl: jasmine.createSpy('serializeUrl').and.returnValue('')
    };
    
    mockAboutAppInfoService = {
      getAboutAppInfo: jasmine.createSpy('getAboutAppInfo').and.returnValue(of({}))
    };
    
    mockSelfOnboardingService = {
      getSelfOnboardingStatus: jasmine.createSpy('getSelfOnboardingStatus').and.returnValue(of({})),
      addProductCurrentStep$: of(0),
      addFacilityCurrentStep$: of(0),
      addProcessingActionCurrentStep$: of(0)
    };

    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([
          { path: 'home', component: AuthorisedSideNavComponent },
          { path: 'my-stock', component: AuthorisedSideNavComponent }
        ]),
        NgbModule,
        NgbTooltipModule
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
