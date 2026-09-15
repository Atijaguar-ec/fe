import { TestBed } from '@angular/core/testing';
import {
  HTTP_INTERCEPTORS,
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import {
  DecimalFormatInterceptor,
  sanitizeDecimals,
} from './decimal-format.interceptor';
import { parseDecimal } from '../../shared/utils';

describe('parseDecimal', () => {
  it('acepta coma o punto como separador decimal', () => {
    expect(parseDecimal('109,1')).toBe(109.1);
    expect(parseDecimal('109.1')).toBe(109.1);
    expect(parseDecimal(' 109 ')).toBe(109);
    expect(parseDecimal('-5,25')).toBe(-5.25);
  });

  it('distingue separador de miles por la posición del último separador', () => {
    expect(parseDecimal('1.234,56')).toBe(1234.56);
    expect(parseDecimal('1,234.56')).toBe(1234.56);
  });

  it('devuelve null para vacío o texto no numérico', () => {
    expect(parseDecimal(null)).toBeNull();
    expect(parseDecimal(undefined)).toBeNull();
    expect(parseDecimal('')).toBeNull();
    expect(parseDecimal('   ')).toBeNull();
    expect(parseDecimal('abc')).toBeNull();
    expect(parseDecimal(NaN)).toBeNull();
  });

  it('deja los números como están', () => {
    expect(parseDecimal(0)).toBe(0);
    expect(parseDecimal(12.5)).toBe(12.5);
  });
});

describe('sanitizeDecimals', () => {
  it('convierte decimales con coma en campos numéricos, también anidados', () => {
    const out = sanitizeDecimals({
      totalQuantity: '109,1',
      pricePerUnit: '1.234,56',
      targetStockOrders: [{ tare: '2,5', sacNumber: '3' }],
      inputTransactions: [{ outputQuantity: '0,75' }],
    }) as any;
    expect(out.totalQuantity).toBe(109.1);
    expect(out.pricePerUnit).toBe(1234.56);
    expect(out.targetStockOrders[0].tare).toBe(2.5);
    // "3" no tiene coma: no se toca, Jackson ya lo acepta
    expect(out.targetStockOrders[0].sacNumber).toBe('3');
    expect(out.inputTransactions[0].outputQuantity).toBe(0.75);
  });

  it('cubre montos de pagos y tasas de cambio', () => {
    const out = sanitizeDecimals({
      amount: '15,50',
      amountPaidToTheCollector: '2,25',
      exchangeRate: '1,08',
      moisturePercentage: '7,5',
    }) as any;
    expect(out.amount).toBe(15.5);
    expect(out.amountPaidToTheCollector).toBe(2.25);
    expect(out.exchangeRate).toBe(1.08);
    expect(out.moisturePercentage).toBe(7.5);
  });

  it('REGRESIÓN: no convierte en {} las fechas ni otras instancias', () => {
    const date = new Date('2026-09-15T12:00:00');
    const blob = new Blob(['x']);
    const out = sanitizeDecimals({
      validity: date,
      payment: { formalCreationDate: date },
      file: blob,
    }) as any;
    expect(out.validity).toBe(date);
    expect(out.payment.formalCreationDate).toBe(date);
    expect(out.file).toBe(blob);
    expect(JSON.stringify(out)).toContain('2026-09-15');
  });

  it('REGRESIÓN: no convierte texto libre que parece decimal', () => {
    const out = sanitizeDecimals({
      comments: '12,5',
      plotName: '1,5',
      identifier: '10,2',
      internalLotNumber: '3,1',
      accountNumber: '12,3',
    }) as any;
    expect(out.comments).toBe('12,5');
    expect(out.plotName).toBe('1,5');
    expect(out.identifier).toBe('10,2');
    expect(out.internalLotNumber).toBe('3,1');
    expect(out.accountNumber).toBe('12,3');
  });

  it('no modifica el objeto original', () => {
    const body = { totalQuantity: '1,5' };
    sanitizeDecimals(body);
    expect(body.totalQuantity).toBe('1,5');
  });
});

describe('DecimalFormatInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        {
          provide: HTTP_INTERCEPTORS,
          useClass: DecimalFormatInterceptor,
          multi: true,
        },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('normaliza el cuerpo JSON antes de enviarlo', () => {
    http.put('/api/chain/stock-order', { totalQuantity: '98,5' }).subscribe();
    const req = controller.expectOne('/api/chain/stock-order');
    expect(req.request.body).toEqual({ totalQuantity: 98.5 });
    req.flush({});
  });

  it('no toca FormData', () => {
    const form = new FormData();
    form.append('totalQuantity', '1,5');
    http.post('/api/document', form).subscribe();
    const req = controller.expectOne('/api/document');
    expect(req.request.body).toBe(form);
    req.flush({});
  });
});
