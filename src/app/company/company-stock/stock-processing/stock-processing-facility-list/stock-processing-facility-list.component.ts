import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { GlobalEventManagerService } from '../../../../core/global-event-manager.service';
import { FacilityControllerService } from '../../../../../api/api/facilityController.service';
import { ApiPaginatedResponseApiFacility } from '../../../../../api/model/apiPaginatedResponseApiFacility';
import { ApiPaginatedListApiFacility } from '../../../../../api/model/apiPaginatedListApiFacility';
import { ApiFacility } from '../../../../../api/model/apiFacility';
import { ProcessingActionControllerService } from '../../../../../api/api/processingActionController.service';
import { ApiProcessingAction } from '../../../../../api/model/apiProcessingAction';
import { ApiPaginatedResponseApiProcessingAction } from '../../../../../api/model/apiPaginatedResponseApiProcessingAction';

@Component({
  selector: 'app-stock-processing-facility-list',
  templateUrl: './stock-processing-facility-list.component.html',
  styleUrls: ['./stock-processing-facility-list.component.scss']
})
export class StockProcessingFacilityListComponent implements OnInit {

  @Input()
  reloadPingList$ = new BehaviorSubject<boolean>(false);

  @Input()
  companyId: number;

  @Output()
  showing = new EventEmitter<number>();

  @Output()
  countAll = new EventEmitter<number>();

  allFacilities = 0;
  showedFacilities = 0;

  facilities$: Observable<ApiPaginatedListApiFacility>;

  // categoryOne = [];
  // categoryTwo = [];
  // categoryThree = [];
  // categoryFour = [];
  // categoryFive = [];
  
  // Dynamic categories based on facility types
  categories: Record<string, ApiFacility[]> = {};
  categoriesOrder: string[] = [];

  processingActions: ApiProcessingAction[] = [];

  constructor(
    private globalEventsManager: GlobalEventManagerService,
    private facilityControllerService: FacilityControllerService,
    private processingActionControllerService: ProcessingActionControllerService
  ) { }

  ngOnInit(): void {

    this.facilities$ = combineLatest([this.reloadPingList$])
      .pipe(
        tap(() => this.globalEventsManager.showLoading(true)),
        switchMap(() => this.processingActionControllerService.listProcessingActionsByCompany(this.companyId)),
        tap((res: ApiPaginatedResponseApiProcessingAction) => {
          this.processingActions = res?.data?.items ?? [];
        }),
        switchMap(() => this.loadEntityList()),
        map((res: ApiPaginatedResponseApiFacility) => {
          const data = (res?.data ?? { items: [], count: 0 }) as ApiPaginatedListApiFacility;
          this.showedFacilities = data.count ?? 0;
          this.showing.emit(this.showedFacilities);
          this.arrangeFacilities(data.items ?? []);
          return data;
        }),
        tap((res: ApiPaginatedListApiFacility) => {
          this.allFacilities = res?.count ?? 0;
          this.countAll.emit(this.allFacilities);
        }),
        tap(() => this.globalEventsManager.showLoading(false))
      );
  }

  loadEntityList(): Observable<ApiPaginatedResponseApiFacility> {
    return this.facilityControllerService.listFacilitiesByCompanyByMap({ id: this.companyId });
  }

  arrangeFacilities(facilities: ApiFacility[]) {
    // Reset categories
    this.categories = {};
    this.categoriesOrder = [];

    // Group facilities by facilityType.code and collect unique codes
    const codeSet = new Set<string>();
    const codeOrderMap = new Map<string, number>();

    for (const facility of facilities) {
      // Safe access with null checks
      const facilityType = facility?.facilityType;
      if (!facilityType?.code) {
        continue;
      }
      
      const code = facilityType.code;
      const order = (facilityType as any).order || 999;
      
      if (!this.categories[code]) {
        this.categories[code] = [];
        codeSet.add(code);
        codeOrderMap.set(code, order);
      }
      
      this.categories[code].push(facility);
    }

    // Sort facility types by processingOrder
    this.categoriesOrder = Array.from(codeSet).sort((a, b) => {
      const orderA = codeOrderMap.get(a) || 999;
      const orderB = codeOrderMap.get(b) || 999;
      return orderA - orderB;
    });

    // Sort facilities within each type by name for consistency
    for (const code of this.categoriesOrder) {
      this.categories[code].sort((a, b) => 
        (a.name || '').localeCompare(b.name || '', 'es')
      );
    }
  }

}
