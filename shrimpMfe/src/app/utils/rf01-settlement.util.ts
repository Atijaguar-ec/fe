/**
 * RF01 — Liquidación de camarón por proceso (Empacadora DUFER).
 *
 * Fuente de verdad: `giz/2026/RF01.md`, confirmado por el dueño de producto como el proceso
 * físico real. Contratos formales: `inatrace-agent-rules/knowledge/shrimp-okf-spec.md`
 * Rules OKF-06 a OKF-10.
 *
 * REGLA CENTRAL (OKF-09): la planta corre DOS procesos independientes — "con cabeza" (entero)
 * y "en cola". Cada uno tiene SU PROPIA basura, SUS PROPIAS libras netas recibidas y SU PROPIO
 * rendimiento. Nunca se agregan cifras cruzando el límite entero↔cola: en el lote 504 de RF01
 * hay 3 lb de basura en clasificación de entero y OTRAS 3 lb en descabezado de cola; sumarlas
 * a 6 lb e imprimirlas en ambas hojas fue el bug corregido el 2026-07-30.
 *
 * Diferencia clave entre los dos procesos (RF01 §1 vs §3):
 *  - Entero NO se pesa al ingreso → sus libras recibidas se RECONSTRUYEN hacia atrás.
 *  - Cola SÍ se pesa al ingreso → sus libras recibidas son un dato medido.
 *
 * La cola entra por dos caminos y ambos deben funcionar: el rechazo descabezado del proceso
 * con cabeza, o camarón que llega directo como cola desde la camaronera.
 */

export type Rf01ProcessType = 'ENTERO' | 'COLA';

/** Bloque de liquidación de un proceso — espeja `ApiSettlementSummary.ProcessSummary`. */
export interface Rf01ProcessBlock {
  processType: Rf01ProcessType;
  applicable: boolean;
  grossReceivedLbs: number;
  grossReceivedReconstructed: boolean;
  wasteLbs: number;
  netReceivedLbs: number;
  rejectedLbs: number;
  processedLbs: number;
  remnanteLbs: number;
  yieldPercent: number;
}

/** Datos disponibles en el frontend para reconstruir los bloques sin el backend. */
export interface Rf01LocalInputs {
  /** Libras clasificadas por el proceso con cabeza. */
  classifiedEnteroLbs: number;
  /** Libras clasificadas por el proceso en cola. */
  classifiedColaLbs: number;
  /** Rechazo del entero enviado a descabezado (alimenta la línea de cola). */
  rejectedLbs: number;
  /** Basura del proceso con cabeza. */
  enteroWasteLbs: number;
  /** Basura del proceso en cola (descabezado). */
  colaWasteLbs: number;
  /** Sobrante/remanente — informativo; RF01 no lo usa en ninguna fórmula. */
  colaRemnanteLbs: number;
  /** True cuando el lote llegó directo como cola desde la camaronera. */
  receptionIsCola: boolean;
  /** Peso de recepción: pesaje real si el lote es cola, ticket de finca si es entero. */
  receptionTotalWeightLbs: number;
}

/** Cifras de peso de una hoja de liquidación. `''` = campo en blanco en el PDF. */
export interface Rf01SheetFigures {
  pesoRecibido: number | '';
  basura: number | '';
  remanente: number | '';
  pesoNetoRecibido: number | '';
  rechazo: number | '';
  pesoProcesado: number | '';
  rendimiento: number | '';
  pesoPlanta?: number | '';
}

export class Rf01Settlement {
  /** Redondeo a 2 decimales, igual que el backend (`RoundingMode.HALF_UP`). */
  static round2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  /** RF01 — Libras netas recibidas = bruto − basura. SOLO basura; el remanente nunca se resta. */
  static netReceived(grossLbs: number, wasteLbs: number): number {
    return this.round2(grossLbs - wasteLbs);
  }

  /** RF01 §4 — Rendimiento = libras procesadas / libras netas recibidas × 100. */
  static yieldPercent(processedLbs: number, netReceivedLbs: number): number {
    if (netReceivedLbs <= 0) return 0;
    return this.round2((processedLbs / netReceivedLbs) * 100);
  }

  /**
   * RF01 §3 — Proceso con cabeza. No hay pesaje al ingreso, así que las libras recibidas se
   * reconstruyen: procesadas + rechazo + basura.
   */
  static reconstructEntero(i: Rf01LocalInputs): Rf01ProcessBlock {
    const processedLbs = i.classifiedEnteroLbs;
    const rejectedLbs = i.rejectedLbs;
    const wasteLbs = i.enteroWasteLbs;
    const grossReceivedLbs = this.round2(processedLbs + rejectedLbs + wasteLbs);
    const netReceivedLbs = this.netReceived(grossReceivedLbs, wasteLbs);

    return {
      processType: 'ENTERO',
      applicable: !i.receptionIsCola,
      grossReceivedLbs,
      grossReceivedReconstructed: true,
      wasteLbs,
      netReceivedLbs,
      rejectedLbs,
      processedLbs,
      remnanteLbs: 0, // la UI nunca captura remanente en entero
      yieldPercent: this.yieldPercent(processedLbs, netReceivedLbs),
    };
  }

  /**
   * RF01 §1 — Proceso en cola. Sí hay pesaje obligatorio al ingreso: el bruto es el rechazo
   * entregado por el proceso con cabeza, o el peso de recepción cuando el lote llegó directo
   * como cola desde la camaronera.
   */
  static reconstructCola(i: Rf01LocalInputs): Rf01ProcessBlock {
    const grossReceivedLbs = i.receptionIsCola ? i.receptionTotalWeightLbs : i.rejectedLbs;
    const wasteLbs = i.colaWasteLbs;
    const netReceivedLbs = this.netReceived(grossReceivedLbs, wasteLbs);
    const processedLbs = i.classifiedColaLbs;

    return {
      processType: 'COLA',
      applicable: grossReceivedLbs > 0 || processedLbs > 0,
      grossReceivedLbs,
      grossReceivedReconstructed: false,
      wasteLbs,
      netReceivedLbs,
      rejectedLbs: 0,
      processedLbs,
      remnanteLbs: i.colaRemnanteLbs,
      yieldPercent: this.yieldPercent(processedLbs, netReceivedLbs),
    };
  }

  /** Hoja de liquidación ENTERO. El rechazo se reporta como cola recuperada. */
  static toEnteroSheet(b: Rf01ProcessBlock): Rf01SheetFigures {
    return {
      pesoRecibido: this.blankIfZero(b.grossReceivedLbs),
      basura: this.blankIfZero(b.wasteLbs),
      remanente: this.blankIfZero(b.remnanteLbs),
      pesoNetoRecibido: this.blankIfZero(b.netReceivedLbs),
      rechazo: this.blankIfZero(b.rejectedLbs),
      pesoProcesado: this.blankIfZero(b.processedLbs),
      rendimiento: this.blankIfZero(b.yieldPercent),
    };
  }

  /** Hoja de liquidación COLA. El peso planta es el pesaje al ingreso de esta línea. */
  static toColaSheet(b: Rf01ProcessBlock): Rf01SheetFigures {
    return {
      pesoPlanta: this.blankIfZero(b.grossReceivedLbs),
      pesoRecibido: this.blankIfZero(b.grossReceivedLbs),
      basura: this.blankIfZero(b.wasteLbs),
      remanente: this.blankIfZero(b.remnanteLbs),
      pesoNetoRecibido: this.blankIfZero(b.netReceivedLbs),
      rechazo: '', // el rechazo pertenece a la hoja de entero, nunca a la de cola
      pesoProcesado: this.blankIfZero(b.processedLbs),
      rendimiento: this.blankIfZero(b.yieldPercent),
    };
  }

  private static blankIfZero(value: number): number | '' {
    return value > 0 ? value : '';
  }
}
