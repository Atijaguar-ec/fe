import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { PrefillProductSelectionModalComponent } from './prefill-product-selection-modal.component';

describe('PrefillProductSelectionModalComponent', () => {
  let component: PrefillProductSelectionModalComponent;
  let fixture: ComponentFixture<PrefillProductSelectionModalComponent>;

  // Mock NgbActiveModal
  const mockNgbActiveModal = {
    close: jasmine.createSpy('close'),
    dismiss: jasmine.createSpy('dismiss')
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [ PrefillProductSelectionModalComponent ],
      providers: [
        { provide: NgbActiveModal, useValue: mockNgbActiveModal }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrefillProductSelectionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
