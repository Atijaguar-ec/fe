import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { StockOrderType } from '../../../../../shared/types';
import { ActivatedRoute } from '@angular/router';
import { EnumSifrant } from '../../../../shared-services/enum-sifrant';
import { GlobalEventManagerService } from '../../../../core/global-event-manager.service';
import { CompanyUserCustomersByRoleService } from '../../../../shared-services/company-user-customers-by-role.service';
import { FacilityControllerService } from '../../../../../api/api/facilityController.service';
import { switchMap, take } from 'rxjs/operators';
import { ApiFacility } from '../../../../../api/model/apiFacility';
import { ApiSemiProduct } from '../../../../../api/model/apiSemiProduct';
import { CodebookTranslations } from '../../../../shared-services/codebook-translations';
import { CompanyControllerService } from '../../../../../api/api/companyController.service';
import { ApiUserCustomer } from '../../../../../api/model/apiUserCustomer';
import { ApiStockOrder } from '../../../../../api/model/apiStockOrder';
import { CertificationTypeControllerService } from '../../../../../api/api/certificationTypeController.service';
import {dateISOString, defaultEmptyObject, generateFormFromMetadata} from '../../../../../shared/utils';
import { ApiStockOrderValidationScheme } from './validation';
import { Location } from '@angular/common';
import { AuthService } from '../../../../core/auth.service';
import { StockOrderControllerService } from '../../../../../api/api/stockOrderController.service';
import { ListEditorManager } from '../../../../shared/list-editor/list-editor-manager';
import { ApiActivityProofValidationScheme } from '../additional-proof-item/validation';
import { ApiActivityProof } from '../../../../../api/model/apiActivityProof';
import { SemiProductControllerService } from '../../../../../api/api/semiProductController.service';
import { ApiResponseApiCompanyGet } from '../../../../../api/model/apiResponseApiCompanyGet';
import StatusEnum = ApiResponseApiCompanyGet.StatusEnum;
import { SelectedUserCompanyService } from '../../../../core/selected-user-company.service';
import { PdfGeneratorService } from '../../../../shared-services/pdf-generator.service';
import { ApiUserGet } from '../../../../../api/model/apiUserGet';
import { Subscription } from 'rxjs';
import { ApiCompanyGet } from '../../../../../api/model/apiCompanyGet';
import { EnvironmentInfoService } from '../../../../core/environment-info.service';
import { ChainFieldConfigService } from '../../../../shared-services/chain-field-config.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { LaboratoryAnalysisService } from '../../../../core/api/laboratory-analysis.service';
import { FieldInspectionService } from '../../../../core/api/field-inspection.service';
import { ShrimpFlavorDefectControllerService } from '../../../../../api/api/shrimpFlavorDefectController.service';

declare const $localize: (messageParts: TemplateStringsArray, ...placeholders: any[]) => string;

@Component({
  selector: 'app-stock-delivery-details',
  templateUrl: './stock-delivery-details.component.html',
  styleUrls: ['./stock-delivery-details.component.scss']
})
export class StockDeliveryDetailsComponent implements OnInit, OnDestroy {

  title: string | null = null;

  update = true;

  @ViewChild('deliveryDetailsContainer') deliveryDetailsContainer!: ElementRef<HTMLElement>;

  stockOrderForm!: FormGroup;
  order: ApiStockOrder | null = null;
  orderTypeForm = new FormControl(null);
  orderTypeCodebook = EnumSifrant.fromObject(this.orderTypeOptions);

  userLastChanged: string | null = null;

  submitted = false;

  showPrintButton = false;

  codebookPreferredWayOfPayment!: EnumSifrant;

  searchFarmers = new FormControl(null, Validators.required);
  searchCollectors = new FormControl(null);
  farmersCodebook!: CompanyUserCustomersByRoleService;
  collectorsCodebook!: CompanyUserCustomersByRoleService;

  employeeForm = new FormControl(null, Validators.required);
  codebookUsers: EnumSifrant = EnumSifrant.fromObject({});

  facilityNameForm = new FormControl(null);

  options: ApiSemiProduct[] = [];
  modelChoice: number | null = null;

  measureUnit = '-';
  selectedCurrency = '-';

  codebookOrganic = EnumSifrant.fromObject(this.yesNo);

  netWeightForm = new FormControl(null);
  finalPriceForm = new FormControl(null);

  updatePOInProgress = false;

  companyProfile: ApiCompanyGet | null = null;
  private currentLoggedInUser: ApiUserGet | null = null;
  certificationTypeMap: Record<string, string> = {};
  certificationTypeOptions: EnumSifrant = EnumSifrant.fromObject({});

  varietyOptionsMap: Record<string, string> = {};
  varietyOptions: EnumSifrant = EnumSifrant.fromObject({});

  private facility: ApiFacility | null = null;

  private purchaseOrderId: number | null;
  private labAnalysisId: number | null = null;
  private srcStockOrderId: number | null = null;
  private fieldInspectionId: number | null = null;

  additionalProofsListManager: ListEditorManager<ApiActivityProof> | null = null;

  private userProfileSubs: Subscription | null = null;
  
  // Observables para visibilidad de campos (dinámicos según facility)
  private _showPriceFields$ = new BehaviorSubject<boolean>(true);
  private _showPaymentFields$ = new BehaviorSubject<boolean>(true);
  private _showMoistureField$ = new BehaviorSubject<boolean>(false);
  private _showShrimpFields$ = new BehaviorSubject<boolean>(false);
  private _showFieldInspectionFields$ = new BehaviorSubject<boolean>(false);
  private _showReceptionFields$ = new BehaviorSubject<boolean>(true);
  private _showSensorialQualityFields$ = new BehaviorSubject<boolean>(false);
  
  showPriceFields$: Observable<boolean> = this._showPriceFields$.asObservable();
  showPaymentFields$: Observable<boolean> = this._showPaymentFields$.asObservable();
  showMoistureField$: Observable<boolean> = this._showMoistureField$.asObservable();
  showShrimpFields$: Observable<boolean> = this._showShrimpFields$.asObservable();
  showFieldInspectionFields$: Observable<boolean> = this._showFieldInspectionFields$.asObservable();
  showReceptionFields$: Observable<boolean> = this._showReceptionFields$.asObservable();
  showSensorialQualityFields$: Observable<boolean> = this._showSensorialQualityFields$.asObservable();

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private globalEventsManager: GlobalEventManagerService,
    private facilityControllerService: FacilityControllerService,
    private companyControllerService: CompanyControllerService,
    private stockOrderControllerService: StockOrderControllerService,
    private semiProductControllerService: SemiProductControllerService,
    private certificationTypeControllerService: CertificationTypeControllerService,
    private codebookTranslations: CodebookTranslations,
    private authService: AuthService,
    private selUserCompanyService: SelectedUserCompanyService,
    private pdfGeneratorService: PdfGeneratorService,
    private envInfo: EnvironmentInfoService,
    private laboratoryAnalysisService: LaboratoryAnalysisService,
    private fieldInspectionService: FieldInspectionService,
    private shrimpFlavorDefectService: ShrimpFlavorDefectControllerService,
    public fieldConfig: ChainFieldConfigService  
  ) {
    const purchaseOrderIdParam = this.route.snapshot.params?.purchaseOrderId;
    this.purchaseOrderId = purchaseOrderIdParam != null ? Number(purchaseOrderIdParam) : null;
    const qp = this.route.snapshot.queryParams || {};
    this.labAnalysisId = qp.labAnalysisId != null ? Number(qp.labAnalysisId) : null;
    this.srcStockOrderId = qp.srcStockOrderId != null ? Number(qp.srcStockOrderId) : null;
    this.fieldInspectionId = qp.fieldInspectionId != null ? Number(qp.fieldInspectionId) : null;
  }

  // Additional proof item factory methods (used when creating ListEditorManger)
  static AdditionalProofItemCreateEmptyObject(): ApiActivityProof {
    const object = ApiActivityProof.formMetadata();
    return defaultEmptyObject(object) as ApiActivityProof;
  }

  static AdditionalProofItemEmptyObjectFormFactory(): () => FormControl {
    return () => {
      return new FormControl(StockDeliveryDetailsComponent.AdditionalProofItemCreateEmptyObject(),
        ApiActivityProofValidationScheme.validators);
    };
  }

  get orderType(): StockOrderType {

    const realType = this.stockOrderForm?.get('orderType')?.value;

    if (realType) {
      return realType;
    }

    if (this.route.snapshot.data.action === 'update') {
      if (this.order && this.order.orderType) {
        return this.order.orderType;
      }
      return {} as StockOrderType;
    }

    if (!this.route.snapshot.data.mode) {
      throw Error('No stock order mode set');
    }
    return this.route.snapshot.data.mode as StockOrderType;
  }

  get orderTypeOptions() {

    const obj: Record<string, string> = {};
    obj['GENERAL_ORDER'] = $localize`:@@orderType.codebook.generalOrder:General order`;
    obj['PROCESSING_ORDER'] = $localize`:@@orderType.codebook.processingOrder:Processing order`;
    obj['PURCHASE_ORDER'] = $localize`:@@orderType.codebook.purchaseOrder:Purchase order`;
    return obj;
  }

  get preferredWayOfPaymentList() {

    const obj: Record<string, string> = {};
    obj['CASH'] = $localize`:@@productLabelStockPurchaseOrdersModal.preferredWayOfPayment.cash:Cash`;

    if (this.stockOrderForm?.get('representativeOfProducerUserCustomer')?.value) {

      obj['CASH_VIA_COLLECTOR'] = $localize`:@@productLabelStockPurchaseOrdersModal.preferredWayOfPayment.cashViaCollector:Cash via collector`;
    }

    if (this.stockOrderForm?.get('producerUserCustomer')?.value &&
      !this.stockOrderForm.get('representativeOfProducerUserCustomer')?.value) {

      obj['UNKNOWN'] = $localize`:@@productLabelStockPurchaseOrdersModal.preferredWayOfPayment.unknown:Unknown`;
    }

    obj['BANK_TRANSFER'] = $localize`:@@productLabelStockPurchaseOrdersModal.preferredWayOfPayment.bankTransfer:Bank transfer`;
    obj['CHEQUE'] = $localize`:@@preferredWayOfPayment.cheque:Cheque`;
    obj['OFFSETTING'] = $localize`:@@preferredWayOfPayment.offsetting:Cheque`;

    return obj;
  }

  get inspectionDateLabel() {
    const productType = this.fieldConfig.getProductType()?.toUpperCase() ?? '';
    const isShrimp = productType === 'SHRIMP';

    if (isShrimp && this.isFieldInspectionFacility()) {
      return $localize`:@@productLabelStockPurchaseOrdersModal.datepicker.inspectionDate.label:Fecha de inspección`;
    }

    return $localize`:@@productLabelStockPurchaseOrdersModal.datepicker.date.label:Delivery date`;
  }

  get inspectionTimeLabel() {
    const productType = this.fieldConfig.getProductType()?.toUpperCase() ?? '';
    const isShrimp = productType === 'SHRIMP';

    if (isShrimp && this.isFieldInspectionFacility()) {
      return $localize`:@@productLabelStockPurchaseOrdersModal.textinput.inspectionTime.label:Hora de inspección`;
    }

    return $localize`:@@productLabelStockPurchaseOrdersModal.textinput.receptionTime.label:Reception time`;
  }

  get quantityLabel() {
    if (this.isFieldInspectionFacility()) {
      return $localize`:@@productLabelStockPurchaseOrdersModal.textinput.quantity.label:Quantity (units)`;
    }
    if (this.orderType === 'PURCHASE_ORDER') {
      return $localize`:@@productLabelStockPurchaseOrdersModal.textinput.quantityDelievered.label:Quantity` + ` (${this.measureUnit})`;
    } else {
      return $localize`:@@productLabelStockPurchaseOrdersModal.textinput.quantity.label:Quantity (units)`;
    }
  }

  private initializeVarietyOptions() {
    this.varietyOptionsMap = {
      NACIONAL: 'Nacional',
      CCN51: 'CCN51'
    };
    this.refreshVarietyOptions();
  }

  private refreshVarietyOptions() {
    this.varietyOptions = EnumSifrant.fromObject(this.varietyOptionsMap);
    this.varietyOptions.setPlaceholder($localize`:@@productLabelStockPurchaseOrdersModal.singleChoice.variety.placeholder:Selecciona la variedad`);
  }

  private refreshCertificationTypeOptions() {
    this.certificationTypeOptions = EnumSifrant.fromObject(this.certificationTypeMap);
    this.certificationTypeOptions.setPlaceholder($localize`:@@productLabelStockPurchaseOrdersModal.singleChoice.organicsCertificationType.placeholder:Seleccionar opción ...`);
  }

  private async loadCertificationTypes() {
    try {
      const res = await this.certificationTypeControllerService
        .getCertificationTypeList('FETCH', 1000, 0, 'label', 'ASC', 'ES')
        .pipe(take(1))
        .toPromise();
      const items = res?.data?.items || [];
      this.certificationTypeMap = {};
      items
        .filter((it: any) => it?.status === 'ACTIVE')
        .forEach((it: any) => {
          // Use label as key and value to keep stored string readable
          const key = it.label;
          this.certificationTypeMap[key] = it.label;
        });
      this.refreshCertificationTypeOptions();
    } catch (_) {
      // keep empty codebook on error
      this.certificationTypeMap = {};
      this.refreshCertificationTypeOptions();
    }
  }

  private async loadShrimpFlavorDefects() {
    const productType = this.fieldConfig.getProductType()?.toUpperCase() ?? '';
    if (productType !== 'SHRIMP') {
      this.flavorDefectCodebook = EnumSifrant.fromObject({});
      return;
    }

    try {
      const res = await this.shrimpFlavorDefectService
        .getActiveShrimpFlavorDefects('ES')
        .pipe(take(1))
        .toPromise();
      const items = res?.data || [];
      const map: Record<string, string> = {};
      items.forEach(defect => {
        if (defect && defect.id != null) {
          map[String(defect.id)] = defect.label || defect.code;
        }
      });
      this.flavorDefectCodebook = EnumSifrant.fromObject(map);
      this.flavorDefectCodebook.setPlaceholder($localize`:@@productLabelStockPurchaseOrdersModal.singleChoice.flavorDefectType.placeholder:Seleccionar opción ...`);
    } catch (_) {
      this.flavorDefectCodebook = EnumSifrant.fromObject({});
    }
  }

  private ensureVarietyOption(value?: string) {
    if (!value) {
      return;
    }
    if (!this.varietyOptionsMap[value]) {
      this.varietyOptionsMap[value] = value;
      this.refreshVarietyOptions();
    }
  }

  get tareLabel() {
    return $localize`:@@productLabelStockPurchaseOrdersModal.textinput.tare.label:Tare` + ` (${this.measureUnit})`;
  }

  get netLabel() {
    return $localize`:@@productLabelStockPurchaseOrdersModal.textinput.netWeight.label:Net weight` + ` (${this.measureUnit})`;
  }

  get finalPriceLabel() {
    const currency = this.selectedCurrency ? this.selectedCurrency : '-';
    return $localize`:@@productLabelStockPurchaseOrdersModal.textinput.finalPrice.label:Final price` + ` (${currency})`;
  }

  get pricePerUnitLabel() {
    return $localize`:@@productLabelStockPurchaseOrdersModal.textinput.pricePerUnit.label:Price per unit` + ` (${this.selectedCurrency}/${this.measureUnit})`;
  }

  get costLabel() {
    return $localize`:@@productLabelStockPurchaseOrdersModal.textinput.cost.label:Base payment` + ` (${this.selectedCurrency})`;
  }

  get balanceLabel() {
    return $localize`:@@productLabelStockPurchaseOrdersModal.textinput.balance.label:Open balance` + ` (${this.selectedCurrency})`;
  }

  get damagedPriceDeductionLabel() {
    return $localize`:@@productLabelStockPurchaseOrdersModal.textinput.damagedPriceDeduction.label: Deduction` + ` (${this.selectedCurrency}/${this.measureUnit})`;
  }

  get finalPriceDiscountLabel() {
    return $localize`:@@productLabelStockPurchaseOrdersModal.textinput.finalPriceDiscount.label:Final price discount` + ` (${this.selectedCurrency})`;
  }

  get damagedWeightDeductionLabel() {
    return $localize`:@@productLabelStockPurchaseOrdersModal.textinput.damagedWeightDeduction.label: Deduction` + ` (${this.measureUnit})`;
  }

  get additionalProofsForm(): FormArray {
    return (this.stockOrderForm?.get('activityProofs') as FormArray) ?? new FormArray([]);
  }

  get yesNo(): Record<string, string> {
    return {
      true: $localize`:@@productLabelStockPurchaseOrdersModal.organic.yes:Yes`,
      false: $localize`:@@productLabelStockPurchaseOrdersModal.organic.no:No`
    };
  }

  // 🔍 Opciones para resultado de prueba de sabor
  get flavorTestResultOptionsData(): Record<string, string> {
    return {
      NORMAL: $localize`:@@productLabelStockPurchaseOrdersModal.flavorTestResult.normal:Normal`,
      DEFECT: $localize`:@@productLabelStockPurchaseOrdersModal.flavorTestResult.defect:Con Defecto`
    };
  }
  flavorTestResultOptions = EnumSifrant.fromObject(this.flavorTestResultOptionsData);

  // 🔍 Opciones para recomendación de compra
  get purchaseRecommendedOptionsData(): Record<string, string> {
    return {
      true: $localize`:@@productLabelStockPurchaseOrdersModal.purchaseRecommended.yes:Sí, Comprar`,
      false: $localize`:@@productLabelStockPurchaseOrdersModal.purchaseRecommended.no:No Comprar`
    };
  }
  purchaseRecommendedOptions = EnumSifrant.fromObject(this.purchaseRecommendedOptionsData);

  // 🔍 Codebook para tipos de defecto de sabor (se cargará desde el servicio)
  flavorDefectCodebook: EnumSifrant = EnumSifrant.fromObject({});

  async ngOnInit() {

    this.userProfileSubs = this.authService.userProfile$
      .pipe(
        switchMap(up => {
          this.currentLoggedInUser = up;
          return this.selUserCompanyService.selectedCompanyProfile$;
        })
      )
      .subscribe(cp => {
        if (cp) {
          this.companyProfile = cp;
          this.selectedCurrency = cp.currency?.code ? cp.currency.code : '-';
          this.reloadOrder();
        }
      });

    this.initializeVarietyOptions();
    // Load organic certification types for the combo (active only)
    this.loadCertificationTypes().then();
    this.loadShrimpFlavorDefects().then();
  }

  ngOnDestroy(): void {
    if (this.userProfileSubs) {
      this.userProfileSubs.unsubscribe();
    }
  }

  private newTitle(pageMode: StockOrderType) {
    switch (pageMode) {
      case 'GENERAL_ORDER':
        return $localize`:@@productLabelStockPurchaseOrdersModal.newGeneralOrderTitle:New transfer order`;
      case 'PROCESSING_ORDER':
        return $localize`:@@productLabelStockPurchaseOrdersModal.newProcessingOrderTitle:New processing order`;
      case 'PURCHASE_ORDER':
        return $localize`:@@productLabelStockPurchaseOrdersModal.newPurchaseOrderTitle:New purchase order`;
      default:
        return null;
    }
  }

  updateTitle(pageMode: StockOrderType) {
    switch (pageMode) {
      case 'GENERAL_ORDER':
        return $localize`:@@productLabelStockPurchaseOrdersModal.updateGeneralOrderTitle:Update transfer order`;
      case 'PROCESSING_ORDER':
        return $localize`:@@productLabelStockPurchaseOrdersModal.updateProcessingOrderTitle:Update processing order`;
      case 'PURCHASE_ORDER':
        return $localize`:@@productLabelStockPurchaseOrdersModal.updatePurchaseOrderTitle:Update purchase order`;
      default:
        return null;
    }
  }

  private reloadOrder() {

    this.globalEventsManager.showLoading(true);
    this.submitted = false;

    this.initializeData().then(() => {
      this.farmersCodebook = new CompanyUserCustomersByRoleService(this.companyControllerService, this.companyProfile?.id ?? 0, 'FARMER');
      this.collectorsCodebook = new CompanyUserCustomersByRoleService(this.companyControllerService, this.companyProfile?.id ?? 0, 'COLLECTOR');

      if (this.update) {
        this.editStockOrder().then();
      } else {
        this.newStockOrder();
      }
      this.updateValidators();
      this.initializeListManager();
      this.globalEventsManager.showLoading(false);
    });
  }

  private async initializeData() {

    const action = this.route.snapshot.data.action;
    if (!action) {
      return;
    }

    if (action === 'new') {

      this.update = false;
      this.title = this.newTitle(this.orderType);
      const facilityId = this.route.snapshot.params.facilityId;

      const response = await this.facilityControllerService.getFacility(facilityId).pipe(take(1)).toPromise();
      if (response && response.status === StatusEnum.OK && response.data) {
        this.facility = response.data;
        // 🎯 Actualizar observables de visibilidad según facility cargado
        this.updateFieldVisibilityObservables();
        for (const item of this.facility?.facilitySemiProductList || []) {
          if (item.buyable) {
            item.name = this.translateName(item);
            this.options.push(item);
          }
        }
        this.facilityNameForm.setValue(this.facility ? this.translateName(this.facility) : null);
      }

    } else if (action === 'update') {

      this.update = true;

      const purchaseOrderId = this.purchaseOrderId;
      if (purchaseOrderId == null) {
        throw Error('Missing purchase order id for update action.');
      }

      const stockOrderResponse = await this.stockOrderControllerService.getStockOrder(purchaseOrderId).pipe(take(1)).toPromise();
      if (stockOrderResponse && stockOrderResponse.status === StatusEnum.OK && stockOrderResponse.data) {

        this.order = stockOrderResponse.data;
        this.title = this.updateTitle(this.orderType);
        this.facility = stockOrderResponse.data.facility ?? null;
        // 🎯 Actualizar observables de visibilidad según facility cargado
        this.updateFieldVisibilityObservables();

        for (const item of this.facility?.facilitySemiProductList || []) {
          if (item.buyable) {
            item.name = this.translateName(item);
            this.options.push(item);
          }
        }
        this.facilityNameForm.setValue(this.facility ? this.translateName(this.facility) : null);
      }
    } else {
      throw Error('Wrong action.');
    }

    if (this.companyProfile) {
      const obj: Record<string, string> = {};
      const users = this.companyProfile.users ?? [];
      for (const user of users) {
        if (user?.id != null) {
          obj[user.id.toString()] = `${user.name ?? ''} ${user.surname ?? ''}`.trim();
        }
      }
      this.codebookUsers = EnumSifrant.fromObject(obj);
    }

    this.showPrintButton = this.showPrintButton || this.update;
  }

  private initializeListManager() {

    this.additionalProofsListManager = new ListEditorManager<ApiActivityProof>(
      this.additionalProofsForm as FormArray,
      StockDeliveryDetailsComponent.AdditionalProofItemEmptyObjectFormFactory(),
      ApiActivityProofValidationScheme
    );

    // TODO: initialize payments list manager
  }

  private newStockOrder() {

    const facilityContext = this.facility?.id ? { facility: { id: this.facility.id } } : undefined;
    this.stockOrderForm = generateFormFromMetadata(ApiStockOrder.formMetadata(), facilityContext, ApiStockOrderValidationScheme(this.orderType));

    // Initialize preferred way of payments
    this.codebookPreferredWayOfPayment = EnumSifrant.fromObject(this.preferredWayOfPaymentList);

    // Set initial data
    if (this.selectedCurrency !== '-') {
      this.stockOrderForm.get('currency')?.setValue(this.selectedCurrency);
    }

    this.stockOrderForm.get('orderType')?.setValue(this.orderType);
    this.stockOrderForm.get('womenShare')?.setValue(false);
    this.setDate();

    // Set current logged-in user as employee
    this.employeeForm.setValue(this.currentLoggedInUser?.id != null ? this.currentLoggedInUser.id.toString() : null);

    // If only one semi-product select it as a default
    if (this.options && this.options.length === 1) {
      const defaultSemiProductId = this.options[0].id;
      if (defaultSemiProductId != null) {
        this.modelChoice = defaultSemiProductId;
        this.stockOrderForm.get('semiProduct')?.setValue({ id: defaultSemiProductId });
        this.setMeasureUnit(defaultSemiProductId).then();
      }
    }

    // Add Week Number control (for cacao). Required only when cacao selected.
    if (!this.stockOrderForm.get('weekNumber')) {
      this.stockOrderForm.addControl('weekNumber', new FormControl(null));
    }
    // Add Parcel Lot control (for cacao)
    if (!this.stockOrderForm.get('parcelLot')) {
      this.stockOrderForm.addControl('parcelLot', new FormControl(null));
    }
    // Add Variety control (for cacao)
    if (!this.stockOrderForm.get('variety')) {
      this.stockOrderForm.addControl('variety', new FormControl(null));
    }
    // Add Organic Certification control
    if (!this.stockOrderForm.get('organicCertification')) {
      this.stockOrderForm.addControl('organicCertification', new FormControl(null));
    }
    // Add Moisture Percentage controls
    if (!this.stockOrderForm.get('finalPriceDiscount')) {
      this.stockOrderForm.addControl('finalPriceDiscount', new FormControl(null));
    }
    if (!this.stockOrderForm?.get('moisturePercentage')) {
      this.stockOrderForm?.addControl('moisturePercentage', new FormControl(null));
    }
    if (!this.stockOrderForm?.get('moistureWeightDeduction')) {
      this.stockOrderForm?.addControl('moistureWeightDeduction', new FormControl(null));
    }
    // Add Shrimp-specific controls
    if (!this.stockOrderForm.get('numberOfGavetas')) {
      this.stockOrderForm.addControl('numberOfGavetas', new FormControl(null));
    }
    if (!this.stockOrderForm.get('numberOfBines')) {
      this.stockOrderForm.addControl('numberOfBines', new FormControl(null));
    }
    if (!this.stockOrderForm.get('numberOfPiscinas')) {
      this.stockOrderForm.addControl('numberOfPiscinas', new FormControl(null));
    }
    if (!this.stockOrderForm.get('guiaRemisionNumber')) {
      this.stockOrderForm.addControl('guiaRemisionNumber', new FormControl(null));
    }
    // Add Laboratory-specific controls
    if (!this.stockOrderForm.get('sampleNumber')) {
      this.stockOrderForm.addControl('sampleNumber', new FormControl(null));
    }
    if (!this.stockOrderForm.get('receptionTime')) {
      this.stockOrderForm.addControl('receptionTime', new FormControl(null));
    }
    if (!this.stockOrderForm.get('comments')) {
      this.stockOrderForm.addControl('comments', new FormControl(null));
    }
    // Add Field Inspection (sensory testing) specific controls
    if (!this.stockOrderForm.get('flavorTestResult')) {
      this.stockOrderForm.addControl('flavorTestResult', new FormControl(null));
    }
    if (!this.stockOrderForm.get('flavorDefectTypeId')) {
      this.stockOrderForm.addControl('flavorDefectTypeId', new FormControl(null));
    }
    if (!this.stockOrderForm.get('purchaseRecommended')) {
      this.stockOrderForm.addControl('purchaseRecommended', new FormControl(null));
    }
    if (!this.stockOrderForm.get('inspectionNotes')) {
      this.stockOrderForm.addControl('inspectionNotes', new FormControl(null));
    }
    this.updateWeekNumberVisibilityAndValidation();

    // Aplicar configuración dinámica de campos
    this.applyFieldConfiguration();

    this.prepareData();
    this.setupFormListeners();
  }

  private async editStockOrder() {

    if (!this.order) {
      return;
    }

    const order = this.order;

    // Generate the form
    this.stockOrderForm = generateFormFromMetadata(ApiStockOrder.formMetadata(), order, ApiStockOrderValidationScheme(this.orderType));

    // Initialize preferred way of payments
    this.codebookPreferredWayOfPayment = EnumSifrant.fromObject(this.preferredWayOfPaymentList);

    if (this.orderType === 'PURCHASE_ORDER') {
      const currencyValue = this.stockOrderForm?.get('currency')?.value;
      this.selectedCurrency = currencyValue ? currencyValue : '-';
      this.searchFarmers.setValue(order.producerUserCustomer);
      if (order.representativeOfProducerUserCustomer && order.representativeOfProducerUserCustomer.id) {
        this.searchCollectors.setValue(order.representativeOfProducerUserCustomer);
      }
    }

    this.modelChoice = order.semiProduct?.id ?? null;
    if (this.modelChoice != null) {
      this.setMeasureUnit(this.modelChoice).then();
    }

    this.employeeForm.setValue(order.creatorId != null ? order.creatorId.toString() : null);
    // TODO: set documents and payments if purchase order

    if (order.updatedBy && order.updatedBy.id) {
      const userUpdatedBy = order.updatedBy;
      this.userLastChanged = `${userUpdatedBy.name} ${userUpdatedBy.surname}`;
    } else if (order.createdBy && order.createdBy.id) {
      const userCreatedBy = order.createdBy;
      this.userLastChanged = `${userCreatedBy.name} ${userCreatedBy.surname}`;
    }

    const organicControl = this.stockOrderForm.get('organic');
    if (organicControl && organicControl.value != null) {
      organicControl.setValue(organicControl.value.toString());
    }

    if (this.stockOrderForm?.get('priceDeterminedLater')?.value) {
      this.stockOrderForm.get('pricePerUnit')?.clearValidators();
      this.stockOrderForm.get('damagedPriceDeduction')?.clearValidators();
    }
    this.stockOrderForm?.updateValueAndValidity();

    // Ensure weekNumber control exists and set value if backend provides it
    if (!this.stockOrderForm.get('weekNumber')) {
      this.stockOrderForm.addControl('weekNumber', new FormControl(null));
    }
    if ((order as any)?.weekNumber != null) {
      this.stockOrderForm?.get('weekNumber')?.setValue((order as any).weekNumber);
    }
    // Ensure parcelLot control exists and set value if backend provides it
    if (!this.stockOrderForm?.get('parcelLot')) {
      this.stockOrderForm?.addControl('parcelLot', new FormControl(null));
    }
    if ((order as any)?.parcelLot != null) {
      this.stockOrderForm?.get('parcelLot')?.setValue((order as any).parcelLot);
    }
    // Ensure variety control exists and set value if backend provides it
    if (!this.stockOrderForm?.get('variety')) {
      this.stockOrderForm?.addControl('variety', new FormControl(null));
    }
    if ((order as any)?.variety != null) {
      this.ensureVarietyOption((order as any).variety);
      this.stockOrderForm?.get('variety')?.setValue((order as any).variety);
    }
    // Ensure organicCertification control exists and set value if backend provides it
    if (!this.stockOrderForm?.get('organicCertification')) {
      this.stockOrderForm?.addControl('organicCertification', new FormControl(null));
    }
    if ((order as any)?.organicCertification != null) {
      const value = (order as any).organicCertification;
      this.stockOrderForm?.get('organicCertification')?.setValue(value);
    }
    // Ensure moisture percentage controls exist
    if (!this.stockOrderForm.get('moisturePercentage')) {
      this.stockOrderForm.addControl('moisturePercentage', new FormControl(null));
    }
    if (!this.stockOrderForm.get('moistureWeightDeduction')) {
      this.stockOrderForm.addControl('moistureWeightDeduction', new FormControl(null));
    }
    // Ensure shrimp-specific controls exist and set values
    if (!this.stockOrderForm.get('numberOfGavetas')) {
      this.stockOrderForm.addControl('numberOfGavetas', new FormControl(null));
    }
    if ((order as any)?.numberOfGavetas != null) {
      this.stockOrderForm.get('numberOfGavetas')?.setValue((order as any).numberOfGavetas);
    }
    if (!this.stockOrderForm.get('numberOfBines')) {
      this.stockOrderForm.addControl('numberOfBines', new FormControl(null));
    }
    if ((order as any)?.numberOfBines != null) {
      this.stockOrderForm.get('numberOfBines')?.setValue((order as any).numberOfBines);
    }
    if (!this.stockOrderForm.get('numberOfPiscinas')) {
      this.stockOrderForm.addControl('numberOfPiscinas', new FormControl(null));
    }
    if ((order as any)?.numberOfPiscinas != null) {
      this.stockOrderForm.get('numberOfPiscinas')?.setValue((order as any).numberOfPiscinas);
    }
    if (!this.stockOrderForm.get('guiaRemisionNumber')) {
      this.stockOrderForm.addControl('guiaRemisionNumber', new FormControl(null));
    }
    if ((order as any)?.guiaRemisionNumber != null) {
      this.stockOrderForm.get('guiaRemisionNumber')?.setValue((order as any).guiaRemisionNumber);
    }
    // Ensure laboratory-specific controls exist and set values
    if (!this.stockOrderForm.get('sampleNumber')) {
      this.stockOrderForm.addControl('sampleNumber', new FormControl(null));
    }
    if ((order as any)?.sampleNumber != null) {
      this.stockOrderForm.get('sampleNumber')?.setValue((order as any).sampleNumber);
    }
    if (!this.stockOrderForm.get('receptionTime')) {
      this.stockOrderForm.addControl('receptionTime', new FormControl(null));
    }
    if ((order as any)?.receptionTime != null) {
      this.stockOrderForm.get('receptionTime')?.setValue((order as any).receptionTime);
    }
    if (!this.stockOrderForm.get('comments')) {
      this.stockOrderForm.addControl('comments', new FormControl(null));
    }
    if ((order as any)?.comments != null) {
      this.stockOrderForm.get('comments')?.setValue((order as any).comments);
    }
    // Ensure field inspection controls exist and set values
    if (!this.stockOrderForm.get('flavorTestResult')) {
      this.stockOrderForm.addControl('flavorTestResult', new FormControl(null));
    }
    if ((order as any)?.flavorTestResult != null) {
      this.stockOrderForm.get('flavorTestResult')?.setValue((order as any).flavorTestResult);
    }
    if (!this.stockOrderForm.get('flavorDefectTypeId')) {
      this.stockOrderForm.addControl('flavorDefectTypeId', new FormControl(null));
    }
    if ((order as any)?.flavorDefectTypeId != null) {
      this.stockOrderForm.get('flavorDefectTypeId')?.setValue((order as any).flavorDefectTypeId);
    }
    if (!this.stockOrderForm.get('purchaseRecommended')) {
      this.stockOrderForm.addControl('purchaseRecommended', new FormControl(null));
    }
    if ((order as any)?.purchaseRecommended != null) {
      this.stockOrderForm.get('purchaseRecommended')?.setValue((order as any).purchaseRecommended);
    }
    if (!this.stockOrderForm.get('inspectionNotes')) {
      this.stockOrderForm.addControl('inspectionNotes', new FormControl(null));
    }
    if ((order as any)?.inspectionNotes != null) {
      this.stockOrderForm.get('inspectionNotes')?.setValue((order as any).inspectionNotes);
    }
    // Aplicar configuración dinámica (por ejemplo, valores por defecto para campos ocultos)
    this.applyFieldConfiguration();
    this.updateWeekNumberVisibilityAndValidation();
    this.setupFormListeners();
  }

  private setupFormListeners() {
    // Listen to changes in fields that affect net weight calculation
    const fieldsToWatch = ['totalGrossQuantity', 'moisturePercentage', 'tare', 'damagedWeightDeduction'];
    fieldsToWatch.forEach(fieldName => {
      const control = this.stockOrderForm.get(fieldName);
      if (control) {
        control.valueChanges.subscribe(() => {
          this.netWeight();
        });
      }
    });

    // Listen to changes in fields that affect final price calculation
    const priceFieldsToWatch = ['pricePerUnit', 'damagedPriceDeduction', 'finalPriceDiscount'];
    priceFieldsToWatch.forEach(fieldName => {
      const control = this.stockOrderForm.get(fieldName);
      if (control) {
        control.valueChanges.subscribe(() => {
          this.finalPrice();
        });
      }
    });

    // 🔍 Listener para resultado de sabor: actualiza validador de tipo de defecto
    const flavorResultControl = this.stockOrderForm?.get('flavorTestResult');
    if (flavorResultControl) {
      flavorResultControl.valueChanges.subscribe((value) => {
        const flavorDefectControl = this.stockOrderForm?.get('flavorDefectTypeId');
        if (flavorDefectControl) {
          if (value === 'DEFECT' && this.isFieldInspectionFacility()) {
            flavorDefectControl.setValidators([Validators.required]);
          } else {
            flavorDefectControl.clearValidators();
            if (value !== 'DEFECT') {
              flavorDefectControl.setValue(null, { emitEvent: false });
            }
          }
          flavorDefectControl.updateValueAndValidity({ emitEvent: false });
        }
      });
    }
  }

  private cannotUpdatePO() {
    this.prepareData();
    
    // Validación base
    const baseInvalid = this.stockOrderForm.invalid || this.searchFarmers.invalid ||
      this.employeeForm.invalid || !this.modelChoice ||
      this.tareInvalidCheck || this.damagedPriceDeductionInvalidCheck;
    
    // Validación adicional para inspección de campo (camarón)
    if (this.isFieldInspectionFacility() && this.fieldConfig.getProductType()?.toUpperCase() === 'SHRIMP') {
      const fieldInspectionInvalid = this.isFieldInspectionInvalid();
      return baseInvalid || fieldInspectionInvalid;
    }
    
    return baseInvalid;
  }

  /**
   * 🔍 Valida campos requeridos para inspección de campo de camarón
   */
  private isFieldInspectionInvalid(): boolean {
    const flavorResult = this.stockOrderForm?.get('flavorTestResult')?.value;
    const purchaseRecommended = this.stockOrderForm?.get('purchaseRecommended')?.value;
    
    // Resultado de sabor es obligatorio
    if (!flavorResult) {
      return true;
    }
    
    // Recomendación de compra es obligatoria
    if (purchaseRecommended === null || purchaseRecommended === undefined || purchaseRecommended === '') {
      return true;
    }
    
    // Si hay defecto, el tipo de defecto es obligatorio
    if (flavorResult === 'DEFECT') {
      const defectType = this.stockOrderForm?.get('flavorDefectTypeId')?.value;
      if (!defectType) {
        return true;
      }
    }
    
    return false;
  }

  onSelectedType(type: StockOrderType) {
    if (!this.stockOrderForm) {
      return;
    }
    switch (type as StockOrderType) {
      case 'PURCHASE_ORDER':
        this.stockOrderForm.get('orderType')?.setValue(type);
        return;
      case 'GENERAL_ORDER':
      case 'PROCESSING_ORDER':
        return;
      default:
        throw Error('Wrong order type: ' + type);
    }
  }

  setFarmer(event: ApiUserCustomer) {

    if (!this.stockOrderForm) {
      return;
    }

    if (event) {
      this.stockOrderForm.get('producerUserCustomer')?.setValue({ id: event.id });
    } else {
      this.stockOrderForm.get('producerUserCustomer')?.setValue(null);
    }

    const producerControl = this.stockOrderForm.get('producerUserCustomer');
    producerControl?.markAsDirty();
    producerControl?.updateValueAndValidity();
    this.codebookPreferredWayOfPayment = EnumSifrant.fromObject(this.preferredWayOfPaymentList);
  }

  setCollector(event: ApiUserCustomer) {

    if (!this.stockOrderForm) {
      return;
    }

    if (event) {
      this.stockOrderForm.get('representativeOfProducerUserCustomer')?.setValue({ id: event.id });
      if (this.stockOrderForm.get('preferredWayOfPayment')?.value === 'UNKNOWN') {
        this.stockOrderForm.get('preferredWayOfPayment')?.setValue(null);
      }
    } else {
      this.stockOrderForm.get('representativeOfProducerUserCustomer')?.setValue(null);
      if (this.stockOrderForm.get('preferredWayOfPayment')?.value === 'CASH_VIA_COLLECTOR') {
        this.stockOrderForm.get('preferredWayOfPayment')?.setValue(null);
      }
    }

    const collectorControl = this.stockOrderForm.get('representativeOfProducerUserCustomer');
    collectorControl?.markAsDirty();
    collectorControl?.updateValueAndValidity();
    this.codebookPreferredWayOfPayment = EnumSifrant.fromObject(this.preferredWayOfPaymentList);
  }

  semiProductSelected(id: string) {

    if (!this.stockOrderForm) {
      return;
    }

    if (id) {
      this.stockOrderForm.get('semiProduct')?.setValue({ id });
      this.setMeasureUnit(Number(id)).then();
    } else {
      this.stockOrderForm.get('semiProduct')?.setValue(null);
    }

    const semiProductControl = this.stockOrderForm.get('semiProduct');
    semiProductControl?.markAsDirty();
    semiProductControl?.updateValueAndValidity();

    // Update week number requirement when semi-product changes
    this.updateWeekNumberVisibilityAndValidation();
  }

  async setMeasureUnit(semiProdId: number) {

    const res = await this.semiProductControllerService.getSemiProduct(semiProdId).pipe(take(1)).toPromise();
    if (res && res.status === StatusEnum.OK && res.data) {
      this.measureUnit = res.data.measurementUnitType?.label ?? '-';
    } else {
      this.measureUnit = '-'; 
    }
  }

  setToBePaid() {

    if (this.stockOrderForm?.get('totalGrossQuantity')?.value && this.stockOrderForm.get('pricePerUnit')?.value) {
      const grossQuantity = Number(this.stockOrderForm.get('totalGrossQuantity')?.value);
      let baseWeight = grossQuantity;
      let pricePerUnit = this.stockOrderForm.get('pricePerUnit')?.value ?? 0;

      const tareControl = this.stockOrderForm.get('tare');
      if (tareControl && tareControl.value) {
        baseWeight -= Number(tareControl.value);
      }
      const damagedWeightControl = this.stockOrderForm.get('damagedWeightDeduction');
      if (damagedWeightControl && damagedWeightControl.value) {
        baseWeight -= Number(damagedWeightControl.value);
      }

      baseWeight = Math.max(0, baseWeight);

      let netWeight = baseWeight;
      const moistureControl = this.stockOrderForm.get('moisturePercentage');
      if (moistureControl && moistureControl.value) {
        const moisturePercent = Number(moistureControl.value);
        netWeight = baseWeight * (moisturePercent / 100);
      }

      if (netWeight < 0) {
        netWeight = 0.00;
      }

      // Apply price deductions
      const damagedPriceControl = this.stockOrderForm.get('damagedPriceDeduction');
      if (damagedPriceControl && damagedPriceControl.value) {
        pricePerUnit -= damagedPriceControl.value;
      }

      const perUnitTotal = Math.max(pricePerUnit, 0);
      let total = perUnitTotal * netWeight;

      const finalPriceDiscountControl = this.stockOrderForm.get('finalPriceDiscount');
      if (finalPriceDiscountControl && finalPriceDiscountControl.value) {
        total -= Number(finalPriceDiscountControl.value);
      }

      if (total < 0) {
        total = 0.00;
      }

      this.stockOrderForm.get('cost')?.setValue(Number(total).toFixed(2));
    } else {

      this.stockOrderForm.get('cost')?.setValue(null);
    }
  }

  setBalance() {

    const costValue = this.stockOrderForm?.get('cost')?.value;
    const balanceControl = this.stockOrderForm?.get('balance');
    if (!balanceControl) {
      return;
    }

    if (costValue !== null && costValue !== undefined) {
      balanceControl.setValue(costValue);
    } else {

      balanceControl.setValue(null);
    }
  }

  dismiss() {
    this.location.back();
  }

  get showCollector() {
    return this.facility && this.facility.displayMayInvolveCollectors;
  }

  get readonlyCollector() {
    return this.facility && !this.facility.displayMayInvolveCollectors;
  }

  get showOrganic() {
    return (this.facility && this.facility.displayOrganic) || this.stockOrderForm?.get('organic')?.value;
  }

  get readonlyOrganic() {
    return this.facility && !this.facility.displayOrganic;
  }
  
  get showTare() {
    return false;
  }

  get readonlyTare() {
    return this.facility && !this.facility.displayTare;
  }

  get showDamagedPriceDeduction() {
    return false;
  }

  get showFinalPriceDiscount() {
    return (this.facility && this.facility.displayFinalPriceDiscount) || this.stockOrderForm?.get('finalPriceDiscount')?.value;
  }

  get showDamagedWeightDeduction() {
    return (this.facility && this.facility.displayWeightDeductionDamage) || this.stockOrderForm?.get('damagedWeightDeduction')?.value;
  }

  get readonlyDamagedPriceDeduction() {
    return (this.facility && !this.facility.displayPriceDeductionDamage) || this.stockOrderForm?.get('priceDeterminedLater')?.value;
  }

  get readonlyFinalPriceDiscount() {
    return (this.facility && !this.facility.displayFinalPriceDiscount) || this.stockOrderForm?.get('priceDeterminedLater')?.value;
  }

  get readonlyDamagedWeightDeduction() {
    return this.facility && !this.facility.displayWeightDeductionDamage;
  }

  get showMoisturePercentage() {
    return (this.facility && this.facility.displayMoisturePercentage) || this.stockOrderForm?.get('moisturePercentage')?.value;
  }

  get readonlyMoisturePercentage() {
    return this.facility && !this.facility.displayMoisturePercentage;
  }

  netWeight() {
    const form = this.stockOrderForm;
    if (form && form.get('totalGrossQuantity')?.value) {
      const grossQuantity = Number(form.get('totalGrossQuantity')?.value);
      let baseWeight = grossQuantity;

      const tareValue = form.get('tare')?.value;
      if (tareValue) {
        baseWeight -= Number(tareValue);
      }
      const damagedWeight = form.get('damagedWeightDeduction')?.value;
      if (damagedWeight) {
        baseWeight -= Number(damagedWeight);
      }

      baseWeight = Math.max(0, baseWeight);

      let finalNetWeight = baseWeight;
      const moistureValue = form.get('moisturePercentage')?.value;
      if (moistureValue) {
        const moisturePercent = Number(moistureValue);
        finalNetWeight = baseWeight * (moisturePercent / 100);
        const moistureDeduction = baseWeight - finalNetWeight;
        const moistureWeightDeductionControl = form.get('moistureWeightDeduction');
        moistureWeightDeductionControl?.setValue(moistureDeduction.toFixed(2), { emitEvent: false });
      } else {
        const moistureWeightDeductionControl = form.get('moistureWeightDeduction');
        moistureWeightDeductionControl?.setValue(null, { emitEvent: false });
      }

      finalNetWeight = Math.max(0, finalNetWeight);
      this.netWeightForm.setValue(finalNetWeight.toFixed(2));
    } else {
      this.netWeightForm.setValue(null);
    }
  }

  finalPrice() {
    if (this.stockOrderForm?.get('pricePerUnit')?.value) {
      let finalPrice = this.stockOrderForm.get('pricePerUnit')?.value;
      const damagedPriceValue = this.stockOrderForm.get('damagedPriceDeduction')?.value;
      if (damagedPriceValue) {
        finalPrice -= damagedPriceValue;
      }

      const finalPriceDiscountControl = this.stockOrderForm.get('finalPriceDiscount');
      const netWeightValue = Number(this.netWeightForm.value ?? 0);
      let total = finalPrice * netWeightValue;
      if (finalPriceDiscountControl && finalPriceDiscountControl.value) {
        total -= Number(finalPriceDiscountControl.value);
      }

      if (total < 0) {
        total = 0.00;
      }

      this.finalPriceForm.setValue(Number(total).toFixed(2));
    } else {
      this.finalPriceForm.setValue(null);
    }
  }

  updateValidators() {
    const organicControl = this.stockOrderForm?.get('organic');
    if (organicControl) {
      organicControl.setValidators(
        this.orderType === 'PURCHASE_ORDER' &&
        this.facility &&
        this.facility.displayOrganic ?
          [Validators.required] : []
      );
      organicControl.updateValueAndValidity();
    }

    const tareControl = this.stockOrderForm?.get('tare');
    if (tareControl) {
      tareControl.setValidators([]);
      tareControl.setValue(null);
      tareControl.updateValueAndValidity();
    }

    const damagedPriceDeductionControl = this.stockOrderForm?.get('damagedPriceDeduction');
    if (damagedPriceDeductionControl) {
      damagedPriceDeductionControl.setValidators([]);
      damagedPriceDeductionControl.setValue(null);
      damagedPriceDeductionControl.updateValueAndValidity();
    }

    const finalPriceDiscountControl = this.stockOrderForm?.get('finalPriceDiscount');
    if (finalPriceDiscountControl) {
      finalPriceDiscountControl.setValidators([]);
      if (!(this.facility && this.facility.displayFinalPriceDiscount)) {
        finalPriceDiscountControl.setValue(null, { emitEvent: false });
      }
      finalPriceDiscountControl.updateValueAndValidity();
    }

    const damagedWeightDeductionControl = this.stockOrderForm?.get('damagedWeightDeduction');
    if (damagedWeightDeductionControl) {
      damagedWeightDeductionControl.setValidators(
        this.orderType === 'PURCHASE_ORDER' &&
        this.facility &&
        this.facility.displayWeightDeductionDamage ?
          [Validators.required] : []
      );
      damagedWeightDeductionControl.updateValueAndValidity();
    }

    const moistureControl = this.stockOrderForm?.get('moisturePercentage');
    if (moistureControl) {
      const moistureValidators = [Validators.min(0), Validators.max(100)];
      if (this.orderType === 'PURCHASE_ORDER' && this.facility && this.facility.displayMoisturePercentage) {
        moistureValidators.unshift(Validators.required);
      }
      moistureControl.setValidators(moistureValidators);
      if (!(this.facility && this.facility.displayMoisturePercentage)) {
        moistureControl.setValue(null);
        const moistureWeightControl = this.stockOrderForm?.get('moistureWeightDeduction');
        if (moistureWeightControl) {
          moistureWeightControl.setValue(null);
        }
      }
      moistureControl.updateValueAndValidity();
    }

    // 🔍 Validadores para campos de inspección de campo (camarón)
    this.updateFieldInspectionValidators();
  }

  /**
   * 🔍 Actualiza validadores para campos de inspección sensorial en campo
   */
  private updateFieldInspectionValidators(): void {
    const isFieldInspection = this.isFieldInspectionFacility();
    const isShrimp = this.fieldConfig.getProductType()?.toUpperCase() === 'SHRIMP';
    
    const flavorResultControl = this.stockOrderForm?.get('flavorTestResult');
    const purchaseRecommendedControl = this.stockOrderForm?.get('purchaseRecommended');
    const flavorDefectControl = this.stockOrderForm?.get('flavorDefectTypeId');
    
    if (isFieldInspection && isShrimp) {
      // Resultado de sabor es obligatorio
      if (flavorResultControl) {
        flavorResultControl.setValidators([Validators.required]);
        flavorResultControl.updateValueAndValidity({ emitEvent: false });
      }
      
      // Recomendación de compra es obligatoria
      if (purchaseRecommendedControl) {
        purchaseRecommendedControl.setValidators([Validators.required]);
        purchaseRecommendedControl.updateValueAndValidity({ emitEvent: false });
      }
      
      // Defecto condicional: obligatorio solo si flavorTestResult = 'DEFECT'
      if (flavorDefectControl) {
        const flavorResult = flavorResultControl?.value;
        if (flavorResult === 'DEFECT') {
          flavorDefectControl.setValidators([Validators.required]);
        } else {
          flavorDefectControl.clearValidators();
        }
        flavorDefectControl.updateValueAndValidity({ emitEvent: false });
      }
    } else {
      // Limpiar validadores si no es inspección de campo
      if (flavorResultControl) {
        flavorResultControl.clearValidators();
        flavorResultControl.updateValueAndValidity({ emitEvent: false });
      }
      if (purchaseRecommendedControl) {
        purchaseRecommendedControl.clearValidators();
        purchaseRecommendedControl.updateValueAndValidity({ emitEvent: false });
      }
      if (flavorDefectControl) {
        flavorDefectControl.clearValidators();
        flavorDefectControl.updateValueAndValidity({ emitEvent: false });
      }
    }
  }

  get tareInvalidCheck() {
      const tare = Number(this.stockOrderForm?.get('tare')?.value ?? 0);
      const totalGrossQuantity = Number(this.stockOrderForm?.get('totalGrossQuantity')?.value ?? 0);
      return tare && totalGrossQuantity && (tare > totalGrossQuantity);
  }

  get damagedPriceDeductionInvalidCheck() {
    const damagedPriceDeduction = Number(this.stockOrderForm?.get('damagedPriceDeduction')?.value ?? 0);
    const pricePerUnit = Number(this.stockOrderForm?.get('pricePerUnit')?.value ?? 0);
    return damagedPriceDeduction && pricePerUnit && (damagedPriceDeduction > pricePerUnit);
  }

  get damagedWeightDeductionInvalidCheck() {
    const damagedWeightDeduction = Number(this.stockOrderForm?.get('damagedWeightDeduction')?.value ?? 0);
    const totalQuantity = Number(this.stockOrderForm?.get('totalQuantity')?.value ?? 0);
    return damagedWeightDeduction && totalQuantity && (damagedWeightDeduction > totalQuantity);
  }

  /**
   * 🔍 Verifica si los campos de inspección de campo son inválidos (para feedback visual)
   */
  get fieldInspectionInvalidCheck(): boolean {
    if (!this.isFieldInspectionFacility()) {
      return false;
    }
    return this.isFieldInspectionInvalid();
  }

  /**
   * 🔍 Verifica si la recomendación de compra es negativa
   */
  get isPurchaseNotRecommended(): boolean {
    const value = this.stockOrderForm?.get('purchaseRecommended')?.value;
    return value === 'false' || value === false;
  }

  async printDeliveryPdf() {
    if (!this.deliveryDetailsContainer?.nativeElement) {
      return;
    }

    const element = this.deliveryDetailsContainer.nativeElement;
    console.log('=== PDF CAPTURE DEBUG ===');
    console.log('Element:', element);
    console.log('Element tagName:', element.tagName);
    console.log('Element classes:', element.className);
    console.log('Element scrollHeight:', element.scrollHeight);
    console.log('Element offsetHeight:', element.offsetHeight);
    console.log('Element clientHeight:', element.clientHeight);
    console.log('Element children count:', element.children.length);
    console.log('========================');

    this.globalEventsManager.showLoading(true);
    try {
      const identifier = this.stockOrderForm?.get('identifier')?.value || 'stock-order';
      const filename = `orden-entrega-${identifier}.pdf`;
      await this.pdfGeneratorService.generatePdfFromElement(element, filename);
    } catch (error) {
      this.globalEventsManager.push({
        action: 'error',
        notificationType: 'error',
        title: $localize`:@@stockDeliveryDetails.printPdf.errorTitle:Error`,
        message: $localize`:@@stockDeliveryDetails.printPdf.errorMessage:No se pudo generar el PDF. Intente nuevamente.`
      });
    } finally {
      this.globalEventsManager.showLoading(false);
    }
  }

  private setQuantities() {

    const totalGrossControl = this.stockOrderForm?.get('totalGrossQuantity');
    if (totalGrossControl?.valid) {

      let quantity = parseFloat(totalGrossControl.value);

      const tareValue = this.stockOrderForm?.get('tare')?.value;
      if (tareValue) {
        quantity -= tareValue;
      }

      if (quantity < 0) {
        quantity = 0.00;
      }

      const totalQuantityControl = this.stockOrderForm?.get('totalQuantity');
      totalQuantityControl?.setValue(quantity);
      totalQuantityControl?.updateValueAndValidity();

      const fulfilledQuantityControl = this.stockOrderForm?.get('fulfilledQuantity');
      fulfilledQuantityControl?.setValue(quantity);
      fulfilledQuantityControl?.updateValueAndValidity();

      const availableQuantityControl = this.stockOrderForm?.get('availableQuantity');
      availableQuantityControl?.setValue(quantity);
      availableQuantityControl?.updateValueAndValidity();
    }
  }

  private setDate() {
    const today = dateISOString(new Date());
    this.stockOrderForm?.get('productionDate')?.setValue(today);
  }

  private prepareData() {
    this.setQuantities();
    const pd = this.stockOrderForm?.get('productionDate')?.value;
    if (pd != null) {
      this.stockOrderForm?.get('productionDate')?.setValue(dateISOString(pd));
    }
  }

  private async setIdentifier() {

    const farmerResponse = await this.companyControllerService
      .getUserCustomer(this.stockOrderForm?.get('producerUserCustomer')?.value?.id).pipe(take(1)).toPromise();

    if (farmerResponse && farmerResponse.status === StatusEnum.OK && farmerResponse.data) {
      const identifier = 'PT-' + farmerResponse.data.surname + '-' + this.stockOrderForm?.get('productionDate')?.value;
      this.stockOrderForm?.get('identifier')?.setValue(identifier);
    }
  }

  private translateName(obj: unknown) {
    return this.codebookTranslations.translate(obj, 'name');
  }
  isCocoa(): boolean {
    return this.envInfo.isProductType('cocoa');
    
  }
  // Determines if current selected semi-product is Cacao/Cocoa
  // isCacaoSelected(): boolean {
  //   if (!this.modelChoice || !this.options) { return false; }
  //   const selected = this.options.find(o => String(o.id) === String(this.modelChoice));
  //   const name = (selected && (selected as any).name ? (selected as any).name : '').toString().toLowerCase();
  //   // Consider multiple spellings
  //   return name.includes('cacao') || name.includes('cocoa');
  // }

  // Applies validators to weekNumber based on cacao selection
  private updateWeekNumberVisibilityAndValidation(): void {
    const ctrl = this.stockOrderForm?.get('weekNumber');
    // if (!ctrl) { return; }
    // if (this.isCacaoSelected()) {
    //   ctrl.setValidators([Validators.required, Validators.min(1), Validators.max(53)]);
    // } else {
    //   ctrl.clearValidators();
    // }
   // ctrl.updateValueAndValidity();
  }
  isCacaoSelected() {
    throw new Error('Method not implemented.');
  }

  get displayPriceDeterminedLater() {
    return this.facility?.displayPriceDeterminedLater ?? false;
  }

  /**
   * 🔍 Detecta si el facility actual es un punto de inspección sensorial en campo
   * Usa la bandera explícita configurada en la instalación
   */
  isFieldInspectionFacility(): boolean {
    return this.facility?.isFieldInspection === true;
  }

  /**
   * 🏭 Detecta si el facility actual es un centro de acopio de camarón
   * (isCollectionFacility = true Y NO es inspección de campo)
   */
  isCollectionFacilityForShrimp(): boolean {
    const productType = this.fieldConfig.getProductType()?.toUpperCase() ?? '';
    const isShrimp = productType === 'SHRIMP';
    const isCollection = this.facility?.isCollectionFacility === true;
    const isFieldInspection = this.facility?.isFieldInspection === true;
    
    return isShrimp && isCollection && !isFieldInspection;
  }

  /**
   * 🧪 Asegura que los controles de análisis sensorial y calidad existan en el formulario
   * Se llama cuando el facility es centro de acopio de camarón
   */
  private ensureSensorialQualityControls(): void {
    if (!this.stockOrderForm) {
      return;
    }

    // Campos de análisis sensorial
    const sensorialFields = [
      'sampleNumber',
      'sensorialRawOdor',
      'sensorialRawTaste', 
      'sensorialRawColor',
      'sensorialCookedOdor',
      'sensorialCookedTaste',
      'sensorialCookedColor',
      'qualityNotes'
    ];

    sensorialFields.forEach(fieldName => {
      if (!this.stockOrderForm.get(fieldName)) {
        this.stockOrderForm.addControl(fieldName, new FormControl(null));
      }
    });

    // Campos booleanos/especiales
    if (!this.stockOrderForm.get('metabisulfiteLevelAcceptable')) {
      this.stockOrderForm.addControl('metabisulfiteLevelAcceptable', new FormControl(null));
    }

    if (!this.stockOrderForm.get('approvedForPurchase')) {
      this.stockOrderForm.addControl('approvedForPurchase', new FormControl(null));
    }

    // Documento de calidad (objeto)
    if (!this.stockOrderForm.get('qualityDocument')) {
      this.stockOrderForm.addControl('qualityDocument', new FormControl(null));
    }

    console.log('🧪 Sensorial quality controls ensured in stockOrderForm');
  }

  /**
   * 🔄 Actualiza los observables de visibilidad de campos según facility y tipo de producto
   * 🦐 NOTA: Ya no se usa isLaboratory - la lógica se basa en isFieldInspection y isCollectionFacility
   */
  private updateFieldVisibilityObservables(): void {
    const productType = this.fieldConfig.getProductType()?.toUpperCase() ?? '';
    const isFieldInspection = this.isFieldInspectionFacility();

    // 🔍 INSPECCIÓN EN CAMPO: Solo mostrar campos de sabor, ocultar todo lo demás
    if (isFieldInspection) {
      this._showPriceFields$.next(false);
      this._showPaymentFields$.next(false);
      this._showShrimpFields$.next(false);
      this._showFieldInspectionFields$.next(true);
      this._showReceptionFields$.next(false);
      console.log('🔍 Facility is FIELD INSPECTION - Only flavor fields visible');
    }
    // 🦐 CAMARÓN: Mostrar campos específicos de camarón
    else if (productType === 'SHRIMP') {
      const showPrice = this.fieldConfig.isFieldVisible('stockOrder', 'pricePerUnit');
      const showPayment = this.fieldConfig.isFieldVisible('stockOrder', 'preferredWayOfPayment');
      const isCollectionFacility = this.isCollectionFacilityForShrimp();
      
      this._showPriceFields$.next(showPrice);
      this._showPaymentFields$.next(showPayment);
      this._showShrimpFields$.next(true);  // Mostrar campos específicos de camarón
      this._showFieldInspectionFields$.next(false);
      this._showReceptionFields$.next(true);
      
      // 🏭 CENTRO DE ACOPIO: Mostrar campos de análisis sensorial y calidad
      this._showSensorialQualityFields$.next(isCollectionFacility);
      
      if (isCollectionFacility) {
        console.log('🏭 Facility is SHRIMP COLLECTION - Sensorial quality fields visible');
        // Asegurar que los controles existan en el formulario
        this.ensureSensorialQualityControls();
      } else {
        console.log('🦐 Facility is NORMAL SHRIMP - Shrimp fields visible');
      }
    }
    // 🍫☕ OTROS PRODUCTOS: Mostrar campos de precio, ocultar campos de camarón
    else {
      this._showPriceFields$.next(true);
      this._showPaymentFields$.next(true);
      this._showShrimpFields$.next(false);
      this._showFieldInspectionFields$.next(false);
      this._showReceptionFields$.next(true);
      console.log('🍫 Facility is NORMAL - Price fields visible');
    }

    // Humedad siempre según configuración de facility
    const showMoisture = this.facility?.displayMoisturePercentage ?? false;
    this._showMoistureField$.next(showMoisture);
  }

  /**
   * 🎯 Aplica configuración dinámica de campos según el tipo de producto Y facility
   * 🦐 NOTA: Ya no se usa isLaboratory - la lógica se basa en ChainFieldConfigService
   */
  private applyFieldConfiguration(): void {
    if (!this.stockOrderForm) {
      return;
    }

    const productType = this.fieldConfig.getProductType()?.toUpperCase() ?? '';

    // Para SHRIMP: siempre ocultar campos de precio según configuración
    const shouldHidePriceFields = productType === 'SHRIMP' || 
      !this.fieldConfig.isFieldVisible('stockOrder', 'pricePerUnit');

    // Campos de precio con configuración dinámica
    const priceConfig = shouldHidePriceFields 
      ? { visible: false, required: false }
      : this.fieldConfig.getFieldConfig('stockOrder', 'pricePerUnit');
    
    const currencyConfig = shouldHidePriceFields
      ? { visible: false, required: false }
      : this.fieldConfig.getFieldConfig('stockOrder', 'currency');
    
    const damagedPriceConfig = shouldHidePriceFields
      ? { visible: false, required: false }
      : this.fieldConfig.getFieldConfig('stockOrder', 'damagedPriceDeduction');
    
    const finalDiscountConfig = shouldHidePriceFields
      ? { visible: false, required: false }
      : this.fieldConfig.getFieldConfig('stockOrder', 'finalPriceDiscount');
    
    const costConfig = shouldHidePriceFields
      ? { visible: false, required: false }
      : this.fieldConfig.getFieldConfig('stockOrder', 'cost');
    
    const balanceConfig = shouldHidePriceFields
      ? { visible: false, required: false }
      : this.fieldConfig.getFieldConfig('stockOrder', 'balance');
    
    const paymentConfig = shouldHidePriceFields
      ? { visible: false, required: false }
      : this.fieldConfig.getFieldConfig('stockOrder', 'preferredWayOfPayment');
    
    const priceLaterConfig = shouldHidePriceFields
      ? { visible: false, required: false }
      : this.fieldConfig.getFieldConfig('stockOrder', 'priceDeterminedLater');

    // Aplicar configuración a cada campo
    const fieldsToConfig = [
      { name: 'pricePerUnit', config: priceConfig },
      { name: 'currency', config: currencyConfig },
      { name: 'damagedPriceDeduction', config: damagedPriceConfig },
      { name: 'finalPriceDiscount', config: finalDiscountConfig },
      { name: 'cost', config: costConfig },
      { name: 'balance', config: balanceConfig },
      { name: 'preferredWayOfPayment', config: paymentConfig },
      { name: 'priceDeterminedLater', config: priceLaterConfig }
    ];

    const hiddenFieldDefaults: Record<string, any> = {
      pricePerUnit: 0,
      damagedPriceDeduction: 0,
      finalPriceDiscount: 0,
      cost: 0,
      balance: 0
    };

    fieldsToConfig.forEach(({ name, config }) => {
      const control = this.stockOrderForm.get(name);
      if (!control) {
        return;
      }

      if (!config.required) {
        control.clearValidators();
        control.updateValueAndValidity({ emitEvent: false });
      }

      if (!config.visible) {
        const defaultValue = hiddenFieldDefaults[name];
        if (typeof defaultValue !== 'undefined' && (control.value === null || control.value === undefined || control.value === '')) {
          control.setValue(defaultValue, { emitEvent: false });
        }
      }
    });

    // Valores por defecto específicos para CAMARÓN
    if (productType === 'SHRIMP') {
      const priceLaterControl = this.stockOrderForm.get('priceDeterminedLater');
      if (priceLaterControl && priceLaterControl.value !== true) {
        priceLaterControl.setValue(true, { emitEvent: false });
      }
      const damagedWeightControl = this.stockOrderForm.get('damagedWeightDeduction');
      if (damagedWeightControl && (damagedWeightControl.value === null || damagedWeightControl.value === undefined || damagedWeightControl.value === '')) {
        damagedWeightControl.setValue(0, { emitEvent: false });
      }
    }

    console.log(`🎯 Field config applied - Product: ${productType}, Hide prices: ${shouldHidePriceFields}`);
  }

  priceDeterminedLaterChanged() {
    // change validation for price per unit based on
    if (this.stockOrderForm?.get('priceDeterminedLater')?.value) {
      this.stockOrderForm.get('pricePerUnit')?.clearValidators();
      this.stockOrderForm.get('pricePerUnit')?.setValue(null);
      this.stockOrderForm.get('damagedPriceDeduction')?.setValue(null);
      this.updateValidators();
    } else {
      this.stockOrderForm?.get('pricePerUnit')?.setValidators(ApiStockOrderValidationScheme(this.orderType).fields.pricePerUnit.validators);
      this.updateValidators();
    }

    this.stockOrderForm?.get('pricePerUnit')?.updateValueAndValidity();
  }

  async createOrUpdatePurchaseOrder(close: boolean = true) {
    if (this.updatePOInProgress) {
      return;
    }
    this.updatePOInProgress = true;
    this.globalEventsManager.showLoading(true);
    this.submitted = true;

    try {
      // Ensure creator
      this.stockOrderForm?.get('creatorId')?.setValue(this.employeeForm.value);

      // Normalize/prepare data
      this.prepareData();

      // Validate
      if (this.cannotUpdatePO()) {
        return;
      }

      // Set identifier for new orders
      if (!this.update) {
        await this.setIdentifier();
      }

      // Recompute amounts before sending
      this.setToBePaid();
      this.setBalance();

      const data = this.stockOrderForm?.getRawValue() as ApiStockOrder;
      // Remove null/undefined keys
      Object.keys(data as any).forEach((key) => ((data as any)[key] == null) && delete (data as any)[key]);

      const res = await this.stockOrderControllerService
        .createOrUpdateStockOrderByMap({ ApiStockOrder: data })
        .pipe(take(1))
        .toPromise();

      if (res && res.status === 'OK') {
        const createdId = res.data && (res.data as any).id ? (res.data as any).id as number : null;
        
        // 🔬 Marcar análisis de laboratorio como usado
        if (!this.update && this.labAnalysisId && createdId) {
          try {
            await this.laboratoryAnalysisService
              .markUsed(this.labAnalysisId, createdId)
              .pipe(take(1))
              .toPromise();
          } catch (_) {}
        }
        
        // 🔍 Marcar inspección de campo como usada
        if (!this.update && this.fieldInspectionId && createdId) {
          try {
            await this.fieldInspectionService
              .markUsed(this.fieldInspectionId, createdId)
              .pipe(take(1))
              .toPromise();
          } catch (_) {}
        }
        
        if (close) {
          this.dismiss();
        } else {
          this.stockOrderForm?.markAsPristine();
          this.employeeForm.markAsPristine();
          this.reloadOrder();
        }
      }
    } finally {
      this.updatePOInProgress = false;
      this.globalEventsManager.showLoading(false);
    }
  }

}
