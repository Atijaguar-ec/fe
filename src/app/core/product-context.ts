import { InjectionToken } from '@angular/core';
import { EnvironmentInfoService } from './environment-info.service';

export type ProductType = 'coffee' | 'cocoa' | 'shrimp' | 'mixed';

export interface ProductContext {
  primaryProductType: ProductType;
  productType: ProductType;
}

export const PRODUCT_CONTEXT = new InjectionToken<ProductContext>('PRODUCT_CONTEXT');

function normalizeProductType(value: string): ProductType {
  const normalized = (value || '').trim().toLowerCase();
  switch (normalized) {
    case 'coffee':
      return 'coffee';
    case 'cocoa':
      return 'cocoa';
    case 'shrimp':
      return 'shrimp';
    case 'mixed':
      return 'mixed';
    default:
      // Default to mixed when unknown to avoid breaking behavior
      return 'mixed';
  }
}

export function productContextFactory(env: EnvironmentInfoService): ProductContext {
  const primary = normalizeProductType(env.primaryProductType);
  const product = normalizeProductType(env.productType);
  return {
    primaryProductType: primary,
    productType: product
  };
}
