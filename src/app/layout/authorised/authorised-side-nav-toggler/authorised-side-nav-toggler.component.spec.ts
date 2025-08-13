import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthorisedSideNavService } from '../services/authorised-side-nav.service';

import { AuthorisedSideNavTogglerComponent } from './authorised-side-nav-toggler.component';

describe('AuthorisedSideNavTogglerComponent', () => {
  let component: AuthorisedSideNavTogglerComponent;
  let fixture: ComponentFixture<AuthorisedSideNavTogglerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AuthorisedSideNavTogglerComponent ],
      providers: [
        { provide: AuthorisedSideNavService, useValue: { toggleSideNav: jasmine.createSpy('toggleSideNav') } }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AuthorisedSideNavTogglerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
