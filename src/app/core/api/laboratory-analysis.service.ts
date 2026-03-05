import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiDefaultResponse } from '../../../api/model/apiDefaultResponse';
import { ApiDocument } from '../../../api/model/apiDocument';

/**
 * Minimal LaboratoryAnalysis API model used on the frontend.
 * Mirrors the backend ApiLaboratoryAnalysis for fields that are relevant to UI.
 */
export interface ApiLaboratoryAnalysis {
  id?: number;
  creationTimestamp?: string;
  updateTimestamp?: string;
  createdById?: number;
  updatedById?: number;
  stockOrderId?: number;
  analysisType?: string;
  analysisDate?: string;
  sensorialRawOdor?: string;
  sensorialRawTaste?: string;
  sensorialRawColor?: string;
  sensorialCookedOdor?: string;
  sensorialCookedTaste?: string;
  sensorialCookedColor?: string;
  qualityNotes?: string;
  metabisulfiteLevelAcceptable?: boolean;
  approvedForPurchase?: boolean;
  qualityDocument?: ApiDocument;
}

@Injectable({
  providedIn: 'root'
})
export class LaboratoryAnalysisService {

  constructor(private http: HttpClient) {}

  /**
   * List approved & unused lab analyses for a company.
   */
  getApprovedAvailable(companyId: number, language: string = 'ES'):
    Observable<{ data: ApiLaboratoryAnalysis[] }> {
    return this.http.get<{ data: ApiLaboratoryAnalysis[] }>(
      `${environment.basePath}/api/chain/laboratory-analysis/approved-available/company/${companyId}`,
      { params: { language } }
    );
  }

  /**
   * Mark an analysis as used by linking it to a destination StockOrder.
   */
  markUsed(analysisId: number, destinationStockOrderId: number):
    Observable<ApiDefaultResponse> {
    return this.http.post<ApiDefaultResponse>(
      `${environment.basePath}/api/chain/laboratory-analysis/${analysisId}/mark-used`,
      {},
      { params: { destinationStockOrderId: destinationStockOrderId.toString() } }
    );
  }
}
