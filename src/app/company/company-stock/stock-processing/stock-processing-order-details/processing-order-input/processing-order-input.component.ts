import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { faCut, faLeaf, faQrcode, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FormArray, FormControl } from '@angular/forms';
import { ApiFacility } from '../../../../../../api/model/apiFacility';
import { CompanyFacilitiesForStockUnitProductService } from '../../../../../shared-services/company-facilities-for-stock-unit-product.service';
import { AvailableSellingFacilitiesForCompany } from '../../../../../shared-services/available-selling-facilities-for.company';
import { ProcessingActionType } from '../../../../../../shared/types';
import { GetAvailableStockForStockUnitInFacility, StockOrderControllerService } from '../../../../../../api/api/stockOrderController.service';
import { dateISOString } from '../../../../../../shared/utils';
import { debounceTime, map, take } from 'rxjs/operators';
import { ApiStockOrder } from '../../../../../../api/model/apiStockOrder';
import { ApiProcessingAction } from '../../../../../../api/model/apiProcessingAction';
import { ApiStockOrderSelectable } from '../stock-processing-order-details.model';
import { GenerateQRCodeModalComponent } from '../../../../../components/generate-qr-code-modal/generate-qr-code-modal.component';
import { ClipInputTransactionModalComponent } from './clip-input-transaction-modal/clip-input-transaction-modal.component';
import { ClipInputTransactionModalResult } from './clip-input-transaction-modal/model';
import { Subscription } from 'rxjs';
import { NgbModalImproved } from '../../../../../core/ngb-modal-improved/ngb-modal-improved.service';
import ApiTransactionStatus = ApiTransaction.StatusEnum;
import { ApiTransaction } from '../../../../../../api/model/apiTransaction';
import { ApiSemiProduct } from '../../../../../../api/model/apiSemiProduct';
import { ApiFinalProduct } from '../../../../../../api/model/apiFinalProduct';
import StatusEnum = ApiTransaction.StatusEnum;
import OrderTypeEnum = ApiStockOrder.OrderTypeEnum;
import { ApiUserCustomer } from '../../../../../../api/model/apiUserCustomer';
import { formatUserCustomerDisplayName } from '../../../../../../shared/utils';

@Component({
  selector: 'app-processing-order-input',
  templateUrl: './processing-order-input.component.html',
  styleUrls: ['./processing-order-input.component.scss', '../stock-processing-order-details-common.scss']
})
export class ProcessingOrderInputComponent implements OnInit, OnDestroy {

  // FontAwesome icons
  readonly faTimes = faTimes;
  readonly faQrcode = faQrcode;
  readonly faCut = faCut;
  readonly faLeaf = faLeaf;
  selectedInputFacility: ApiFacility = null;

  // Input stock orders filter controls
  dateFromFilterControl = new FormControl(null);
  dateToFilterControl = new FormControl(null);
  internalLotNameSearchControl = new FormControl(null);
  organicOnlyFilterControl = new FormControl(null);

  // Input stock orders properties and controls
  organicOnlyInputStockOrders = false;
  cbSelectAllControl = new FormControl(false);

  // Input stock orders properties and controls
  availableInputStockOrders: ApiStockOrderSelectable[] = [];
  selectedInputStockOrders: ApiStockOrderSelectable[] = [];

  // List for holding references to observable subscriptions
  subscriptions: Subscription[] = [];

  @Input()
  processingUserId: number;

  @Input()
  editing: boolean;

  @Input()
  submitted: boolean;

  @Input()
  companyId: number;

  @Input()
  selectedProcAction: ApiProcessingAction;

  @Input()
  inputFacilitiesCodebook: CompanyFacilitiesForStockUnitProductService | AvailableSellingFacilitiesForCompany;

  @Input()
  inputFacilityControl: FormControl;

  @Input()
  inspectionTimeControl: FormControl;

  @Input()
  totalInputQuantityControl: FormControl;

  @Input()
  currentInputStockUnit: ApiSemiProduct | ApiFinalProduct;

  @Input()
  remainingQuantityControl: FormControl;

  @Input()
  targetStockOrdersArray: FormArray;

  @Input()
  inputTransactionsArray: FormArray;

  @Input()
  inputTransactions: ApiTransaction[];

  @Input()
  totalOutputQuantity: number;

  @Output()
  calcRemainingQuantity = new EventEmitter<void>();

  // Notify parent when the selection of input stock orders changes
  @Output()
  selectedInputsChanged = new EventEmitter<ApiStockOrderSelectable[]>();

  constructor(
    private stockOrderController: StockOrderControllerService,
    private modalService: NgbModalImproved,
    private cdr: ChangeDetectorRef
  ) { }

  get actionType(): ProcessingActionType {
    return this.selectedProcAction ? this.selectedProcAction.type : null;
  }

  get organicOnlyStatusValue() {
    if (this.organicOnlyFilterControl.value != null) {
      if (this.organicOnlyFilterControl.value) {
        return $localize`:@@productLabelStockProcessingOrderDetail.organicOnlyStatus.organicProduct:Organic`; 
      } else {
        return $localize`:@@productLabelStockProcessingOrderDetail.organicOnlyStatus.nonOrganicProduct:Non-organic`;
      }
    }
  }

  formatUserCustomer(user: ApiUserCustomer | null | undefined): string {
    return formatUserCustomerDisplayName(user ?? null);
  }

  get leftSideEnabled() {
    const facility = this.inputFacilityControl.value as ApiFacility;
    if (!facility) { return true; }
    if (!this.editing) { return true; }
    return this.companyId === facility.company?.id;
  }

  get hideAvailableStock() {
    const facility = this.inputFacilityControl.value as ApiFacility;
    if (!facility) {
      return true;
    }
    
    // 🦐 For classification facilities, always show available stock regardless of company ownership
    if (facility.isClassificationProcess) {
      return false;
    }
    
    // For other facilities, only show stock if facility belongs to current company
    return facility.company?.id !== this.companyId;
  }

  get oneInputStockOrderRequired() {

    if (this.actionType === 'SHIPMENT') { return false; }

    const existingInputTRCount = this.inputTransactions ? this.inputTransactions.length : 0;
    const selectedInputSOCount = this.selectedInputStockOrders ? this.selectedInputStockOrders.length : 0;

    return existingInputTRCount + selectedInputSOCount === 0;
  }

  ngOnInit(): void {

    // Register value change listeners for input controls
    this.registerInternalLotSearchValueChangeListener();
    this.registerInputFacilityValueChangeListener();
  }

  ngOnDestroy(): void {

    this.clearInputPropsAndControls();

    // Do not clear inputFacilityControl here: it is owned and managed by the parent
    // component (StockProcessingOrderDetailsComponent). Clearing it on destroy would
    // reset the selected facility when the layout toggles (e.g. when switching to
    // classification mode), even though the parent still holds a valid selection.
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  async setOrganicOnlyStatus(organicOnly: boolean) {
    if (!this.leftSideEnabled) {
      return;
    }

    this.organicOnlyFilterControl.setValue(organicOnly);
    if (this.selectedInputFacility) {
      this.dateSearch().then();
    }
  }

  async dateSearch() {

    if (!this.leftSideEnabled) { return; }
    if (!this.selectedInputFacility) { return; }

    const from = this.dateFromFilterControl.value;
    const to = this.dateToFilterControl.value;

    // Check if this is a classification facility:
    // 1. By the explicit flag isClassificationProcess
    // 2. By facility name containing "Clasificad" (fallback for when flag is not populated)
    const isClassificationFacility = this.selectedInputFacility.isClassificationProcess === true
      || (this.selectedInputFacility.name?.toLowerCase().includes('clasificad') ?? false);

    // Prepare initial request params
    const requestParams: GetAvailableStockForStockUnitInFacility.PartialParamMap = {
      limit: 500,
      offset: 0,
      facilityId: this.selectedInputFacility.id,
      organicOnly: this.organicOnlyFilterControl.value,
      internalLotName: this.internalLotNameSearchControl.value
    };

    // For classification facilities, do NOT restrict by semi/final product so that
    // all balances present in the classification area are visible.
    if (!isClassificationFacility) {
      requestParams.semiProductId = this.selectedProcAction.inputSemiProduct?.id;
      requestParams.finalProductId = this.selectedProcAction.inputFinalProduct?.id;
    }

    // Prepare date filters
    if (from && to) {
      requestParams.productionDateStart = dateISOString(from);
      requestParams.productionDateEnd = dateISOString(to);
    } else if (from) {
      requestParams.productionDateStart = dateISOString(from);
    } else if (to) {
      requestParams.productionDateEnd = dateISOString(to);
    }

    // Get the available stock in the provided facility for the provided semi-product
    this.availableInputStockOrders = await this.fetchAvailableStockOrders(requestParams);

    // Reinitialize selections
    const tmpSelected = [];
    for (const item of this.availableInputStockOrders) {
      for (const selected of this.selectedInputStockOrders) {
        if (selected.id === item.id) {
          tmpSelected.push(item);
          item.selected = true;
          item.selectedQuantity = selected.availableQuantity;
        }
      }
    }
    this.selectedInputStockOrders = tmpSelected;
    this.calcInputQuantity(true);
  }

  private registerInternalLotSearchValueChangeListener() {
    this.subscriptions.push(
      this.internalLotNameSearchControl.valueChanges
        .pipe(debounceTime(350))
        .subscribe(() => this.dateSearch())
    );
  }

  private registerInputFacilityValueChangeListener() {
    this.subscriptions.push(
      this.inputFacilityControl.valueChanges.subscribe((facility: ApiFacility) => {

        // If we are creating new Quote order, set the quoteFacility when input facility is selected
        if (!this.editing && this.actionType === 'SHIPMENT' && this.targetStockOrdersArray?.length > 0) {
          this.targetStockOrdersArray.at(0).get('quoteFacility').setValue(facility);
        }
      })
    );
  }

  private async fetchAvailableStockOrders(params: GetAvailableStockForStockUnitInFacility.PartialParamMap): Promise<ApiStockOrder[]> {

    // Final product is defined for 'FINAL_PROCESSING' and Quote or Transfer for a final product
    const finalProduct = this.selectedProcAction.outputFinalProduct;

    return this.stockOrderController
      .getAvailableStockForStockUnitInFacilityByMap(params)
      .pipe(
        take(1),
        map(res => {
          if (res && res.status === 'OK' && res.data) {

            // If we are editing existing order, filter the stock orders that are already present in the proc. order
            if (this.editing) {
              const availableStockOrders = res.data.items;
              this.targetStockOrdersArray.value.forEach(tso => {
                const soIndex = availableStockOrders.findIndex(aso => aso.id === tso.id);
                if (soIndex !== -1) {
                  availableStockOrders.splice(soIndex, 1);
                }
              });

              return availableStockOrders;
            }

            return res.data.items;
          } else {
            return [];
          }
        }),
        map(availableStockOrders => {

          let filtered = availableStockOrders;

          // If generating QR code, filter all the stock orders that have already generated QR code tag
          if (this.selectedProcAction.type === 'GENERATE_QR_CODE') {
            filtered = availableStockOrders.filter(apiStockOrder => !apiStockOrder.qrCodeTag);
          } else if (finalProduct) {

            // If final product action (final processing of Quote or Transfer order for a final product)
            // filter the stock orders that have QR code tag for different final products than the selected one (from the Proc. action)
            filtered = availableStockOrders.filter(apiStockOrder => !apiStockOrder.qrCodeTag || apiStockOrder.qrCodeTagFinalProduct.id === finalProduct.id);
          }

          // 🦐 All available stock orders are shown without special laboratory filtering
          // The isLaboratory flag is no longer used for filtering inputs
          return filtered;
        })
      )
      .toPromise();
  }

  async setInputFacility(facility: ApiFacility) {

    this.clearInputPropsAndControls();

    if (facility) {
      this.selectedInputFacility = facility;

      // Check if this is a classification facility:
      // 1. By the explicit flag isClassificationProcess
      // 2. By facility name containing "Clasificad" (fallback for when flag is not populated)
      const isClassificationFacility = facility.isClassificationProcess === true
        || (facility.name?.toLowerCase().includes('clasificad') ?? false);

      console.log('[setInputFacility] facility:', facility.name);
      console.log('isClassificationProcess:', facility.isClassificationProcess);
      console.log('detected as classification:', isClassificationFacility);

      const requestParams: GetAvailableStockForStockUnitInFacility.PartialParamMap = {
        limit: 500,
        offset: 0,
        facilityId: facility.id
      };

      // For classification facilities, load all available stock in the area,
      // regardless of semi/final product. For other facilities, keep the
      // existing filters by input semi/final product of the processing action.
      if (!isClassificationFacility) {
        requestParams.semiProductId = this.selectedProcAction.inputSemiProduct?.id;
        requestParams.finalProductId = this.selectedProcAction.inputFinalProduct?.id;
      }

      console.log('[setInputFacility] requestParams:', requestParams);
      this.availableInputStockOrders = await this.fetchAvailableStockOrders(requestParams);
      console.log('[setInputFacility] availableInputStockOrders count:', this.availableInputStockOrders?.length, 'hideAvailableStock:', this.hideAvailableStock);

      // Force change detection to ensure the view updates with the new data
      this.cdr.detectChanges();
    } else {
      this.clearInputFacility();
    }
  }

  cbSelectAllClick() {

    if (!this.leftSideEnabled) { return; }
    if (this.hideAvailableStock) { return; }

    if (this.cbSelectAllControl.value) {

      this.selectedInputStockOrders = [];
      for (const item of this.availableInputStockOrders) {
        this.selectedInputStockOrders.push(item);
      }

      this.availableInputStockOrders.map(item => { item.selected = true; item.selectedQuantity = item.availableQuantity; return item; });

      if (this.actionType === 'SHIPMENT') {
        this.clipInputQuantity();
      }

    } else {

      this.selectedInputStockOrders = [];
      this.availableInputStockOrders.map(item => { item.selected = false; item.selectedQuantity = 0; return item; });
    }

    this.calcInputQuantity(true);
    this.setOrganicAndWomenOnly();
    this.emitSelectedInputsChangedWithWeekNumbers();
  }

  cbSelectClick(stockOrder: ApiStockOrderSelectable, index: number) {

    if (!this.leftSideEnabled) { return; }

    if (this.cbSelectAllControl.value) {
      this.cbSelectAllControl.setValue(false);
    }

    if (!this.availableInputStockOrders[index].selected) {

      const outputQuantity = this.totalOutputQuantity as number || 0;
      const inputQuantity = this.calcInputQuantity(false);

      const toFill = Number((outputQuantity - inputQuantity).toFixed(2));

      const currentAvailable = this.availableInputStockOrders[index].availableQuantity;

      if (this.actionType === 'SHIPMENT') {

        // In case of 'SHIPMENT' we always clip the input quantity
        if (toFill > 0 && currentAvailable > 0) {
          this.availableInputStockOrders[index].selected = true;
          this.availableInputStockOrders[index].selectedQuantity = toFill < currentAvailable ? toFill : currentAvailable;
        } else {

          // We have to set first to true due tu change detection in checkbox component
          this.availableInputStockOrders[index].selected = true;
          this.availableInputStockOrders[index].selectedQuantity = 0;
          setTimeout(() => this.availableInputStockOrders[index].selected = false);
        }
      } else {
        this.availableInputStockOrders[index].selected = true;
        this.availableInputStockOrders[index].selectedQuantity = currentAvailable;
      }
    } else {
      this.availableInputStockOrders[index].selected = false;
      this.availableInputStockOrders[index].selectedQuantity = 0;
    }

    this.selectInputStockOrder(stockOrder);
  }

  openInputStockOrderQRCode(order: ApiStockOrder) {

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

  async clipInputTransaction(item: ApiStockOrderSelectable, index: number) {

    if (!this.leftSideEnabled) { return; }

    const modalRef = this.modalService.open(ClipInputTransactionModalComponent, { centered: true, keyboard: false, backdrop: 'static' });
    Object.assign(modalRef.componentInstance, {
      stockOrder: item,
      currentSelectedQuantity: this.availableInputStockOrders[index].selectedQuantity
    });

    const result: ClipInputTransactionModalResult = await modalRef.result;
    if (!result) {
      return;
    }

    if (result.selectedQuantity > 0) {

      // If this transaction was not selected, trigger selection
      if (!this.availableInputStockOrders[index].selected) {
        this.selectInputStockOrder(item);
      }

      this.availableInputStockOrders[index].selected = true;
      this.availableInputStockOrders[index].selectedQuantity = result.selectedQuantity;
    } else {

      // If this transaction was selected, trigger unselect
      if (this.availableInputStockOrders[index].selected) {
        this.selectInputStockOrder(item);
      }

      this.availableInputStockOrders[index].selected = false;
      this.availableInputStockOrders[index].selectedQuantity = 0;
    }

    this.calcInputQuantity(true);
  }

  deleteTransaction(i: number) {

    if (!this.leftSideEnabled) { return; }

    switch (this.actionType) {
      case 'PROCESSING':
      case 'FINAL_PROCESSING':
      case 'GENERATE_QR_CODE':
      case 'SHIPMENT':
        this.inputTransactionsArray.removeAt(i);
        this.calcInputQuantity(true);
        break;
      case 'TRANSFER':
        this.inputTransactionsArray.removeAt(i);
        this.targetStockOrdersArray.removeAt(i);
        this.calcInputQuantity(true);
    }
  }

  private selectInputStockOrder(stockOrder: ApiStockOrderSelectable) {

    const index = this.selectedInputStockOrders.indexOf(stockOrder);
    if (index !== -1) {
      this.selectedInputStockOrders.splice(index, 1);
    } else {
      this.selectedInputStockOrders.push(stockOrder);
    }

    this.calcInputQuantity(true);
    this.setOrganicAndWomenOnly();
    this.emitSelectedInputsChangedWithWeekNumbers();
  }

  private setOrganicAndWomenOnly() {

    let countOrganic = 0;
    const allSelected = this.selectedInputStockOrders.length;
    for (const item of this.selectedInputStockOrders) {
      if (item.organic) {
        countOrganic++;
      }
    }

    this.organicOnlyInputStockOrders = countOrganic === allSelected && allSelected > 0;
  }

  private async emitSelectedInputsChangedWithWeekNumbers() {
    const fetches: Promise<any>[] = [];
    for (const so of this.selectedInputStockOrders) {
      const id = (so as any)?.id;
      if (id && so.weekNumber == null) {
        const p = this.stockOrderController.getStockOrder(id, true)
          .pipe(take(1))
          .toPromise()
          .then(res => {
            if (res && res.status === 'OK' && res.data) {
              if (res.data.weekNumber != null) {
                so.weekNumber = res.data.weekNumber;
              } else {
                const txs = (res.data as any)?.processingOrder?.inputTransactions as any[] | undefined;
                if (txs && txs.length) {
                  for (const tx of txs) {
                    const wn = tx?.sourceStockOrder?.weekNumber;
                    if (wn != null) { so.weekNumber = wn; break; }
                  }
                }
              }
            }
          })
          .catch(() => {});
        fetches.push(p);
      }
    }
    if (fetches.length) {
      await Promise.all(fetches);
    }
    this.selectedInputsChanged.emit(this.selectedInputStockOrders);
  }

  private clipInputQuantity() {

    const outputQuantity = this.totalOutputQuantity;
    let tmpQuantity = 0;

    for (const tx of this.inputTransactions) {
      tmpQuantity += tx.outputQuantity;
    }

    for (const item of this.availableInputStockOrders) {

      if (!item.selected) { continue; }

      if (tmpQuantity + item.availableQuantity <= outputQuantity) {
        tmpQuantity += item.availableQuantity;
        item.selectedQuantity = item.availableQuantity;
        continue;
      }

      if (tmpQuantity >= outputQuantity) {
        item.selected = false;
        item.selectedQuantity = 0;
        continue;
      }

      item.selectedQuantity = Number((outputQuantity - tmpQuantity).toFixed(2));
      tmpQuantity = outputQuantity;
    }

    // Filter all selected Stock orders that are no longer selected (after clipping)
    this.selectedInputStockOrders = this.selectedInputStockOrders.filter(so => so.selected);
  }

  clearInputPropsAndControls() {

    this.dateFromFilterControl.setValue(null);
    this.dateToFilterControl.setValue(null);
    this.internalLotNameSearchControl.setValue(null, { emitEvent: false });

    this.organicOnlyFilterControl.setValue(null);

    this.availableInputStockOrders = [];
    this.selectedInputStockOrders = [];
    this.cbSelectAllControl.setValue(false);

    this.organicOnlyInputStockOrders = false;

    this.totalInputQuantityControl.reset();
    this.remainingQuantityControl.reset();
  }

  clearInputFacility() {
    this.selectedInputFacility = null;
    this.inputFacilityControl.setValue(null);
  }

  calcInputQuantity(setValue: boolean) {

    let inputQuantity = 0;
    if (this.editing) {
      for (const item of this.availableInputStockOrders) {
        inputQuantity += item.selectedQuantity ? item.selectedQuantity : 0;
      }

      const txs = this.inputTransactions;

      if (txs) {
        for (const tx of txs) {
          if (tx.status !== ApiTransactionStatus.CANCELED) {
            inputQuantity += tx.outputQuantity;
          }
        }
      }
    } else {
      for (const item of this.availableInputStockOrders) {
        inputQuantity += item.selectedQuantity ? item.selectedQuantity : 0;
      }
    }

    // Set total input quantity value
    if (setValue) {

      if (inputQuantity) {
        switch (this.actionType) {
          case 'GENERATE_QR_CODE':
            // If generating QR code, the output is always the same with the input
            this.totalInputQuantityControl.setValue(Number(inputQuantity).toFixed(2));
            this.targetStockOrdersArray.at(0).get('totalQuantity').setValue(Number(inputQuantity).toFixed(2));
            break;
          default:
            this.totalInputQuantityControl.setValue(Number(inputQuantity).toFixed(2));
        }
      } else {
        this.totalInputQuantityControl.reset();
      }

      // Also update the remaining quantity
      this.calcRemainingQuantity.emit();
    }

    return inputQuantity;
  }

  prepInputTransactionsFromStockOrders(): ApiTransaction[] {

    const inputTransactions: ApiTransaction[] = [];

    // Common computed properties used in every transaction
    const isProcessing = this.actionType === 'PROCESSING' || this.actionType === 'FINAL_PROCESSING' || this.actionType === 'GENERATE_QR_CODE';
    const status: ApiTransaction.StatusEnum = this.actionType === 'SHIPMENT' ? StatusEnum.PENDING : StatusEnum.EXECUTED;

    for (const stockOrder of this.selectedInputStockOrders) {

      // Create transaction for current stock order from the list of selected stock orders
      const transaction: ApiTransaction = {
        isProcessing,
        company: { id: this.companyId },
        initiationUserId: this.processingUserId,
        sourceStockOrder: stockOrder,
        status,
        inputQuantity: stockOrder.selectedQuantity,
        outputQuantity: stockOrder.selectedQuantity
      };

      inputTransactions.push(transaction);
    }

    return inputTransactions;
  }

  prepareTransferTargetStockOrders(sourceStockOrder: ApiStockOrder): ApiStockOrder[] {

    const targetStockOrders: ApiStockOrder[] = [];

    for (const [index, selectedStockOrder] of this.selectedInputStockOrders.entries()) {
      // 🦐 Usar internalLotNumber si existe, sino usar identifier como fallback (para entregas iniciales)
      const baseLotNumber = sourceStockOrder.internalLotNumber || selectedStockOrder.identifier || selectedStockOrder.id?.toString() || '';
      const newStockOrder: ApiStockOrder = {
        facility: sourceStockOrder.facility,
        semiProduct: selectedStockOrder.semiProduct,
        finalProduct: selectedStockOrder.finalProduct,
        internalLotNumber: this.selectedInputStockOrders.length > 1 ? `${baseLotNumber}/${index + 1}` : baseLotNumber,
        weekNumber: selectedStockOrder.weekNumber ?? sourceStockOrder.weekNumber,
        // 🦐 Traceability: always inherit shrimp-specific custody fields when transferring
        numberOfGavetas: selectedStockOrder.numberOfGavetas ?? sourceStockOrder.numberOfGavetas,
        numberOfBines: selectedStockOrder.numberOfBines ?? sourceStockOrder.numberOfBines,
        numberOfPiscinas: selectedStockOrder.numberOfPiscinas ?? sourceStockOrder.numberOfPiscinas,
        guiaRemisionNumber: selectedStockOrder.guiaRemisionNumber ?? sourceStockOrder.guiaRemisionNumber,
        creatorId: this.processingUserId,
        productionDate: selectedStockOrder.productionDate ? selectedStockOrder.productionDate : (dateISOString(new Date()) as any),
        orderType: OrderTypeEnum.TRANSFERORDER,
        totalQuantity: selectedStockOrder.availableQuantity
      };

      // Propagate laboratory analysis fields and classification fields from the temporary output form
      // so they are preserved in TRANSFER-type processing actions.
      const labSource: any = sourceStockOrder as any;
      const labTarget: any = newStockOrder as any;
      [
        'sensorialRawOdor',
        'sensorialRawTaste',
        'sensorialRawColor',
        'sensorialCookedOdor',
        'sensorialCookedTaste',
        'sensorialCookedColor',
        'qualityNotes',
        'metabisulfiteLevelAcceptable',
        'approvedForPurchase',
        'qualityDocument',
        // Classification fields
        'classificationStartTime',
        'classificationEndTime',
        'productionOrder',
        'freezingType',
        'machine',
        'brandHeader',
        'classificationDetails'
      ].forEach(fieldName => {
        if (labSource[fieldName] !== undefined) {
          labTarget[fieldName] = labSource[fieldName];
        }
      });

      // Set the temporary object that holds the processing evidence fields
      newStockOrder['requiredProcEvidenceFieldGroup'] = sourceStockOrder['requiredProcEvidenceFieldGroup'];

      targetStockOrders.push(newStockOrder);
    }

    return targetStockOrders;
  }

}
