import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SystemLeftPanelComponent } from './system-left-panel.component';

describe('SystemLeftPanelComponent', () => {
  let component: SystemLeftPanelComponent;
  let fixture: ComponentFixture<SystemLeftPanelComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SystemLeftPanelComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SystemLeftPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
