import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastrModule } from 'ngx-toastr';

import { TextinputModalComponent } from './textinput-modal.component';

describe('TextinputModalComponent', () => {
  let component: TextinputModalComponent;
  let fixture: ComponentFixture<TextinputModalComponent>;

  // Mock NgbActiveModal
  const mockNgbActiveModal = {
    close: jasmine.createSpy('close'),
    dismiss: jasmine.createSpy('dismiss')
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ FormsModule, ReactiveFormsModule, ToastrModule.forRoot() ],
      declarations: [ TextinputModalComponent ],
      providers: [
        { provide: NgbActiveModal, useValue: mockNgbActiveModal }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TextinputModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
