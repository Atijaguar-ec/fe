import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { LayoutModule } from 'src/app/layout/layout.module';

import { LandingPageTopNavComponent } from './landing-page-top-nav.component';

describe('LandingPageTopNavComponent', () => {
  let component: LandingPageTopNavComponent;
  let fixture: ComponentFixture<LandingPageTopNavComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ RouterTestingModule, LayoutModule ],
      declarations: [ LandingPageTopNavComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LandingPageTopNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
