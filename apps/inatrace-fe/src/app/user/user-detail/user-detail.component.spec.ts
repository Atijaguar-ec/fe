import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { GlobalEventManagerService } from '../../core/global-event-manager.service';
import { RouterTestingModule } from '@angular/router/testing';
import { NgbModalImproved } from '../../core/ngb-modal-improved/ngb-modal-improved.service';

import { UserDetailComponent } from './user-detail.component';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

describe('UserDetailComponent', () => {
  let component: UserDetailComponent;
  let fixture: ComponentFixture<UserDetailComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [UserDetailComponent],
      imports: [RouterTestingModule],
      providers: [
        {
          provide: GlobalEventManagerService,
          useValue: { showLoading: () => {} },
        },
        { provide: NgbModalImproved, useValue: {} },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
