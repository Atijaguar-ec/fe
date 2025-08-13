import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ToastrService, TOAST_CONFIG } from 'ngx-toastr';
import { NgbModalImproved } from 'src/app/core/ngb-modal-improved/ngb-modal-improved.service';
import { SharedModule } from 'src/app/shared/shared.module';

import { ResetPasswordComponent } from './reset-password.component';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;

  // Mock ActivatedRoute
  const mockActivatedRoute = {
    snapshot: {
      paramMap: convertToParamMap({})
    }
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ 
        RouterTestingModule,
        HttpClientTestingModule,
        SharedModule
      ],
      declarations: [ ResetPasswordComponent ],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
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
          provide: 'GlobalEventManagerService', 
          useValue: {
            showLoading: () => {},
            hideLoading: () => {}
          }
        }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
