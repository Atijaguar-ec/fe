import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbModalImproved } from 'src/app/core/ngb-modal-improved/ngb-modal-improved.service';

import { ProductLabelStatisticsPageComponent } from './product-label-statistics-page.component';

describe('ProductLabelStatisticsPageComponent', () => {
  let component: ProductLabelStatisticsPageComponent;
  let fixture: ComponentFixture<ProductLabelStatisticsPageComponent>;
  
  // Mock NgbModalImproved
  const mockNgbModalImproved = {
    open: jasmine.createSpy('open').and.returnValue({
      componentInstance: {},
      result: Promise.resolve()
    })
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        ToastrModule.forRoot(),
        BrowserAnimationsModule
      ],
      declarations: [ ProductLabelStatisticsPageComponent ],
      providers: [
        { provide: NgbModalImproved, useValue: mockNgbModalImproved }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductLabelStatisticsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
