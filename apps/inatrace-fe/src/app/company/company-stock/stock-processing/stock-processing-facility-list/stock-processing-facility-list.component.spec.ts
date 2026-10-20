import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StockProcessingFacilityListComponent } from './stock-processing-facility-list.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { GlobalEventManagerService } from '../../../../core/global-event-manager.service';
import { FacilityControllerService } from '../../../../../api/api/facilityController.service';
import { ProcessingActionControllerService } from '../../../../../api/api/processingActionController.service';
import { of } from 'rxjs';

describe('StockProcessingFacilityListComponent', () => {
  let component: StockProcessingFacilityListComponent;
  let fixture: ComponentFixture<StockProcessingFacilityListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StockProcessingFacilityListComponent ],
      imports: [ HttpClientTestingModule ],
      providers: [
        { provide: GlobalEventManagerService, useValue: { showLoading: () => {} } },
        { provide: FacilityControllerService, useValue: {} },
        { provide: ProcessingActionControllerService, useValue: { listProcessingActionsByCompany: () => of({ data: { items: [] } }) } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StockProcessingFacilityListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should group shrimp facilities into dynamic categories', () => {
    const shrimpFacilities: any[] = [
      { id: 1, name: 'Recepcion 1', facilityType: { code: 'RECEPCION' } },
      { id: 2, name: 'Clasificadora 1', facilityType: { code: 'CLASIFICADORA' } },
      { id: 3, name: 'Tunel 1', facilityType: { code: 'TUNEL_IQF' } }
    ];

    // Reset categories
    component.categories = {};
    component.categoriesOrder = [];
    
    // Act
    component.arrangeFacilities(shrimpFacilities);

    // Assert
    expect(component.categoriesOrder.length).toBe(3);
    expect(component.categories['RECEPCION'].length).toBe(1);
    expect(component.categories['CLASIFICADORA'].length).toBe(1);
  });
});
