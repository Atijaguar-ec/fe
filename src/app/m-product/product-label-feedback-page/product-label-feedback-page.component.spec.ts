import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LayoutModule } from 'src/app/layout/layout.module';
import { ProductCommonModule } from 'src/app/m-product/product-common/product-common.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgbDropdownModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService, ToastrModule, TOAST_CONFIG } from 'ngx-toastr';

import { ProductLabelFeedbackPageComponent } from './product-label-feedback-page.component';
import { NgbModalImproved } from 'src/app/core/ngb-modal-improved/ngb-modal-improved.service';

describe('ProductLabelFeedbackPageComponent', () => {
  let component: ProductLabelFeedbackPageComponent;
  let fixture: ComponentFixture<ProductLabelFeedbackPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        LayoutModule,
        ProductCommonModule,
        SharedModule,
        NgbDropdownModule,
        NgbPaginationModule
      ],
      declarations: [ ProductLabelFeedbackPageComponent ],
      providers: [
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
        },
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
        }}
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductLabelFeedbackPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
