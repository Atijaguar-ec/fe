import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ToastrModule } from 'ngx-toastr';
import { NgbModalImproved } from '../../../core/ngb-modal-improved/ngb-modal-improved.service';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

import { AuthorisedSideNavComponent } from './authorised-side-nav.component';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

describe('AuthorisedSideNavComponent', () => {
  let component: AuthorisedSideNavComponent;
  let fixture: ComponentFixture<AuthorisedSideNavComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AuthorisedSideNavComponent],
      imports: [RouterTestingModule, ToastrModule.forRoot(), NgbTooltipModule],
      providers: [
        { provide: NgbModalImproved, useValue: {} },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AuthorisedSideNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
