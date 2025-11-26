import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiDefaultResponse } from '../../../api/model/apiDefaultResponse';

/**
 * Field Inspection API model used on the frontend.
 * Mirrors the backend ApiFieldInspection for fields that are relevant to UI.
 */
export interface ApiFieldInspection {
  id?: number;
  creationTimestamp?: string;
  updateTimestamp?: string;
  createdById?: number;
  updatedById?: number;
  
  // Stock order references
  sourceStockOrderId?: number;
  sourceStockOrderIdentifier?: string;
  destinationStockOrderId?: number;
  companyId?: number;
  
  // Inspection data
  inspectionDate?: string;
  inspectionTime?: string;
  
  // Producer info
  producerUserCustomerId?: number;
  producerName?: string;
  
  // Sensorial results
  flavorTestResult?: string;  // 'NORMAL' or 'DEFECT'
  flavorDefectTypeId?: number;
  flavorDefectTypeCode?: string;
  flavorDefectTypeLabel?: string;
  purchaseRecommended?: boolean;
  inspectionNotes?: string;
  
  // Reception data
  numberOfGavetas?: number;
  numberOfBines?: number;
  numberOfPiscinas?: number;
  guiaRemisionNumber?: string;
  totalQuantity?: number;
  
  // Computed
  available?: boolean;
}

/**
 * Service for Field Inspection operations.
 * Handles field inspections performed at shrimp farms (camaroneras).
 */
@Injectable({
  providedIn: 'root'
})
export class FieldInspectionService {

  constructor(private http: HttpClient) {}

  /**
   * List available field inspections for a company.
   * Available means not yet linked to a destination stock order.
   * 
   * @param companyId Company ID to filter by
   * @param onlyRecommended If true, only return inspections where purchase is recommended
   */
  getAvailable(companyId: number, onlyRecommended: boolean = false): 
    Observable<{ data: ApiFieldInspection[] }> {
    return this.http.get<{ data: ApiFieldInspection[] }>(
      `${environment.basePath}/api/chain/field-inspection/available/company/${companyId}`,
      { params: { onlyRecommended: onlyRecommended.toString() } }
    );
  }

  /**
   * Get a specific field inspection by ID.
   */
  getById(id: number): Observable<{ data: ApiFieldInspection }> {
    return this.http.get<{ data: ApiFieldInspection }>(
      `${environment.basePath}/api/chain/field-inspection/${id}`
    );
  }

  /**
   * Mark a field inspection as used by linking it to a destination stock order.
   * 
   * @param inspectionId The field inspection ID
   * @param destinationStockOrderId The stock order at the packing plant
   */
  markUsed(inspectionId: number, destinationStockOrderId: number): 
    Observable<ApiDefaultResponse> {
    return this.http.post<ApiDefaultResponse>(
      `${environment.basePath}/api/chain/field-inspection/${inspectionId}/mark-used`,
      {},
      { params: { destinationStockOrderId: destinationStockOrderId.toString() } }
    );
  }

  /**
   * Get display label for flavor test result.
   */
  getFlavorTestResultLabel(result: string | null | undefined): string {
    if (!result) return '-';
    switch (result) {
      case 'NORMAL': return $localize`:@@fieldInspection.flavorTestResult.normal:Normal`;
      case 'DEFECT': return $localize`:@@fieldInspection.flavorTestResult.defect:Con Defecto`;
      default: return result;
    }
  }

  /**
   * Get display label for purchase recommendation.
   */
  getPurchaseRecommendedLabel(recommended: boolean | null | undefined): string {
    if (recommended === null || recommended === undefined) return '-';
    return recommended 
      ? $localize`:@@fieldInspection.purchaseRecommended.yes:Sí, Comprar`
      : $localize`:@@fieldInspection.purchaseRecommended.no:No Comprar`;
  }
}

declare const $localize: (messageParts: TemplateStringsArray, ...placeholders: any[]) => string;
