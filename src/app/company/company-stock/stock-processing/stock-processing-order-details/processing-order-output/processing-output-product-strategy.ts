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

  // Shrimp-specific facility capabilities (default implementation in non-shrimp strategies returns false)
  abstract isCuttingFacility(selectedInputFacility: ApiFacility | null): boolean;
  abstract isTreatmentFacility(selectedInputFacility: ApiFacility | null): boolean;
  abstract isTunnelFreezingFacility(selectedInputFacility: ApiFacility | null): boolean;
  abstract isWashingAreaFacility(selectedInputFacility: ApiFacility | null): boolean;
}

/**
 * Default strategy for products without special shrimp behavior (e.g. cocoa, coffee).
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

  updateValidators(tsoGroup: FormGroup, _selectedInputFacility: ApiFacility | null): void {
    // For non-shrimp products: internalLotNumber is always required
    const internalLotControl = tsoGroup.get('internalLotNumber');
    if (internalLotControl) {
      internalLotControl.setValidators([Validators.required]);
      internalLotControl.updateValueAndValidity({ emitEvent: false });
    }
  }

  isClassificationMode(_selectedInputFacility: ApiFacility | null): boolean {
    return false;
  }

  isCuttingFacility(_selectedInputFacility: ApiFacility | null): boolean {
    return false;
  }

  isTreatmentFacility(_selectedInputFacility: ApiFacility | null): boolean {
    return false;
  }

  isTunnelFreezingFacility(_selectedInputFacility: ApiFacility | null): boolean {
    return false;
  }

  isWashingAreaFacility(_selectedInputFacility: ApiFacility | null): boolean {
    return false;
  }
}

/**
 * Strategy for shrimp-specific behavior (sensorial analysis, quality, classification, processing areas).
 * 
 * 🦐 SHRIMP PROCESSING OUTPUT STRATEGY
 * 
 * This strategy controls the visibility and validation of shrimp-specific fields
 * in the processing output form. Key principles:
 * 
 * 1. NO dependency on isLaboratory - laboratory analysis is captured at DELIVERY time
 * 2. Lot fields are ALWAYS visible for shrimp (no special hiding logic)
 * 3. Sensorial analysis section is NOT shown in processing output (it's in delivery)
 * 4. Processing-specific sections shown based on facility capabilities:
 *    - isFreezingProcess → Freezing section
 *    - isCuttingProcess → Cutting section  
 *    - isTreatmentProcess → Treatment section
 *    - isTunnelFreezing → Tunnel freezing section
 *    - isWashingArea → Washing area section
 *    - isClassificationProcess → Classification mode (uses specialized component)
 * 
 * 5. Traceability fields (gavetas, bines, piscinas, guía) are always inherited from inputs
 */
class ShrimpProcessingOutputStrategy extends ProcessingOutputProductStrategy {
  
  // Shrimp traceability/custody fields - inherited from input
  private readonly shrimpTraceabilityFields = [
    'numberOfGavetas',
    'numberOfBines',
    'numberOfPiscinas',
    'guiaRemisionNumber'
  ];

  // Freezing process fields
  private readonly freezingFields = [
    'freezingType',
    'freezingEntryDate',
    'freezingExitDate',
    'freezingTemperatureControl'
  ];

  // Cutting process fields
  private readonly cuttingFields = [
    'cuttingType',
    'cuttingEntryDate',
    'cuttingExitDate',
    'cuttingTemperatureControl'
  ];

  // Treatment process fields
  private readonly treatmentFields = [
    'treatmentType',
    'treatmentEntryDate',
    'treatmentExitDate',
    'treatmentTemperatureControl',
    'treatmentChemicalUsed'
  ];

  // Tunnel freezing fields
  private readonly tunnelFields = [
    'tunnelProductionDate',
    'tunnelExpirationDate',
    'tunnelNetWeight',
    'tunnelSupplier',
    'tunnelFreezingType',
    'tunnelEntryDate',
    'tunnelExitDate'
  ];

  // Washing area fields
  private readonly washingFields = [
    'washingWaterTemperature',
    'washingShrimpTemperatureControl'
  ];

  shouldShowLaboratorySection(_tsoGroup: AbstractControl, _selectedInputFacility: ApiFacility | null): boolean {
    // 🦐 For shrimp: Laboratory/sensorial analysis is captured at DELIVERY time
    // in the collection facility, NOT in the processing output.
    // Always return false - no lab section in processing output for shrimp.
    return false;
  }

  shouldShowFreezingSection(_tsoGroup: AbstractControl, selectedInputFacility: ApiFacility | null): boolean {
    // Show freezing-specific fields when the INPUT facility is marked as freezing process
    return selectedInputFacility?.isFreezingProcess === true;
  }

  shouldHideLotFields(_selectedInputFacility: ApiFacility | null): boolean {
    // 🦐 For shrimp: Lot fields are ALWAYS visible
    // There's no special "laboratory" hiding logic anymore
    return false;
  }

  shouldShowOutputQuantityField(actionType: ProcessingActionType | null): boolean {
    // For shrimp product: show quantity for all actions except QR code generation
    return actionType !== 'GENERATE_QR_CODE';
  }

  ensureExtraControls(tsoGroup: FormGroup): void {
    // 🦐 Ensure shrimp-specific traceability/custody controls exist
    // These are inherited from input and preserved through the chain
    this.shrimpTraceabilityFields.forEach(fieldName => {
      if (!tsoGroup.get(fieldName)) {
        tsoGroup.addControl(fieldName, new FormControl(null));
      }
    });

    // Freezing process controls
    this.freezingFields.forEach(fieldName => {
      if (!tsoGroup.get(fieldName)) {
        tsoGroup.addControl(fieldName, new FormControl(null));
      }
    });

    // Cutting process controls
    this.cuttingFields.forEach(fieldName => {
      if (!tsoGroup.get(fieldName)) {
        tsoGroup.addControl(fieldName, new FormControl(null));
      }
    });

    // Treatment process controls
    this.treatmentFields.forEach(fieldName => {
      if (!tsoGroup.get(fieldName)) {
        tsoGroup.addControl(fieldName, new FormControl(null));
      }
    });

    // Tunnel freezing controls
    this.tunnelFields.forEach(fieldName => {
      if (!tsoGroup.get(fieldName)) {
        tsoGroup.addControl(fieldName, new FormControl(null));
      }
    });

    // Washing area controls
    this.washingFields.forEach(fieldName => {
      if (!tsoGroup.get(fieldName)) {
        tsoGroup.addControl(fieldName, new FormControl(null));
      }
    });
  }

  updateValidators(tsoGroup: FormGroup, selectedInputFacility: ApiFacility | null): void {
    // 🦐 SHRIMP VALIDATORS - No dependency on isLaboratory
    const isFreezingFacility = this.shouldShowFreezingSection(tsoGroup, selectedInputFacility);
    const isClassification = this.isClassificationMode(selectedInputFacility);
    const isCuttingFacility = this.isCuttingFacility(selectedInputFacility);
    const isTreatmentFacility = this.isTreatmentFacility(selectedInputFacility);
    const isTunnelFacility = this.isTunnelFreezingFacility(selectedInputFacility);
    const isWashingFacility = this.isWashingAreaFacility(selectedInputFacility);

    // Freezing fields: in standard mode require all; in classification mode only freezingType
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

    // Cutting fields
    this.cuttingFields.forEach(fieldName => {
      const control = tsoGroup.get(fieldName);
      if (!control) { return; }

      if (isCuttingFacility) {
        control.setValidators([Validators.required]);
      } else {
        control.clearValidators();
      }
      control.updateValueAndValidity({ emitEvent: false });
    });

    // Treatment fields
    this.treatmentFields.forEach(fieldName => {
      const control = tsoGroup.get(fieldName);
      if (!control) { return; }

      if (isTreatmentFacility) {
        control.setValidators([Validators.required]);
      } else {
        control.clearValidators();
      }
      control.updateValueAndValidity({ emitEvent: false });
    });

    // Tunnel freezing fields
    this.tunnelFields.forEach(fieldName => {
      const control = tsoGroup.get(fieldName);
      if (!control) { return; }

      if (isTunnelFacility) {
        control.setValidators([Validators.required]);
      } else {
        control.clearValidators();
      }
      control.updateValueAndValidity({ emitEvent: false });
    });

    // Washing area fields
    this.washingFields.forEach(fieldName => {
      const control = tsoGroup.get(fieldName);
      if (!control) { return; }

      if (isWashingFacility) {
        control.setValidators([Validators.required]);
      } else {
        control.clearValidators();
      }
      control.updateValueAndValidity({ emitEvent: false });
    });

    // 🦐 Internal lot number: ALWAYS required for shrimp (no special lab hiding)
    const internalLotControl = tsoGroup.get('internalLotNumber');
    if (internalLotControl) {
      internalLotControl.setValidators([Validators.required]);
      internalLotControl.updateValueAndValidity({ emitEvent: false });
    }
  }

  isClassificationMode(selectedInputFacility: ApiFacility | null): boolean {
    // For shrimp product: classification mode when input facility is a classification process facility.
    return selectedInputFacility?.isClassificationProcess === true;
  }

  isCuttingFacility(selectedInputFacility: ApiFacility | null): boolean {
    return selectedInputFacility?.isCuttingProcess === true;
  }

  isTreatmentFacility(selectedInputFacility: ApiFacility | null): boolean {
    return selectedInputFacility?.isTreatmentProcess === true;
  }

  isTunnelFreezingFacility(selectedInputFacility: ApiFacility | null): boolean {
    return selectedInputFacility?.isTunnelFreezing === true;
  }

  isWashingAreaFacility(selectedInputFacility: ApiFacility | null): boolean {
    return selectedInputFacility?.isWashingArea === true;
  }
}

export function processingOutputStrategyFactory(productContext: ProductContext): ProcessingOutputProductStrategy {

  return productContext.primaryProductType === 'shrimp'
    ? new ShrimpProcessingOutputStrategy()
    : new DefaultProcessingOutputStrategy();
}
