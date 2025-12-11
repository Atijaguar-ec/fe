import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { LayoutModule } from 'src/app/layout/layout.module';
import { ProductCommonModule } from 'src/app/m-product/product-common/product-common.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { of, Subject } from 'rxjs';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { ComponentsModule } from 'src/app/components/components.module';

import { BatchDetailPageComponent } from './batch-detail-page.component';
import { ProductControllerService } from 'src/api/api/productController.service';
import { GlobalEventManagerService } from 'src/app/core/global-event-manager.service';
import { NgbModalImproved } from 'src/app/core/ngb-modal-improved/ngb-modal-improved.service';

describe('BatchDetailPageComponent', () => {
  let component: BatchDetailPageComponent;
  let fixture: ComponentFixture<BatchDetailPageComponent>;
  let mockGlobalEventManagerService: any;
  let mockNgbModalImproved: any;
  let mockProductControllerService: any;
  let mockActivatedRoute: any;

  beforeEach(async(() => {
    // Mock GlobalEventManagerService
    mockGlobalEventManagerService = {
      showLoadingSpinner: jasmine.createSpy('showLoadingSpinner'),
      hideLoadingSpinner: jasmine.createSpy('hideLoadingSpinner'),
      showLoading: jasmine.createSpy('showLoading'),
      push: jasmine.createSpy('push'),
      loadedGoogleMapsEmitter: new Subject<boolean>()
    };
    
    // Mock NgbModalImproved
    mockNgbModalImproved = {
      open: jasmine.createSpy('open').and.returnValue({
        componentInstance: {},
        result: Promise.resolve()
      })
    };

    // Mock ProductControllerService
    mockProductControllerService = {
      getProductLabelBatch: jasmine.createSpy('getProductLabelBatch').and.returnValue(of({ data: { locations: [] } })),
      updateProductLabelBatch: jasmine.createSpy('updateProductLabelBatch').and.returnValue(of({ status: 'OK' })),
      createProductLabelBatch: jasmine.createSpy('createProductLabelBatch').and.returnValue(of({ status: 'OK' }))
    };

    // Mock ActivatedRoute -> default to create mode (no batchId)
    mockActivatedRoute = {
      snapshot: {
        params: { labelId: 1 },
        paramMap: convertToParamMap({ labelId: 1 }),
        children: [],
        url: []
      }
    };

    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        ReactiveFormsModule,
        NgbModule,
        LayoutModule,
        ProductCommonModule,
        SharedModule,
        FontAwesomeModule,
        ComponentsModule
      ],
      declarations: [ BatchDetailPageComponent ],
      providers: [
        { provide: ProductControllerService, useValue: mockProductControllerService },
        { provide: GlobalEventManagerService, useValue: mockGlobalEventManagerService },
        { provide: NgbModalImproved, useValue: mockNgbModalImproved }
        ,{ provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BatchDetailPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
