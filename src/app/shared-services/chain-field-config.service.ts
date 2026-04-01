/**
 * 🔧 Chain Field Configuration Service
 * 
 * Controla la visibilidad y obligatoriedad de campos según el tipo de producto.
 * Centraliza la lógica de qué campos se muestran para cada cadena.
 * 
 * - Cacao/Café: SÍ manejan precios → mostrar campos de precio
 * - Cacao: NO usa humedad → ocultar campo moisturePercentage
 * 
 * @author INATrace DevOps Team
 * @version 1.1.0
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EnvironmentInfoService } from '../core/environment-info.service';

/**
 * Configuración de un campo individual
 */
export interface FieldConfig {
  visible: boolean;
  required: boolean;
  readOnly?: boolean;
}

/**
 * Configuración de campos por módulo
 */
export interface ChainFieldConfiguration {
  // Campos de Customer Order (pedidos de cliente)
  customerOrder: {
    currencyForEndCustomer: FieldConfig;
    pricePerUnitForEndCustomer: FieldConfig;
  };
  
  // Campos de Stock Order (entregas/recepciones)
  stockOrder: {
    moisturePercentage: FieldConfig;
    organicCertification: FieldConfig;
    pricePerUnit: FieldConfig;
    currency: FieldConfig;
    damagedWeightDeduction: FieldConfig;
    damagedPriceDeduction: FieldConfig;
    finalPriceDiscount: FieldConfig;
    tare: FieldConfig;
    cost: FieldConfig;  // Pago inicial (Base payment)
    balance: FieldConfig;  // Saldo pendiente (Open balance)
    preferredWayOfPayment: FieldConfig;
    priceDeterminedLater: FieldConfig;
  };
  
  // Campos de Payment (pagos)
  payment: {
    bankTransferEvidence: FieldConfig;
    receiptDocument: FieldConfig;
  };
}

/**
 * Configuraciones predefinidas por tipo de cadena
 */
const CHAIN_CONFIGURATIONS: Record<string, ChainFieldConfiguration> = {
  
  // ============================================================================
  // COCOA - Configuración por defecto
  // ============================================================================
  COCOA: {
    customerOrder: {
      currencyForEndCustomer: { visible: true, required: true },
      pricePerUnitForEndCustomer: { visible: true, required: true }
    },
    stockOrder: {
      moisturePercentage: { visible: false, required: false },
      organicCertification: { visible: true, required: false },
      pricePerUnit: { visible: true, required: true },
      currency: { visible: true, required: true },
      damagedWeightDeduction: { visible: true, required: false },
      damagedPriceDeduction: { visible: true, required: false },
      finalPriceDiscount: { visible: true, required: false },
      tare: { visible: true, required: false },
      cost: { visible: true, required: false },  // Pago inicial visible
      balance: { visible: true, required: false },  // Saldo pendiente visible
      preferredWayOfPayment: { visible: true, required: true },
      priceDeterminedLater: { visible: true, required: false }
    },
    payment: {
      bankTransferEvidence: { visible: true, required: false },
      receiptDocument: { visible: true, required: false }
    }
  },
  

  
  // ============================================================================
  // COFFEE - Similar a cocoa
  // ============================================================================
  COFFEE: {
    customerOrder: {
      currencyForEndCustomer: { visible: true, required: true },
      pricePerUnitForEndCustomer: { visible: true, required: true }
    },
    stockOrder: {
      moisturePercentage: { visible: true, required: false },  // Café puede usar humedad
      organicCertification: { visible: true, required: false },
      pricePerUnit: { visible: true, required: true },
      currency: { visible: true, required: true },
      damagedWeightDeduction: { visible: true, required: false },
      damagedPriceDeduction: { visible: true, required: false },
      finalPriceDiscount: { visible: true, required: false },
      tare: { visible: true, required: false },
      cost: { visible: true, required: false },  // ☕ Pago inicial visible
      balance: { visible: true, required: false },  // ☕ Saldo pendiente visible
      preferredWayOfPayment: { visible: true, required: true },
      priceDeterminedLater: { visible: true, required: false }
    },
    payment: {
      bankTransferEvidence: { visible: true, required: false },
      receiptDocument: { visible: true, required: false }
    }
  }
};

@Injectable({
  providedIn: 'root'
})
export class ChainFieldConfigService {

  /**
   * Configuración actual reactiva
   */
  private _config$ = new BehaviorSubject<ChainFieldConfiguration>(
    CHAIN_CONFIGURATIONS['COCOA']
  );

  /**
   * Observable público de la configuración
   */
  public readonly config$: Observable<ChainFieldConfiguration> = this._config$.asObservable();

  /**
   * Tipo de producto activo
   */
  private _productType: string = 'COCOA';

  constructor(private envService: EnvironmentInfoService) {
    this.loadConfiguration();
  }

  /**
   * Carga la configuración basada en PRIMARY_PRODUCT_TYPE
   */
  private loadConfiguration(): void {
    this._productType = this.envService.primaryProductType || 'COCOA';
    const config = CHAIN_CONFIGURATIONS[this._productType] || CHAIN_CONFIGURATIONS['COCOA'];
    
    this._config$.next(config);
    
    console.log(`🔧 Chain Field Config loaded for: ${this._productType}`);
  }

  /**
   * Obtiene la configuración actual (síncrono)
   */
  getCurrentConfig(): ChainFieldConfiguration {
    return this._config$.value;
  }

  /**
   * Verifica si un campo es visible
   */
  isFieldVisible(module: keyof ChainFieldConfiguration, fieldName: string): boolean {
    const moduleConfig = this._config$.value[module] as any;
    if (!moduleConfig || !moduleConfig[fieldName]) {
      return true; // Default visible si no hay config
    }
    return moduleConfig[fieldName].visible;
  }

  /**
   * Verifica si un campo es obligatorio
   */
  isFieldRequired(module: keyof ChainFieldConfiguration, fieldName: string): boolean {
    const moduleConfig = this._config$.value[module] as any;
    if (!moduleConfig || !moduleConfig[fieldName]) {
      return false;
    }
    return moduleConfig[fieldName].required;
  }

  /**
   * Observable para visibilidad de un campo específico
   */
  isFieldVisible$(module: keyof ChainFieldConfiguration, fieldName: string): Observable<boolean> {
    return this.config$.pipe(
      map(config => {
        const moduleConfig = config[module] as any;
        if (!moduleConfig || !moduleConfig[fieldName]) {
          return true;
        }
        return moduleConfig[fieldName].visible;
      })
    );
  }

  /**
   * Observable para obligatoriedad de un campo específico
   */
  isFieldRequired$(module: keyof ChainFieldConfiguration, fieldName: string): Observable<boolean> {
    return this.config$.pipe(
      map(config => {
        const moduleConfig = config[module] as any;
        if (!moduleConfig || !moduleConfig[fieldName]) {
          return false;
        }
        return moduleConfig[fieldName].required;
      })
    );
  }

  /**
   * Obtiene la configuración de un campo específico
   */
  getFieldConfig(module: keyof ChainFieldConfiguration, fieldName: string): FieldConfig {
    const moduleConfig = this._config$.value[module] as any;
    if (!moduleConfig || !moduleConfig[fieldName]) {
      return { visible: true, required: false };
    }
    return moduleConfig[fieldName];
  }

  /**
   * Obtiene el tipo de producto activo
   */
  getProductType(): string {
    return this._productType;
  }
}
