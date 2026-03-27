import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SingleChoiceComponent } from './single-choice.component';

describe('SingleChoiceComponent', () => {
  let component: SingleChoiceComponent;
  let fixture: ComponentFixture<SingleChoiceComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SingleChoiceComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SingleChoiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
