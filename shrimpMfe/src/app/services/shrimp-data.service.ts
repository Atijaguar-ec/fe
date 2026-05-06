import { Injectable, Inject, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, tap, catchError, switchMap } from 'rxjs/operators';
import { INATRACE_API_BASE_URL } from '@inatrace/shared-auth';

export interface ShrimpFacility {
  id: number;
  name: string;
  code?: string;
}

export interface ShrimpSemiProduct {
  id: number;
  name: string;
}

export interface ShrimpSupplier {
  id: number;
  name: string;
  surname: string;
  displayName: string;
  type: 'FARMER' | 'COLLECTOR';
  location?: string;
  phone?: string;
}

export interface ReceptionLot {
  id: string;
  base_lot_number: string;
  supplier_id: number | null;
  supplier_name: string;
  gross_weight_lbs: number;
  bins_count: number;
  product_type: string;
  reception_date: string;
}

@Injectable({
  providedIn: 'root'
})
export class ShrimpDataService {
  /**
   * API base URL resolved via dependency injection priority chain:
   *  1. INATRACE_API_BASE_URL token (provided by host via provideInatraceAuth)
   *  2. window.env.apiBaseUrl (runtime config injected by Docker/CI)
   *  3. Dev-only fallback for standalone `nx serve shrimpMfe`
   */
  private readonly baseUrl: string;

  // No mock data — all data comes from Core API or ms-shrimp
  private receptionLotsSubject = new BehaviorSubject<ReceptionLot[]>([]);

  constructor(
    private http: HttpClient,
    @Optional() @Inject(INATRACE_API_BASE_URL) injectedApiBaseUrl: string | null
  ) {
    this.baseUrl = injectedApiBaseUrl
      ?? (window as any)?.['env']?.['apiBaseUrl']
      ?? 'http://localhost:8082/api'; // dev-only fallback — never reached when hosted
  }

  /**
   * 1. LIVE API: Get Active Company Details
   * Calls the real INATrace backend — requires valid session
   */
  getActiveCompany(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/user/profile`).pipe(
      catchError((err) => {
        console.error('[ShrimpData] No se pudo obtener la compañía activa. ¿Está logueado?', err?.status);
        return of(null);
      })
    );
  }

  /**
   * 2. LIVE API: Get Facilities
   * Calls the real INATrace backend for facilities bound to the selected company
   */
  getFacilities(companyId: number): Observable<ShrimpFacility[]> {
    return this.http.get<any>(`${this.baseUrl}/chain/facility/list/collecting/company/${companyId}?limit=100&offset=0`).pipe(
      map(res => res?.data?.items || []),
      catchError(err => {
        console.error('[ShrimpData] Error al cargar instalaciones del Core:', err?.status, err?.message);
        return of([]);
      })
    );
  }

  /**
   * 3. LIVE API: Get Suppliers (Farmers/Collectors)
   * Reads from the Core's userCustomers endpoint
   */
  getSuppliers(companyId: number): Observable<ShrimpSupplier[]> {
    return this.http.get<any>(`${this.baseUrl}/company/userCustomers/${companyId}/FARMER?limit=200&offset=0`).pipe(
      map(res => {
        const items = res?.data?.items || [];
        return items.map((uc: any) => ({
          id: uc.id,
          name: uc.name || '',
          surname: uc.surname || '',
          displayName: `${uc.name || ''} ${uc.surname || ''}`.trim(),
          type: uc.type || 'FARMER',
          location: uc.location,
          phone: uc.phone
        }));
      }),
      catchError(err => {
        console.error('[ShrimpData] Error al cargar proveedores del Core:', err?.status, err?.message);
        return of([]);
      })
    );
  }

  /**
   * 4. LIVE API: Get Semi-Products for the company/value chain
   */
  getSemiProducts(companyId: number): Observable<ShrimpSemiProduct[]> {
    return this.http.get<any>(`${this.baseUrl}/company/${companyId}/value-chains`).pipe(
      switchMap(res => {
        // First get the value chains linked to the company
        const valueChains = res?.data?.items || [];
        const vcIds = valueChains.map((vc: any) => vc.id);
        
        if (vcIds.length === 0) {
          return of([]); // Return empty if no value chains
        }

        // Then query the real semi-products endpoint by those value chains
        return this.http.get<any>(`${this.baseUrl}/chain/semi-product/list/by-value-chains?valueChainIds=${vcIds.join(',')}`).pipe(
          map(spRes => {
            const items = spRes?.data?.items || [];
            return items.map((sp: any) => {
              let uiName = sp.name || sp.description || '';
              if (uiName.includes('Entero')) uiName = 'Entero';
              else if (uiName.includes('Cola')) uiName = 'Cola';
              
              return {
                id: sp.id,
                name: uiName,
                originalName: sp.name || sp.description
              };
            });
          })
        );
      }),
      catchError(err => {
        console.error('[ShrimpData] Error al cargar semi-productos del Core:', err?.status, err?.message);
        return of([]);
      })
    );
  }

  /**
   * 5. LIVE API: Create Purchase Order (Reception delivery)
   *
   * Calls PUT /api/chain/stock-order with orderType: PURCHASE_ORDER
   * This is the same endpoint the Core FE uses for "Entrega nuevo".
   *
   * Required fields by the backend:
   *  - facility.id
   *  - semiProduct.id
   *  - producerUserCustomer.id
   *  - totalGrossQuantity
   *  - totalQuantity (auto-calculated: gross - tare)
   *  - fulfilledQuantity (= totalQuantity for new orders)
   *  - availableQuantity (= totalQuantity for new orders)
   *  - pricePerUnit OR priceDeterminedLater=true
   *  - orderType: PURCHASE_ORDER
   */
  createPurchaseOrder(params: {
    id?: number;
    facilityId: number;
    semiProductId: number;
    producerUserCustomerId: number;
    totalGrossQuantity: number;
    tare?: number;
    pricePerUnit?: number;
    priceDeterminedLater?: boolean;
    currency?: string;
    internalLotNumber: string;
    deliveryTime: string;        // ISO date  YYYY-MM-DD
    comments?: string;
    preferredWayOfPayment?: string;
  }): Observable<{ id: number }> {
    const tare = params.tare || 0;
    const totalQuantity = params.totalGrossQuantity - tare;

    const payload: any = {
      ...(params.id ? { id: params.id } : {}),
      orderType: 'PURCHASE_ORDER',
      facility: { id: params.facilityId },
      semiProduct: { id: params.semiProductId },
      producerUserCustomer: { id: params.producerUserCustomerId },
      totalGrossQuantity: params.totalGrossQuantity,
      totalQuantity: totalQuantity,
      fulfilledQuantity: totalQuantity,
      availableQuantity: totalQuantity,
      tare: tare > 0 ? tare : null,
      internalLotNumber: params.internalLotNumber,
      deliveryTime: params.deliveryTime,
      productionDate: params.deliveryTime,
      currency: params.currency || 'USD',
      isPurchaseOrder: true,
      comments: params.comments || null,
      preferredWayOfPayment: params.preferredWayOfPayment || 'CASH',
    };

    // Price: either set or mark as "determine later"
    if (params.priceDeterminedLater) {
      payload.priceDeterminedLater = true;
    } else {
      payload.pricePerUnit = params.pricePerUnit ?? 0;
      payload.priceDeterminedLater = false;
    }
    return this.http.put<any>(`${this.baseUrl}/chain/stock-order`, payload).pipe(
      map(res => ({ id: res?.data?.id || res?.id })),
      tap(result => console.log('[ShrimpDataService] StockOrder created:', result)),
      catchError(err => {
        console.error('[ShrimpDataService] Error creating StockOrder:', err);
        throw err;
      })
    );
  }

  /**
   * 6. LIVE API: Get Today's Reception Records
   * Now reads from ms-shrimp (source of truth for shrimp receptions)
   */
  getTodayReceptions(companyId: number, dateStr: string): Observable<any[]> {
    // Read from ms-shrimp directly — that's where we save now
    const msBaseUrl = (window as any)?.['env']?.['shrimpApiBaseUrl']
      ?? 'http://localhost:8085/api/shrimp';

    return this.http.get<any>(`${msBaseUrl}/reception/list`).pipe(
      map(res => {
        const items = res?.data || [];
        return items.map((item: any) => ({
          id: Date.now() + Math.floor(Math.random() * 1000),
          coreStockOrderId: item.stockOrderId,
          lotNumber: item.internalLotBase || 'Desconocido',
          supplierName: item.createdBy || 'Operador',
          supplierId: null,
          pesoBruto: item.totalWeightLbs || 0,
          bines: item.binsCount || 0,
          tipo: item.shrimpType === 'COLA' ? 'Cola' : 'Entero',
          fecha: new Date(item.createdAt || new Date()),
          saved: true
        }));
      }),
      catchError(err => {
        console.error('[ShrimpData] Error al cargar recepciones de ms-shrimp:', err?.status, err?.message);
        return of([]);
      })
    );
  }

  // ─── MÓDULO: CLASIFICACIÓN ─────────────────────────────

  /**
   * C1. LIVE API: Get Available Reception Lots
   * Requests open balances for the company that are Entero or Cola
   */
  getAvailableForClassification(companyId: number): Observable<any[]> {
    const params = `availableOnly=true&limit=100&offset=0`;
    return this.http.get<any>(`${this.baseUrl}/chain/stock-order/list/company/${companyId}?${params}`).pipe(
      map(res => {
        const items = res?.data?.items || [];
        // Only keep "Entero" or "Cola" (which are typically inputs for Clasificación)
        return items
          .filter((item: any) => {
            const name = item.semiProduct?.name || '';
            const available = item.availableQuantity ?? item.totalGrossQuantity ?? 0;
            return (name.includes('Entero') || name.includes('Cola')) && available > 0;
          })
          .map((item: any) => {
            let isRechazo = false;
            try {
              const meta = item.comments ? JSON.parse(item.comments) : {};
              isRechazo = !!meta.rechazoDeClasificacion;
            } catch (_) { /* comments might not be JSON */ }

            return {
              coreStockOrderId: item.id,
              lotNumber: item.internalLotNumber || 'Desconocido',
              pesoBruto: item.availableQuantity ?? item.totalGrossQuantity ?? 0,
              tipo: item.semiProduct?.name?.includes('Cola') ? 'Cola' : 'Entero',
              facilityId: item.facility?.id,
              fecha: new Date(item.productionDate),
              isRechazo
            };
          });
      }),
      tap(l => console.log('[ShrimpDataService] Got stock for classification:', l.length)),
      catchError(err => {
        console.warn('Could not fetch stock for classification:', err);
        return of([]);
      })
    );
  }

  /**
   * C2. LIVE API: Get Classification action definition
   * Fetches the specific ProcessingAction linked to 'CLAS'
   */
  getClassificationAction(companyId: number): Observable<any> {
    const params = 'actionType=PROCESSING&limit=50';
    return this.http.get<any>(`${this.baseUrl}/chain/processing-action/list/company/${companyId}?${params}`).pipe(
      map(res => {
        const items = res?.data?.items || [];
        return items.find((pa: any) => pa.prefix === 'CLAS');
      }),
      catchError(err => {
        console.warn('Error fetching classification PA:', err);
        return of(null);
      })
    );
  }

  /**
   * C3. LIVE API: Submit Classification Order
   * Performs the multi-target StockOrder depletion -> creation map
   */
  submitClassificationOrder(payload: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/chain/processing-order`, payload).pipe(
      map(res => ({ id: res?.data?.id || res?.id, success: true })),
      tap(result => console.log('[ShrimpDataService] Classification executed:', result)),
      catchError(err => {
        console.error('[ShrimpDataService] Error processing classification:', err);
        throw err;
      })
    );
  }

  // ─── Mocks & Utilities ─────────────────────────────

  /**
   * 6. LOCAL: Get Reception Lots (in-memory cache)
   */
  getReceptionLots(): Observable<ReceptionLot[]> {
    return this.receptionLotsSubject.asObservable();
  }

  /**
   * 7. LOCAL: Push lot to local cache after Core persistence
   */
  pushLocalReceptionLot(lot: ReceptionLot): void {
    const current = this.receptionLotsSubject.value;
    this.receptionLotsSubject.next([lot, ...current]);
  }

}
