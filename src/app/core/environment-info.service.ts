import { Injectable } from '@angular/core';

type WindowEnv = {
  [key: string]: string | undefined;
};

@Injectable({
  providedIn: 'root'
})
export class EnvironmentInfoService {

  private get env(): WindowEnv {
    const globalWindow = window as any;
    return (globalWindow?.env || {}) as WindowEnv;
  }

  get environmentName(): string {
    return this.env.NODE_ENV || this.env.environmentName || 'production';
  }

  get companyName(): string {
    return this.env.COMPANY_NAME || 'ECUADOR';
  }

  get primaryProductType(): string {
    return this.env.PRIMARY_PRODUCT_TYPE || 'COCOA';
  }

  get productType(): string {
    return this.env.PRODUCT_TYPE || 'MIXED';
  }

  get domain(): string {
    return this.env.DOMAIN || '';
  }

  getEnvironmentBadgeLabel(): string {
    const normalized = this.normalizeEnvironment(this.environmentName);
    switch (normalized) {
      case 'develop':
      case 'development':
      case 'dev':
        return 'DEV';
      case 'test':
      case 'qa':
      case 'staging':
        return 'TEST';
      case 'prod':
      case 'production':
        return 'PROD';
      default:
        return (this.environmentName || 'PROD').toUpperCase();
    }
  }

  getEnvironmentDisplayName(): string {
    const normalized = this.normalizeEnvironment(this.environmentName);
    switch (normalized) {
      case 'develop':
      case 'development':
      case 'dev':
        return 'Desarrollo';
      case 'test':
      case 'qa':
      case 'staging':
        return 'Pruebas';
      case 'prod':
      case 'production':
        return 'Producción';
      default:
        return this.capitalize(normalized || 'operación');
    }
  }

  getEnvironmentBadgeClass(): string {
    const normalized = this.normalizeEnvironment(this.environmentName);
    switch (normalized) {
      case 'develop':
      case 'development':
      case 'dev':
        return 'env-dev';
      case 'test':
      case 'qa':
      case 'staging':
        return 'env-test';
      case 'prod':
      case 'production':
        return 'env-prod';
      default:
        return 'env-generic';
    }
  }

  getProductBadgeLabel(): string {
    const normalized = this.normalizeProductType(this.primaryProductType);
    return normalized.toUpperCase();
  }

  getProductDisplayName(): string {
    const normalized = this.normalizeProductType(this.primaryProductType);
    switch (normalized) {
      case 'coffee':
        return 'Café';
      case 'cocoa':
        return 'Cacao';
      case 'shrimp':
        return 'Camarón';
      default:
        return this.capitalize(normalized || 'producto');
    }
  }

  getProductIconPath(productType?: string): string {
    const normalized = this.normalizeProductType(productType || this.primaryProductType);
    switch (normalized) {
      case 'coffee':
        return '/assets/icons/icon-coffee.png';
      case 'cocoa':
        return '/assets/icons/icon-cocoa.png';
      case 'shrimp':
        return '/assets/icons/icon-shrimp.png';
      default:
        return '/assets/icons/icon-self-onboarding-assistant.png';
    }
  }

  /**
   * Check if the current product type matches a specific type
   */
  isProductType(type: 'coffee' | 'cocoa' | 'shrimp'): boolean {
    return this.normalizeProductType(this.primaryProductType) === type;
  }

  private normalizeEnvironment(value: string): string {
    return (value || '').trim().toLowerCase();
  }

  private normalizeProductType(value: string): string {
    return (value || '').trim().toLowerCase();
  }

  private capitalize(value: string): string {
    if (!value) { return ''; }
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
