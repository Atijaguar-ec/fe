import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ToastrModule } from 'ngx-toastr';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { GlobalEventManagerService } from '../../core/global-event-manager.service';
import { ActivatedRoute } from '@angular/router';
import { NgbModalImproved } from '../../core/ngb-modal-improved/ngb-modal-improved.service';

import { ProductLabelFeedbackPageComponent } from './product-label-feedback-page.component';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

describe('ProductLabelFeedbackPageComponent', () => {
  let component: ProductLabelFeedbackPageComponent;
  let fixture: ComponentFixture<ProductLabelFeedbackPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ProductLabelFeedbackPageComponent],
      imports: [ToastrModule.forRoot()],
      providers: [
        {
          provide: GlobalEventManagerService,
          useValue: { showLoading: () => {} },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '1' } } },
        },
        { provide: NgbModalImproved, useValue: {} },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
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
