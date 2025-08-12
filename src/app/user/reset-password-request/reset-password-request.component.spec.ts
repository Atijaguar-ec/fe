import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ResetPasswordRequestComponent } from './reset-password-request.component';
import { UserControllerService } from 'src/api/api/userController.service';
import { GlobalEventManagerService } from 'src/app/core/global-event-manager.service';
import { SharedModule } from 'src/app/shared/shared.module';

describe('ResetPasswordRequestComponent', () => {
  let component: ResetPasswordRequestComponent;
  let fixture: ComponentFixture<ResetPasswordRequestComponent>;
  let mockUserControllerService: any;
  let mockToastrService: any;
  let mockGlobalEventManagerService: any;

  beforeEach(async(() => {
    // Mock UserControllerService
    mockUserControllerService = {
      resetPasswordRequestUsingPOST: jasmine.createSpy('resetPasswordRequestUsingPOST').and.returnValue(Promise.resolve())
    };
    
    // Mock ToastrService
    mockToastrService = {
      success: jasmine.createSpy('success'),
      error: jasmine.createSpy('error')
    };
    
    // Mock GlobalEventManagerService
    mockGlobalEventManagerService = {
      showLoading: jasmine.createSpy('showLoading'),
      showLoadingSpinner: jasmine.createSpy('showLoadingSpinner'),
      hideLoadingSpinner: jasmine.createSpy('hideLoadingSpinner'),
      push: jasmine.createSpy('push')
    };

    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        BrowserAnimationsModule,
        ToastrModule.forRoot(),
        FormsModule,
        ReactiveFormsModule,
        SharedModule
      ],
      declarations: [ ResetPasswordRequestComponent ],
      providers: [
        { provide: UserControllerService, useValue: mockUserControllerService },
        { provide: ToastrService, useValue: mockToastrService },
        { provide: GlobalEventManagerService, useValue: mockGlobalEventManagerService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResetPasswordRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
