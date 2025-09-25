import { AfterViewInit } from '@angular/core';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
import { SortOption, SortOrder } from '../../../shared/result-sorter/result-sorter-types';
import { GlobalEventManagerService } from '../../../core/global-event-manager.service';
import { CompanyControllerService, GetUserCustomersForCompanyAndType } from '../../../../api/api/companyController.service';
import { Router } from '@angular/router';
import { map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { AuthService } from '../../../core/auth.service';
import { SelectedUserCompanyService } from '../../../core/selected-user-company.service';
import { ApiUserGet } from '../../../../api/model/apiUserGet';
import RoleEnum = ApiUserGet.RoleEnum;
import { FileSaverService } from 'ngx-filesaver';
import { ApiPlot } from '../../../../api/model/apiPlot';
import {
  OpenPlotDetailsExternallyModalComponent
} from '../open-plot-details-externally-modal/open-plot-details-externally-modal.component';
import { NgbModalImproved } from '../../../core/ngb-modal-improved/ngb-modal-improved.service';
import { ApiCompany } from '../../../../api/model/apiCompany';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { SelfOnboardingService } from '../../../shared-services/self-onboarding.service';
import { PdfGeneratorService } from '../../../shared-services/pdf-generator.service';
import { StockOrderControllerService, GetStockOrderListByCompanyId } from '../../../../api/api/stockOrderController.service';
import { PaymentControllerService, ListPaymentsByCompany } from '../../../../api/api/paymentController.service';

@Component({
  selector: 'app-company-farmers-list',
  templateUrl: './company-farmers-list.component.html',
  styleUrls: ['./company-farmers-list.component.scss']
})
export class CompanyFarmersListComponent implements OnInit, OnDestroy, AfterViewInit {

  organizationId;
  selectedCompany: ApiCompany;
  page = 1;
  pageSize = 10;

  showing;
  farmerCount;

  searchNameFarmers = new FormControl('');
  byCategory = 'BY_NAME';

  farmers$: Observable<any>;
  plots$: Observable<ApiPlot[]>;
  sorting$ = new BehaviorSubject<{ key: string, sortOrder: SortOrder }>({ key: 'BY_NAME', sortOrder: 'ASC'});
  query$ = new BehaviorSubject('');
  pagination$ = new BehaviorSubject(1);
  search$ = new BehaviorSubject('BY_NAME');
  ping$ = new BehaviorSubject(null);

  showRwanda = false;
  showHonduras = false;

  items = [
    { name: $localize`:@@productLabelStakeholders.search.firstName:First name`,
      category: 'BY_NAME'
    },
    { name: $localize`:@@productLabelStakeholders.search.lastName:Last name`,
      category: 'BY_SURNAME'
    }
  ];

  sortOptions: SortOption[] = [
    {
      key: 'name',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.name.name:First name`,
      defaultSortOrder: 'ASC'
    },
    {
      key: 'surname',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.surname.name:Last name`,
      defaultSortOrder: 'ASC'
    },
    {
      key: 'gender',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.gender.name:Gender`,
      inactive: true
    },
    {
      key: 'id',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.id.name:Id`,
    },
    {
      key: 'city',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.city.name:City/Town/Village`,
      inactive: true
    },
    {
      key: 'state',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.state.name:State/Province/Region`,
      inactive: true
    },
    {
      key: 'actions',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.actions.name:Actions`,
      inactive: true
    }
  ];

  sortOptionsRwanda: SortOption[] = [
    {
      key: 'name',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.name.name:First name`,
      defaultSortOrder: 'ASC'
    },
    {
      key: 'surname',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.surname.name:Last name`,
      defaultSortOrder: 'ASC'
    },
    {
      key: 'gender',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.gender.name:Gender`,
      inactive: true
    },
    {
      key: 'id',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.id.name:Id`,
    },
    {
      key: 'village',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.village.name:Village`,
      inactive: true
    },
    {
      key: 'cell',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.cell.name:Cell`,
      inactive: true
    },
    {
      key: 'actions',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.actions.name:Actions`,
      inactive: true
    }
  ];

  sortOptionsHonduras: SortOption[] = [
    {
      key: 'name',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.name.name:First name`,
      defaultSortOrder: 'ASC'
    },
    {
      key: 'surname',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.surname.name:Last name`,
      defaultSortOrder: 'ASC'
    },
    {
      key: 'gender',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.gender.name:Gender`,
      inactive: true
    },
    {
      key: 'id',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.id.name:Id`,
    },
    {
      key: 'municipality',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.municipality.name:Municipality`,
      inactive: true
    },
    {
      key: 'village',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.village.name:Village`,
      inactive: true
    },
    {
      key: 'actions',
      name: $localize`:@@productLabelStakeholdersCollectors.sortOptions.actions.name:Actions`,
      inactive: true
    }
  ];

  isSystemOrRegionalAdmin = false;

  subs: Subscription;

  @ViewChild('addFarmerButtonTooltip')
  addFarmerButtonTooltip: NgbTooltip;

  @ViewChild('generatingPdfModal')
  generatingPdfModal: any;

  // Propiedades para el modal profesional de PDF
  currentStep = 0;
  pdfProgress = 0;
  currentPdfStep = 'Preparando...';

  constructor(
      private globalEventsManager: GlobalEventManagerService,
      private companyController: CompanyControllerService,
      private router: Router,
      private authService: AuthService,
      private selUserCompanyService: SelectedUserCompanyService,
      private fileSaverService: FileSaverService,
      private modalService: NgbModalImproved,
      private selfOnboardingService: SelfOnboardingService,
      private pdfGeneratorService: PdfGeneratorService,
      private stockOrderController: StockOrderControllerService,
      private paymentController: PaymentControllerService
  ) { }

  ngOnInit(): void {

    this.authService.userProfile$.pipe(take(1)).subscribe(up => {
      this.isSystemOrRegionalAdmin = up && (up.role === RoleEnum.SYSTEMADMIN || up.role === RoleEnum.REGIONALADMIN);
    });

    this.selUserCompanyService.selectedCompanyProfile$.pipe(take(1)).subscribe(cp => {
      if (cp) {

        this.organizationId = cp.id;
        this.selectedCompany = cp;

        this.showRwanda = cp.headquarters &&
            cp.headquarters.country &&
            cp.headquarters.country.code &&
            cp.headquarters.country.code === 'RW';

        this.showHonduras = cp.headquarters &&
          cp.headquarters.country &&
          cp.headquarters.country.code &&
          cp.headquarters.country.code === 'HN';

        this.loadFarmers().then();
      }
    });
  }

  ngAfterViewInit() {

    this.subs = this.selfOnboardingService.addFarmersCurrentStep$.subscribe(currentStep => {
      if (currentStep === 2) {
        this.addFarmerButtonTooltip.open();
      } else {
        this.addFarmerButtonTooltip.close();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.subs) {
      this.subs.unsubscribe();
    }
  }

  private async loadFarmers() {

    this.farmers$ = combineLatest([this.sorting$, this.query$, this.search$, this.pagination$, this.ping$])
        .pipe(
            map(([sort, queryString, search, page, ping]) => {
              const params: GetUserCustomersForCompanyAndType.PartialParamMap = {
                companyId: this.organizationId,
                type: 'FARMER',
                sort: sort.sortOrder,
                sortBy: sort.key,
                offset: (page - 1) * this.pageSize,
                limit: this.pageSize,
                query: queryString,
                searchBy: search
              };
              return params;
            }),
            tap(() => this.globalEventsManager.showLoading(true)),
            switchMap(params => this.companyController.getUserCustomersForCompanyAndTypeByMap(params)),
            map(response => {
              if (response) {
                this.farmerCount = response.data.count;
                this.showing = this.farmerCount >= this.pageSize ? Math.min(this.page * this.pageSize, this.farmerCount) : this.farmerCount;

                return response.data;
              }
            }),
            tap(() => this.globalEventsManager.showLoading(false)),
            shareReplay(1)
        );

    this.plots$ = this.companyController.getUserCustomersPlotsForCompany(this.organizationId)
        .pipe(
            map(response => response.data)
        );
  }

  async addFarmer() {

    const addFarmerCurrentStep = await this.selfOnboardingService.addFarmersCurrentStep$.pipe(take(1)).toPromise();
    if (addFarmerCurrentStep === 2) {
      this.selfOnboardingService.setAddFarmersCurrentStep(3);
    }

    this.router.navigate(['my-farmers', 'add']).then();
  }

  editFarmer(id) {
    this.router.navigate(['my-farmers', 'edit', id]).then();
  }

  async exportFarmerData(): Promise<void> {

    this.globalEventsManager.showLoading(true);
    try {
      const res = await this.companyController.exportFarmerDataByCompany(this.organizationId)
          .pipe(take(1))
          .toPromise();

      this.fileSaverService.save(res, 'farmers_data.zip');
    } finally {
      this.globalEventsManager.showLoading(false);
    }
  }

  async deleteFarmer(id) {
    const result = await this.globalEventsManager.openMessageModal({
      type: 'warning',
      message: $localize`:@@productLabelStakeholdersCollectors.deleteCollector.error.message:Are you sure you want to delete the collector?`,
      options: {
        centered: true
      }
    });
    if (result !== 'ok') {
      return;
    }
    const res = await this.companyController.deleteUserCustomer(id).pipe(take(1)).toPromise();
    if (res && res.status === 'OK') {
      this.ping$.next(null);
    }
  }

  importFarmers() {
    this.router.navigate(['my-farmers', 'import']).then();
  }

  changeSort(event) {
    let newKey = '';
    switch (event.key) {
      case 'id':
        newKey = 'BY_ID';
        break;
      case 'name':
        newKey = 'BY_NAME';
        break;
      case 'surname':
        newKey = 'BY_SURNAME';
        break;
    }
    event.key = newKey;
    this.sorting$.next(event);
  }

  showPagination() {
    return this.farmerCount && this.farmerCount > this.pageSize;
  }

  onPageChange(event) {
    this.pagination$.next(event);
  }

  onSearchInput(event) {
    this.query$.next(event);
  }

  onCategoryChange(event) {
    this.search$.next(event);
  }

  openGeoIdWhisp($geoId: string) {
    const modalRef = this.modalService.open(OpenPlotDetailsExternallyModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'xxl',
      scrollable: true
    });
    Object.assign(modalRef.componentInstance, {
      geoId: $geoId
    });
    modalRef.result.then();
  }

  /**
   * Genera y descarga un PDF con los detalles del agricultor - Implementación Profesional UX
   */
  async viewFarmerPdf(farmerId: string, farmerName: string) {
    // Resetear estado del modal
    this.resetPdfModalState();
    
    // Abrir modal profesional
    const modalRef = this.modalService.open(this.generatingPdfModal, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'lg'
    });

    try {
      // Paso 1: Cargar información del agricultor desde la API
      this.updatePdfProgress(1, 25, 'Cargando información del agricultor...');
      const farmerResponse = await this.companyController.getUserCustomer(Number(farmerId)).pipe(take(1)).toPromise();
      
      if (!farmerResponse || farmerResponse.status !== 'OK' || !farmerResponse.data) {
        throw new Error('No se pudo obtener la información del agricultor');
      }

      const farmerData = farmerResponse.data;

      // Paso 2: Preparar datos para el reporte (cargar entregas y pagos)
      this.updatePdfProgress(2, 50, 'Preparando datos del reporte...');

      // Cargar entregas (purchase orders) y pagos del agricultor en paralelo
      const deliveriesParams: GetStockOrderListByCompanyId.PartialParamMap = {
        companyId: this.organizationId,
        requestType: 'FETCH',
        limit: 1000,
        offset: 0,
        sortBy: 'productionDate',
        sort: 'DESC',
        farmerId: Number(farmerId),
        isPurchaseOrderOnly: true,
        orderType: 'PURCHASE_ORDER'
      };

      const paymentsParams: ListPaymentsByCompany.PartialParamMap = {
        id: this.organizationId,
        requestType: 'FETCH',
        limit: 1000,
        offset: 0,
        farmerId: Number(farmerId)
      };

      const [deliveriesResp, paymentsResp] = await Promise.all([
        this.stockOrderController.getStockOrderListByCompanyIdByMap(deliveriesParams).pipe(take(1)).toPromise(),
        this.paymentController.listPaymentsByCompanyByMap(paymentsParams).pipe(take(1)).toPromise()
      ]);

      const deliveriesItems = deliveriesResp?.data?.items || [];
      const paymentsItems = paymentsResp?.data?.items || [];

      // Normalizar datos para el generador de PDF
      const deliveries = deliveriesItems.map(o => {
        const productName = (o.semiProduct as any)?.name || (o.finalProduct as any)?.name || '';
        const qty = o.totalQuantity || 0;
        const unitPrice = o.pricePerUnit || 0;
        const total = (o as any).cost != null ? (o as any).cost : (unitPrice && qty ? unitPrice * qty : 0);
        return {
          date: o.productionDate || o.deliveryTime || null,
          product: { name: productName },
          quantity: qty,
          unitPrice: unitPrice,
          totalAmount: total,
          currency: o.currency || 'USD'
        };
      });

      const payments = paymentsItems.map(p => ({
        paymentDate: (p as any).formalCreationTime || null,
        paymentPurposeType: p.paymentPurposeType || 'Payment',
        paymentType: (p as any).preferredWayOfPayment || p.paymentType || '',
        amount: p.amount != null ? p.amount : (p as any).totalPaid || 0,
        paymentStatus: p.paymentStatus || '',
        currency: p.currency || 'USD'
      }));

      // Calcular acumulados
      const totalDeliveriesQty = deliveries.reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);
      const totalPaymentsAmount = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const weightedPriceSum = deliveries.reduce((sum, d) => sum + ((Number(d.unitPrice) || 0) * (Number(d.quantity) || 0)), 0);
      const avgPrice = totalDeliveriesQty > 0 ? (weightedPriceSum / totalDeliveriesQty) : 0;

      // Adjuntar a farmerData
      (farmerData as any).deliveries = deliveries;
      (farmerData as any).payments = payments;
      (farmerData as any).totalDeliveries = totalDeliveriesQty;
      (farmerData as any).totalPayments = totalPaymentsAmount;
      (farmerData as any).totalProduction = totalDeliveriesQty; // como aproximación
      (farmerData as any).averagePrice = avgPrice;

      // Paso 3: Generar documento PDF
      this.updatePdfProgress(3, 75, 'Generando documento PDF...');
      await this.delay(500); // Breve pausa para mostrar progreso

      await this.pdfGeneratorService.generateFarmerPdf(farmerId, farmerName, farmerData);

      // Paso 4: Completado
      this.updatePdfProgress(4, 100, '¡Reporte generado exitosamente!');
      await this.delay(1000); // Mostrar éxito brevemente

      modalRef.close();

      // Mostrar notificación de éxito
      this.globalEventsManager.push({
        notificationType: 'success',
        title: 'Reporte Generado',
        message: `Los datos del agricultor <strong>${farmerName}</strong> se ha descargado correctamente.`
      });

    } catch (error) {
      console.error('Error generating farmer PDF:', error);
      modalRef.close();
      
      // Mostrar error profesional
      await this.globalEventsManager.openMessageModal({
        type: 'error',
        title: 'Error al Generar Reporte',
        message: `
          <div class="text-left">
            <p>No se pudo generar el reporte del agricultor <strong>${farmerName}</strong>.</p>
            <p class="mb-2"><strong>Posibles causas:</strong></p>
            <ul class="mb-2">
              <li>Problemas de conectividad</li>
              <li>Mapas no cargados completamente</li>
              <li>Información incompleta del agricultor</li>
            </ul>
            <p class="text-muted"><small>Por favor, intente nuevamente en unos momentos.</small></p>
          </div>
        `,
        options: { centered: true }
      });
    }
  }

  /**
   * Resetea el estado del modal de PDF
   */
  private resetPdfModalState(): void {
    this.currentStep = 0;
    this.pdfProgress = 0;
    this.currentPdfStep = 'Preparando...';
  }

  /**
   * Actualiza el progreso del modal de PDF
   */
  private updatePdfProgress(step: number, progress: number, message: string): void {
    this.currentStep = step;
    this.pdfProgress = progress;
    this.currentPdfStep = message;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

}
