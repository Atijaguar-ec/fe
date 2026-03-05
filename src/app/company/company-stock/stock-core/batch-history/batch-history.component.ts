import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';
import { GlobalEventManagerService } from '../../../../core/global-event-manager.service';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, shareReplay, switchMap, tap, take } from 'rxjs/operators';
import { ApiTransaction } from '../../../../../api/model/apiTransaction';
import { ApiStockOrder } from '../../../../../api/model/apiStockOrder';
import { StockOrderControllerService } from '../../../../../api/api/stockOrderController.service';
import { StockOrderType } from '../../../../../shared/types';
import { ApiStockOrderHistory } from '../../../../../api/model/apiStockOrderHistory';
import { ApiStockOrderHistoryTimelineItem } from '../../../../../api/model/apiStockOrderHistoryTimelineItem';
import { ApiFacility } from '../../../../../api/model/apiFacility';
import { ApiMeasureUnitType } from '../../../../../api/model/apiMeasureUnitType';
import { ApiUserCustomer } from '../../../../../api/model/apiUserCustomer';
import { formatUserCustomerDisplayName } from '../../../../../shared/utils';
import { EnvironmentInfoService } from '../../../../core/environment-info.service';

declare const $localize: (messageParts: TemplateStringsArray, ...expressions: unknown[]) => string;

interface GroupedStockOrders {
  processingDate: string;
  facility: ApiFacility;
  internalLotNumber: string;
  stockOrders: ApiStockOrder[];
  summedUpQuantity: number;
  measureUnitType: ApiMeasureUnitType;
}

@Component({
  selector: 'app-batch-history',
  templateUrl: './batch-history.component.html',
  styleUrls: ['./batch-history.component.scss']
})
export class BatchHistoryComponent implements OnInit, AfterViewInit {

  qrCodeSize = 150;

  faTimes = faTimes;

  reloadPing$ = new BehaviorSubject<boolean>(false);

  productId = this.route.snapshot.params.id;

  history$: Observable<ApiStockOrderHistory> = combineLatest([this.reloadPing$, this.route.params])
    .pipe(
      tap(() => this.globalEventsManager.showLoading(true)),
      switchMap(val => {
        return this.stockOrderService.getStockOrderAggregatedHistory(val[1].stockOrderId);
      }),
      map(val => {
        if (val && val.status === 'OK') {

          const stockOrderHistory = val.data;

          stockOrderHistory?.timelineItems?.forEach(timelineItem => {
            if (timelineItem.processingOrder) {

              const groups = new Map<string, ApiStockOrder[]>();
              for (const tso of timelineItem.processingOrder.targetStockOrders) {
                if (tso.sacNumber != null) {

                  // If sac number is present, parse the internal LOT number without the sac number part
                  const lastSlashIndex = tso.internalLotNumber.lastIndexOf('/');
                  if (lastSlashIndex !== -1) {

                    const internalLOTNumber = tso.internalLotNumber.substring(0, lastSlashIndex);
                    if (groups.has(internalLOTNumber)) {
                      groups.get(internalLOTNumber).push(tso);
                    } else {
                      groups.set(internalLOTNumber, [tso]);
                    }
                  }
                }
              }

              // Add the grouped stock orders into the Stock order history
              const groupsArray: GroupedStockOrders[] = [];
              groups.forEach((stockOrders, internalLOTNumber) => {
                const stockOrdersGroup: GroupedStockOrders = {
                  stockOrders,
                  facility: stockOrders[0].facility,
                  internalLotNumber: internalLOTNumber,
                  processingDate: stockOrders[0].productionDate,
                  summedUpQuantity: stockOrders.map(so => so.totalQuantity).reduce((previousValue, currentValue) => {
                    return (previousValue ?? 0) + currentValue;
                  }),
                  measureUnitType: stockOrders[0].measureUnitType
                };
                groupsArray.push(stockOrdersGroup);

                // Remove the stock orders from the original target stock order array
                stockOrders.forEach(so => {
                  const removeIndex = timelineItem?.processingOrder?.targetStockOrders?.findIndex(tso => tso.id === so.id);
                  timelineItem.processingOrder?.targetStockOrders?.splice(removeIndex, 1);
                });
              });
              timelineItem.processingOrder['stockOrderGroups'] = groupsArray;
            }
          });

          return stockOrderHistory;
        }
        return null;
      }),
      tap(() => this.globalEventsManager.showLoading(false)),
      shareReplay(1)
    );

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private stockOrderService: StockOrderControllerService,
    private globalEventsManager: GlobalEventManagerService,
    public envInfo: EnvironmentInfoService
  ) { }

  /**
   * Verifica si el producto es camarón
   */
  get isShrimp(): boolean {
    return this.envInfo.isProductType('shrimp');
  }

  /**
   * Verifica si la orden es de inspección en campo
   */
  isFieldInspectionOrder(order: ApiStockOrder): boolean {
    return !!order?.facility?.isFieldInspection;
  }

  /**
   * Obtiene la etiqueta del resultado de sabor
   */
  getFlavorTestResultLabel(result?: string): string {
    if (!result) { return '-'; }
    if (result === 'NORMAL') {
      return $localize`:@@batchHistory.flavorResult.normal:Normal`;
    }
    if (result === 'DEFECT') {
      return $localize`:@@batchHistory.flavorResult.defect:Con defecto`;
    }
    return result;
  }

  /**
   * Obtiene la etiqueta de recomendación de compra
   */
  getPurchaseRecommendedLabel(recommended?: boolean): string {
    if (recommended === true) {
      return $localize`:@@batchHistory.purchaseRecommended.yes:Sí - Recomendado`;
    }
    if (recommended === false) {
      return $localize`:@@batchHistory.purchaseRecommended.no:No - No recomendado`;
    }
    return '-';
  }

  /**
   * Obtiene la unidad de medida correcta según el tipo de orden
   */
  getDisplayMeasureUnit(order: ApiStockOrder): string {
    if (!order) { return ''; }
    if (this.isShrimp && this.isFieldInspectionOrder(order)) {
      return $localize`:@@batchHistory.measureUnit.units:Unidades`;
    }
    return order.measureUnitType?.label || '';
  }

  getTargetStockOrders(timelineItem: ApiStockOrderHistoryTimelineItem) {
    return timelineItem.purchaseOrders?.length > 0 ? timelineItem.purchaseOrders : timelineItem.processingOrder.targetStockOrders;
  }

  getStockOrderGroups(timelineItem: ApiStockOrderHistoryTimelineItem): GroupedStockOrders[] {
    return timelineItem.processingOrder ? timelineItem.processingOrder['stockOrderGroups'] : [];
  }

  isRoot(root: ApiStockOrder, one: ApiStockOrder) {
    return root.id === one.id;
  }

  processingOrderName(historyItem: ApiStockOrderHistoryTimelineItem) {

    if (historyItem.processingOrder) {
      if (historyItem.processingOrder.processingAction) {
        return historyItem.processingOrder.processingAction.name;
      } else {
        return $localize`:@@orderHistoryView.processingOrderName.corruptedHistory: Corrupted history - processing action deleted`;
      }
    }

    return $localize`:@@orderHistoryView.processingOrderName.purchase:Purchase`;
  }

  processingCreationDate(historyItem: ApiStockOrderHistoryTimelineItem) {
    if (!historyItem.processingOrder) { return null; }
    return historyItem.processingOrder.processingDate;
  }

  ngOnInit() {
  }

  @ViewChild('pdfContainer') pdfContainer: ElementRef<HTMLDivElement>;

  async ngAfterViewInit() {
    // Si viene con query param downloadPdf=1, esperamos a que history$ emita y capturamos la vista
    this.route.queryParamMap.pipe(take(1)).subscribe(async (params: ParamMap) => {
      const shouldDownload = params.get('downloadPdf') === '1';
      if (!shouldDownload) { return; }

      // Esperar a que el observable de historia emita y el DOM esté dibujado
      this.history$.pipe(take(1)).subscribe(async (history) => {
        // Pequeño delay para asegurar render final (gráficos/qr)
        setTimeout(async () => {
          try {
            const html2canvas = (await import('html2canvas')).default;
            const { jsPDF } = await import('jspdf');

            const element = this.pdfContainer?.nativeElement;
            if (!element) { return; }

            const canvas = await html2canvas(element, {
              scale: 2,
              useCORS: true,
              backgroundColor: '#ffffff',
              windowWidth: element.scrollWidth,
            });

            // Crear PDF A4 ajustando la imagen a ancho de página manteniendo proporción
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            const imgWidth = pageWidth - 20; // márgenes
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            const y = 10;
            // multi-page slicing variables

            // Si la imagen es más alta que una página, la partimos en múltiples páginas
            const pageCanvas = document.createElement('canvas');
            const pageCtx = pageCanvas.getContext('2d');
            if (!pageCtx) { return; }
            const pxPerMm = canvas.width / (imgWidth);
            const pageHeightPx = (pageHeight - 20) * pxPerMm; // altura utilizable en px
            let renderedHeightPx = 0;

            while (renderedHeightPx < canvas.height) {
              pageCanvas.width = canvas.width;
              pageCanvas.height = Math.min(pageHeightPx, canvas.height - renderedHeightPx);
              pageCtx.drawImage(canvas, 0, renderedHeightPx, canvas.width, pageCanvas.height, 0, 0, canvas.width, pageCanvas.height);

              const pageImgData = pageCanvas.toDataURL('image/png');
              const pageImgHeightMm = (pageCanvas.height / pxPerMm);

              if (renderedHeightPx === 0) {
                pdf.addImage(pageImgData, 'PNG', 10, y, imgWidth, pageImgHeightMm);
              } else {
                pdf.addPage();
                pdf.addImage(pageImgData, 'PNG', 10, 10, imgWidth, pageImgHeightMm);
              }

              renderedHeightPx += pageCanvas.height;
            }

            // Determinar nombre de archivo: entrega--<identifier|internalLotNumber|id>.pdf
            const so = (history && (history as any).stockOrder) as ApiStockOrder;
            const rawId = so?.identifier || so?.internalLotNumber || (so?.id != null ? so.id.toString() : 'sin-id');
            const safeId = rawId.replace(/[^a-zA-Z0-9\-_]+/g, '_');
            pdf.save(`entrega--${safeId}.pdf`);
          } catch (err) {
            // Mostrar mensaje amigable en lugar de usar console.error (regla tslint no-console)
            this.globalEventsManager.openMessageModal({
              type: 'error',
              message: $localize`:@@orderHistoryView.pdfGeneration.error:Error al generar el PDF de la orden. Por favor, intente nuevamente.`,
              options: { centered: true }
            });
          }
        }, 400);
      });
    });
  }

  goToInput(tx: ApiTransaction) {
    this.router.navigate(['stock-order', tx.sourceStockOrder.id, 'view'], { relativeTo: this.route.parent }).then();
  }

  async goToOutput(tx: ApiTransaction) {
    this.router.navigate(['stock-order', tx.targetStockOrder.id, 'view'], { relativeTo: this.route.parent }).then();
  }

  goToSibling(order: ApiStockOrder) {
    this.router.navigate(['stock-order', order.id, 'view'], { relativeTo: this.route.parent }).then();
  }

  downloadPdf() {
    this.route.queryParamMap.pipe(take(1)).subscribe(async () => {
      this.history$.pipe(take(1)).subscribe(async (history) => {
        setTimeout(async () => {
          try {
            const html2canvas = (await import('html2canvas')).default;
            const { jsPDF } = await import('jspdf');

            const element = this.pdfContainer?.nativeElement;
            if (!element) { return; }

            const canvas = await html2canvas(element, {
              scale: 2,
              useCORS: true,
              backgroundColor: '#ffffff',
              windowWidth: element.scrollWidth,
            });

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            const imgWidth = pageWidth - 20;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            const y = 10;

            const pageCanvas = document.createElement('canvas');
            const pageCtx = pageCanvas.getContext('2d');
            if (!pageCtx) { return; }
            const pxPerMm = canvas.width / imgWidth;
            const pageHeightPx = (pageHeight - 20) * pxPerMm;
            let renderedHeightPx = 0;

            while (renderedHeightPx < canvas.height) {
              pageCanvas.width = canvas.width;
              pageCanvas.height = Math.min(pageHeightPx, canvas.height - renderedHeightPx);
              pageCtx.drawImage(canvas, 0, renderedHeightPx, canvas.width, pageCanvas.height, 0, 0, canvas.width, pageCanvas.height);

              const pageImgData = pageCanvas.toDataURL('image/png');
              const pageImgHeightMm = pageCanvas.height / pxPerMm;

              if (renderedHeightPx === 0) {
                pdf.addImage(pageImgData, 'PNG', 10, y, imgWidth, pageImgHeightMm);
              } else {
                pdf.addPage();
                pdf.addImage(pageImgData, 'PNG', 10, 10, imgWidth, pageImgHeightMm);
              }

              renderedHeightPx += pageCanvas.height;
            }

            const so = (history && (history as any).stockOrder) as ApiStockOrder;
            const rawId = so?.identifier || so?.internalLotNumber || (so?.id != null ? so.id.toString() : 'sin-id');
            const safeId = rawId.replace(/[^a-zA-Z0-9\-_]+/g, '_');
            pdf.save(`entrega--${safeId}.pdf`);
          } catch (err) {
            this.globalEventsManager.openMessageModal({
              type: 'error',
              message: $localize`:@@orderHistoryView.pdfGeneration.error:Error al generar el PDF de la orden. Por favor, intente nuevamente.`,
              options: { centered: true }
            });
          }
        }, 400);
      });
    });
  }

  goToOrderView(order: ApiStockOrder) {
    this.router.navigate(['stock-order', order.id, 'view'], { relativeTo: this.route.parent }).then();
  }

  isThisOrder(currentOrder: ApiStockOrder, toShowOrder: ApiStockOrder) {
    return currentOrder.id === toShowOrder.id;
  }

  edit(order: ApiStockOrder) {

      switch (order.orderType as StockOrderType) {
        case 'PURCHASE_ORDER':
          this.router.navigate(['my-stock', 'deliveries', 'update', order.id]).then();
          return;
        case 'GENERAL_ORDER':
        case 'PROCESSING_ORDER':
        case 'TRANSFER_ORDER':
          this.router.navigate(['my-stock', 'processing', 'update', order.id]).then();
          return;

        default:
          throw new Error('Unsupported Stock order type');
      }
  }

  qrCodeString(stockOrder: ApiStockOrder) {
    if (!stockOrder) {
      return;
    }
    return stockOrder.id.toString();
  }

  copyToClipboard() {
    document.execCommand('copy');
  }

  companyNameForTimelineItem(item: ApiStockOrderHistoryTimelineItem): string {
    if (!item) {
      return '';
    }

    const directOrders = (this.getTargetStockOrders(item) || []) as ApiStockOrder[];
    const groupedOrders = this.getStockOrderGroups(item) || [];

    const firstOrder = directOrders.length > 0 ? directOrders[0] : undefined;
    const firstGroup = groupedOrders.length > 0 ? groupedOrders[0] : undefined;

    const facility = firstOrder?.facility ?? firstGroup?.facility;
    const companyName = facility?.company?.name;

    if (companyName) {
      return companyName;
    }

    if (facility?.name) {
      return facility.name;
    }

    return '';
  }

  companyLabelForTimelineItem(item: ApiStockOrderHistoryTimelineItem): string {
    const companyName = this.companyNameForTimelineItem(item);
    
    return companyName || $localize`:@@orderHistoryView.timeline.unknownCompany:Empresa no especificada`;
  }

  shouldShowCompanyDivider(items: ApiStockOrderHistoryTimelineItem[], index: number): boolean {
    if (!items || index < 0 || index >= items.length) {
      return false;
    }

    const current = this.companyNameForTimelineItem(items[index]);

    if (index === 0) {
      return true;
    }

    const previous = this.companyNameForTimelineItem(items[index - 1]);
    return current !== previous;
  }

  transactionColor(tx) {
    if (tx.status === 'CANCELED') { return 'ab-edit-link canceled'; }
    return 'ab-edit-link';
  }

  formatQuantity(order: ApiStockOrder, value?: number): string {
    const quantity = Number(value ?? 0);
    const formatted = quantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const unit = order?.measureUnitType?.label;
    return unit ? `${formatted} ${unit}` : formatted;
  }

  getUserCustomerDisplayName(user?: ApiUserCustomer | null): string {
    return formatUserCustomerDisplayName(user ?? null);
  }

  getGrossQuantity(order: ApiStockOrder): string {
    return this.formatQuantity(order, order?.totalGrossQuantity ?? 0);
  }

  // ... (rest of the code remains the same)
  getNetQuantity(order: ApiStockOrder): string {
    return this.formatQuantity(order, order?.netQuantity ?? order?.totalQuantity ?? 0);
  }

  getDeductionsSummary(order: ApiStockOrder): string {
    const deductions: string[] = [];
    if (!order) {
      return '-';
    }

    const gross = Number(order.totalGrossQuantity ?? order.totalQuantity ?? 0);
    let currentWeight = gross;

    // Tare deduction
    if (order.tare && Number(order.tare) > 0) {
      const tareLabel = $localize`:@@orderHistoryView.deductions.tare:Tara`;
      deductions.push(`${tareLabel}: -${this.formatQuantity(order, order.tare)}`);
      currentWeight -= Number(order.tare);
    }

    // Damaged weight deduction
    if (order.damagedWeightDeduction && Number(order.damagedWeightDeduction) > 0) {
      const damageLabel = $localize`:@@orderHistoryView.deductions.damage:Descuento peso`;
      deductions.push(`${damageLabel}: -${this.formatQuantity(order, order.damagedWeightDeduction)}`);
      currentWeight -= Number(order.damagedWeightDeduction);
    }

    // Moisture percentage deduction
    if (order.moisturePercentage && Number(order.moisturePercentage) > 0) {
      const moistureLabel = $localize`:@@orderHistoryView.deductions.moisture:Humedad`;
      const percentage = Number(order.moisturePercentage).toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 0 });
      
      // Calculate what remains after moisture percentage
      const baseWeight = Math.max(0, currentWeight);
      const netAfterMoisture = baseWeight * (Number(order.moisturePercentage) / 100);
      const moistureDeduction = baseWeight - netAfterMoisture;
      
      if (moistureDeduction > 0) {
        deductions.push(`${moistureLabel} (${percentage}%): -${this.formatQuantity(order, moistureDeduction)}`);
      }
    }

    return deductions.length > 0 ? deductions.join(' | ') : '-';
  }

  private getMoistureWeightDeduction(order: ApiStockOrder): number {
    if (order.moistureWeightDeduction != null) {
      return Number(order.moistureWeightDeduction);
    }

    if (order.moisturePercentage == null) {
      return 0;
    }

    const gross = Number(order.totalGrossQuantity ?? order.totalQuantity ?? 0);
    const tare = Number(order.tare ?? 0);
    const damaged = Number(order.damagedWeightDeduction ?? 0);
    const baseWeight = Math.max(0, gross - tare - damaged);
    const moistureFactor = Number(order.moisturePercentage) / 100;
    const netAfterMoisture = baseWeight * moistureFactor;
    const deduction = baseWeight - netAfterMoisture;
    return deduction > 0 ? deduction : 0;
  }

}
