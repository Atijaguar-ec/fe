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

/**
 * Shrimp size catalog entry.
 * productType: ENTERO | COLA
 * nomenclaturePrefix: HEAD_ON | SHELL_ON
 * sizeGroup: STANDARD | BROKEN | OTHERS
 * displayName: computed "SHELL-ON 36/40"
 */
export interface ShrimpSize {
  id: number;
  productType: 'ENTERO' | 'COLA';
  nomenclaturePrefix: 'HEAD_ON' | 'SHELL_ON';
  name: string;
  displayName: string;
  sizeGroup: 'STANDARD' | 'BROKEN' | 'OTHERS';
  semiProductId?: number;
  sortOrder: number;
  active: boolean;
}

/**
 * A sub-lot work item waiting for transformation in a destination area.
 * Produced by classification and consumed by each transformation module.
 * Aligned with DUFER doc point 7: "identificado por lote y talla".
 */
export interface TransformWorkItem {
  subLotId: string;
  lote: string;
  loteSuffix: string;
  talla: ShrimpSize;
  qualityClass: 'A' | 'B' | 'C';
  cantidad: number;
  unidad: 'CAJETAS' | 'GAVETAS';
  libras?: number;
  maquina: string;
  destinationType: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE';
}

/**
 * Area settlement result.
 * DUFER doc point 7.2: "libras recibidas vs masters producidos = liquidación de área".
 */
export interface AreaSettlement {
  destinationType: 'BLOQUE' | 'IQF' | 'VALOR_AGREGADO' | 'SALMUERA';
  lotSuffix: string;
  receivedLbs: number;
  mastersProduced: number;
  masterWeightLbs: number;
  areaShrinkageLbs: number;
  areaYieldPercent: number;
  status: 'PENDING' | 'CLOSED';
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

  /**
   * Returns a classification summary for a lot including sub-lots, KPIs, and rejection data.
   * Used by the 3-tab liquidación component (Tab 1 + Tab 3).
   */
  getClassificationSummary(stockOrderId: number): Observable<any> {
    return this.http.get<ApiResponse<any>>(
      `${this.msBaseUrl}/classification/summary/${stockOrderId}`
    ).pipe(
      map(res => res.data),
      catchError(() => of(null))
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

  // ──── SHRIMP SIZE CATALOG ──────────────────────────────

  /**
   * Lists active shrimp sizes from the catalog.
   * productType: 'ENTERO' | 'COLA'
   * sizeGroup (optional): 'STANDARD' | 'BROKEN' | 'OTHERS'
   * Used by classification screen to populate the talla selector.
   */
  listSizes(productType: string, sizeGroup?: string): Observable<ShrimpSize[]> {
    let url = `${this.msBaseUrl}/sizes?productType=${productType}`;
    if (sizeGroup) url += `&sizeGroup=${sizeGroup}`;
    return this.http.get<ApiResponse<ShrimpSize[]>>(url).pipe(
      map(res => res.data ?? []),
      catchError(() => of([]))
    );
  }

  // ──── TRANSFORMATION WORK QUEUE ───────────────────────

  /**
   * Returns sub-lots pending transformation for a given destination.
   * DUFER doc point 7.2: "el producto recibido es identificado por lote y talla".
   */
  listPendingSubLots(destinationType: string): Observable<TransformWorkItem[]> {
    return this.http.get<ApiResponse<TransformWorkItem[]>>(
      `${this.msBaseUrl}/classifications/pending?destinationType=${destinationType}`
    ).pipe(
      map(res => res.data ?? []),
      catchError(() => of([]))
    );
  }

  // ──── AREA SETTLEMENT ─────────────────────────────────

  /**
   * Returns the area settlement for each destination.
   * DUFER doc point 7.2: "libras recibidas vs masters producidos = liquidación de área".
   */
  getAreaSettlements(stockOrderId: number): Observable<AreaSettlement[]> {
    return this.http.get<ApiResponse<AreaSettlement[]>>(
      `${this.msBaseUrl}/settlement/area-summary/${stockOrderId}`
    ).pipe(
      map(res => res.data ?? []),
      catchError(() => of([]))
    );
  }

  /**
   * Returns the full consolidated settlement (both cycles: Entero + Cola).
   * Reproduces the format of DUFER plant documents 5 & 6.
   */
  getConsolidated(stockOrderId: number): Observable<any> {
    return this.http.get<ApiResponse<any>>(
      `${this.msBaseUrl}/settlement/consolidated/${stockOrderId}`
    ).pipe(
      map(res => res.data),
      catchError(() => of(null))
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

