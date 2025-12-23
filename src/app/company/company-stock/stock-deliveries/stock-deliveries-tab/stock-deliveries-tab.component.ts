import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { GlobalEventManagerService } from '../../../../core/global-event-manager.service';
import { StockCoreTabComponent } from '../../stock-core/stock-core-tab/stock-core-tab.component';
import { ActivatedRoute, Router } from '@angular/router';
import { FacilityControllerService } from '../../../../../api/api/facilityController.service';
import { take } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { AuthService } from '../../../../core/auth.service';
import { CompanyControllerService } from '../../../../../api/api/companyController.service';
import { FacilitySemiProductsCodebookService } from '../../../../shared-services/facility-semi-products-codebook.service';
import { map, startWith } from 'rxjs/operators';
import { CodebookTranslations } from '../../../../shared-services/codebook-translations';
import { ApiFacility } from '../../../../../api/model/apiFacility';
import { FileSaverService } from 'ngx-filesaver';
import { SelectedUserCompanyService } from '../../../../core/selected-user-company.service';
import { StockOrderControllerService } from '../../../../../api/api/stockOrderController.service';
import { SelfOnboardingService } from '../../../../shared-services/self-onboarding.service';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { EnvironmentInfoService } from '../../../../core/environment-info.service';
import { NgbModalImproved } from '../../../../core/ngb-modal-improved/ngb-modal-improved.service';
import { FieldInspectionSelectionModalComponent } from '../field-inspection-selection-modal/field-inspection-selection-modal.component';
import { ApiFieldInspection } from '../../../../core/api/field-inspection.service';

declare const $localize: any;

@Component({
  selector: 'app-stock-deliveries-tab',
  templateUrl: './stock-deliveries-tab.component.html',
  styleUrls: ['./stock-deliveries-tab.component.scss']
})
export class StockDeliveriesTabComponent extends StockCoreTabComponent implements OnInit, OnDestroy, AfterViewInit {
  rootTab = 0;

  showedPurchaseOrders = 0;
  allPurchaseOrders = 0;

  searchFarmerNameAndSurname = new FormControl(null);
  searchFarmerNameSurnamePing$ = new BehaviorSubject<string | null>(null);

  reloadPurchaseOrdersPing$ = new BehaviorSubject<boolean>(false);

  semiProductFrom = new FormControl(null);
  facilitySemiProducts: FacilitySemiProductsCodebookService | null = null;

  semiProductId$: Observable<number | null> = this.semiProductFrom.valueChanges.pipe(
      startWith(null),
      map(semiProduct => {
        if (semiProduct) { return semiProduct.id; }
        return null;
      })
  );

  private facilityIdChangeSub!: Subscription;
  private subs!: Subscription;

  @ViewChild('deliveriesTitleTooltip')
  deliveriesTitleTooltip!: NgbTooltip;

  @ViewChild('addDeliveryButtonTooltip')
  addDeliveryButtonTooltip!: NgbTooltip;

  constructor(
      protected router: Router,
      protected route: ActivatedRoute,
      protected globalEventManager: GlobalEventManagerService,
      protected facilityControllerService: FacilityControllerService,
      protected authService: AuthService,
      protected companyController: CompanyControllerService,
      private stockOrderControllerService: StockOrderControllerService,
      private codebookTranslations: CodebookTranslations,
      private fileSaverService: FileSaverService,
      protected selUserCompanyService: SelectedUserCompanyService,
      protected selfOnboardingService: SelfOnboardingService,
      private envInfo: EnvironmentInfoService,
      private modalService: NgbModalImproved
  ) {
    super(router, route, globalEventManager, facilityControllerService, authService, companyController, selUserCompanyService);
  }

  async ngOnInit(): Promise<void> {

    await super.ngOnInit();

    this.facilityIdChangeSub = this.facilityIdPing$.subscribe(facilityId => this.setFacilitySemiProducts(facilityId));
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();

    this.subs = this.selfOnboardingService.guidedTourStep$.subscribe(step => {

      setTimeout(() => {
        if (this.deliveriesTitleTooltip) {
          this.deliveriesTitleTooltip.close();
        }
        if (this.addDeliveryButtonTooltip) {
          this.addDeliveryButtonTooltip.close();
        }
      }, 50);

      if (step === 2) {
        setTimeout(() => {
          if (this.deliveriesTitleTooltip) {
            this.deliveriesTitleTooltip.open();
          }
        }, 50);
      } else if (step === 3) {
        setTimeout(() => {
          if (this.addDeliveryButtonTooltip) {
            this.addDeliveryButtonTooltip.open();
          }
        }, 50);
      }
    });
  }

  ngOnDestroy() {
    if (this.facilityIdChangeSub) {
      this.facilityIdChangeSub.unsubscribe();
    }

    if (this.subs) {
      this.subs.unsubscribe();
    }
  }

  async newPurchaseOrder() {

    if (!this.facilityForStockOrderForm.value) {
      const title = $localize`:@@productLabelStock.purchase.warning.title:Missing facility`;
      const message = $localize`:@@productLabelStock.purchase.warning.message:Please select facility before continuing`;
      this.showWarning(title, message);
      return;
    }

    const facility = this.facilityForStockOrderForm.value as ApiFacility;
    const isShrimp = this.envInfo.isProductType('shrimp');
    const isFieldInspection = facility && facility.isFieldInspection;
    
    // Para camarón: Si NO es inspección en campo, mostrar modales de selección
    const canLinkFieldInspection = isShrimp && !isFieldInspection;

    let selectedFieldInspection: ApiFieldInspection | null = null;

    // 🔍 Paso 1: Mostrar modal de inspección de campo (opcional)
    if (canLinkFieldInspection) {
      try {
        const fieldModalRef = this.modalService.open(FieldInspectionSelectionModalComponent, {
          centered: true,
          backdrop: 'static',
          keyboard: false,
          size: 'lg'
        }, {
          companyId: this.companyId,
          onlyRecommended: false
        });

        const fieldResult = await fieldModalRef.result;
        if (fieldResult === undefined) {
          return;
        }
        selectedFieldInspection = fieldResult as ApiFieldInspection | null;
      } catch (e) {
        // User cancelled - abort navigation
        return;
      }
    }

    // Construir query params
    const queryParams: any = {};
    if (selectedFieldInspection) {
      queryParams.fieldInspectionId = selectedFieldInspection.id;
    }

    this.router.navigate(
      ['my-stock', 'deliveries', 'facility', this.selectedFacilityId, 'deliveries', 'new'],
      { queryParams }
    ).then();
  }

  async newPurchaseOrderBulk() {

    if (!this.facilityForStockOrderForm.value) {
      const title = $localize`:@@productLabelStock.purchase.warning.title:Missing facility`;
      const message = $localize`:@@productLabelStock.purchase.warning.message:Please select facility before continuing`;
      this.showWarning(title, message);
      return;
    }

    const facility = this.facilityForStockOrderForm.value as ApiFacility;
    const isShrimp = this.envInfo.isProductType('shrimp');
    const isFieldInspection = facility && facility.isFieldInspection;
    
    const canLinkFieldInspection = isShrimp && !isFieldInspection;

    let selectedFieldInspection: ApiFieldInspection | null = null;

    // 🔍 Paso 1: Mostrar modal de inspección de campo (opcional)
    if (canLinkFieldInspection) {
      try {
        const fieldModalRef = this.modalService.open(FieldInspectionSelectionModalComponent, {
          centered: true,
          backdrop: 'static',
          keyboard: false,
          size: 'lg'
        }, {
          companyId: this.companyId,
          onlyRecommended: false
        });

        const fieldResult = await fieldModalRef.result;
        if (fieldResult === undefined) {
          return;
        }
        selectedFieldInspection = fieldResult as ApiFieldInspection | null;
      } catch (e) {
        return;
      }
    }

    const queryParams: any = {};
    if (selectedFieldInspection) {
      queryParams.fieldInspectionId = selectedFieldInspection.id;
    }

    this.router.navigate(
      ['my-stock', 'deliveries', 'facility', this.selectedFacilityId, 'deliveries', 'new-bulk'],
      { queryParams }
    ).then();
  }

  async exportDeliveriesExcel(): Promise<void> {

    this.globalEventManager.showLoading(true);
    try {
      const res = await this.stockOrderControllerService.exportDeliveriesByCompany(this.companyId)
          .pipe(take(1))
          .toPromise();

      this.fileSaverService.save(res, 'deliveries.xlsx');
    } finally {
      this.globalEventManager.showLoading(false);
    }
  }

  onShowPO(event:any) {
    this.showedPurchaseOrders = event;
  }

  onCountAllPO(event:any) {
    this.allPurchaseOrders = event;
  }

  searchPurchaseInput(event:any) {
    this.searchFarmerNameSurnamePing$.next(event);
  }
  private setFacilitySemiProducts(facilityId: number) {
    if (facilityId !== null && facilityId !== undefined) {
      this.facilitySemiProducts = new FacilitySemiProductsCodebookService(this.facilityControllerService, facilityId, this.codebookTranslations);
    } else {
      this.facilitySemiProducts = null;
    }
  }
  
  whenFacilityForStockOrderChanged(event: ApiFacility) {
    if (event === null) {
      this.semiProductFrom.setValue(null);
    }
    this.facilityForStockOrderChanged(event);
  }

}
