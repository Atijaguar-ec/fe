import { Injectable } from '@angular/core';

/**
 * Servicio profesional para manejar la visibilidad de campos según el tipo de producto
 * configurado a nivel de sistema (variables de entorno)
 */
@Injectable({
  providedIn: 'root'
})
export class ProductFieldVisibilityService {

  private readonly systemProductType: string;
  
  // Configuración simple: campos ocultos por tipo de producto
  private readonly hiddenFieldsByProductType = {
    COFFEE: [
      'fermentationDays',
      'dryingMethod'
    ],
    CACAO: [
      'numberOfPlants',
      'processingMethod'
    ],
    SHRIMP: [
      'numberOfPlants',
      'processingMethod',
      'fermentationDays',
      'dryingMethod',
      'maxProductionQuantity' 
    ]
  };

  constructor() {
    this.systemProductType = this.getSystemProductTypeFromEnv();
  }

  /**
   * Determina si un campo debe ser visible
   * @param fieldName Nombre del campo a verificar
   * @param productType Tipo de producto específico (opcional)
   * @returns true si el campo debe ser visible
   */
  shouldShowField(fieldName: string, productType?: any): boolean {
    const typeToCheck = productType ? this.extractProductTypeName(productType) : this.systemProductType;
    const hiddenFields = this.hiddenFieldsByProductType[typeToCheck] || [];
    
    return !hiddenFields.includes(fieldName);
  }

  /**
   * Obtiene el tipo de producto principal del sistema
   */
  getSystemProductType(): string {
    return this.systemProductType;
  }

  /**
   * Verifica si el sistema está configurado para un tipo de producto específico
   */
  isSystemConfiguredFor(productType: string): boolean {
    return this.systemProductType === productType.toUpperCase();
  }

  /**
   * Obtiene los campos ocultos para un tipo de producto
   */
  getHiddenFields(productType?: string): string[] {
    const type = productType ? productType.toUpperCase() : this.systemProductType;
    return [...(this.hiddenFieldsByProductType[type] || [])];
  }

  /**
   * Obtiene información de debug sobre la configuración actual
   */
  getDebugInfo(): any {
    return {
      systemProductType: this.systemProductType,
      hiddenFields: this.getHiddenFields(),
      allConfiguration: this.hiddenFieldsByProductType
    };
  }

  /**
   * Obtiene el tipo de producto desde variables de entorno
   */
  private getSystemProductTypeFromEnv(): string {
    const envProductType = (window as any)?.env?.primaryProductType || 'CACAO';
    return envProductType.toUpperCase();
  }

  /**
   * Extrae el nombre del tipo de producto desde diferentes formatos
   */
  private extractProductTypeName(productType: any): string {
    if (typeof productType === 'string') {
      return productType.toUpperCase();
    }
    
    if (productType && typeof productType === 'object') {
      const name = productType.code || productType.name || productType.type || '';
      return name.toUpperCase();
    }
    
    return this.systemProductType;
  }
}
