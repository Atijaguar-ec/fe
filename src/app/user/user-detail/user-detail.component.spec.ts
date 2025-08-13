import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ToastrModule } from 'ngx-toastr';
import { RouterTestingModule } from '@angular/router/testing';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { UserDetailComponent } from './user-detail.component';
import { NgbModalImproved } from '../../core/ngb-modal-improved/ngb-modal-improved.service';

// Mock para NgbModalImproved
const mockNgbModalImproved = {
  open: () => ({ result: Promise.resolve() }),
  dismissAll: () => {}
};

describe('UserDetailComponent', () => {
  let component: UserDetailComponent;
  let fixture: ComponentFixture<UserDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ 
        HttpClientTestingModule,
        RouterTestingModule,
        ToastrModule.forRoot(),
        NgbModule
      ],
      declarations: [ UserDetailComponent ],
      providers: [
        { provide: NgbModalImproved, useValue: mockNgbModalImproved }
      ]
    })
    .compileComponents();
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
