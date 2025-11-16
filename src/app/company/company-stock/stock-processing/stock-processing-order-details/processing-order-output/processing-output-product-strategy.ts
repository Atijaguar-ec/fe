import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { ApiFacility } from '../../../../../../api/model/apiFacility';
import { ProductContext } from '../../../../../core/product-context';
import { ProcessingActionType } from '../../../../../../shared/types';

/**
 * Base abstract strategy for product-specific behavior in ProcessingOrderOutputComponent.
 *
 * Using an abstract class instead of an interface allows us to use it directly as
 * an Angular DI token (no parameter decorators needed in the component).
 */
export abstract class ProcessingOutputProductStrategy {
  abstract shouldShowLaboratorySection(tsoGroup: AbstractControl, selectedInputFacility: ApiFacility | null): boolean;
  abstract shouldHideLotFields(selectedInputFacility: ApiFacility | null): boolean;
  abstract shouldShowOutputQuantityField(actionType: ProcessingActionType | null): boolean;
  abstract shouldShowFreezingSection(tsoGroup: AbstractControl, selectedInputFacility: ApiFacility | null): boolean;
  abstract ensureExtraControls(tsoGroup: FormGroup): void;
  abstract updateValidators(tsoGroup: FormGroup, selectedInputFacility: ApiFacility | null): void;
  abstract isClassificationMode(selectedInputFacility: ApiFacility | null): boolean;
}

/**
 * Default strategy for products without special laboratory behavior (e.g. cocoa, coffee).
 */
class DefaultProcessingOutputStrategy extends ProcessingOutputProductStrategy {
  shouldShowLaboratorySection(_tsoGroup: AbstractControl, _selectedInputFacility: ApiFacility | null): boolean {
    return false;
  }

  shouldHideLotFields(_selectedInputFacility: ApiFacility | null): boolean {
    return false;
  }

  shouldShowOutputQuantityField(actionType: ProcessingActionType | null): boolean {
    return actionType !== 'TRANSFER' && actionType !== 'GENERATE_QR_CODE';
  }

  shouldShowFreezingSection(_tsoGroup: AbstractControl, _selectedInputFacility: ApiFacility | null): boolean {
    return false;
  }

  ensureExtraControls(_tsoGroup: FormGroup): void {
    // No additional controls for default products.
  }

  updateValidators(tsoGroup: FormGroup, selectedInputFacility: ApiFacility | null): void {
    // Replicate existing behavior for non-shrimp products:
    // internalLotNumber is required unless input comes from a laboratory facility.
    const internalLotControl = tsoGroup.get('internalLotNumber');
    if (internalLotControl) {
      const isInputFromLab = selectedInputFacility?.isLaboratory === true;
      if (isInputFromLab) {
        internalLotControl.clearValidators();
      } else {
        internalLotControl.setValidators([Validators.required]);
      }
      internalLotControl.updateValueAndValidity({ emitEvent: false });
    }
  }

  isClassificationMode(_selectedInputFacility: ApiFacility | null): boolean {
    return false;
  }
}

/**
 * Strategy for shrimp-specific behavior (laboratory, sensorial analysis, quality, classification).
 */
class ShrimpProcessingOutputStrategy extends ProcessingOutputProductStrategy {
  private readonly labTextFields = [
    'sensorialRawOdor',
    'sensorialRawTaste',
    'sensorialRawColor',
    'sensorialCookedOdor',
    'sensorialCookedTaste',
    'sensorialCookedColor',
    'qualityNotes'
  ];

  private readonly shrimpTraceabilityFields = [
    'numberOfGavetas',
    'numberOfBines',
    'numberOfPiscinas',
    'guiaRemisionNumber'
  ];

  private readonly freezingFields = [
    'freezingType',
    'freezingEntryDate',
    'freezingExitDate',
    'freezingTemperatureControl'
  ];

  shouldShowLaboratorySection(_tsoGroup: AbstractControl, selectedInputFacility: ApiFacility | null): boolean {
    // For shrimp product: decide visibility based on the INPUT facility
    // (area from which the product comes), not the output facility.
    const facility = selectedInputFacility;
    return facility?.isCollectionFacility === true;
  }

  shouldShowFreezingSection(_tsoGroup: AbstractControl, selectedInputFacility: ApiFacility | null): boolean {
    // For shrimp product: show freezing-specific fields when the INPUT facility
    // is marked as freezing process.
    const facility = selectedInputFacility;
    return facility?.isFreezingProcess === true;
  }

  shouldHideLotFields(selectedInputFacility: ApiFacility | null): boolean {
    // When input facility is laboratory, lot is assigned AFTER lab tests, not before.
    return selectedInputFacility?.isLaboratory === true;
  }

  shouldShowOutputQuantityField(actionType: ProcessingActionType | null): boolean {
    // For shrimp product: show quantity for all actions except QR code generation.
    return actionType !== 'GENERATE_QR_CODE';
  }

  ensureExtraControls(tsoGroup: FormGroup): void {
    if (!tsoGroup.get('sampleNumber')) {
      tsoGroup.addControl('sampleNumber', new FormControl(null));
    }
    if (!tsoGroup.get('receptionTime')) {
      tsoGroup.addControl('receptionTime', new FormControl(null));
    }
    if (!tsoGroup.get('qualityDocument')) {
      tsoGroup.addControl('qualityDocument', new FormControl(null));
    }

    // Sensory analysis: metabisulfite acceptance (yes/no)
    if (!tsoGroup.get('metabisulfiteLevelAcceptable')) {
      tsoGroup.addControl('metabisulfiteLevelAcceptable', new FormControl(null));
    }

    if (!tsoGroup.get('approvedForPurchase')) {
      tsoGroup.addControl('approvedForPurchase', new FormControl(null));
    }

    this.labTextFields.forEach(fieldName => {
      if (!tsoGroup.get(fieldName)) {
        tsoGroup.addControl(fieldName, new FormControl(null));
      }
    });

    this.freezingFields.forEach(fieldName => {
      if (!tsoGroup.get(fieldName)) {
        tsoGroup.addControl(fieldName, new FormControl(null));
      }
    });

    // Ensure shrimp-specific traceability controls exist for custody
    this.shrimpTraceabilityFields.forEach(fieldName => {
      if (!tsoGroup.get(fieldName)) {
        tsoGroup.addControl(fieldName, new FormControl(null));
      }
    });
  }

  updateValidators(tsoGroup: FormGroup, selectedInputFacility: ApiFacility | null): void {
    const isLabSectionVisible = this.shouldShowLaboratorySection(tsoGroup, selectedInputFacility);
    const isInputFromLab = selectedInputFacility?.isLaboratory === true;
    const isFreezingFacility = this.shouldShowFreezingSection(tsoGroup, selectedInputFacility);
    const isClassification = this.isClassificationMode(selectedInputFacility);

    // Sample number is required when lab section is visible
    const requiredControls = ['sampleNumber'];

    requiredControls.forEach(fieldName => {
      const control = tsoGroup.get(fieldName);
      if (!control) { return; }

      if (isLabSectionVisible) {
        control.setValidators([Validators.required]);
      } else {
        control.clearValidators();
      }
      control.updateValueAndValidity({ emitEvent: false });
    });

    // Analysis approval must be explicitly answered (cannot stay null),
    // but both true (yes) and false (no) are valid values.
    const approvalControl = tsoGroup.get('approvedForPurchase');
    if (approvalControl) {
      if (isLabSectionVisible) {
        approvalControl.setValidators([
          (ctrl: AbstractControl) =>
            ctrl.value === null || ctrl.value === undefined ? { required: true } : null
        ]);
      } else {
        approvalControl.clearValidators();
      }
      approvalControl.updateValueAndValidity({ emitEvent: false });
    }

    // Freezing fields: in standard mode require all; in classification mode only the shared freezingType
    const freezingRequiredControls = isClassification ? ['freezingType'] : this.freezingFields;
    freezingRequiredControls.forEach(fieldName => {
      const control = tsoGroup.get(fieldName);
      if (!control) { return; }

      if (isFreezingFacility) {
        control.setValidators([Validators.required]);
      } else {
        control.clearValidators();
      }
      control.updateValueAndValidity({ emitEvent: false });
    });

    // Internal lot number: NOT required when input is from laboratory (field is hidden)
    const internalLotControl = tsoGroup.get('internalLotNumber');
    if (internalLotControl) {
      if (isInputFromLab) {
        // Laboratory input: lot field is hidden, so NOT required
        internalLotControl.clearValidators();
        // console.log('🔬 Laboratory input: internalLotNumber NOT required (field hidden)');
      } else {
        // Normal input: lot field is visible, so required
        internalLotControl.setValidators([Validators.required]);
        // console.log('🦐 Normal input: internalLotNumber required');
      }
      internalLotControl.updateValueAndValidity({ emitEvent: false });
    }
  }

  isClassificationMode(selectedInputFacility: ApiFacility | null): boolean {
    // For shrimp product: classification mode when input facility is a classification process facility.
    return selectedInputFacility?.isClassificationProcess === true;
  }
}

export function processingOutputStrategyFactory(productContext: ProductContext): ProcessingOutputProductStrategy {

  return productContext.primaryProductType === 'shrimp'
    ? new ShrimpProcessingOutputStrategy()
    : new DefaultProcessingOutputStrategy();
}
