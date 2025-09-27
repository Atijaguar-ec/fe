import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { ApiUserCustomer } from '../../../../api/model/apiUserCustomer';
import { ApiCompany } from '../../../../api/model/apiCompany';
import { ApiStockOrder } from '../../../../api/model/apiStockOrder';
import { ApiPayment } from '../../../../api/model/apiPayment';
import { CompanyControllerService, GetUserCustomer } from '../../../../api/api/companyController.service';
import { SelectedUserCompanyService } from '../../../core/selected-user-company.service';
import { GlobalEventManagerService } from '../../../core/global-event-manager.service';
import { ProductFieldVisibilityService } from '../../../shared-services/product-field-visibility.service';
import { StockOrderControllerService, GetStockOrderListByCompanyId } from '../../../../api/api/stockOrderController.service';
import { PaymentControllerService, ListPaymentsByCompany } from '../../../../api/api/paymentController.service';

interface FarmerDeliverySummary {
  date?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  currency: string;
  weekNumber?: number;
}

interface FarmerPaymentSummary {
  date?: string;
  purpose: string;
  type: string;
  amount: number;
  status: string;
  currency: string;
}

@Component({
  selector: 'app-company-farmers-report',
  templateUrl: './company-farmers-report.component.html',
  styleUrls: ['./company-farmers-report.component.scss']
})
export class CompanyFarmersReportComponent implements OnInit, OnDestroy {

  loading = true;
  errorMessage: string | null = null;

  company: ApiCompany;
  farmer: ApiUserCustomer;
  deliveries: FarmerDeliverySummary[] = [];
  payments: FarmerPaymentSummary[] = [];

  totalDeliveriesQuantity = 0;
  totalPaymentsAmount = 0;
  averagePrice = 0;
  reportUrl = '';

  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private companyController: CompanyControllerService,
    private stockOrderController: StockOrderControllerService,
    private paymentController: PaymentControllerService,
    private selectedCompanyService: SelectedUserCompanyService,
    private globalEventsManager: GlobalEventManagerService,
    private fieldVisibilityService: ProductFieldVisibilityService
  ) { }

  ngOnInit(): void {
    this.loadReportData().then();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  get farmerFullName(): string {
    if (!this.farmer) {
      return '';
    }
    const name = this.farmer.name || '';
    const surname = this.farmer.surname || '';
    return `${name} ${surname}`.trim();
  }

  getInitialLat(): number | null {
    if (this.farmer?.plots && this.farmer.plots.length > 0) {
      const firstPlot = this.farmer.plots[0];
      if (firstPlot.coordinates && firstPlot.coordinates.length > 0) {
        return firstPlot.coordinates[0].latitude || null;
      }
    }
    return null;
  }

  getInitialLng(): number | null {
    if (this.farmer?.plots && this.farmer.plots.length > 0) {
      const firstPlot = this.farmer.plots[0];
      if (firstPlot.coordinates && firstPlot.coordinates.length > 0) {
        return firstPlot.coordinates[0].longitude || null;
      }
    }
    return null;
  }

  get qrCodeValue(): string {
    if (this.reportUrl) {
      return this.reportUrl;
    }

    return this.farmer?.id ? `${this.farmer.id}` : '';
  }

  shouldShowField(fieldName: string): boolean {
    return this.fieldVisibilityService.shouldShowField(fieldName);
  }

  getMaxProductionQuantity(): number | null {
    if (this.farmer?.farm && (this.farmer.farm as any)?.maxProductionQuantity) {
      return (this.farmer.farm as any).maxProductionQuantity;
    }
    return null;
  }

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route }).then();
  }

  printReport(): void {
    window.print();
  }

  private async loadReportData(): Promise<void> {
    const farmerIdParam = this.route.snapshot.paramMap.get('id');
    if (!farmerIdParam) {
      this.errorMessage = 'No se pudo determinar el agricultor solicitado.';
      return;
    }

    const farmerId = Number(farmerIdParam);
    if (Number.isNaN(farmerId)) {
      this.errorMessage = 'El identificador del agricultor no es válido.';
      return;
    }

    try {
      this.loading = true;
      this.globalEventsManager.showLoading(true);

      this.company = await this.selectedCompanyService.selectedCompanyProfile$.pipe(take(1)).toPromise();
      if (!this.company) {
        this.errorMessage = 'No se encontró la empresa seleccionada.';
        return;
      }

      const farmerResponse = await this.companyController.getUserCustomer(farmerId).pipe(take(1)).toPromise();
      if (!farmerResponse || farmerResponse.status !== 'OK' || !farmerResponse.data) {
        this.errorMessage = 'No se pudo cargar la información del agricultor.';
        return;
      }

      this.farmer = farmerResponse.data;

      await Promise.all([
        this.loadDeliveries(farmerId),
        this.loadPayments(farmerId),
        this.loadFarmerWithPlots()
      ]);

      if (typeof window !== 'undefined') {
        this.reportUrl = window.location.href;
      }

      this.calculateAggregations();
    } catch (error) {
      console.error('Error al cargar el reporte del agricultor', error);
      this.errorMessage = 'Ocurrió un error al cargar la información. Intente nuevamente.';
    } finally {
      this.loading = false;
      this.globalEventsManager.showLoading(false);
    }
  }

  private async loadFarmerWithPlots(): Promise<void> {
    // Si el farmer ya tiene plots, no necesitamos cargar nada más
    if (this.farmer?.plots && this.farmer.plots.length > 0) {
      return;
    }
    
    // Si no tiene plots, intentar cargar desde el endpoint completo
    if (!this.farmer?.id) {
      return;
    }
    
    try {
      const farmerResponse = await this.companyController.getUserCustomer(this.farmer.id).pipe(take(1)).toPromise();
      if (farmerResponse && farmerResponse.status === 'OK' && farmerResponse.data) {
        this.farmer = farmerResponse.data;
      }
    } catch (error) {
      console.warn('No se pudieron cargar los plots del agricultor', error);
    }
  }

  private async loadDeliveries(farmerId: number): Promise<void> {
    const companyId = this.company?.id;
    if (!companyId) {
      this.errorMessage = 'No se encontró el identificador de la empresa.';
      return;
    }

    const params: GetStockOrderListByCompanyId.PartialParamMap = {
      companyId,
      requestType: 'FETCH',
      limit: 1000,
      offset: 0,
      sortBy: 'productionDate',
      sort: 'DESC',
      farmerId,
      isPurchaseOrderOnly: true,
      orderType: 'PURCHASE_ORDER'
    };

    const response = await this.stockOrderController.getStockOrderListByCompanyIdByMap(params).pipe(take(1)).toPromise();
    const items = response?.data?.items || [];

    this.deliveries = items.map(order => this.mapDelivery(order));
  }

  private mapDelivery(order: ApiStockOrder): FarmerDeliverySummary {
    const productName = (order as any)?.semiProduct?.name || (order as any)?.finalProduct?.name || '';
    const quantity = Number(order.totalQuantity) || 0;
    const unitPrice = Number((order as any).pricePerUnit) || 0;
    const totalAmount = (order as any).cost != null ? Number((order as any).cost) : unitPrice * quantity;

    return {
      date: (order.productionDate as any) || (order.deliveryTime as any) || null,
      productName,
      quantity,
      unitPrice,
      totalAmount,
      currency: order.currency || 'USD',
      weekNumber: (order as any).weekNumber || undefined
    };
  }

  private async loadPayments(farmerId: number): Promise<void> {
    const companyId = this.company?.id;
    if (!companyId) {
      this.errorMessage = 'No se encontró el identificador de la empresa.';
      return;
    }

    const params: ListPaymentsByCompany.PartialParamMap = {
      id: companyId,
      requestType: 'FETCH',
      limit: 1000,
      offset: 0,
      farmerId
    };

    const response = await this.paymentController.listPaymentsByCompanyByMap(params).pipe(take(1)).toPromise();
    const items = response?.data?.items || [];

    this.payments = items.map(payment => this.mapPayment(payment));
  }

  private mapPayment(payment: ApiPayment): FarmerPaymentSummary {
    const amount = (payment as any).amount != null ? Number((payment as any).amount) : Number((payment as any).totalPaid) || 0;

    return {
      date: (payment as any).formalCreationTime || (payment as any).createdAt || null,
      purpose: payment.paymentPurposeType || 'Pago',
      type: (payment as any).preferredWayOfPayment || payment.paymentType || '',
      amount,
      status: payment.paymentStatus || '',
      currency: payment.currency || 'USD'
    };
  }

  private calculateAggregations(): void {
    this.totalDeliveriesQuantity = this.deliveries.reduce((sum, delivery) => sum + delivery.quantity, 0);
    this.totalPaymentsAmount = this.payments.reduce((sum, payment) => sum + payment.amount, 0);

    const weightedPriceSum = this.deliveries.reduce((sum, delivery) => sum + (delivery.unitPrice * delivery.quantity), 0);
    this.averagePrice = this.totalDeliveriesQuantity > 0 ? weightedPriceSum / this.totalDeliveriesQuantity : 0;
  }

}
