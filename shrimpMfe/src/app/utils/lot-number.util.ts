/**
 * Utilidad Temporal para Fase 1 (ShrimpMfe)
 * 
 * Implementa la estrategia pragmática dictada en spec-backend.md
 * donde los sufijos se manejan en el frontend usando comentarios
 * hasta que el microservicio real de camarón (Fase 3) sea desarrollado.
 */
export class LotNumberUtil {
  /**
   * Genera el ID del lote hijo basándose en el índice productivo.
   * @param {string} baseLot - Ej. "250121"
   * @param {number} childIndex - El número de fracción. Ej. 2 para el primer desglose.
   * @returns {string} - Ej. "250121-2"
   */
  static generateSuffix(baseLot: string, childIndex: number): string {
    if (!baseLot) return '';
    if (childIndex <= 1) return baseLot; // 1 es el lote base original
    return `${baseLot}-${childIndex}`;
  }

  /**
   * Empaqueta valores multimodales (cajetas/lbs) temporalmente para ser
   * salvados en el campo "comments" del StockOrder del Core INATrace actual.
   * 
   * @param {number} weightLbs - Peso exacto físico a trackear 
   * @param {number} boxesCount - Cantidad de bines o cajetas
   * @returns {string} Payload JSON para el campo de comentario
   */
  static packDualUnitComment(weightLbs: number, boxesCount: number): string {
    return JSON.stringify({
      dualUnit: true,
      lbs: weightLbs,
      cajetas: boxesCount,
      v: 1
    });
  }
}
