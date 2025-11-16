import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { AbstractControl, FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { ApiProcessingAction } from '../../../../../../api/model/apiProcessingAction';
import { ProcessingActionType } from '../../../../../../shared/types';
import { ApiFinalProduct } from '../../../../../../api/model/apiFinalProduct';
import { ApiProcessingActionOutputSemiProduct } from '../../../../../../api/model/apiProcessingActionOutputSemiProduct';
import { CompanyFacilitiesForStockUnitProductService } from '../../../../../shared-services/company-facilities-for-stock-unit-product.service';
import { ApiSemiProduct } from '../../../../../../api/model/apiSemiProduct';
import { ApiStockOrder } from '../../../../../../api/model/apiStockOrder';
import { dateISOString, generateFormFromMetadata } from '../../../../../../shared/utils';
import { ApiStockOrderValidationScheme } from '../validation';
import OrderTypeEnum = ApiStockOrder.OrderTypeEnum;
import { StockProcessingOrderDetailsHelper } from '../stock-processing-order-details.helper';
import { ApiStockOrderEvidenceFieldValue } from '../../../../../../api/model/apiStockOrderEvidenceFieldValue';
import { debounceTime, take } from 'rxjs/operators';
import ProcessingEvidenceField = ApiProcessingEvidenceField.TypeEnum;
import { ApiProcessingEvidenceField } from '../../../../../../api/model/apiProcessingEvidenceField';
import { Subscription } from 'rxjs';
import { StaticSemiProductsService } from '../static-semi-products.service';
import { ApiFacility } from '../../../../../../api/model/apiFacility';
import { ProcessingOutputProductStrategy } from './processing-output-product-strategy';

declare const $localize: any;

@Component({
  selector: 'app-processing-order-output',
  templateUrl: './processing-order-output.component.html',
  styleUrls: ['./processing-order-output.component.scss', '../stock-processing-order-details-common.scss']
})
export class ProcessingOrderOutputComponent implements OnInit, OnDestroy {

  readonly faTrashAlt = faTrashAlt;

  // List for holding references to observable subscriptions
  subscriptions: Subscription[] = [];

  @Input()
  editing!: boolean;

  @Input()
  submitted!: boolean;

  @Input()
  processingUserId!: number;

  @Input()
  productOrderId!: string | null;

  @Input()
  selectedProcAction!: ApiProcessingAction;

  @Input()
  procActionLotPrefixControl!: FormControl;

  @Input()
  rightSideEnabled!: boolean;

  @Input()
  targetStockOrdersArray!: FormArray;

  @Input()
  finalProductOutputFacilitiesCodebook!: CompanyFacilitiesForStockUnitProductService;

  @Input()
  semiProductOutputFacilitiesCodebooks!: Map<number, CompanyFacilitiesForStockUnitProductService>;

  @Input()
  currentOutputFinalProduct!: ApiFinalProduct;

  @Input()
  outputFinalProductNameControl!: FormControl;

  @Input()
  outputSemiProductsCodebook!: StaticSemiProductsService;

  @Input()
  selectedInputFacility: ApiFacility | null = null;

  @Output()
  calcTotalOutputQuantity = new EventEmitter<void>();

  @Output()
  calcRemainingQuantity = new EventEmitter<void>();

  @Output()
  newOutputAdded = new EventEmitter<void>();

  constructor(private productStrategy: ProcessingOutputProductStrategy) { }

  get actionType(): ProcessingActionType | null {
    return this.selectedProcAction ? this.selectedProcAction.type || null : null;
  }

  get targetStockOrderOutputQuantityLabel() {
    if (this.actionType === 'SHIPMENT') {
      return $localize`:@@productLabelStockProcessingOrderDetail.textinput.orderedQuantityLabelWithUnits.label: Ordered quantity in`;
    } else {
      return $localize`:@@productLabelStockProcessingOrderDetail.textinput.outputQuantityLabelWithUnits.label: Output quantity in`;
    }
  }

  get showAddNewOutputButton() {
    return this.actionType === 'PROCESSING';
  }

  /**
   * Check if the selected facility is a laboratory
   */
  isFacilityLaboratory(tsoGroup: AbstractControl): boolean {
    const facility = tsoGroup?.get('facility')?.value as ApiFacility;
    return facility?.isLaboratory === true;
  }

  /**
   * Check if we should show laboratory-specific fields
   * For SHRIMP product: show sensorial analysis and quality fields for ALL entries
   * (both laboratory and normal production entries)
   */
  shouldShowLaboratoryFields(tsoGroup: AbstractControl): boolean {
    return this.productStrategy.shouldShowLaboratorySection(tsoGroup, this.selectedInputFacility);
  }

  /**
   * Check if lot fields should be hidden
   * When input facility is laboratory, lot is assigned AFTER lab tests, not before
   */
  shouldHideLotFields(): boolean {
    return this.productStrategy.shouldHideLotFields(this.selectedInputFacility);
  }

  shouldShowOutputQuantity(): boolean {
    return this.productStrategy.shouldShowOutputQuantityField(this.actionType);
  }

  shouldShowFreezingSection(tsoGroup: AbstractControl): boolean {
    return this.productStrategy.shouldShowFreezingSection(tsoGroup, this.selectedInputFacility);
  }

  /**
   * Check if the selected input facility is a classification process facility
   * This determines whether to show the specialized classification form
   */
  isClassificationMode(): boolean {
    return this.productStrategy.isClassificationMode(this.selectedInputFacility);
  }

  getTSOGroupRepackedOutputsArray(tsoGroup: AbstractControl): FormArray {
    return tsoGroup.get('repackedOutputsArray') as FormArray;
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  removeOutput(index: number) {
    this.targetStockOrdersArray.removeAt(index);
    this.calcTotalOutputQuantity.emit();
    this.calcRemainingQuantity.emit();
  }

  private ensureLaboratoryControls(tsoGroup: FormGroup): void {
    this.productStrategy.ensureExtraControls(tsoGroup);
  }

  private updateLaboratoryFieldValidators(tsoGroup: FormGroup): void {
    this.productStrategy.updateValidators(tsoGroup, this.selectedInputFacility);
  }

  getOutputFacilityCodebook(tsoGroup: FormGroup): CompanyFacilitiesForStockUnitProductService | null {

    if (this.finalProductOutputFacilitiesCodebook) {
      return this.finalProductOutputFacilitiesCodebook;
    }

    const semiProduct = (tsoGroup.get('semiProduct' )?.value as ApiSemiProduct);
    if (semiProduct) {
      return this.semiProductOutputFacilitiesCodebooks?.get(semiProduct.id);
    }

    return null;
  }

  getRepackedSacQuantityLabel(tsoGroup: AbstractControl) {

    const outputFinalProduct = tsoGroup.get('finalProduct')?.value as ApiFinalProduct;
    const outputSemiProduct = tsoGroup.get('semiProduct')?.value as ApiProcessingActionOutputSemiProduct;

    let unit = '';
    if (outputFinalProduct) {
      unit = outputFinalProduct.measurementUnitType?.label;
    } else if (outputSemiProduct) {
      unit = outputSemiProduct.measurementUnitType?.label;
    }

    return $localize`:@@productLabelStockProcessingOrderDetail.itemNetWeightLabel: Quantity (max. ${ this.getTSOGroupRepackedMaxWeight(tsoGroup) } ${ unit })`;
  }

  getTSOGroupRepackedMaxWeight(tsoGroup: AbstractControl): number | null {

    const outputSemiProduct = tsoGroup.get('semiProduct')?.value as ApiProcessingActionOutputSemiProduct;
    let maxOutputWeight: number | null = null;

    if (this.selectedProcAction.repackedOutputFinalProducts) {
      maxOutputWeight = this.selectedProcAction.maxOutputWeight;
    } else if (outputSemiProduct?.repackedOutput) {
      maxOutputWeight = outputSemiProduct.maxOutputWeight;
    }

    return maxOutputWeight;
  }

  prefillRepackedOutputSOQuantities(tsoGroup: AbstractControl) {

    const repackedOutputsArray = this.getTSOGroupRepackedOutputsArray(tsoGroup);

    let availableQua = tsoGroup.get('totalQuantity')?.value;
    const maxAllowedWeight = this.getTSOGroupRepackedMaxWeight(tsoGroup);

    repackedOutputsArray.controls.some((outputStockOrderGroup: FormGroup) => {
      outputStockOrderGroup.get('totalQuantity').setValue(Number(availableQua > maxAllowedWeight ? maxAllowedWeight : availableQua).toFixed(2));
      availableQua -= maxAllowedWeight;
      if (availableQua <= 0) {
        return true;
      }
    });
  }

  addRepackedOutputStockOrder(tsoGroup: AbstractControl) {

    const repackedOutputsArray = this.getTSOGroupRepackedOutputsArray(tsoGroup);

    let sacNumber = null;
    if (repackedOutputsArray.length > 0) {
      const lastSacNumber = Number(repackedOutputsArray.controls[repackedOutputsArray.length - 1].get('sacNumber').value);
      if (lastSacNumber && lastSacNumber > 0) {
        sacNumber = lastSacNumber + 1;
      }
    }

    repackedOutputsArray.push(this.prepareRepackedSOFormGroup(sacNumber, tsoGroup));
  }

  removeRepackedOutputStockOrder(tsoGroup: AbstractControl, index: number) {
    this.getTSOGroupRepackedOutputsArray(tsoGroup).removeAt(index);
  }

  notAllOutputQuantityIsUsed(tsoGroup: AbstractControl) {

    const repackedOutputsArray = this.getTSOGroupRepackedOutputsArray(tsoGroup);

    if (!repackedOutputsArray && !this.selectedProcAction?.repackedOutputFinalProducts) {
      return false;
    }

    const enteredOutputQuantity = tsoGroup.get('totalQuantity')?.value;
    if (!enteredOutputQuantity) {
      return false;
    }

    let repackedSOQuantity = 0;
    repackedOutputsArray.controls.forEach((soGroup: FormGroup) => {
      repackedSOQuantity += soGroup.get('totalQuantity').value ? Number(soGroup.get('totalQuantity').value) : 0;
    });

    return Number(enteredOutputQuantity) > repackedSOQuantity;
  }

  private generateRepackedOutputStockOrders(totalOutputQuantity: number, tsoGroup: AbstractControl): void {

    const repackedOutputsArray = this.getTSOGroupRepackedOutputsArray(tsoGroup);

    // If we are updating a processing order, do not regenerate the output stock orders
    if (this.editing || !repackedOutputsArray) {
      return;
    }

    repackedOutputsArray.clear();

    const outputStockOrdersSize = Math.ceil(totalOutputQuantity / this.getTSOGroupRepackedMaxWeight(tsoGroup));
    for (let i = 0; i < outputStockOrdersSize; i++) {
      repackedOutputsArray.push(this.prepareRepackedSOFormGroup(i + 1, tsoGroup));
    }
  }

  private prepareRepackedSOFormGroup(sacNumber: number, tsoGroup: AbstractControl): FormGroup {

    return new FormGroup({
      id: new FormControl(null),
      totalQuantity: new FormControl(null, [Validators.required, Validators.max(this.getTSOGroupRepackedMaxWeight(tsoGroup))]),
      sacNumber: new FormControl(sacNumber, [Validators.required])
    });
  }

  async addNewOutput() {

    // If no processing action is selected, exit
    if (!this.selectedProcAction) {
      return;
    }

    // Validate if we can add new output
    switch (this.actionType) {
      case 'TRANSFER':
      case 'SHIPMENT':
      case 'GENERATE_QR_CODE':
      case 'FINAL_PROCESSING':
        // If we already have one target Stock order, exit
        if (this.targetStockOrdersArray.length > 0) {
          return;
        }
    }

    // Create a default Stock order with common shared values
    const defaultStockOrder: ApiStockOrder = {
      creatorId: this.processingUserId,
      orderType: this.actionType === 'SHIPMENT' ? OrderTypeEnum.GENERALORDER : OrderTypeEnum.PROCESSINGORDER,
      productionDate: dateISOString(new Date())
    };

    const targetStockOrderGroup = generateFormFromMetadata(ApiStockOrder.formMetadata(), defaultStockOrder, ApiStockOrderValidationScheme);
    this.targetStockOrdersArray.push(targetStockOrderGroup);

    this.setRequiredFieldsAndListenersForTSO(targetStockOrderGroup);

    // If we have defined output final product, set it the target Stock order form group
    if (this.currentOutputFinalProduct) {
      targetStockOrderGroup.get('finalProduct').setValue(this.currentOutputFinalProduct);

      // If there is only one facility available for the output final product, set it in the target Stock order form group
      const facilities = await this.finalProductOutputFacilitiesCodebook.getAllCandidates().toPromise();
      if (facilities?.length === 1) {
        targetStockOrderGroup.get('facility').setValue(facilities[0]);
      }

    } else if (this.selectedProcAction.outputSemiProducts?.length === 1) {

      // If we have output semi-products, and there is only one defined in the Processing action, set it automatically
      targetStockOrderGroup.get('semiProduct').setValue(this.selectedProcAction.outputSemiProducts[0]);
    }

    // Emit event to notify parent that a new output was added
    this.newOutputAdded.emit();
  }

  setRequiredFieldsAndListenersForTSO(tsoGroup: FormGroup) {

    // Set validators for specific fields depending on the Processing action type
    switch (this.actionType) {
      case 'PROCESSING':
        StockProcessingOrderDetailsHelper.setFormControlValidators(tsoGroup, 'totalQuantity', [Validators.required]);
      // tslint:disable-next-line:no-switch-case-fall-through
      case 'GENERATE_QR_CODE':
        StockProcessingOrderDetailsHelper.setFormControlValidators(tsoGroup, 'semiProduct', [Validators.required]);
        break;
      case 'SHIPMENT':
        StockProcessingOrderDetailsHelper.setFormControlValidators(tsoGroup, 'totalQuantity', [Validators.required]);
        StockProcessingOrderDetailsHelper.setFormControlValidators(tsoGroup, 'deliveryTime', [Validators.required]);
        StockProcessingOrderDetailsHelper.setFormControlValidators(tsoGroup, 'quoteFacility', [Validators.required]);
      // tslint:disable-next-line:no-switch-case-fall-through
      case 'TRANSFER':
        if (this.selectedProcAction.finalProductAction) {
          StockProcessingOrderDetailsHelper.setFormControlValidators(tsoGroup, 'finalProduct', [Validators.required]);
        } else {
          StockProcessingOrderDetailsHelper.setFormControlValidators(tsoGroup, 'semiProduct', [Validators.required]);
        }
        break;
    }

    StockProcessingOrderDetailsHelper.setFormControlValidators(tsoGroup, 'facility', [Validators.required]);

    // Clear the required fields form
    const requiredProcEvidenceFieldGroup = new FormGroup({});

    // Set required fields form group
    const evidenceFieldsValues: ApiStockOrderEvidenceFieldValue[] =
      tsoGroup.get('requiredEvidenceFieldValues')?.value ?
        tsoGroup.get('requiredEvidenceFieldValues').value : [];

    this.selectedProcAction.requiredEvidenceFields.forEach(field => {

      let value = null;
      const evidenceFieldValue = evidenceFieldsValues
        .find(efv => efv.evidenceFieldId === field.id && efv.evidenceFieldName === field.fieldName);

      if (evidenceFieldValue) {
        switch (field.type) {
          case ProcessingEvidenceField.NUMBER:
          case ProcessingEvidenceField.INTEGER:
          case ProcessingEvidenceField.EXCHANGERATE:
          case ProcessingEvidenceField.PRICE:
            value = evidenceFieldValue.numericValue;
            break;
          case ProcessingEvidenceField.DATE:
          case ProcessingEvidenceField.TIMESTAMP:
            value = evidenceFieldValue.dateValue;
            break;
          case ProcessingEvidenceField.STRING:
          case ProcessingEvidenceField.TEXT:
            value = evidenceFieldValue.stringValue;
            break;
          default:
            value = evidenceFieldValue.stringValue;
        }
      }

      if (field.mandatory) {
        requiredProcEvidenceFieldGroup.addControl(field.fieldName, new FormControl(value, Validators.required));
      } else {
        requiredProcEvidenceFieldGroup.addControl(field.fieldName, new FormControl(value));
      }
    });

    tsoGroup.setControl('requiredProcEvidenceFieldGroup', requiredProcEvidenceFieldGroup);

    this.ensureLaboratoryControls(tsoGroup);
    this.updateLaboratoryFieldValidators(tsoGroup);

    // Register value change listeners for specific fields
    const totalQuantityControl = tsoGroup.get('totalQuantity');
    if (totalQuantityControl) {
      this.subscriptions.push(totalQuantityControl.valueChanges
        .pipe(debounceTime(350))
        .subscribe((totalQuantity: number) => {
          setTimeout(() => this.targetStockOrderOutputQuantityChange());

          // When the total output quantity changes we need to re/generate the output stock orders that are
          // being repacked as part of this processing; This is only applicable when we have selected output semi-product
          // with the option 'repackedOutputs' and set 'maxOutputWeight'
          this.generateRepackedOutputStockOrders(totalQuantity, tsoGroup);
        }));
    }

    const finalProductControl = tsoGroup.get('finalProduct');
    if (finalProductControl) {
      this.subscriptions.push(finalProductControl.valueChanges
        .subscribe((value: ApiFinalProduct | null) => this.targetStockOrderFinalProductChange(value, tsoGroup)));
    }

    const semiProductControl = tsoGroup.get('semiProduct');
    if (semiProductControl) {
      this.subscriptions.push(semiProductControl.valueChanges
        .subscribe((value: ApiFinalProduct | null) => this.targetStockOrderSemiProductChange(value, tsoGroup)));
    }

    const facilityControl = tsoGroup.get('facility');
    if (facilityControl) {
      this.subscriptions.push(facilityControl.valueChanges
        .subscribe(() => this.updateLaboratoryFieldValidators(tsoGroup)));
    }

    // Set specific fields to default disabled state
    if (!this.editing && totalQuantityControl) {
      totalQuantityControl.disable({ emitEvent: false });
    }
  }

  private targetStockOrderOutputQuantityChange() {
    this.calcTotalOutputQuantity.emit();
    this.calcRemainingQuantity.emit();
  }

  private targetStockOrderFinalProductChange(finalProduct: ApiFinalProduct | null, targetStockOrderGroup: FormGroup) {

    // Remove repacked outputs form array
    targetStockOrderGroup.removeControl('repackedOutputsArray');

    if (finalProduct) {
      targetStockOrderGroup.get('measureUnitType').setValue(finalProduct.measurementUnitType);
      targetStockOrderGroup.get('totalQuantity').enable({ emitEvent: false });

      // If selected processing action has set the option to repack output final product, set the form array control
      if (this.selectedProcAction.repackedOutputFinalProducts) {
        targetStockOrderGroup.addControl('repackedOutputsArray', new FormArray([]));
      }

    } else {
      targetStockOrderGroup.get('measureUnitType').setValue(null);
      targetStockOrderGroup.get('totalQuantity').disable({ emitEvent: false });
    }
    targetStockOrderGroup.get('totalQuantity').setValue(null);
  }

  private targetStockOrderSemiProductChange(semiProduct: ApiProcessingActionOutputSemiProduct | null, targetStockOrderGroup: FormGroup) {

    // Remove repacked outputs form array
    targetStockOrderGroup.removeControl('repackedOutputsArray');

    if (semiProduct) {
      targetStockOrderGroup.get('measureUnitType').setValue(semiProduct.measurementUnitType);
      targetStockOrderGroup.get('totalQuantity').enable({ emitEvent: false });

      // If there is only one facility available for this semi-product set it by default
      const facilitiesCodebook = this.semiProductOutputFacilitiesCodebooks.get(semiProduct.id);
      facilitiesCodebook.getAllCandidates().pipe(take(1)).subscribe(facilities => {
        if (facilities.length === 1) {
          setTimeout(() => {
            targetStockOrderGroup.get('facility').setValue(facilities[0]);
          });
        }
      });

      // If output semi-product has set option to repack outputs, add the form array control into the target Stock order
      if (semiProduct.repackedOutput) {
        targetStockOrderGroup.addControl('repackedOutputsArray', new FormArray([]));
      }

    } else {
      targetStockOrderGroup.get('facility').setValue(null);
      targetStockOrderGroup.get('measureUnitType').setValue(null);
      targetStockOrderGroup.get('totalQuantity').disable({ emitEvent: false });
    }
    targetStockOrderGroup.get('totalQuantity').setValue(null);
  }

}
