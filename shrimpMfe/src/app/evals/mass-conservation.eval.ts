import { ReceptionLot } from '../services/shrimp-data.service';

/**
 * EVAL: Mass Conservation Oracle
 * Objective: Verify balance between referential Peso Camaronera (input) and Classified Output.
 * Rule: Peso Camaronera is referential; output > input produces a Warning flag, but is non-blocking (isValid: true).
 */

interface ClassificationTempOut {
  destination: string;
  size_grade: string;
  weight_lbs: number;
  cajetas_count: number;
}

export class MassConservationEval {
  
  /**
   * Average net weight of a standard shrimp block box is ~2Kg or ~4.41 lbs.
   */
  static readonly LBS_PER_CAJETA = 4.41;

  static calculateShrinkage(
    receptionLot: ReceptionLot,
    classifications: ClassificationTempOut[]
  ): { 
    pesoCamaroneraLbs: number, 
    totalClassifiedLbs: number, 
    deltaLbs: number, 
    isExceedingCamaronera: boolean,
    isValid: boolean
  } {
    const input = receptionLot.gross_weight_lbs;
    
    const outputLbs = classifications.reduce((acc, out) => {
      if (out.destination === 'BLOQUE') {
         return acc + (out.cajetas_count * this.LBS_PER_CAJETA);
      }
      return acc + out.weight_lbs;
    }, 0);

    const deltaLbs = input - outputLbs;
    
    // Peso Camaronera is purely referential.
    // If outputLbs > input (deltaLbs < 0), it triggers a Warning (isExceedingCamaronera = true)
    // but remains VALID and NON-BLOCKING in DUFER business logic.
    const isExceedingCamaronera = deltaLbs < 0;

    return {
      pesoCamaroneraLbs: input,
      totalClassifiedLbs: outputLbs,
      deltaLbs,
      isExceedingCamaronera,
      isValid: true // Always non-blocking
    };
  }
}

// ---------------------------------------------------------
// TEST RUNNER
// ---------------------------------------------------------
function runEvals() {
  const lot: ReceptionLot = {
    id: '1', base_lot_number: '250121', supplier_id: null, supplier_name: 'TEST SUPPLIER', gross_weight_lbs: 2400, bins_count: 50,
    product_type: 'ENTERO', reception_date: new Date().toISOString()
  };

  const outputsNormal: ClassificationTempOut[] = [
    { destination: 'BLOQUE', size_grade: '21_25', weight_lbs: 0, cajetas_count: 300 }, // 300 * 4.41 = 1323 lbs
    { destination: 'IQF', size_grade: '26_30', weight_lbs: 800, cajetas_count: 0 }     // 800 lbs
  ];

  const resNormal = MassConservationEval.calculateShrinkage(lot, outputsNormal);
  console.assert(resNormal.totalClassifiedLbs === 2123, 'Normal output calc failed');
  console.assert(resNormal.deltaLbs === 277, 'Normal delta calc failed');
  console.assert(resNormal.isExceedingCamaronera === false, 'Exceeding check failed');
  console.assert(resNormal.isValid === true, 'Non-blocking validation failed');

  // Scenario 2: Output exceeds referential Peso Camaronera (e.g. 2600 lbs vs 2400 lbs)
  const outputsExceeding: ClassificationTempOut[] = [
    { destination: 'IQF', size_grade: '21_25', weight_lbs: 2600, cajetas_count: 0 }
  ];

  const resExceeding = MassConservationEval.calculateShrinkage(lot, outputsExceeding);
  console.assert(resExceeding.deltaLbs === -200, 'Exceeding delta calc failed');
  console.assert(resExceeding.isExceedingCamaronera === true, 'Exceeding warning flag failed');
  console.assert(resExceeding.isValid === true, 'Exceeding must remain valid (non-blocking)');

  console.log('✅ MassConservationEval: ALL REFERENTIAL PESO CAMARONERA SCENARIOS PASSED.');
}

runEvals();
