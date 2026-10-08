  isDeliveryReceiptConfigEnabled,
  isSimplifySemiProductConfigEnabled,
  isPublicDeliveryReceiptConfigEnabled,
  DELIVERY_RECEIPT_CONFIG_KEY,
  DELIVERY_RECEIPT_ALT_KEY,
  SIMPLIFY_SEMI_PRODUCT_KEY,
  SIMPLIFY_SEMI_PRODUCT_ALT_KEY,
  PUBLIC_DELIVERY_RECEIPT_CONFIG_KEY,
} from './delivery-receipt.util';

describe('delivery-receipt.util', () => {
  describe('isDeliveryReceiptConfigEnabled', () => {
    it('should return false for null, undefined or empty config (FV default)', () => {
      expect(isDeliveryReceiptConfigEnabled(null)).toBe(false);
      expect(isDeliveryReceiptConfigEnabled(undefined)).toBe(false);
      expect(isDeliveryReceiptConfigEnabled({})).toBe(false);
      expect(
        isDeliveryReceiptConfigEnabled({ onlyOrganicProduction: true }),
      ).toBe(false);
      expect(
        isDeliveryReceiptConfigEnabled({ [DELIVERY_RECEIPT_CONFIG_KEY]: false }),
      ).toBe(false);
      expect(
        isDeliveryReceiptConfigEnabled({ [DELIVERY_RECEIPT_CONFIG_KEY]: 'false' }),
      ).toBe(false);
      expect(
        isDeliveryReceiptConfigEnabled({ [DELIVERY_RECEIPT_CONFIG_KEY]: 0 }),
      ).toBe(false);
      expect(
        isDeliveryReceiptConfigEnabled({ [DELIVERY_RECEIPT_CONFIG_KEY]: '0' }),
      ).toBe(false);
    });

    it('should return true when enableDeliveryReceipt or deliveryReceiptSequence is true (UNOCACE)', () => {
      expect(
        isDeliveryReceiptConfigEnabled({ [DELIVERY_RECEIPT_CONFIG_KEY]: true }),
      ).toBe(true);
      expect(
        isDeliveryReceiptConfigEnabled({ [DELIVERY_RECEIPT_CONFIG_KEY]: 'true' }),
      ).toBe(true);
      expect(
        isDeliveryReceiptConfigEnabled({ [DELIVERY_RECEIPT_CONFIG_KEY]: 'TRUE' }),
      ).toBe(true);
      expect(
        isDeliveryReceiptConfigEnabled({ [DELIVERY_RECEIPT_CONFIG_KEY]: 1 }),
      ).toBe(true);
      expect(
        isDeliveryReceiptConfigEnabled({ [DELIVERY_RECEIPT_CONFIG_KEY]: '1' }),
      ).toBe(true);
      expect(
        isDeliveryReceiptConfigEnabled({ [DELIVERY_RECEIPT_ALT_KEY]: true }),
      ).toBe(true);
      expect(
        isDeliveryReceiptConfigEnabled({ [DELIVERY_RECEIPT_ALT_KEY]: 'true' }),
      ).toBe(true);
    });
  });

  describe('isSimplifySemiProductConfigEnabled', () => {
    it('should return false for null, undefined or empty config (FV default)', () => {
      expect(isSimplifySemiProductConfigEnabled(null)).toBe(false);
      expect(isSimplifySemiProductConfigEnabled(undefined)).toBe(false);
      expect(isSimplifySemiProductConfigEnabled({})).toBe(false);
      expect(
        isSimplifySemiProductConfigEnabled({ [SIMPLIFY_SEMI_PRODUCT_KEY]: false }),
      ).toBe(false);
      expect(
        isSimplifySemiProductConfigEnabled({ [SIMPLIFY_SEMI_PRODUCT_KEY]: 'false' }),
      ).toBe(false);
      expect(
        isSimplifySemiProductConfigEnabled({ [SIMPLIFY_SEMI_PRODUCT_KEY]: 0 }),
      ).toBe(false);
    });

    it('should return true when simplifySemiProductToCacao or genericCacaoDisplay is true', () => {
      expect(
        isSimplifySemiProductConfigEnabled({ [SIMPLIFY_SEMI_PRODUCT_KEY]: true }),
      ).toBe(true);
      expect(
        isSimplifySemiProductConfigEnabled({ [SIMPLIFY_SEMI_PRODUCT_KEY]: 'true' }),
      ).toBe(true);
      expect(
        isSimplifySemiProductConfigEnabled({ [SIMPLIFY_SEMI_PRODUCT_KEY]: 1 }),
      ).toBe(true);
      expect(
        isSimplifySemiProductConfigEnabled({ [SIMPLIFY_SEMI_PRODUCT_ALT_KEY]: true }),
      ).toBe(true);
      expect(
        isSimplifySemiProductConfigEnabled({ [SIMPLIFY_SEMI_PRODUCT_ALT_KEY]: 'true' }),
      ).toBe(true);
    });
  });

  describe('isPublicDeliveryReceiptConfigEnabled', () => {
    it('should return false for null, undefined, empty, or false config', () => {
      expect(isPublicDeliveryReceiptConfigEnabled(null)).toBe(false);
      expect(isPublicDeliveryReceiptConfigEnabled(undefined)).toBe(false);
      expect(isPublicDeliveryReceiptConfigEnabled({})).toBe(false);
      expect(
        isPublicDeliveryReceiptConfigEnabled({ [PUBLIC_DELIVERY_RECEIPT_CONFIG_KEY]: false }),
      ).toBe(false);
      expect(
        isPublicDeliveryReceiptConfigEnabled({ [PUBLIC_DELIVERY_RECEIPT_CONFIG_KEY]: 'false' }),
      ).toBe(false);
      expect(
        isPublicDeliveryReceiptConfigEnabled({ [PUBLIC_DELIVERY_RECEIPT_CONFIG_KEY]: 0 }),
      ).toBe(false);
    });

    it('should return true when enablePublicDeliveryReceipt is true (boolean, string, or number)', () => {
      expect(
        isPublicDeliveryReceiptConfigEnabled({ [PUBLIC_DELIVERY_RECEIPT_CONFIG_KEY]: true }),
      ).toBe(true);
      expect(
        isPublicDeliveryReceiptConfigEnabled({ [PUBLIC_DELIVERY_RECEIPT_CONFIG_KEY]: 'true' }),
      ).toBe(true);
      expect(
        isPublicDeliveryReceiptConfigEnabled({ [PUBLIC_DELIVERY_RECEIPT_CONFIG_KEY]: 1 }),
      ).toBe(true);
    });
  });
});
