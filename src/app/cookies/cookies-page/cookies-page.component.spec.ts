import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { CookiesPageComponent } from './cookies-page.component';
import { NgbModalImproved } from '../../core/ngb-modal-improved/ngb-modal-improved.service';

describe('CookiesPageComponent', () => {
  let component: CookiesPageComponent;
  let fixture: ComponentFixture<CookiesPageComponent>;
  let mockNgbModalImproved: any;

  beforeEach(async(() => {
    // Mock NgbModalImproved
    mockNgbModalImproved = {
      open: jasmine.createSpy('open').and.returnValue({
        componentInstance: {},
        result: Promise.resolve()
      })
    };

    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        NgbModule
      ],
      declarations: [ CookiesPageComponent ],
      providers: [
        { provide: NgbModalImproved, useValue: mockNgbModalImproved }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CookiesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
