import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { PrefillLocationsFromProductModalComponent } from './prefill-locations-from-product-modal.component';

describe('PrefillLocationsFromProductModalComponent', () => {
  let component: PrefillLocationsFromProductModalComponent;
  let fixture: ComponentFixture<PrefillLocationsFromProductModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [NgbActiveModal],
      declarations: [PrefillLocationsFromProductModalComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      PrefillLocationsFromProductModalComponent,
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
