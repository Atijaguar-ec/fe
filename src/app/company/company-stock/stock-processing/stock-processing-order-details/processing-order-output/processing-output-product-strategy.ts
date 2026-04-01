import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { ApiFacility } from '../../../../../../api/model/apiFacility';
import { ProductContext } from '../../../../../core/product-context';
import { ProcessingActionType } from '../../../../../../shared/types';

/**
 * Base strategy for product-specific behavior in ProcessingOrderOutputComponent.
 */
export class ProcessingOutputProductStrategy {
  
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

export function processingOutputStrategyFactory(): ProcessingOutputProductStrategy {
  return new ProcessingOutputProductStrategy();
}
