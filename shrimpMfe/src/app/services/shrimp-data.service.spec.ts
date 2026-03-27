import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ShrimpDataService } from './shrimp-data.service';
import { of } from 'rxjs';

describe('ShrimpDataService', () => {
  let service: ShrimpDataService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    // Reset window.env for consistent testing of baseUrl logic
    (window as any).env = { apiBaseUrl: 'http://localhost:8082/api' };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ShrimpDataService]
    });
    service = TestBed.inject(ShrimpDataService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getSemiProducts', () => {
    it('should fetch value chains and filter semi-products to ONLY "Entero" and "Cola"', (done) => {
      const companyId = 1;
      const expectedBaseUrl = 'http://localhost:8082/api';
      
      const mockValueChainsResponse = {
        data: {
          items: [
            { id: 101, name: 'Dufer Value Chain 1' },
            { id: 102, name: 'Dufer Value Chain 2' }
          ]
        }
      };

      const mockSemiProductsResponse = {
        data: {
          items: [
            { id: 49, name: 'Entero' },
            { id: 50, name: 'Cola' },
            { id: 51, name: 'U10' },
            { id: 52, name: '16/20' }
          ]
        }
      };

      service.getSemiProducts(companyId).subscribe(semiProducts => {
        expect(semiProducts.length).toBe(2);
        
        // Assert strict inclusion of Entero and Cola
        expect(semiProducts.find(sp => sp.name === 'Entero')).toBeTruthy();
        expect(semiProducts.find(sp => sp.name === 'Cola')).toBeTruthy();
        
        // Assert exclusion of others
        expect(semiProducts.find(sp => sp.name === 'U10')).toBeFalsy();
        
        expect(semiProducts[0].id).toBe(49);
        expect(semiProducts[1].id).toBe(50);
        
        done();
      });

      // Assert first call
      const req1 = httpTestingController.expectOne(`${expectedBaseUrl}/company/${companyId}/value-chains`);
      expect(req1.request.method).toEqual('GET');
      req1.flush(mockValueChainsResponse);

      // Assert second call chained by switchMap
      const req2 = httpTestingController.expectOne(`${expectedBaseUrl}/chain/semi-product/list/by-value-chains?valueChainIds=101,102`);
      expect(req2.request.method).toEqual('GET');
      req2.flush(mockSemiProductsResponse);
    });

    it('should return empty array if no value chains exist', (done) => {
      const companyId = 1;
      const expectedBaseUrl = 'http://localhost:8082/api';
      
      const mockValueChainsEmptyResponse = {
        data: {
          items: []
        }
      };

      service.getSemiProducts(companyId).subscribe(semiProducts => {
        expect(semiProducts.length).toBe(0);
        done();
      });

      const req1 = httpTestingController.expectOne(`${expectedBaseUrl}/company/${companyId}/value-chains`);
      expect(req1.request.method).toEqual('GET');
      req1.flush(mockValueChainsEmptyResponse);

      // No second request should be made
      httpTestingController.expectNone(`${expectedBaseUrl}/chain/semi-product/list/by-value-chains?valueChainIds=`);
    });
  });

  describe('createPurchaseOrder', () => {
    it('should post complete StockOrder using the correct API base URL', (done) => {
      const mockParams = {
        facilityId: 101,
        semiProductId: 49,
        producerUserCustomerId: 2,
        totalGrossQuantity: 100,
        tare: 5,
        pricePerUnit: 2.5,
        priceDeterminedLater: false,
        currency: 'USD',
        internalLotNumber: '270326-001',
        deliveryTime: '2026-03-27',
        comments: 'Gavetas: 2',
        preferredWayOfPayment: 'BANK_TRANSFER'
      };

      service.createPurchaseOrder(mockParams).subscribe(res => {
        expect(res.id).toBe(999);
        done();
      });

      const expectedBaseUrl = 'http://localhost:8082/api';
      const req = httpTestingController.expectOne(`${expectedBaseUrl}/chain/stock-order`);
      expect(req.request.method).toEqual('PUT');
      
      // Assert payload correctness
      const payload = req.request.body;
      expect(payload.orderType).toBe('PURCHASE_ORDER');
      expect(payload.totalGrossQuantity).toBe(100);
      expect(payload.tare).toBe(5);
      expect(payload.totalQuantity).toBe(95); // Validating auto calculation subtraction
      expect(payload.fulfilledQuantity).toBe(95);
      expect(payload.availableQuantity).toBe(95);
      expect(payload.pricePerUnit).toBe(2.5);
      expect(payload.priceDeterminedLater).toBe(false);
      expect(payload.comments).toBe('Gavetas: 2');
      
      req.flush({ data: { id: 999 } });
    });
  });
});
