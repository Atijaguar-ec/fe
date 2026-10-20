import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';

import { LabelRedirectToProductPageComponent } from './label-redirect-to-product-page.component';

describe('LabelRedirectToProductPageComponent', () => {
  let component: LabelRedirectToProductPageComponent;
  let fixture: ComponentFixture<LabelRedirectToProductPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (k: string) => '123' } } },
        },
      ],
      declarations: [LabelRedirectToProductPageComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LabelRedirectToProductPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
