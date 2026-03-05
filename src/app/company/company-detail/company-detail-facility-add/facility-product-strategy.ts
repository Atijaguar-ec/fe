import { FormControl, FormGroup } from '@angular/forms';
import { ProductContext } from '../../../core/product-context';

/**
 * Base abstract strategy for product-specific behavior in CompanyDetailFacilityAddComponent.
 */
export abstract class FacilityProductStrategy {
  abstract readonly isShrimpProduct: boolean;

  abstract ensureClassificationProcessControl(form: FormGroup, initialValue: boolean): void;

  abstract ensureFreezingProcessControl(form: FormGroup, initialValue: boolean): void;
}

/**
 * Default strategy for products without shrimp-specific facility behavior (e.g. cocoa, coffee).
 */
class DefaultFacilityProductStrategy extends FacilityProductStrategy {
  readonly isShrimpProduct = false;

  ensureClassificationProcessControl(form: FormGroup, initialValue: boolean): void {
    let control = form.get('isClassificationProcess') as FormControl | null;

    if (!control) {
      control = new FormControl(false);
      form.addControl('isClassificationProcess', control);
    } else {
      control.setValue(false, { emitEvent: false });
    }

    control.disable({ emitEvent: false });
  }

  ensureFreezingProcessControl(form: FormGroup, initialValue: boolean): void {
    let control = form.get('isFreezingProcess') as FormControl | null;

    if (!control) {
      control = new FormControl(false);
      form.addControl('isFreezingProcess', control);
    } else {
      control.setValue(false, { emitEvent: false });
    }

    control.disable({ emitEvent: false });
  }
}

/**
 * Strategy for shrimp-specific facility behavior.
 */
class ShrimpFacilityProductStrategy extends FacilityProductStrategy {
  readonly isShrimpProduct = true;

  ensureClassificationProcessControl(form: FormGroup, initialValue: boolean): void {
    let control = form.get('isClassificationProcess') as FormControl | null;

    if (!control) {
      control = new FormControl(initialValue ?? false);
      form.addControl('isClassificationProcess', control);
    } else {
      control.setValue(initialValue ?? false, { emitEvent: false });
    }

    control.enable({ emitEvent: false });
  }

  ensureFreezingProcessControl(form: FormGroup, initialValue: boolean): void {
    let control = form.get('isFreezingProcess') as FormControl | null;

    if (!control) {
      control = new FormControl(initialValue ?? false);
      form.addControl('isFreezingProcess', control);
    } else {
      control.setValue(initialValue ?? false, { emitEvent: false });
    }

    control.enable({ emitEvent: false });
  }
}

export function facilityProductStrategyFactory(productContext: ProductContext): FacilityProductStrategy {
  return productContext.primaryProductType === 'shrimp'
    ? new ShrimpFacilityProductStrategy()
    : new DefaultFacilityProductStrategy();
}
