import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NgbModalImproved } from '../../core/ngb-modal-improved/ngb-modal-improved.service';

import { CookiesPageComponent } from './cookies-page.component';

describe('CookiesPageComponent', () => {
  let component: CookiesPageComponent;
  let fixture: ComponentFixture<CookiesPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: NgbModalImproved, useValue: {} }],
      declarations: [CookiesPageComponent],
    }).compileComponents();
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
