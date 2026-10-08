/**
 * Utilidades para comprobantes de entrega y simplificación de semiproducto en lotes.
 * Espejo de DeliveryReceiptTools.java en el backend:
 * - enableDeliveryReceipt (o deliveryReceiptSequence): activa la numeración y visualización
 *   secuencial ("0001", "0002", ...) del comprobante de entrega.
 * - simplifySemiProductToCacao (o genericCacaoDisplay): sustituye la visualización del
 *   nombre técnico del semiproducto por la palabra "Cacao" en la vista básica de historial.
 *
 * Ambas opciones están apagadas por defecto (ausente o false = inactivo).
 * Para Fortaleza del Valle (FV) quedan desactivadas salvo que un usuario funcional las
 * active desde la configuración de la empresa (company-detail). UNOCACE las tiene activas.
 */

export const DELIVERY_RECEIPT_CONFIG_KEY = 'enableDeliveryReceipt';
export const DELIVERY_RECEIPT_ALT_KEY = 'deliveryReceiptSequence';
export const SIMPLIFY_SEMI_PRODUCT_KEY = 'simplifySemiProductToCacao';
export const SIMPLIFY_SEMI_PRODUCT_ALT_KEY = 'genericCacaoDisplay';
export const QUOTA_BALANCE_CONFIG_KEY = 'enableQuotaBalance';
export const PUBLIC_DELIVERY_RECEIPT_CONFIG_KEY = 'enablePublicDeliveryReceipt';

function isTruthy(val: any): boolean {
  if (val === true || val === 1) {
    return true;
  }
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    return s === 'true' || s === '1';
  }
  return false;
}

export function isDeliveryReceiptConfigEnabled(
  configuration: { [key: string]: any } | null | undefined,
): boolean {
  if (!configuration) {
    return false;
  }
  return (
    isTruthy(configuration[DELIVERY_RECEIPT_CONFIG_KEY]) ||
    isTruthy(configuration[DELIVERY_RECEIPT_ALT_KEY])
  );
}

export function isSimplifySemiProductConfigEnabled(
  configuration: { [key: string]: any } | null | undefined,
): boolean {
  if (!configuration) {
    return false;
  }
  return (
    isTruthy(configuration[SIMPLIFY_SEMI_PRODUCT_KEY]) ||
    isTruthy(configuration[SIMPLIFY_SEMI_PRODUCT_ALT_KEY])
  );
}

export function isQuotaBalanceConfigEnabled(
  configuration: { [key: string]: any } | null | undefined,
): boolean {
  if (!configuration) {
    return false;
  }
  return isTruthy(configuration[QUOTA_BALANCE_CONFIG_KEY]);
}

export function isPublicDeliveryReceiptConfigEnabled(
  configuration: { [key: string]: any } | null | undefined,
): boolean {
  if (!configuration) {
    return false;
  }
  return isTruthy(configuration[PUBLIC_DELIVERY_RECEIPT_CONFIG_KEY]);
}
