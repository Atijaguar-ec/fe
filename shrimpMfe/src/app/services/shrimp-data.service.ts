import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, tap, catchError, switchMap } from 'rxjs/operators';
import * as mockDb from '../data/shrimp-mock-db.json';

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
  // Use the same base URL configured in the host app so Keycloak interceptor matches it
  private baseUrl = (window as any)?.['env']?.['apiBaseUrl'] || 'http://localhost:8082/api';

  // We keep the mock data in memory so we can "push" to it during the demo.
  private mockState = { ...mockDb };
  private receptionLotsSubject = new BehaviorSubject<ReceptionLot[]>(
    (this.mockState.reception_lots || []).map((lot: any) => ({
      ...lot,
      supplier_id: lot.supplier_id ?? null,
      supplier_name: lot.supplier_name ?? 'N/A'
    }))
  );

  constructor(private http: HttpClient) {}

  /**
   * 1. LIVE API: Get Active Company Details
   * Calls the real INATrace backend
   */
  getActiveCompany(): Observable<any> {
    // Uses the profile endpoint to determine the logged-in user's company
    return this.http.get<any>(`${this.baseUrl}/user/profile`).pipe(
      map(res => {
        const companyId = res?.data?.companyIds?.[0] || 1;
        return { id: companyId, name: 'Dufer Cia. Ltda.' };
      }),
      catchError(err => {
        console.warn('Could not fetch active company, using fallback', err);
        return of({ id: 1, name: 'Dufer Cia. Ltda.' });
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
        console.warn('Could not fetch facilities, using fallback', err);
        return of([
          { id: 101, name: 'Planta Dufer - Recepción' },
          { id: 102, name: 'Planta Dufer - Clasificadora' },
          { id: 103, name: 'Planta Dufer - Túnel IQF' }
        ]);
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
        console.warn('Could not fetch suppliers, using fallback', err);
        return of([
          { id: 1, name: 'Carlos', surname: 'Mendoza Reyes', displayName: 'Carlos Mendoza Reyes', type: 'FARMER' as const },
          { id: 2, name: 'María', surname: 'Tomalá Suárez', displayName: 'María Tomalá Suárez', type: 'FARMER' as const },
          { id: 3, name: 'Pedro', surname: 'Acopiador Central', displayName: 'Pedro Acopiador Central', type: 'COLLECTOR' as const },
        ]);
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
            return items
              .filter((sp: any) => sp.name === 'Entero' || sp.name === 'Cola')
              .map((sp: any) => ({
                id: sp.id,
                name: sp.name || sp.description
              }));
          })
        );
      }),
      catchError(err => {
        console.warn('Could not fetch semi-products, using fallback', err);
        return of([
          { id: 49, name: 'Entero' },
          { id: 50, name: 'Cola' }
        ]);
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

  // ─── Local State & Queries ─────────────────────────────

  /**
   * 6. LIVE API: Get Today's Reception Records
   * Fetches the purchase orders created today for the reception list
   */
  getTodayReceptions(companyId: number, dateStr: string): Observable<any[]> {
    const params = `isPurchaseOrderOnly=true&productionDateStart=${dateStr}&productionDateEnd=${dateStr}&limit=50&offset=0`;
    return this.http.get<any>(`${this.baseUrl}/chain/stock-order/list/company/${companyId}?${params}`).pipe(
      map(res => {
        const items = res?.data?.items || [];
        return items.map((item: any) => {
          let bines = 0;
          try {
            if (item.comments) {
              const parsed = JSON.parse(item.comments);
              bines = parsed.cajetas || 0;
            }
          } catch { }

          return {
            id: Date.now() + Math.floor(Math.random() * 1000), // Virtual UI ID
            coreStockOrderId: item.id,
            lotNumber: item.internalLotNumber || 'Desconocido',
            supplierName: item.producerUserCustomer?.name ? `${item.producerUserCustomer.name} ${item.producerUserCustomer.surname || ''}`.trim() : 'Proveedor GIZ',
            supplierId: item.producerUserCustomer?.id || null,
            pesoBruto: item.totalGrossQuantity || 0,
            bines: bines,
            tipo: item.semiProduct?.name || 'Entero',
            fecha: new Date(item.productionDate),
            saved: true
          };
        });
      }),
      catchError(err => {
        console.warn('Could not fetch today receptions', err);
        return of([]);
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

  /**
   * 8. MOCK DB: Save Classification Output
   */
  saveClassificationOutput(output: any): Observable<any> {
    const newOutput = {
      ...output,
      id: `co-${Date.now()}`
    };
    this.mockState.classification_outputs.push(newOutput);
    return of(newOutput);
  }
}
