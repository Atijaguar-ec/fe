import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, of, Subscription } from 'rxjs';
import { DeliveryDates, StockOrderListingPageMode } from '../stock-core-tab/stock-core-tab.component';
import { SortOption } from '../../../../shared/result-sorter/result-sorter-types';
import { FormControl } from '@angular/forms';
import { finalize, map, switchMap, take, tap } from 'rxjs/operators';
import { GlobalEventManagerService } from '../../../../core/global-event-manager.service';
import { StockOrderControllerService } from '../../../../../api/api/stockOrderController.service';
import { ApiPaginatedResponseApiStockOrder } from '../../../../../api/model/apiPaginatedResponseApiStockOrder';
import { ApiPaginatedListApiStockOrder } from '../../../../../api/model/apiPaginatedListApiStockOrder';
import { formatDateWithDots } from '../../../../../shared/utils';
import { ApiStockOrder } from '../../../../../api/model/apiStockOrder';
import { ApiUserCustomer } from '../../../../../api/model/apiUserCustomer';
import { StockOrderType } from '../../../../../shared/types';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiDefaultResponse } from '../../../../../api/model/apiDefaultResponse';
import StatusEnum = ApiDefaultResponse.StatusEnum;
import { AggregatedStockItem } from './models';
import { GenerateQRCodeModalComponent } from '../../../../components/generate-qr-code-modal/generate-qr-code-modal.component';
import { NgbModalImproved } from '../../../../core/ngb-modal-improved/ngb-modal-improved.service';
import { ProcessingOrderControllerService } from '../../../../../api/api/processingOrderController.service';
import { ToastrService } from 'ngx-toastr';
import { FileSaverService } from 'ngx-filesaver';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { SelfOnboardingService } from '../../../../shared-services/self-onboarding.service';
import { EnvironmentInfoService } from '../../../../core/environment-info.service';

@Component({
  selector: 'app-stock-unit-list',
  templateUrl: './stock-unit-list.component.html',
  styleUrls: ['./stock-unit-list.component.scss']
})
export class StockUnitListComponent implements OnInit, OnDestroy, AfterViewInit {

  @Input()
  reloadPingList$ = new BehaviorSubject<boolean>(false);

  @Input()
  facilityId$ = new BehaviorSubject<number>(null);

  @Input()
  openBalanceOnly$ = new BehaviorSubject<boolean>(false);

  @Input()
  purchaseOrderOnly$ = new BehaviorSubject<boolean>(true);

  @Input()
  availableOnly$ = new BehaviorSubject<boolean>(false);

  @Input()
  semiProductId$ = new BehaviorSubject<number>(null);

  @Input()
  selectedOrders: ApiStockOrder[];

  @Input()
  clickAddPaymentsPing$ = new BehaviorSubject<boolean>(false);

  @Input()
  companyId: number = null;

  @Input()
  farmerIdPing$ = new BehaviorSubject<number>(null);

  @Input()
  representativeOfProducerUserCustomerIdPing$ = new BehaviorSubject<number>(null);

  @Input()
  wayOfPaymentPing$ = new BehaviorSubject<string>('');

  @Input()
  womenOnlyPing$ = new BehaviorSubject<boolean>(null);

  @Input()
  deliveryDatesPing$ = new BehaviorSubject<DeliveryDates>({ from: null, to: null });

  @Input()
  searchFarmerNameSurnamePing$ = new BehaviorSubject<string>(null);

  @Input()
  mode: 'PURCHASE' | 'GENERAL' = 'PURCHASE';

  @Input()
  pageListingMode: StockOrderListingPageMode = 'PURCHASE_ORDERS';

  @Input()
  hideCheckbox = false;

  @Input()
  maxProductionQuantity$ = new BehaviorSubject<number>(0);

  @Output()
  countAll = new EventEmitter<number>();

  @Output()
  showing = new EventEmitter<number>();

  @Output()
  selectedIdsChanged = new EventEmitter<ApiStockOrder[]>();

  @ViewChild('deliveriesListTooltip')
  deliveriesListTooltip: NgbTooltip;

  sortOptions: SortOption[];
  private sortingParams$ = new BehaviorSubject(null);

  private allOrders = 0;
  private showedOrders = 0;
  page = 1;
  pageSize = 10;
  private paging$ = new BehaviorSubject<number>(1);

  cbCheckedAll = new FormControl(false);
  private allSelected = false;
  currentData: ApiStockOrder[];

  orders$: Observable<ApiPaginatedListApiStockOrder>;
  aggregatedOrders: AggregatedStockItem[];

  subs: Subscription;

  private addPricePerUnitMessage: string = $localize`:@@productLabelStockPayments.addPricePerUnit.message:Add price per unit`;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private globalEventsManager: GlobalEventManagerService,
    private fileSaverService: FileSaverService,
    private stockOrderControllerService: StockOrderControllerService,
    private processingOrderController: ProcessingOrderControllerService,
    private modalService: NgbModalImproved,
    private toasterService: ToastrService,
    private selfOnboardingService: SelfOnboardingService,
    private envInfo: EnvironmentInfoService
  ) { }

  ngOnInit(): void {

    this.subs = this.clickAddPaymentsPing$.subscribe(val => {
      if (val) {
        this.addPayments();
      }
    });

    this.initSortOptions();

    this.orders$ = combineLatest([
      this.reloadPingList$,
      this.paging$,
      this.sortingParams$,
      this.facilityId$,
      this.farmerIdPing$,
      this.representativeOfProducerUserCustomerIdPing$,
      this.openBalanceOnly$,
      this.purchaseOrderOnly$,
      this.availableOnly$,
      this.semiProductId$,
      this.wayOfPaymentPing$,
      this.womenOnlyPing$,
      this.deliveryDatesPing$,
      this.searchFarmerNameSurnamePing$
    ]).pipe(
      map(([
             ping,
             page,
             sorting,
             facilityId,
             farmerId,
             representativeOfProducerUserCustomerId,
             isOpenBalanceOnly,
             isPurchaseOrderOnly,
             availableOnly,
             semiProductId,
             wayOfPayment,
             isWomenShare,
             deliveryDates,
             query]) => {
        return {
          offset: (page - 1) * this.pageSize,
          limit: this.pageSize,
          ...sorting,
          facilityId,
          farmerId,
          representativeOfProducerUserCustomerId,
          isOpenBalanceOnly,
          isPurchaseOrderOnly,
          availableOnly,
          semiProductId,
          wayOfPayment,
          isWomenShare,
          productionDateStart: deliveryDates.from,
          productionDateEnd: deliveryDates.to,
          query: query ? query : null
        };
      }),
      tap(() => this.globalEventsManager.showLoading(true)),
      switchMap(params => {
        return this.loadStockOrders(params);
      }),
      map(response => {

        if (response && response.data) {
          this.currentData = response.data.items;
          this.setCounts(response.data.count);
          return response.data;
        } else {
          return null;
        }
      }),
      tap((data: ApiPaginatedListApiStockOrder) => {
        if (data) {
          this.aggregatedOrders = this.aggregateOrderItems(data.items);
          // Validate organic production limits
          if (data.items) {
            this.validateOrganicProductionLimits(data.items);
          }
        }
      }),
      tap(() => this.refreshCBs()),
      tap(() => this.globalEventsManager.showLoading(false))
    );
  }

  ngAfterViewInit(): void {

    this.subs.add(this.selfOnboardingService.guidedTourStep$.subscribe(step => {

          setTimeout(() => {
            this.deliveriesListTooltip?.close();
          }, 50);

          if (step === 4) {
            setTimeout(() => this.deliveriesListTooltip.open(), 50);
          }
        })
    );
  }

  ngOnDestroy(): void {
    if (this.subs) { this.subs.unsubscribe(); }
  }

  private initSortOptions() {

    this.sortOptions = [
      {
        key: 'cb',
        name: '',
        selectAllCheckbox: ['PURCHASE_ORDERS'].indexOf(this.pageListingMode) >= 0,
        hide: this.hideCheckbox
      },
      {
        key: 'date',
        name: ['PURCHASE_ORDERS'].indexOf(this.pageListingMode) >= 0
          ? $localize`:@@productLabelPurchaseOrder.sortOptions.deliveryDate.name:Delivery date`
          : $localize`:@@productLabelPurchaseOrder.sortOptions.production.name:Production date`,
        defaultSortOrder: 'DESC'
      },
      {
        key: 'identifier',
        name: $localize`:@@productLabelPurchaseOrder.sortOptions.identifier.name:Identifier`,
        inactive: true,
        hide: ['PURCHASE_ORDERS'].indexOf(this.pageListingMode) >= 0,
      },
      {
        key: 'orderType',
        name: $localize`:@@productLabelPurchaseOrder.sortOptions.orderType.name:Type`,
        inactive: true,
        hide: ['PURCHASE_ORDERS'].indexOf(this.pageListingMode) >= 0,
      },
      {
        key: 'farmer',
        name: $localize`:@@productLabelPurchaseOrder.sortOptions.farmer.name:Farmer`,
        inactive: true,
        hide: ['COMPANY_ADMIN', 'SYSTEM_ADMIN'].indexOf(this.pageListingMode) >= 0,
      },
      {
        key: 'semiProduct',
        name: $localize`:@@productLabelPurchaseOrder.sortOptions.semiProduct.name:Semi-product`,
        inactive: true
      },
      {
        key: 'weekNumber',
        name: $localize`:@@productLabelPurchaseOrder.sortOptions.weekNumber.name:Week Number`,
        inactive: true,
        hide: ['COMPANY_ADMIN', 'SYSTEM_ADMIN'].indexOf(this.pageListingMode) >= 0,
      },
      {
        key: 'grossQuantity',
        name: $localize`:@@productLabelPurchaseOrder.sortOptions.grossQuantity.name:Gross Quantity`,
        inactive: true,
        hide: ['COMPANY_ADMIN', 'SYSTEM_ADMIN'].indexOf(this.pageListingMode) >= 0,
      },
      {
        key: 'deductions',
        name: $localize`:@@productLabelPurchaseOrder.sortOptions.deductions.name:Deductions`,
        inactive: true,
        hide: ['COMPANY_ADMIN', 'SYSTEM_ADMIN'].indexOf(this.pageListingMode) >= 0,
      },
      {
        key: 'quantity',
        name: $localize`:@@productLabelPurchaseOrder.sortOptions.netQuantity.name:Net Quantity`,
        inactive: true,
        hide: ['COMPANY_ADMIN', 'SYSTEM_ADMIN'].indexOf(this.pageListingMode) >= 0,
      },
      {
        key: 'quantity',
        name: $localize`:@@productLabelPurchaseOrder.sortOptions.quantityFiledAvailable.name:Quantity / Filled / Available`,
        inactive: true,
        hide: ['PURCHASE_ORDERS'].indexOf(this.pageListingMode) >= 0,
      },
      {
        key: 'unit',
        name: $localize`:@@productLabelPurchaseOrder.sortOptions.unit.name:Unit`,
        inactive: true,
        hide: ['PURCHASE_ORDERS'].indexOf(this.pageListingMode) >= 0,
      },
      {
        key: 'payable',
        name: $localize`:@@productLabelPurchaseOrder.sortOptions.payable.name:Payable / Balance`,
        inactive: true,
        hide: ['COMPANY_ADMIN', 'SYSTEM_ADMIN'].indexOf(this.pageListingMode) >= 0,
      },
      {
        key: 'deliveryTime',
        name: $localize`:@@productLabelPurchaseOrder.sortOptions.deliveryTime.name:Delivery date`,
        hide: ['PURCHASE_ORDERS'].indexOf(this.pageListingMode) >= 0,
      },
      {
        key: 'updateTimestamp',
        name: $localize`:@@productLabelPurchaseOrder.sortOptions.lastChange.name:Date of last change`,
        defaultSortOrder: 'DESC',
        hide: ['PURCHASE_ORDERS'].indexOf(this.pageListingMode) >= 0,
      },
      {
        key: 'isAvailable',
        name: $localize`:@@productLabelPurchaseOrder.sortOptions.status.name:Status`,
        inactive: true,
        hide: ['PURCHASE_ORDERS'].indexOf(this.pageListingMode) >= 0,
      },
      {
        key: 'actions',
        name: $localize`:@@productLabelPurchaseOrder.sortOptions.actions.name:Actions`,
        inactive: true
      }
    ];

    if (this.envInfo.isProductType('shrimp')) {
      // 🦐 Shrimp deliveries: hide week number, net quantity and payable columns
      this.sortOptions[6].hide = true;  // Week Number
      this.sortOptions[8].hide = true;  // Deductions
      this.sortOptions[9].hide = true;  // Net Quantity
      this.sortOptions[12].hide = true; // Payable / Balance
    }

    if (this.mode === 'PURCHASE') {
      this.sortingParams$.next({ sortBy: 'date', sort: 'DESC' });
    }

    if (this.mode === 'GENERAL') {
      this.sortingParams$.next({ sortBy: 'lastChange', sort: 'DESC' });
    }
  }

  private loadStockOrders(params): Observable<ApiPaginatedResponseApiStockOrder> {

    if (!params.isOpenBalanceOnly) {
      delete params.isOpenBalanceOnly;
    }

    const facilityId = params.facilityId;
    delete params.facilityId;

    if (this.mode === 'PURCHASE') {
      if (!facilityId) {
        return this.stockOrderControllerService.getStockOrderListByCompanyIdByMap({ ...params, companyId: this.companyId });
      }
      return this.stockOrderControllerService.getStockOrderListByFacilityIdByMap({ ...params, facilityId });
    }

    if (this.mode === 'GENERAL') {

      if (!facilityId) {
        return of({
          data: {
            count: 0,
            items: []
          },
          status: StatusEnum.OK
        });
      }
      return this.stockOrderControllerService.getStockOrderListByFacilityIdByMap({ ...params, facilityId });
    }
  }

  private setCounts(allCount: number) {

    this.allOrders = allCount;

    if (this.pageSize > this.allOrders) {
      this.showedOrders = this.allOrders;
    } else {
      const temp = this.allOrders - (this.pageSize * (this.page - 1));
      this.showedOrders = temp >= this.pageSize ? this.pageSize : temp;
    }

    this.showing.emit(this.showedOrders);
    this.countAll.emit(this.allOrders);
  }

  edit(order: ApiStockOrder) {

    if (this.pageListingMode === 'PURCHASE_ORDERS') {

      this.router.navigate(['my-stock', 'deliveries', 'update', order.id]).then();

    } else {

      switch (order.orderType as StockOrderType) {
        case 'PURCHASE_ORDER':
          this.router.navigate(['my-stock', 'deliveries', 'update', order.id]).then();
          return;
        case 'GENERAL_ORDER':
        case 'PROCESSING_ORDER':
        case 'TRANSFER_ORDER':
          this.router.navigate(['my-stock', 'processing', 'update', order.id]).then();
          return;

        default:
          throw new Error('Unsupported Stock order type');
      }
    }
  }

  history(item: ApiStockOrder) {
    this.router.navigate(['all-stock', 'stock-order', item.id, 'view'],
      { relativeTo: this.route.parent.parent, queryParams: { returnUrl: this.router.routerState.snapshot.url, downloadPdf: 0 }}).then();
  }

  payment(order: ApiStockOrder) {
    if (order.priceDeterminedLater) {
      this.toasterService.warning(this.addPricePerUnitMessage);
      return;
    }
    this.router.navigate(['my-stock', 'payments', 'delivery', order.id, 'new']).then();
  }

  farmerProfile(id) {
    this.router.navigate(['my-farmers', 'edit', id],
      { queryParams: {returnUrl: this.router.routerState.snapshot.url }}).then();
  }

  openQRCodes(order: ApiStockOrder) {

    if (!order.qrCodeTag) {
      return;
    }

    const modalRef = this.modalService.open(GenerateQRCodeModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });
    Object.assign(modalRef.componentInstance, {
      qrCodeTag: order.qrCodeTag,
      qrCodeFinalProduct: order.qrCodeTagFinalProduct
    });
  }

  canDelete(order: ApiStockOrder) {
    if (order.orderType === 'PROCESSING_ORDER') { return true; }
    if (order.orderType === 'TRANSFER_ORDER') { return true; }
    if (order.orderType === 'GENERAL_ORDER') { return Math.abs(order.fulfilledQuantity - order.availableQuantity) < 0.0000000001; }
    return true;
  }

  async delete(order: ApiStockOrder) {

    let confirmResult;
    if (order.orderType === 'PROCESSING_ORDER' || order.orderType === 'TRANSFER_ORDER') {
      confirmResult = await this.globalEventsManager.openMessageModal({
        type: 'warning',
        message: $localize`:@@productLabelPurchaseOrder.deleteProcessingOrder.error.message:Are you sure you want to delete the order? This will delete processing transaction and possibly all orders generated from it.`,
        options: { centered: true }
      });
    } else {
      confirmResult = await this.globalEventsManager.openMessageModal({
        type: 'warning',
        message: $localize`:@@productLabelPurchaseOrder.delete.error.message:Are you sure you want to delete the order?`,
        options: { centered: true }
      });
    }

    // If user confirms, the modal result is 'ok'
    if (confirmResult !== 'ok') {
      return;
    }

    try {

      this.globalEventsManager.showLoading(true);

      if (order.orderType === 'PROCESSING_ORDER' || order.orderType === 'TRANSFER_ORDER' || order.orderType === 'GENERAL_ORDER') {

        const stockOrderResp = await this.stockOrderControllerService.getStockOrder(order.id, true).pipe(take(1)).toPromise();
        if (stockOrderResp && stockOrderResp.status === 'OK' && stockOrderResp.data) {
          const procOrderResp = await this.processingOrderController.deleteProcessingOrder(stockOrderResp.data.processingOrder.id).pipe(take(1)).toPromise();
          if (procOrderResp && procOrderResp.status === 'OK') {
            this.reloadPingList$.next(true);
          }
        }

        return;
      }

      // Remove purchase order
      const response = await this.stockOrderControllerService.deleteStockOrder(order.id).pipe(take(1)).toPromise();
      if (response && response.status === StatusEnum.OK) {
        this.reloadPingList$.next(true);
        this.clearCBs();
      }

    } finally {
      this.globalEventsManager.showLoading(false);
    }
  }

  changeSort(event) {
    if (event.key === 'cb') {
      this.selectAllOnPage(event.checked);
      return;
    }
    this.sortingParams$.next({ sortBy: event.key, sort: event.sortOrder });
  }

  showPagination() {
    return ((this.showedOrders - this.pageSize) === 0 && this.allOrders >= this.pageSize) || this.page > 1;
  }

  onPageChange(event) {
    this.paging$.next(event);
  }

  cbSelected(order: ApiStockOrder, index: number) {

    (this.currentData[index] as any).selected = !(this.currentData[index] as any).selected;

    const selectedIndex = this.selectedOrders.indexOf(order);

    if (selectedIndex !== -1) {
      this.selectedOrders.splice(selectedIndex, 1);
    } else {
      this.selectedOrders.push(order);
    }
    this.selectedIdsChanged.emit(this.selectedOrders);

    if (this.allSelected) {
      this.allSelected = false;
      this.cbCheckedAll.setValue(false);
    } else {
      this.refreshCBs();
    }
  }

  private refreshCBs(){

    if (!this.selectedOrders){
      return;
    }

    let selectedCount = 0;

    for (const item of this.currentData) {
      for (const order of this.selectedOrders) {

        if (order.id === item.id) {

          (item as any).selected = true;
          selectedCount += 1;

          // Prevents having selected multiple same items
          const replaceIndex = this.selectedOrders.indexOf(order);
          if (replaceIndex !== -1) {
            this.selectedOrders.splice(replaceIndex, 1);
            this.selectedOrders.push(item);
          }
          break;
        }

      }
    }

    this.allSelected = selectedCount === this.showedOrders;
    this.cbCheckedAll.setValue(this.allSelected);
  }

  private selectAllOnPage(checked) {

    if (checked) {

      for (const item of this.currentData) {

        // Remove existing item (if exists)
        for (const order of this.selectedOrders) {
          if (order.id === item.id) {
            const replaceIndex = this.selectedOrders.indexOf(order);
            if (replaceIndex !== -1) {
              this.selectedOrders.splice(replaceIndex, 1);
            }
            break;
          }
        }

        // Select and add item
        (item as any).selected = true;
        this.selectedOrders.push(item);
      }

      this.allSelected = true;
      this.selectedIdsChanged.emit(this.selectedOrders);

    } else {

      // Unselect and remove items (from selectedOrders)
      for (const item of this.currentData) {
        for (const order of this.selectedOrders) {
          if (order.id === item.id) {
            (item as any).selected = false;
            const removeIndex = this.selectedOrders.indexOf(order);
            if (removeIndex !== -1) {
              this.selectedOrders.splice(removeIndex, 1);
            }
            break;
          }
        }
      }

      this.allSelected = false;
      this.selectedIdsChanged.emit(this.selectedOrders);
    }
  }

  private clearCBs() {
    this.selectedOrders = [];
    this.allSelected = false;
    this.cbCheckedAll.setValue(false);
    this.selectedIdsChanged.emit(this.selectedOrders);
    for (const item of this.currentData) {
      if ((item as any).selected) { (item as any).selected = false; }
    }
  }

  private addPayments() {
    const poIds = [];
    for (const item of this.selectedOrders) {
      if (item.priceDeterminedLater) {
        continue;
      }
      poIds.push(item.id);
    }
    this.router.navigate(['my-stock', 'payments', 'deliveries', 'bulk-payment', poIds.toString(), 'new', 'PO']).then();
  }

  formatDate(productionDate) {
    if (productionDate) {
      return formatDateWithDots(productionDate);
    }
    return '';
  }

  private isFieldInspectionOrder(order: ApiStockOrder | null | undefined): boolean {
    return !!order?.facility?.isFieldInspection;
  }

  getDisplayMeasureUnit(order: ApiStockOrder | null | undefined): string {
    if (!order) {
      return '';
    }

    if (this.envInfo.isProductType('shrimp') && this.isFieldInspectionOrder(order)) {
      return $localize`:@@stockUnitList.measureUnit.units:Unidades`;
    }

    return order.measureUnitType?.label || '';
  }
  
  aggregateOrderItems(items: ApiStockOrder[]): AggregatedStockItem[] {

    // Aggregate semi-products
    const aggregatedSemiProductsMap: Map<number, AggregatedStockItem> = items
      .filter(stockOrder => stockOrder.semiProduct && stockOrder.semiProduct.id)
      .reduce((acc: Map<number, AggregatedStockItem>, item: ApiStockOrder) => {

        const nextTotalQuantity = item.totalQuantity ? item.totalQuantity : 0;

        if (acc.has(item.semiProduct.id)) {
          const prevElem = acc.get(item.semiProduct.id);
          acc.set(item.semiProduct.id, {
            ...prevElem,
            amount: nextTotalQuantity + prevElem.amount
          });
        } else {
          acc.set(item.semiProduct.id, {
            amount: nextTotalQuantity,
            measureUnit: this.getDisplayMeasureUnit(item),
            stockUnitName: item.semiProduct.name
          });
        }
        return acc;
      }, new Map<number, AggregatedStockItem>());

    // Aggregate final products
    const aggregatedFinalProducts: Map<number, AggregatedStockItem> = items
      .filter(stockOrder => stockOrder.finalProduct && stockOrder.finalProduct.id)
      .reduce((acc: Map<number, AggregatedStockItem>, item: ApiStockOrder) => {

        const nextTotalQuantity = item.totalQuantity ? item.totalQuantity : 0;

        if (acc.has(item.finalProduct.id)) {
          const prevElem = acc.get(item.finalProduct.id);
          acc.set(item.finalProduct.id, {
            ...prevElem,
            amount: nextTotalQuantity + prevElem.amount
          });
        } else {
          acc.set(item.finalProduct.id, {
            amount: nextTotalQuantity,
            measureUnit: this.getDisplayMeasureUnit(item),
            stockUnitName: `${item.finalProduct.name} (${item.finalProduct.product.name})`
          });
        }
        return acc;
      }, new Map<number, AggregatedStockItem>());
    
    return [...Array.from(aggregatedSemiProductsMap.values()), ...Array.from(aggregatedFinalProducts.values())];
  }

  orderIdentifier(order: ApiStockOrder) {
    return order && (order.identifier || order.internalLotNumber);
  }

  farmerName(farmer: ApiUserCustomer) {

    if (farmer) {
      const isLegal = farmer.personType === ApiUserCustomer.PersonTypeEnum.LEGAL || (farmer as any).personType === 'LEGAL';

      const baseName = ((): string => {
        if (isLegal && farmer.companyName && farmer.companyName.trim().length > 0) {
          return farmer.companyName.trim();
        }

        const namePart = farmer.name ? farmer.name.trim() : '';
        const surnamePart = farmer.surname ? farmer.surname.trim() : '';
        return `${namePart} ${surnamePart}`.trim();
      })();

      if (farmer.location?.address?.country?.code === 'RW') {

        const cell = farmer.location.address.cell ? farmer.location.address.cell.substring(0, 2).toLocaleUpperCase() : '--';
        const village = farmer.location.address.village ? farmer.location.address.village.substring(0, 2).toLocaleUpperCase() : '--';
        return `${baseName} (${farmer.id}, ${village}-${cell})`;

      } else if (farmer.location?.address?.country?.code === 'HN') {
        const municipality = farmer.location.address.hondurasMunicipality ? farmer.location.address.hondurasMunicipality : '--';
        const village = farmer.location.address.hondurasVillage ? farmer.location.address.hondurasVillage : '--';
        return `${baseName} (${farmer.id}, ${municipality}-${village})`;
      }

      return baseName;
    }

    return '';
  }

  async exportGeoData(order: ApiStockOrder) {
    this.globalEventsManager.showLoading(true);
    const res = await this.stockOrderControllerService.exportGeoData(order.id)
      .pipe(
        take(1),
        finalize(() => {
          this.globalEventsManager.showLoading(false);
        })
      ).toPromise();
    if (res.size > 0) {
      this.fileSaverService.save(res, 'geoData.geojson');
    } else {
      this.toasterService.info($localize`:@@orderList.export.geojson.noDataAvailable:There is no Geo data available for this order`);
      return;
    }
  }

  continueGuidedTourToProcessing() {
    this.selfOnboardingService.guidedTourNextStep(5);
    this.router.navigate(['my-stock', 'processing']).then();
  }

  /**
   * Validates organic production limits and shows alerts
   * @param orders Current stock orders
   */
  private validateOrganicProductionLimits(orders: ApiStockOrder[]): void {
    this.maxProductionQuantity$.pipe(take(1)).subscribe(maxQuantity => {
      if (!maxQuantity || maxQuantity <= 0 || !orders) {
        return;
      }

      // Calculate total organic production
      const totalOrganicProduction = orders
        .filter(order => order.organic === true)
        .reduce((total, order) => {
          const quantity = order.fulfilledQuantity || order.availableQuantity || 0;
          return total + quantity;
        }, 0);

      // Check if limit is exceeded
      if (totalOrganicProduction > maxQuantity) {
        const excess = totalOrganicProduction - maxQuantity;
        const exceededMessage = $localize`:@@stockUnitList.organicLimitExceeded:⚠️ ALERTA: La producción orgánica excede el límite permitido por ${excess.toFixed(2)}:excessAmount: qq. Límite: ${maxQuantity}:maxQuantity: qq, Actual: ${totalOrganicProduction.toFixed(2)}:currentAmount: qq. Límite de Producción Orgánica Excedido.`;
        const organicLimitTitle = $localize`:@@stockUnitList.organicLimitTitle:Límite de Producción Orgánica`;
        this.toasterService.error(exceededMessage, organicLimitTitle, { timeOut: 10000, closeButton: true });
      } else if (totalOrganicProduction > maxQuantity * 0.8) {
        // Warning at 80% of limit
        const remaining = maxQuantity - totalOrganicProduction;
        const nearLimitMessage = $localize`:@@stockUnitList.organicLimitWarning:⚠️ ADVERTENCIA: La producción orgánica está cerca del límite. Restante: ${remaining.toFixed(2)}:remainingAmount: qq de ${maxQuantity}:maxQuantity: qq permitidos.`;
        const organicLimitTitle = $localize`:@@stockUnitList.organicLimitTitle:Límite de Producción Orgánica`;
        this.toasterService.warning(nearLimitMessage, organicLimitTitle, { timeOut: 7000, closeButton: true });
      }
    });
  }

  /**
   * Calcula el saldo de producción orgánica para un producto específico
   * @param aggregatedItem Item agregado de la tabla
   * @returns Saldo en quintales
   */
  private calculateOrganicBalance(aggregatedItem: AggregatedStockItem): { balance: number; maxLimit: number; isOrganic: boolean } {
    let maxLimit = 0;
    let isOrganic = false;

    // Obtener el límite máximo
    this.maxProductionQuantity$.pipe(take(1)).subscribe(limit => {
      maxLimit = limit || 0;
    });

    if (!maxLimit || maxLimit <= 0) {
      return { balance: 0, maxLimit: 0, isOrganic: false };
    }

    // Calcular producción orgánica total para este producto específico (convertir de libras a quintales)
    const organicProductionLbs = this.currentData
      ?.filter(order => 
        order.organic === true && 
        (order.semiProduct?.name === aggregatedItem.stockUnitName || 
         order.finalProduct?.name === aggregatedItem.stockUnitName)
      )
      .reduce((total, order) => {
        const quantity = order.fulfilledQuantity || order.availableQuantity || 0;
        return total + quantity;
      }, 0) || 0;

    // Convertir de libras a quintales (1 quintal = 100 libras)
    const organicProductionQq = organicProductionLbs / 100;
    const balance = maxLimit - organicProductionQq;
    isOrganic = organicProductionLbs > 0;

    return { balance, maxLimit, isOrganic };
  }

  /**
   * Obtiene el texto del saldo orgánico
   */
  getOrganicBalanceText(aggregatedItem: AggregatedStockItem): string {
    const { balance, maxLimit, isOrganic } = this.calculateOrganicBalance(aggregatedItem);
    
    if (!maxLimit) {
      return 'N/A';
    }

    if (!isOrganic) {
      return `${maxLimit.toFixed(2)} qq disponibles`;
    }

    if (balance >= 0) {
      return `${balance.toFixed(2)} qq restantes`;
    } else {
      return `⚠️ Exceso: ${Math.abs(balance).toFixed(2)} qq`;
    }
  }

  /**
   * Obtiene la clase CSS para el color del saldo
   */
  getOrganicBalanceClass(aggregatedItem: AggregatedStockItem): string {
    const { balance, maxLimit, isOrganic } = this.calculateOrganicBalance(aggregatedItem);
    
    if (!maxLimit || !isOrganic) {
      return 'text-muted';
    }

    const usedPercentage = ((maxLimit - balance) / maxLimit) * 100;

    if (balance < 0) {
      return 'text-danger fw-bold'; // Rojo - Exceso
    } else if (usedPercentage >= 80) {
      return 'text-warning fw-bold'; // Amarillo - Advertencia (80%+)
    } else {
      return 'text-success'; // Verde - Normal
    }
  }

  /**
   * Obtiene el tooltip con información detallada
   */
  getOrganicBalanceTooltip(aggregatedItem: AggregatedStockItem): string {
    const { balance, maxLimit, isOrganic } = this.calculateOrganicBalance(aggregatedItem);
    
    if (!maxLimit) {
      return 'No se ha configurado límite de producción orgánica';
    }

    if (!isOrganic) {
      return `Límite configurado: ${maxLimit} qq. No hay producción orgánica registrada para este producto.`;
    }

    const used = maxLimit - balance;
    const percentage = (used / maxLimit) * 100;

    if (balance < 0) {
      return `⚠️ ALERTA: Producción orgánica excede el límite por ${Math.abs(balance).toFixed(2)} qq. ` +
             `Límite: ${maxLimit} qq, Usado: ${used.toFixed(2)} qq (${percentage.toFixed(1)}%)`;
    } else if (percentage >= 80) {
      return `⚠️ ADVERTENCIA: Cerca del límite de producción orgánica. ` +
             `Usado: ${used.toFixed(2)} qq de ${maxLimit} qq (${percentage.toFixed(1)}%)`;
    } else {
      return `Disponible: ${balance.toFixed(2)} qq de ${maxLimit} qq (${(100 - percentage).toFixed(1)}% restante)`;
    }
  }

  /**
   * Formats deductions summary for display
   */
  getDeductionsSummary(order: ApiStockOrder): string {
    const deductions: string[] = [];
    const unit = order.measureUnitType?.label || '';

    const gross = Number(order.totalGrossQuantity ?? order.totalQuantity ?? 0);
    let currentWeight = gross;

    // Tare deduction
    if (order.tare && Number(order.tare) > 0) {
      deductions.push(`Tara: -${Number(order.tare).toFixed(2)} ${unit}`);
      currentWeight -= Number(order.tare);
    }

    // Damaged weight deduction
    if (order.damagedWeightDeduction && Number(order.damagedWeightDeduction) > 0) {
      deductions.push(`Peso: -${Number(order.damagedWeightDeduction).toFixed(2)} ${unit}`);
      currentWeight -= Number(order.damagedWeightDeduction);
    }

    // Moisture percentage deduction
    if (order.moisturePercentage && Number(order.moisturePercentage) > 0) {
      const baseWeight = Math.max(0, currentWeight);
      const netAfterMoisture = baseWeight * (Number(order.moisturePercentage) / 100);
      const moistureDeduction = baseWeight - netAfterMoisture;
      
      if (moistureDeduction > 0) {
        deductions.push(`Humedad (${Number(order.moisturePercentage).toFixed(0)}%): -${moistureDeduction.toFixed(2)} ${unit}`);
      }
    }

    return deductions.length > 0 ? deductions.join(' | ') : '-';
  }
}
