import { TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { GlobalEventManagerService } from './core/global-event-manager.service';
import { ToastrModule } from 'ngx-toastr';
import { CookieManagementService } from './shared/directives/cookie-management.service';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        ToastrModule.forRoot()
      ],
      providers: [
        { provide: GlobalEventManagerService, useValue: {} },
        { provide: CookieManagementService, useValue: { loadConsentedCookies: () => {}, hasDefinedConsentToAllActiveCookies: () => true } }
      ],
      declarations: [
        AppComponent
      ],
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'INATrace-fe'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('INATrace');
  });

});
