import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbModalImproved } from 'src/app/core/ngb-modal-improved/ngb-modal-improved.service';

import { FeedbackModalComponent } from './feedback-modal.component';

describe('ProductLabelFrontFeedbackComponent', () => {
  let component: FeedbackModalComponent;
  let fixture: ComponentFixture<FeedbackModalComponent>;

  // Mock NgbActiveModal
  const mockNgbActiveModal = {
    close: jasmine.createSpy('close'),
    dismiss: jasmine.createSpy('dismiss')
  };

  // Mock NgbModalImproved
  const mockNgbModalImproved = {
    open: jasmine.createSpy('open').and.returnValue({
      componentInstance: {},
      result: Promise.resolve()
    })
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        ToastrModule.forRoot(),
        BrowserAnimationsModule
      ],
      declarations: [ FeedbackModalComponent ],
      providers: [
        { provide: NgbActiveModal, useValue: mockNgbActiveModal },
        { provide: NgbModalImproved, useValue: mockNgbModalImproved }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedbackModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
