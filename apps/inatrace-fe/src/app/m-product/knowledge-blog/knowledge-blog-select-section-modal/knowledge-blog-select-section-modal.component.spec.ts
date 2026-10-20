import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { KnowledgeBlogSelectSectionModalComponent } from './knowledge-blog-select-section-modal.component';

describe('KnowledgeBlogSelectSectionModalComponent', () => {
  let component: KnowledgeBlogSelectSectionModalComponent;
  let fixture: ComponentFixture<KnowledgeBlogSelectSectionModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [NgbActiveModal],
      declarations: [KnowledgeBlogSelectSectionModalComponent],
    }).compileComponents();
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
