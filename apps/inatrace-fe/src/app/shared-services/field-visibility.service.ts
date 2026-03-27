import { Injectable } from '@angular/core';
import { ApiFacility } from '../../api/model/apiFacility';
import { ApiStockOrder } from '../../api/model/apiStockOrder';

export interface VisibilityRules {
  showOrganic: boolean;
  showTare: boolean;
  showCollector: boolean;
  showWomensOnly: boolean;
  showDamagedPriceDeduction: boolean;
  showDamagedWeightDeduction: boolean;
  showFlavorTest: boolean;
  showPurchaseRecommended: boolean;
  requireLabApproval: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class FieldVisibilityService {
  getVisibilityRules(
    facility: ApiFacility,
    order: ApiStockOrder,
    isShrimp: boolean = false
  ): VisibilityRules {
    const facilityCode = facility?.facilityType?.code;
    const isFieldInspection = facilityCode === 'RECEPCION' || (facility as any).isFieldInspection === true;
    const isLaboratory = facilityCode === 'LABORATORIO' || (facility as any).isLaboratory === true;

    // Default rules (current logic extracted)
    const rules: VisibilityRules = {
      showOrganic: !!(facility?.displayOrganic || order?.organic),
      showTare: !!(facility?.displayTare || order?.tare),
      showCollector: !!facility?.displayMayInvolveCollectors,
      showWomensOnly: !!(facility?.displayWomenOnly || order?.womenShare),
      showDamagedPriceDeduction: !!(facility?.displayPriceDeductionDamage || order?.damagedPriceDeduction),
      showDamagedWeightDeduction: !!(facility?.displayWeightDeductionDamage || order?.damagedWeightDeduction),
      showFlavorTest: false,
      showPurchaseRecommended: false,
      requireLabApproval: !isLaboratory && !isFieldInspection && isShrimp,
    };

    // Shrimp Specific Refinement (EDD target)
    if (isShrimp && isFieldInspection) {
      rules.showOrganic = false;
      rules.showTare = false;
      rules.showCollector = false;
      rules.showWomensOnly = false;
      rules.showDamagedPriceDeduction = false;
      rules.showDamagedWeightDeduction = false;
      rules.showFlavorTest = true;
      rules.showPurchaseRecommended = true;
      rules.requireLabApproval = false;
    }

    return rules;
  }
}
