import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { faTrashAlt, faPlus } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { ApiSemiProduct } from '../../../../../../api/model/apiSemiProduct';
import { CompanyFacilitiesForStockUnitProductService } from '../../../../../shared-services/company-facilities-for-stock-unit-product.service';
import { StaticSemiProductsService } from '../static-semi-products.service';

declare const $localize: any;

/**
 * Component for handling shrimp classification processing output.
 * Displays specialized form for classification batch with size-based details.
 */
@Component({
  selector: 'app-processing-order-output-classification',
  templateUrl: './processing-order-output-classification.component.html',
  styleUrls: ['./processing-order-output-classification.component.scss', '../stock-processing-order-details-common.scss']
})
export class ProcessingOrderOutputClassificationComponent implements OnInit, OnDestroy {

  readonly faTrashAlt = faTrashAlt;
  readonly faPlus = faPlus;

  private subscriptions: Subscription[] = [];
  private readonly KG_TO_LB_FACTOR = 2.20462;

  @Input()
  tsoGroup!: FormGroup;

  @Input()
  tsoGroupIndex!: number;

  @Input()
  submitted!: boolean;

  @Input()
  rightSideEnabled!: boolean;

  @Input()
  procActionLotPrefixControl!: FormControl;

  @Input()
  outputSemiProductsCodebook!: StaticSemiProductsService;

  @Input()
  semiProductOutputFacilitiesCodebooks!: Map<number, CompanyFacilitiesForStockUnitProductService>;

  @Output()
  removeOutputEvent = new EventEmitter<number>();

  constructor() { }

  ngOnInit(): void {
    this.ensureClassificationControls();
    this.setupValidators();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Ensure all classification-specific form controls exist
   */
  private ensureClassificationControls(): void {
    // Header fields
    const headerFields = [
      'classificationStartTime',
      'classificationEndTime',
      'productionOrder',
      'freezingType',
      'machine',
      'brandHeader'
    ];

    headerFields.forEach(fieldName => {
      if (!this.tsoGroup.get(fieldName)) {
        this.tsoGroup.addControl(fieldName, new FormControl(null));
      }
    });

    // Ensure classification details array exists
    if (!this.tsoGroup.get('classificationDetails')) {
      this.tsoGroup.addControl('classificationDetails', new FormArray([]));
    }
  }

  /**
   * Setup validators for classification fields
   */
  private setupValidators(): void {
    const requiredFields = [
      'classificationStartTime',
      'classificationEndTime',
      'productionOrder',
      'freezingType',
      'machine',
      'brandHeader'
    ];

    requiredFields.forEach(fieldName => {
      const control = this.tsoGroup.get(fieldName);
      if (control) {
        control.setValidators([Validators.required]);
        control.updateValueAndValidity({ emitEvent: false });
      }
    });
  }

  /**
   * Get classification details FormArray
   */
  get classificationDetailsArray(): FormArray {
    return this.tsoGroup.get('classificationDetails') as FormArray;
  }

  /**
   * Get output facility codebook based on selected semi-product
   */
  getOutputFacilityCodebook(): CompanyFacilitiesForStockUnitProductService | null {
    const semiProduct = this.tsoGroup.get('semiProduct')?.value as ApiSemiProduct;
    if (semiProduct && semiProduct.id) {
      return this.semiProductOutputFacilitiesCodebooks?.get(semiProduct.id) || null;
    }
    return null;
  }

  /**
   * Add a new classification detail row
   */
  addClassificationDetail(): void {
    const detailGroup = new FormGroup({
      brandDetail: new FormControl(null, [Validators.required]),
      size: new FormControl(null, [Validators.required]),
      boxes: new FormControl(null, [Validators.required, Validators.min(0)]),
      classificationU: new FormControl(null, [Validators.required, Validators.min(0)]),
      classificationNumber: new FormControl(null, [Validators.required, Validators.min(0)]),
      weightPerBox: new FormControl(null, [Validators.required, Validators.min(0)]),
      weightFormat: new FormControl('KG', [Validators.required])
    });

    this.classificationDetailsArray.push(detailGroup);
  }

  /**
   * Remove a classification detail row
   */
  removeClassificationDetail(index: number): void {
    if (this.classificationDetailsArray.length > 1) {
      this.classificationDetailsArray.removeAt(index);
    }
  }

  /**
   * Calculate total weight for a detail row (boxes * weightPerBox)
   */
  calculateTotalWeight(detailGroup: AbstractControl): number {
    const boxes = detailGroup.get('boxes')?.value || 0;
    const weightPerBox = detailGroup.get('weightPerBox')?.value || 0;
    return boxes * weightPerBox;
  }

  /**
   * Calculate pounds per size (totalWeight * 2.20462 / (classificationU + classificationNumber))
   */
  calculatePoundsPerSize(detailGroup: AbstractControl): number {
    const totalWeight = this.calculateTotalWeight(detailGroup);
    const classificationU = detailGroup.get('classificationU')?.value || 0;
    const classificationNumber = detailGroup.get('classificationNumber')?.value || 0;
    const totalClassification = classificationU + classificationNumber;
    
    if (totalClassification === 0) {
      return 0;
    }
    
    return (totalWeight * this.KG_TO_LB_FACTOR) / totalClassification;
  }

  /**
   * Calculate grand total weight across all details
   */
  calculateGrandTotalWeight(): number {
    let total = 0;
    this.classificationDetailsArray.controls.forEach(control => {
      total += this.calculateTotalWeight(control);
    });
    return total;
  }

  /**
   * Calculate grand total boxes across all details
   */
  calculateGrandTotalBoxes(): number {
    let total = 0;
    this.classificationDetailsArray.controls.forEach(control => {
      total += control.get('boxes')?.value || 0;
    });
    return total;
  }

  /**
   * Handle remove output button click
   */
  onRemoveOutput(): void {
    this.removeOutputEvent.emit(this.tsoGroupIndex);
  }

  /**
   * Check if the form can be deleted (at least 2 outputs must exist)
   */
  get canDelete(): boolean {
    // This will be controlled by parent component
    return true;
  }

  private calculateGrandTotalWeightInKilograms(): number {
    let total = 0;

    this.classificationDetailsArray?.controls?.forEach(control => {
      const weight = this.calculateTotalWeight(control);
      const format = (control.get('weightFormat')?.value || 'KG').toString().toUpperCase();

      if (format === 'LB') {
        total += weight / this.KG_TO_LB_FACTOR;
      } else {
        total += weight;
      }
    });

    return total;
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  }
}
