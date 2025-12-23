import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { GenericEditableItemComponent } from '../../../../../shared/generic-editable-item/generic-editable-item.component';
import { ApiStockOrder } from '../../../../../../api/model/apiStockOrder';
import { GlobalEventManagerService } from '../../../../../core/global-event-manager.service';
import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { FormGroup } from '@angular/forms';
import { generateFormFromMetadata } from '../../../../../../shared/utils';
import { ApiProcessingOrderValidationScheme, ApiStockOrderValidationScheme } from './validation';
import { CompanyFinalProductQuoteOrderActionsService } from '../../../../../shared-services/company-final-product-quote-order-actions.service';
import { ProcessingActionControllerService } from '../../../../../../api/api/processingActionController.service';
import { AvailableSellingFacilitiesForCompany } from '../../../../../shared-services/available-selling-facilities-for.company';
import { FacilityControllerService } from '../../../../../../api/api/facilityController.service';
import { ApiProcessingAction } from '../../../../../../api/model/apiProcessingAction';
import { ApiMeasureUnitType } from '../../../../../../api/model/apiMeasureUnitType';
import { ApiProcessingOrder } from '../../../../../../api/model/apiProcessingOrder';
import { ApiFacility } from '../../../../../../api/model/apiFacility';
import { map, startWith } from 'rxjs/operators';
import { CurrencyCodesService } from '../../../../../shared-services/currency-codes.service';
import { ChainFieldConfigService } from '../../../../../shared-services/chain-field-config.service';
import { Observable } from 'rxjs';

declare const $localize: (messageParts: TemplateStringsArray, ...placeholders: any[]) => string;

@Component({
  selector: 'app-customer-order-item',
  templateUrl: './customer-order-item.component.html',
  styleUrls: ['./customer-order-item.component.scss']
})
export class CustomerOrderItemComponent extends GenericEditableItemComponent<ApiStockOrder> implements OnInit, OnDestroy {

  @Input()
  disableDelete = false;

  @Input()
  set globalOrderId(value: string) {
    this.globalOrderIdLocal = value;
    if (value) {
      this.globalOrderId$.next(value);
    } else {
      this.globalOrderId$.next('-');
    }
  }

  get globalOrderId(): string {
    return this.globalOrderIdLocal;
  }

  @Input()
  set companyId(value: number) {
    this.companyIdLocal = value;
  }

  get companyId(): number | null {
    return this.companyIdLocal;
  }

  @Input()
  outputFacility!: ApiFacility;

  globalOrderIdLocal = '-';

  companyIdLocal: number | null = null;

  globalOrderId$ = new BehaviorSubject<string>('-');

  codebookOrderingProcessingActions!: CompanyFinalProductQuoteOrderActionsService;

  inputFacilitiesCodebook: AvailableSellingFacilitiesForCompany | null = null;

  internalLotSubs!: Subscription;

  // Observables para visibilidad de campos
  showPriceFields$: Observable<boolean>;

  constructor(
    protected globalEventsManager: GlobalEventManagerService,
    private processingActionController: ProcessingActionControllerService,
    private facilityController: FacilityControllerService,
    public currencyCodesService: CurrencyCodesService,
    public fieldConfig: ChainFieldConfigService  // 🎯 Servicio de configuración
  ) {
    super(globalEventsManager);
    
    // Inicializar observables de visibilidad
    this.showPriceFields$ = this.fieldConfig.isFieldVisible$('customerOrder', 'currencyForEndCustomer');
  }

  get name() {

    if (this.contentObject) {

      const stockOrder = this.contentObject as ApiStockOrder;

      if (!stockOrder.processingOrder?.processingAction) {
        return null;
      }

      const procAction = stockOrder.processingOrder.processingAction;
      const inputProduct = procAction.inputFinalProduct;

      if (!inputProduct) {
        return null;
      }

      let res = `${ inputProduct.name }: ${ stockOrder.totalQuantity ?? 0 } ${ inputProduct.measurementUnitType?.label ?? '' }`;

      if (stockOrder.pricePerUnitForEndCustomer) {
        res += `, ${ stockOrder.pricePerUnitForEndCustomer } ${stockOrder.currencyForEndCustomer ?? ''}/per ${ inputProduct.measurementUnitType?.label ?? '' }`;
      }

      const kgFactor = (inputProduct.measurementUnitType as ApiMeasureUnitType | undefined)?.weight;

      if (kgFactor && stockOrder.totalQuantity) {
        res += ` (${ stockOrder.totalQuantity * kgFactor } kg)`;
      }

      return res;
    }

    return '';
  }

  private get processingAction(): ApiProcessingAction | null {
    const control = this.form?.get('processingOrder.processingAction');
    if (control) {
      return control.value as ApiProcessingAction;
    }
    return null;
  }

  private get measurementUnit(): string | null {
    const prAction = this.processingAction;
    const unitType = prAction?.outputFinalProduct?.measurementUnitType as ApiMeasureUnitType | undefined;
    return unitType?.label ?? null;
  }

  get outputQuantityLabel() {
    if (this.measurementUnit) {
      return $localize`:@@stockOrderItem.textinput.quantityLabelWithUnits.label:Quantity in` + ' ' + this.measurementUnit;
    }
    return $localize`:@@stockOrderItem.textinput.quantity.label:Quantity`;
  }

  get selectedCurrency() {
    const control = this.form?.get('currencyForEndCustomer');
    return control ? control.value : null;
  }

  get selectedCurrencyLabel() {
    return this.selectedCurrency ? this.selectedCurrency : '-';
  }

  get pricePerUnitLabel() {
    return $localize`:@@stockOrderItem.textinput.pricePerUnitForEndCustomer.label:Gross price per item at end customer` + ` (${this.selectedCurrencyLabel})`;
  }

  get pricePerUnitPlaceholder() {
    return $localize`:@@stockOrderItem.textinput.pricePerUnitForEndCustomer.placeholder:Enter price in` + ` ${this.selectedCurrencyLabel}`;
  }

  ngOnInit(): void {

    super.ngOnInit();
    if (this.companyId) {
      this.codebookOrderingProcessingActions =
        new CompanyFinalProductQuoteOrderActionsService(this.processingActionController, this.companyId, this.outputFacility);
    }

    // Set the internal LOT number (name) automatically from the other fields
    const totalQuantityControl = this.form?.get('totalQuantity');
    const processingActionControl = this.form?.get('processingOrder.processingAction');
    const internalLotControl = this.form?.get('internalLotNumber');

    if (totalQuantityControl && processingActionControl && internalLotControl) {
      this.internalLotSubs = combineLatest([
        totalQuantityControl.valueChanges.pipe(startWith(0)),
        processingActionControl.valueChanges.pipe(startWith(null)),
        this.globalOrderId$
      ]).pipe(
        map(([totalQuantity, processingAction, globalOrderId]) => {
          if (totalQuantity && processingAction && globalOrderId) {
            return `${ globalOrderId } (${ processingAction.inputFinalProduct.name }, ${ totalQuantity } ${ processingAction.inputFinalProduct.measurementUnitType.label })`;
          }
          return '-';
        })
      ).subscribe(internalLotName => {
        internalLotControl.setValue(internalLotName);
        this.form.updateValueAndValidity();
      });
    }
  }

  ngOnDestroy(): void {
    if (this.internalLotSubs) {
      this.internalLotSubs.unsubscribe();
    }
  }

  public generateForm(value: any): FormGroup {

    const form = generateFormFromMetadata(ApiStockOrder.formMetadata(), value, ApiStockOrderValidationScheme);
    form.setControl('processingOrder', generateFormFromMetadata(ApiProcessingOrder.formMetadata(), {}, ApiProcessingOrderValidationScheme));
    
    // 🎯 Aplicar configuración de campos dinámica
    this.applyFieldConfiguration(form);
    
    form.updateValueAndValidity();

    return form;
  }

  /**
   * 🎯 Aplica configuración dinámica de campos según el tipo de producto
   */
  private applyFieldConfiguration(form: FormGroup): void {
    // Campos de precio (currency y pricePerUnit)
    const currencyConfig = this.fieldConfig.getFieldConfig('customerOrder', 'currencyForEndCustomer');
    const priceConfig = this.fieldConfig.getFieldConfig('customerOrder', 'pricePerUnitForEndCustomer');
    const currencyControl = form.get('currencyForEndCustomer');
    const priceControl = form.get('pricePerUnitForEndCustomer');

    // Ajustar validaciones dinámicamente
    if (currencyControl && !currencyConfig.required) {
      currencyControl.clearValidators();
      currencyControl.updateValueAndValidity();
    }

    if (priceControl && !priceConfig.required) {
      priceControl.clearValidators();
      priceControl.updateValueAndValidity();
    }
  }

  setProcessingAction(event: ApiProcessingAction) {
    if (event && this.companyId) {
      this.inputFacilitiesCodebook = new AvailableSellingFacilitiesForCompany(this.facilityController, this.companyId, undefined, event.inputFinalProduct.id);
    } else {
      this.inputFacilitiesCodebook = null;
    }
  }

}
