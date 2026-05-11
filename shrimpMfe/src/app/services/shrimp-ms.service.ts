import { Injectable, Inject, Optional } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

/**
 * API client for the ms-shrimp microservice.
 * All shrimp-specific traceability operations go through this service.
 * NEVER calls Core endpoints — only /api/shrimp/*.
 */

export interface ApiResponse<T> {
  status: string;
  data: T;
  errorMessage?: string;
}

export interface ReceptionExt {
  stockOrderId: number;
  internalLotBase: string;
  shrimpType: 'ENTERO' | 'COLA';
  totalWeightLbs: number;
  binsCount: number;
  temperatureCelsius?: number;
  status: string;
  createdAt: string;
  createdBy: string;
}

export interface Classification {
  id: string;
  stockOrderId: number;
  roundNumber: number;
  rejectedWeightLbs?: number;
  classifiedAt: string;
  classifiedBy: string;
}

export interface ClassificationDetail {
  id: string;
  classificationId: string;
  shrimpSize: string;
  weightLbs: number;
  cajetasCount: number;
}

export interface ProductiveDestination {
  id: string;
  classificationDetailId: string;
  destinationType: 'BLOQUE' | 'IQF' | 'VALOR_AGREGADO' | 'SALMUERA';
  lotSuffix: string;
  allocatedWeightLbs: number;
}

export interface ProcessingLot {
  id: string;
  destinationId: string;
  outputMasters: number;
  shrinkageLbs?: number;
  shrinkageReason?: string;
  status: string;
  processedAt: string;
}

export interface MasterCarton {
  id: string;
  processingLotId: string;
  brand: string;
  shrimpSize: string;
  presentation: string;
  freezeType: string;
  grossWeightLbs: number;
  qrCode?: string;
}

export interface ColdStorageSlot {
  id: string;
  chamberName: string;
  slotCode: string;
  capacityMasters: number;
}

export interface ColdStorageMovement {
  id: string;
  processingLotId: string;
  slotId: string;
  quantityMasters: number;
  movementType: 'IN' | 'OUT';
  movedAt: string;
  movedBy: string;
  justification?: string;
}

export interface CommercialPresentation {
  id: string;
  brandName: string;
  destino: string;
  name: string;
  weightPerUnit: number;
  unitLabel: string;
  companyId: number;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class ShrimpMsService {

  private readonly msBaseUrl: string;

  constructor(private http: HttpClient) {
    // ms-shrimp runs on port 8085
    this.msBaseUrl = (window as any)?.['env']?.['shrimpApiBaseUrl']
      ?? 'http://localhost:8085/api/shrimp';
  }

  // ──── RECEPTION ────────────────────────────────────────

  getReception(stockOrderId: number): Observable<ReceptionExt | null> {
    return this.http.get<ApiResponse<ReceptionExt>>(`${this.msBaseUrl}/reception/${stockOrderId}`).pipe(
      map(res => res.data),
      catchError(() => of(null))
    );
  }

  createReception(data: Partial<ReceptionExt>): Observable<ReceptionExt> {
    return this.http.post<ApiResponse<ReceptionExt>>(`${this.msBaseUrl}/reception`, data).pipe(
      map(res => res.data)
    );
  }

  // ──── CLASSIFICATION ───────────────────────────────────

  getClassification(id: string): Observable<Classification | null> {
    return this.http.get<ApiResponse<Classification>>(`${this.msBaseUrl}/classification/${id}`).pipe(
      map(res => res.data),
      catchError(() => of(null))
    );
  }

  getClassificationsByLot(stockOrderId: number): Observable<Classification[]> {
    return this.http.get<ApiResponse<Classification[]>>(`${this.msBaseUrl}/classification/by-lot/${stockOrderId}`).pipe(
      map(res => res.data || []),
      catchError(() => of([]))
    );
  }

  createClassification(data: Partial<Classification>): Observable<Classification> {
    return this.http.post<ApiResponse<Classification>>(`${this.msBaseUrl}/classification`, data).pipe(
      map(res => res.data)
    );
  }

  // ──── CLASSIFICATION DETAIL ────────────────────────────

  createClassificationDetail(data: Partial<ClassificationDetail>): Observable<ClassificationDetail> {
    return this.http.post<ApiResponse<ClassificationDetail>>(`${this.msBaseUrl}/classification-detail`, data).pipe(
      map(res => res.data)
    );
  }

  // ──── PRODUCTIVE DESTINATION ───────────────────────────

  createDestination(data: Partial<ProductiveDestination>): Observable<ProductiveDestination> {
    return this.http.post<ApiResponse<ProductiveDestination>>(`${this.msBaseUrl}/productive-destination`, data).pipe(
      map(res => res.data),
      tap(dest => console.log('[ShrimpMsService] Destination created with suffix:', dest.lotSuffix))
    );
  }

  // ──── PROCESSING LOT ──────────────────────────────────

  createProcessingLot(data: Partial<ProcessingLot>): Observable<ProcessingLot> {
    return this.http.post<ApiResponse<ProcessingLot>>(`${this.msBaseUrl}/processing-lot`, data).pipe(
      map(res => res.data)
    );
  }

  // ──── MASTER CARTON ───────────────────────────────────

  createMasterCarton(data: Partial<MasterCarton>): Observable<MasterCarton> {
    return this.http.post<ApiResponse<any>>(`${this.msBaseUrl}/master-carton`, data).pipe(
      map(res => res.data)
    );
  }

  // ──── COLD STORAGE ────────────────────────────────────

  getSlots(): Observable<ColdStorageSlot[]> {
    return this.http.get<ApiResponse<ColdStorageSlot[]>>(`${this.msBaseUrl}/cold-storage/slots`).pipe(
      map(res => res.data || []),
      catchError(() => of([]))
    );
  }

  createSlot(data: Partial<ColdStorageSlot>): Observable<ColdStorageSlot> {
    return this.http.post<ApiResponse<ColdStorageSlot>>(`${this.msBaseUrl}/cold-storage/slots`, data).pipe(
      map(res => res.data)
    );
  }

  createMovement(data: Partial<ColdStorageMovement>): Observable<ColdStorageMovement & { fifoWarning?: string }> {
    return this.http.post<ApiResponse<ColdStorageMovement & { fifoWarning?: string }>>(`${this.msBaseUrl}/cold-storage/movement`, data).pipe(
      map(res => res.data)
    );
  }

  // ──── RECEPTION LIST ──────────────────────────────────

  listReceptions(): Observable<ReceptionExt[]> {
    return this.http.get<ApiResponse<ReceptionExt[]>>(`${this.msBaseUrl}/reception/list`).pipe(
      map(res => res.data || []),
      catchError(() => of([]))
    );
  }

  closeReception(stockOrderId: number): Observable<ReceptionExt> {
    return this.http.put<ApiResponse<ReceptionExt>>(`${this.msBaseUrl}/reception/${stockOrderId}/close`, {}).pipe(
      map(res => res.data)
    );
  }

  // ──── REJECTION CYCLE ─────────────────────────────────

  createRejection(data: { classificationId: string; lbsRejected: number }): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.msBaseUrl}/rejection-cycle`, data).pipe(
      map(res => res.data)
    );
  }

  completeBeheading(cycleId: string, lbsRecoveredCola: number, lbsWasteHeads: number): Observable<any> {
    return this.http.put<ApiResponse<any>>(
      `${this.msBaseUrl}/rejection-cycle/${cycleId}/complete-beheading?lbsRecoveredCola=${lbsRecoveredCola}&lbsWasteHeads=${lbsWasteHeads}`, {}
    ).pipe(map(res => res.data));
  }

  completeReentry(cycleId: string): Observable<any> {
    return this.http.put<ApiResponse<any>>(`${this.msBaseUrl}/rejection-cycle/${cycleId}/complete-reentry`, {}).pipe(
      map(res => res.data)
    );
  }

  // ──── WASTE RECORD ────────────────────────────────────

  createWasteRecord(data: { wasteType: string; weightLbs: number; reason?: string; processingLotId?: string; rejectionCycleId?: string }): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.msBaseUrl}/waste-record`, data).pipe(
      map(res => res.data)
    );
  }

  // ──── SETTLEMENT ──────────────────────────────────────

  getSettlementSummary(stockOrderId: number): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.msBaseUrl}/settlement/summary/${stockOrderId}`).pipe(
      map(res => res.data),
      catchError(() => of(null))
    );
  }

  closeSettlement(stockOrderId: number): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.msBaseUrl}/settlement/close/${stockOrderId}`, {}).pipe(
      map(res => res.data)
    );
  }

  // ──── COMMERCIAL PRESENTATIONS ─────────────────────────

  listPresentations(companyId: number, destino?: string): Observable<CommercialPresentation[]> {
    let url = `${this.msBaseUrl}/commercial-presentation/company/${companyId}`;
    if (destino) url += `?destino=${destino}`;
    return this.http.get<ApiResponse<CommercialPresentation[]>>(url).pipe(
      map(res => res.data ?? []),
      catchError(() => of([]))
    );
  }

  createPresentation(data: Partial<CommercialPresentation>): Observable<CommercialPresentation> {
    return this.http.post<ApiResponse<CommercialPresentation>>(`${this.msBaseUrl}/commercial-presentation`, data).pipe(
      map(res => res.data)
    );
  }

  updatePresentation(id: string, data: Partial<CommercialPresentation>): Observable<CommercialPresentation> {
    return this.http.put<ApiResponse<CommercialPresentation>>(`${this.msBaseUrl}/commercial-presentation/${id}`, data).pipe(
      map(res => res.data)
    );
  }

  deletePresentation(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.msBaseUrl}/commercial-presentation/${id}`).pipe(
      map(res => res.data)
    );
  }
}

