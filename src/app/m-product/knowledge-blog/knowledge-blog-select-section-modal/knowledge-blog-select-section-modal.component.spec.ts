import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from 'src/app/shared/shared.module';

import { KnowledgeBlogSelectSectionModalComponent } from './knowledge-blog-select-section-modal.component';

describe('KnowledgeBlogSelectSectionModalComponent', () => {
  let component: KnowledgeBlogSelectSectionModalComponent;
  let fixture: ComponentFixture<KnowledgeBlogSelectSectionModalComponent>;

  const mockNgbActiveModal = {
    close: jasmine.createSpy('close'),
    dismiss: jasmine.createSpy('dismiss')
  } as Partial<NgbActiveModal> as NgbActiveModal;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ ReactiveFormsModule, SharedModule ],
      declarations: [ KnowledgeBlogSelectSectionModalComponent ],
      providers: [ { provide: NgbActiveModal, useValue: mockNgbActiveModal } ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KnowledgeBlogSelectSectionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
