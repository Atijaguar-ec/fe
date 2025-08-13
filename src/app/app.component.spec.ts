import { TestBed, async } from '@angular/core/testing';
import { Component, Input } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { ToastrService, TOAST_CONFIG } from 'ngx-toastr';
import { NgbModalImproved } from './core/ngb-modal-improved/ngb-modal-improved.service';
import { Angulartics2, RouterlessTracking } from 'angulartics2';
import { Angulartics2GoogleGlobalSiteTag } from 'angulartics2/gst';

@Component({
  selector: 'app-cookie-banner',
  template: ''
})
class MockCookieBannerComponent {
  @Input() cookieInfoUrl: string;
}

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule
      ],
      declarations: [
        AppComponent,
        MockCookieBannerComponent
      ],
      providers: [
        { provide: ToastrService, useValue: {
          success: () => {},
          error: () => {},
          warning: () => {},
          info: () => {}
        }},
        { provide: TOAST_CONFIG, useValue: {
          timeOut: 3000,
          positionClass: 'toast-top-right',
          preventDuplicates: true
        }},
        { 
          provide: 'GlobalEventManagerService', 
          useValue: {
            showLoading: () => {},
            hideLoading: () => {}
          }
        },
        { 
          provide: NgbModalImproved, 
          useValue: {
            open: () => ({
              result: Promise.resolve(),
              componentInstance: {}
            }),
            dismissAll: () => {}
          }
        },
        { 
          provide: 'MessageModalService', 
          useValue: {
            showMessage: () => {},
            showConfirmation: () => Promise.resolve(true)
          }
        },
        { 
          provide: RouterlessTracking, 
          useValue: {}
        },
        { 
          provide: Angulartics2, 
          useValue: {
            eventTrack: { next: () => {} },
            pageTrack: { next: () => {} },
            exceptionTrack: { next: () => {} },
            setUsername: { next: () => {} },
            setUserProperties: { next: () => {} }
          }
        },
        { 
          provide: Angulartics2GoogleGlobalSiteTag, 
          useValue: {}
        },
        { 
          provide: 'CookieManagementService', 
          useValue: {
            getCookieConsent: () => ({})
          }
        }
      ]
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'INATrace'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('INATrace');
  });

  // Test eliminado: el template ya no contiene un elemento h1
  // it('should render title in a h1 tag', () => {
  //   const fixture = TestBed.createComponent(AppComponent);
  //   fixture.detectChanges();
  //   const compiled = fixture.debugElement.nativeElement;
  //   expect(compiled.querySelector('h1').textContent).toContain('Welcome to INATrace-fe!');
  // });
});
