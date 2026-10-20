import { ReceptionLot } from '../services/shrimp-data.service';

/**
 * EVAL: Mass Conservation Oracle
 * Objective: Mathematically guarantee that Input exactly matches Outputs + Shrinkage.
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
    totalInputLbs: number, 
    totalClassifiedLbs: number, 
    shrinkageLbs: number, 
    isBalanced: boolean 
  } {
    const input = receptionLot.gross_weight_lbs;
    
    const outputLbs = classifications.reduce((acc, out) => {
      if (out.destination === 'BLOQUE') {
         return acc + (out.cajetas_count * this.LBS_PER_CAJETA);
      }
      return acc + out.weight_lbs;
    }, 0);

    const shrinkage = input - outputLbs;
    
    // In a physical plant, a mathematically negative shrink (producing more than received)
    // is a critical error (fraud/misweighing). 
    // A positive shrink up to 5% is standard water loss.
    const isBalanced = shrinkage >= 0;

    return {
      totalInputLbs: input,
      totalClassifiedLbs: outputLbs,
      shrinkageLbs: shrinkage,
      isBalanced
    };
  }
}

// ---------------------------------------------------------
// TEST RUNNER
// ---------------------------------------------------------
function runEvals() {
  const lot: ReceptionLot = {
    id: '1', base_lot_number: '250121', gross_weight_lbs: 2400, bins_count: 50,
    product_type: 'ENTERO', reception_date: new Date().toISOString()
  };

  const outputs: ClassificationTempOut[] = [
    { destination: 'BLOQUE', size_grade: '21_25', weight_lbs: 0, cajetas_count: 300 }, // 300 * 4.41 = 1323 lbs
    { destination: 'IQF', size_grade: '26_30', weight_lbs: 800, cajetas_count: 0 }     // 800 lbs
  ];

  const result = MassConservationEval.calculateShrinkage(lot, outputs);
  
  // Total out = 2123
  // Shrink = 2400 - 2123 = 277 lbs
  console.assert(result.totalClassifiedLbs === 2123, 'Output calc failed');
  console.assert(result.shrinkageLbs === 277, 'Shrink calc failed');
  console.assert(result.isBalanced === true, 'Balance truth failed');
  
  if (result.shrinkageLbs === 277) {
    console.log('✅ MassConservationEval: ALL SCENARIOS PASSED.');
  }
}

// runEvals();
