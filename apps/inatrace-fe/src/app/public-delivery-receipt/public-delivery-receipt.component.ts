import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ApiStockOrder } from 'src/api/model/apiStockOrder';
import { ApiResponseApiStockOrder } from 'src/api/model/apiResponseApiStockOrder';
import { weekColor, WeekColor } from '../shared-services/week-number.util';
import {
  faCheck,
  faCheckCircle,
  faTimesCircle,
  faLock,
  faPrint,
  faExclamationTriangle,
  faCalendarAlt,
  faQrcode,
  faBuilding,
  faMapMarkerAlt,
  faUser,
  faLeaf,
  faBalanceScale,
  faFileInvoice,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-public-delivery-receipt',
  templateUrl: './public-delivery-receipt.component.html',
  styleUrls: ['./public-delivery-receipt.component.scss'],
  standalone: false,
})
export class PublicDeliveryReceiptComponent implements OnInit {
  loading = true;
  isPrivate = false;
  notFound = false;
  errorMessage = '';
  stockOrder: ApiStockOrder | null = null;
  receiptId: string | null = null;
  currentUrl = '';

  faCheck = faCheck;
  faCheckCircle = faCheckCircle;
  faTimesCircle = faTimesCircle;
  faLock = faLock;
  faPrint = faPrint;
  faExclamationTriangle = faExclamationTriangle;
  faCalendarAlt = faCalendarAlt;
  faQrcode = faQrcode;
  faBuilding = faBuilding;
  faMapMarkerAlt = faMapMarkerAlt;
  faUser = faUser;
  faLeaf = faLeaf;
  faBalanceScale = faBalanceScale;
  faFileInvoice = faFileInvoice;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.receiptId = this.route.snapshot.paramMap.get('id');
    try {
      this.currentUrl = window.location.href;
    } catch {
      this.currentUrl = '';
    }
    if (this.receiptId) {
      this.loadReceipt(this.receiptId);
    } else {
      this.loading = false;
      this.notFound = true;
    }
  }

  loadReceipt(id: string): void {
    this.loading = true;
    this.isPrivate = false;
    this.notFound = false;
    this.errorMessage = '';

    this.http
      .get<ApiResponseApiStockOrder>(`/api/public/delivery-receipt/${encodeURIComponent(id)}`)
      .subscribe({
        next: (res) => {
          this.loading = false;
          if (res && res.data) {
            this.stockOrder = res.data;
          } else {
            this.notFound = true;
          }
        },
        error: (err) => {
          this.loading = false;
          if (err.status === 403 || err.status === 401 || err?.error?.status === 'UNAUTHORIZED') {
            this.isPrivate = true;
          } else if (err.status === 404 || err?.error?.status === 'NOT_FOUND') {
            this.notFound = true;
          } else {
            this.errorMessage =
              err?.error?.errorMessage ||
              $localize`:@@publicReceipt.generalError:No fue posible cargar el comprobante de entrega.`;
          }
        },
      });
  }

  get farmerName(): string {
    const f = this.stockOrder?.producerUserCustomer;
    if (!f) return '';
    return [f.name, f.surname].filter(Boolean).join(' ') || (f.id != null ? String(f.id) : '');
  }

  get displaySemiProductName(): string {
    return this.stockOrder?.semiProduct?.name || 'Cacao';
  }

  get displayMeasureUnit(): string {
    return this.stockOrder?.measureUnitType?.label || 'Libra';
  }

  get weekColorInfo(): WeekColor | null {
    if (!this.stockOrder?.weekNumber) {
      return null;
    }
    return weekColor(this.stockOrder.weekNumber);
  }

  get isCanceled(): boolean {
    return this.stockOrder?.status === 'CANCELED';
  }

  printTicket(): void {
    window.print();
  }
}
