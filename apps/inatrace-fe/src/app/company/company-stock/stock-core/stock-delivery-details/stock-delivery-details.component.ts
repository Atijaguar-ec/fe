import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { StockOrderType } from '../../../../../shared/types';
import { ActivatedRoute } from '@angular/router';
import { EnumSifrant } from '../../../../shared-services/enum-sifrant';
import { GlobalEventManagerService } from '../../../../core/global-event-manager.service';
import { CompanyUserCustomersByRoleService } from '../../../../shared-services/company-user-customers-by-role.service';
import {
  calculateWeekNumber,
  WeekColor,
  weekColor,
  weekColorCodesEnabled,
  weekNumberingSchemeOf,
} from '../../../../shared-services/week-number.util';
import { FacilityControllerService } from '../../../../../api/api/facilityController.service';
import { switchMap, take } from 'rxjs/operators';
import { ApiFacility } from '../../../../../api/model/apiFacility';
import { ApiSemiProduct } from '../../../../../api/model/apiSemiProduct';
import { CodebookTranslations } from '../../../../shared-services/codebook-translations';
import { CompanyControllerService } from '../../../../../api/api/companyController.service';
import { ApiUserCustomer } from '../../../../../api/model/apiUserCustomer';
import { ApiPlot } from '../../../../../api/model/apiPlot';
import { ApiStockOrder } from '../../../../../api/model/apiStockOrder';
import { CertificationTypeControllerService } from '../../../../../api/api/certificationTypeController.service';
import {dateISOString, defaultEmptyObject, generateFormFromMetadata} from '../../../../../shared/utils';
import { ApiStockOrderValidationScheme } from './validation';
import { Location } from '@angular/common';
import { AuthService } from '../../../../core/auth.service';
import _ from 'lodash-es';
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
import { ProductFieldVisibilityService } from '../../../../shared-services/product-field-visibility.service';

@Component({
  selector: 'app-stock-delivery-details',
  templateUrl: './stock-delivery-details.component.html',
  styleUrls: ['./stock-delivery-details.component.scss'],
  standalone: false,
})
export class StockDeliveryDetailsComponent implements OnInit, OnDestroy {

  title: string | null = null;

  update = true;

  @ViewChild('deliveryDetailsContainer') deliveryDetailsContainer: ElementRef<HTMLElement>;

  stockOrderForm: FormGroup;
  order: ApiStockOrder;
  orderTypeForm = new FormControl(null);
  orderTypeCodebook = EnumSifrant.fromObject(this.orderTypeOptions);

  userLastChanged = null;

  submitted = false;

  showPrintButton = false;

  codebookPreferredWayOfPayment: EnumSifrant;

  searchFarmers = new FormControl(null, Validators.required);
  searchCollectors = new FormControl(null);
  farmersCodebook: CompanyUserCustomersByRoleService;
  collectorsCodebook: CompanyUserCustomersByRoleService;

  employeeForm = new FormControl(null, Validators.required);
  codebookUsers: EnumSifrant;

  facilityNameForm = new FormControl(null);

  options: ApiSemiProduct[] = [];
  modelChoice = null;

  measureUnit = '-';
  selectedCurrency = '-';

  codebookOrganic = EnumSifrant.fromObject(this.yesNo);

  netWeightForm = new FormControl(null);
  finalPriceForm = new FormControl(null);

  updatePOInProgress = false;

  companyProfile: ApiCompanyGet | null = null;
  private currentLoggedInUser: ApiUserGet | null = null;
  certificationTypeMap: Record<string, string> = {};

  /** Las certificaciones que el combo ofrece ahora mismo (el mapa de arriba, ya
   *  filtrado segun si la entrega es organica). */
  private certificationTypeFilteredMap: Record<string, string> = {};
  certificationTypeOptions: EnumSifrant = EnumSifrant.fromObject({});

  varietyOptionsMap: Record<string, string> = {};
  varietyOptions: EnumSifrant = EnumSifrant.fromObject({});

  // N° Parcela ya no se tipea libremente: se elige entre las parcelas que el
  // agricultor tiene registradas. parcelLotOptions se recalcula cada vez que
  // cambia el agricultor seleccionado (ver refreshParcelLotOptions()).
  parcelLotOptions: EnumSifrant = EnumSifrant.fromObject({});
  private parcelLotCount = 0;

  /**
   * Parcelas del agricultor elegido. Se guardan enteras, no solo la cantidad, porque
   * de ellas salen tanto las opciones del combo (el nombre con que el agricultor las
   * registro) como la variedad y la certificacion que hereda la entrega.
   */
  private farmerPlots: ApiPlot[] = [];

  private facility: ApiFacility;

  private purchaseOrderId = this.route.snapshot.params.purchaseOrderId;

  additionalProofsListManager = null;

  private userProfileSubs: Subscription;
  

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
    public productFieldVisibilityService: ProductFieldVisibilityService,
  ) { }

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

    const realType = this.stockOrderForm && this.stockOrderForm.get('orderType').value;

    if (realType) {
      return realType;
    }

    if (this.route.snapshot.data.action === 'update') {
      if (this.order && this.order.orderType) {
        return this.order.orderType;
      }
      return null;
    }

    if (!this.route.snapshot.data.mode) {
      throw Error('No stock order mode set');
    }
    return this.route.snapshot.data.mode as StockOrderType;
  }

  get orderTypeOptions() {

    const obj = {};
    obj['GENERAL_ORDER'] = $localize`:@@orderType.codebook.generalOrder:General order`;
    obj['PROCESSING_ORDER'] = $localize`:@@orderType.codebook.processingOrder:Processing order`;
    obj['PURCHASE_ORDER'] = $localize`:@@orderType.codebook.purchaseOrder:Purchase order`;
    return obj;
  }

  get preferredWayOfPaymentList() {

    const obj = {};
    obj['CASH'] = $localize`:@@productLabelStockPurchaseOrdersModal.preferredWayOfPayment.cash:Cash`;

    if (this.stockOrderForm &&
      this.stockOrderForm.get('representativeOfProducerUserCustomer') &&
      this.stockOrderForm.get('representativeOfProducerUserCustomer').value) {

      obj['CASH_VIA_COLLECTOR'] = $localize`:@@productLabelStockPurchaseOrdersModal.preferredWayOfPayment.cashViaCollector:Cash via collector`;
    }

    if (this.stockOrderForm &&
      this.stockOrderForm.get('producerUserCustomer') &&
      this.stockOrderForm.get('producerUserCustomer').value &&
      this.stockOrderForm.get('representativeOfProducerUserCustomer') &&
      !this.stockOrderForm.get('representativeOfProducerUserCustomer').value) {

      obj['UNKNOWN'] = $localize`:@@productLabelStockPurchaseOrdersModal.preferredWayOfPayment.unknown:Unknown`;
    }

    obj['BANK_TRANSFER'] = $localize`:@@productLabelStockPurchaseOrdersModal.preferredWayOfPayment.bankTransfer:Bank transfer`;
    obj['CHEQUE'] = $localize`:@@preferredWayOfPayment.cheque:Cheque`;
    obj['OFFSETTING'] = $localize`:@@preferredWayOfPayment.offsetting:Cheque`;

    return obj;
  }

  get quantityLabel() {
    if (this.orderType === 'PURCHASE_ORDER') {
      return $localize`:@@productLabelStockPurchaseOrdersModal.textinput.quantityDelievered.label:Quantity` + ` (${this.measureUnit})`;
    } else {
      return $localize`:@@productLabelStockPurchaseOrdersModal.textinput.quantity.label:Quantity (units)`;
    }
  }

  get shouldShowVariety(): boolean {
    return this.productFieldVisibilityService.shouldShowField('variety') && !this.companyProfile?.configuration?.onlyNacionalVariety;
  }

  get shouldShowParcelLot(): boolean {
    // Siempre visible en Recepción, independientemente de la configuración
    // enableParcelLot de la empresa (decisión de producto 2026-08-05).
    return this.productFieldVisibilityService.shouldShowField('parcelLot');
  }

  get selectedEmployeeName(): string {
    if (!this.employeeForm.value) {
      return this.currentLoggedInUser ? `${this.currentLoggedInUser.name} ${this.currentLoggedInUser.surname}` : '';
    }
    if (!this.companyProfile) {
      return '';
    }
    const user = this.companyProfile.users.find(u => String(u.id) === String(this.employeeForm.value));
    return user ? `${user.name} ${user.surname}` : '';
  }

  private initializeVarietyOptions() {
    // numericVarietyOptions (config por empresa, hoy solo UNOCACE): el combo
    // muestra únicamente "1" y "2" (Orgánico y CCN51 respectivamente). El valor
    // GUARDADO es literalmente "1"/"2", no un identificador interno tipo
    // ORGANICO/CCN51: historial (batch-history), procesamiento y el PDF export
    // muestran stockOrder.variety como texto crudo, sin pasar por este combo,
    // así que el dato en sí tiene que ser ya el "1"/"2" que se pidió.
    this.varietyOptionsMap = this.companyProfile?.configuration?.numericVarietyOptions
      ? { '1': '1', '2': '2' }
      : { NACIONAL: 'Nacional', CCN51: 'CCN51' };
    this.refreshVarietyOptions();
  }

  /**
   * "CCN51" se guarda como "2" cuando numericVarietyOptions está activo (ver
   * initializeVarietyOptions). Los efectos que dependen de la variedad CCN51
   * (autocompletar certificación de transición) deben reconocerla en ambas
   * representaciones en vez de comparar contra el literal 'CCN51'.
   */
  private isCcn51VarietyValue(val: string): boolean {
    return val === 'CCN51' || (!!this.companyProfile?.configuration?.numericVarietyOptions && val === '2');
  }

  private refreshVarietyOptions() {
    this.varietyOptions = EnumSifrant.fromObject(this.varietyOptionsMap);
    this.varietyOptions.setPlaceholder($localize`:@@productLabelStockPurchaseOrdersModal.singleChoice.variety.placeholder:Selecciona la variedad`);
  }

  /** Quita tildes/diacríticos para comparar sin depender de la acentuación exacta
   *  (ej. "transición" vs "transicion") — los nombres vienen de un catálogo editable
   *  desde el admin, no hay garantía de que siempre estén escritos sin tilde. */
  private stripAccents(value: string): string {
    return value
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/ñ/g, 'n');
  }

  private getTransitionCertificationKey(): string {
    const keys = Object.keys(this.certificationTypeMap);
    return (
      keys.find((k) => {
        const normalized = this.stripAccents(k.toLowerCase());
        return normalized.includes('transition') || normalized.includes('transicion');
      }) || 'Transición / Fairtrade / SPP'
    );
  }

  private refreshCertificationTypeOptions() {
    const organicVal = this.stockOrderForm?.get('organic')?.value;
    const isOrganic = organicVal === 'true' || organicVal === true;
    const isNonOrganic = organicVal === 'false' || organicVal === false;

    const filteredMap: { [key: string]: string } = {};

    Object.keys(this.certificationTypeMap).forEach((key) => {
      const lowerKey = this.stripAccents(key.toLowerCase());
      const isOrganicCert = lowerKey.includes('biosuisse') || lowerKey.includes('naturland');
      const isTransitionCert = lowerKey.includes('transicion') || lowerKey.includes('transition');

      if (isOrganic) {
        if (!isTransitionCert) {
          filteredMap[key] = this.certificationTypeMap[key];
        }
      } else if (isNonOrganic) {
        if (isTransitionCert) {
          filteredMap[key] = this.certificationTypeMap[key];
        }
      } else {
        filteredMap[key] = this.certificationTypeMap[key];
      }
    });

    this.certificationTypeFilteredMap = filteredMap;
    this.certificationTypeOptions = EnumSifrant.fromObject(filteredMap);
    this.certificationTypeOptions.setPlaceholder(
      $localize`:@@productLabelStockPurchaseOrdersModal.singleChoice.organicsCertificationType.placeholder:Seleccionar opción ...`
    );

    const keys = Object.keys(filteredMap);
    if (keys.length > 0 && this.stockOrderForm) {
      const currentVal = this.stockOrderForm.get('organicCertification')?.value;
      if (!currentVal || !keys.includes(currentVal)) {
        this.stockOrderForm.get('organicCertification')?.setValue(keys[0]);
      }
    }
  }

  private async loadCertificationTypes() {
    try {
      // Backend moderno: GET /api/codebook/certification-type retorna List<ApiCertificationType> directamente (sin paginación)
      const items: any[] = await this.certificationTypeControllerService
        .listActive('ES')
        .pipe(take(1))
        .toPromise();
      this.certificationTypeMap = {};
      (items || [])
        .filter((it: any) => it?.status === 'ACTIVE')
        .forEach((it: any) => {
          const key = it.name;
          this.certificationTypeMap[key] = it.name;
        });
      this.refreshCertificationTypeOptions();
    } catch (_) {
      // keep empty codebook on error
      this.certificationTypeMap = {};
      this.refreshCertificationTypeOptions();
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

  /**
   * Recalcula las opciones de N° Parcela a partir de las parcelas registradas
   * para el agricultor.
   *
   * existingValue, cuando se pasa, se conserva como opción aunque exceda la
   * cantidad actual de parcelas del agricultor (edición de una entrega antigua
   * cuyo agricultor perdió parcelas después) — nunca se limpia el control.
   * Sin existingValue (agricultor recién elegido en el selector), el número de
   * parcela del agricultor anterior no aplica y el control se limpia.
   */
  private async refreshParcelLotOptions(
    farmerId?: number,
    existingValue?: string | number,
    preselectFirstPlot = false,
  ) {
    if (this.parcelLotAsFreeText) {
      // Sin combo no hay opciones que cargar ni parcelas que consultar. Al elegir
      // agricultor se deja el 1 puesto, que es el caso común (pedido de FV).
      if (preselectFirstPlot) {
        this.stockOrderForm?.get('parcelLot')?.setValue('1');
      }
      return;
    }

    if (!farmerId) {
      this.farmerPlots = [];
      this.parcelLotCount = 0;
      this.buildParcelLotOptions();
      if (existingValue == null) {
        this.stockOrderForm?.get('parcelLot')?.setValue(null);
      }
      return;
    }

    try {
      const farmerResponse = await this.companyControllerService
        .getUserCustomer(farmerId)
        .pipe(take(1))
        .toPromise();

      this.farmerPlots = farmerResponse?.data?.plots ?? [];
      this.parcelLotCount = this.farmerPlots.length;
    } catch (_) {
      this.farmerPlots = [];
      this.parcelLotCount = 0;
    }

    this.buildParcelLotOptions();

    if (existingValue != null) {
      // El valor guardado puede no estar entre las opciones actuales (parcela
      // eliminada después de la entrega); se agrega igual para que se siga viendo.
      if (this.parcelLotOptionsMap[existingValue] === undefined) {
        this.parcelLotOptionsMap[existingValue] = this.parcelLotLabel(existingValue);
        this.buildParcelLotOptions(false);
      }
    } else {
      // Cambió el agricultor: la parcela del agricultor anterior no aplica.
      //
      // Se preselecciona solo si tiene UNA sola parcela, porque ahí no hay nada más
      // que elegir y ademas se hereda su variedad y certificación. Con dos o más el
      // campo queda vacío a propósito: elegir por él sería atribuir a la entrega una
      // parcela concreta, con sus datos, que nadie eligió.
      const preselect = preselectFirstPlot && this.parcelLotCount === 1;
      this.stockOrderForm
        ?.get('parcelLot')
        ?.setValue(preselect ? this.parcelLotValueFor(this.farmerPlots[0], 1) : null);
    }
  }

  private parcelLotOptionsMap: Record<string, string> = {};

  private parcelLotLabel(n: string | number): string {
    return $localize`:@@productLabelStockPurchaseOrdersModal.singleChoice.parcelLot.option:Parcela ${n}`;
  }

  /**
   * Regla de negocio (2026-08-14): un agricultor sin parcelas registradas no puede
   * vender cacao. Se implementa haciendo N° Parcela obligatorio siempre que el campo
   * se muestre: si el agricultor no tiene parcelas el combo queda vacío, no hay nada
   * que elegir y la entrega no se puede guardar.
   *
   * Solo aplica donde el campo es visible (hoy cacao, vía ProductFieldVisibilityService),
   * para no bloquear productos que nunca tuvieron este campo.
   */
  private updateParcelLotValidator() {
    const control = this.stockOrderForm?.get('parcelLot');
    if (!control) {
      return;
    }

    // El patron de solo digitos aplica a la caja de texto, donde se escribe un numero
    // a mano. En el combo el valor es el nombre de la parcela, que es texto libre.
    const validators = [];
    if (this.orderType === 'PURCHASE_ORDER' && this.shouldShowParcelLot) {
      validators.push(Validators.required);
    }
    if (this.parcelLotAsFreeText) {
      validators.push(Validators.pattern(/^[0-9]+$/));
    }
    control.setValidators(validators);
    control.updateValueAndValidity({ emitEvent: false });
  }

  /**
   * Copia a la entrega la variedad y la certificacion que ya estan registradas en la
   * parcela elegida, en vez de pedir que se vuelvan a cargar a mano.
   *
   * Quedan editables a proposito: la certificacion de la parcela puede haber cambiado
   * desde que se registro, y la entrega documenta lo que efectivamente llego.
   *
   * El orden importa. Fijar la variedad dispara la regla existente que, con CCN51,
   * autocompleta la certificacion de transicion; poniendo la certificacion despues,
   * la de la parcela es la que queda.
   */
  private applyPlotDefaults(parcelLotValue: string | number): void {
    const plot = this.plotForParcelLot(parcelLotValue);
    if (!plot) {
      return;
    }

    const variety = this.varietyValueFromPlot(plot);
    // Con onlyNacionalVariety la variedad es fija y el campo ni se muestra.
    if (variety && !this.companyProfile?.configuration?.onlyNacionalVariety) {
      this.stockOrderForm?.get('variety')?.setValue(variety);
    }

    // Solo si la certificacion de la parcela esta entre las que el combo ofrece ahora:
    // las opciones se filtran segun si la entrega es organica, y poner una que quedo
    // fuera del filtro dejaria el combo mostrando un valor que no se puede elegir.
    const certification = plot.certificationType?.name;
    if (certification && this.certificationTypeFilteredMap[certification] !== undefined) {
      this.stockOrderForm?.get('organicCertification')?.setValue(certification);
    }
  }

  /**
   * La parcela y la entrega no usan el mismo vocabulario para la variedad: la parcela
   * guarda ORGANICO/CCN51 y la entrega NACIONAL/CCN51, o "1"/"2" cuando la empresa usa
   * el combo numerico (ver initializeVarietyOptions). ORGANICO y NACIONAL son la misma
   * casilla con distinto nombre: confirmar con el cliente antes de darlo por hecho.
   */
  private varietyValueFromPlot(plot: ApiPlot): string | null {
    const numeric = !!this.companyProfile?.configuration?.numericVarietyOptions;

    switch (plot.cocoaVariety) {
      case 'CCN51':
        return numeric ? '2' : 'CCN51';
      case 'ORGANICO':
        return numeric ? '1' : 'NACIONAL';
      default:
        return null;
    }
  }

  /**
   * N° Parcela como caja de texto en vez de combo de parcelas del agricultor.
   *
   * Es para las empresas que no llevan las parcelas registradas en el sistema
   * (Fortaleza): ahí el combo sale vacío y, al ser obligatorio, deja la entrega sin
   * poder guardarse. En modo texto el número se escribe a mano y no se valida contra
   * las parcelas del agricultor.
   */
  get parcelLotAsFreeText(): boolean {
    return !!this.companyProfile?.configuration?.parcelLotFreeText;
  }

  /**
   * true cuando hay un agricultor elegido y no tiene ninguna parcela registrada.
   * En modo texto libre no aplica: no hay parcelas contra las cuales validar.
   */
  get selectedFarmerHasNoPlots(): boolean {
    return !this.parcelLotAsFreeText && !!this.searchFarmers?.value && this.parcelLotCount === 0;
  }

  /**
   * Lo que se guarda en la entrega: el nombre con el que el agricultor registro la
   * parcela ("Lote 7"). Las parcelas sin nombre caen en su posicion de la lista, que
   * es lo que se guardaba antes de este cambio, para no alterar lo ya registrado ni
   * el Excel de exportacion, que vuelca este campo tal cual.
   */
  private parcelLotValueFor(plot: ApiPlot, position: number): string {
    return (plot?.plotName ?? '').trim() || String(position);
  }

  private parcelLotLabelFor(plot: ApiPlot, position: number): string {
    return (plot?.plotName ?? '').trim() || this.parcelLotLabel(position);
  }

  /** La parcela detras del valor elegido, para heredar sus datos. */
  private plotForParcelLot(value: string | number): ApiPlot | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const target = String(value);
    return (
      this.farmerPlots.find(
        (plot, index) => this.parcelLotValueFor(plot, index + 1) === target,
      ) ?? null
    );
  }

  private buildParcelLotOptions(resetMap = true) {
    if (resetMap) {
      this.parcelLotOptionsMap = {};
      this.farmerPlots.forEach((plot, index) => {
        const value = this.parcelLotValueFor(plot, index + 1);
        // Dos parcelas con el mismo nombre son indistinguibles para quien registra:
        // se ofrece una sola opcion y hereda los datos de la primera.
        if (this.parcelLotOptionsMap[value] === undefined) {
          this.parcelLotOptionsMap[value] = this.parcelLotLabelFor(plot, index + 1);
        }
      });
    }
    this.parcelLotOptions = EnumSifrant.fromObject(this.parcelLotOptionsMap);
    this.parcelLotOptions.setPlaceholder(
      this.parcelLotCount > 0
        ? $localize`:@@productLabelStockPurchaseOrdersModal.singleChoice.parcelLot.placeholder:Selecciona la parcela`
        : $localize`:@@productLabelStockPurchaseOrdersModal.singleChoice.parcelLot.empty:El agricultor no tiene parcelas registradas`,
    );
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

  /**
   * Precio por unidad fijo por empresa (config fixedPricePerUnit): el campo sale
   * precargado con el precio del producto y en solo lectura. Recepcion no conoce el
   * precio y este se actualiza semanalmente desde Configuracion de la empresa.
   *
   * Solo lectura, no deshabilitado: un control deshabilitado no viaja en el payload
   * del formulario y la entrega se guardaria sin precio.
   */
  get fixedPricePerUnit(): boolean {
    return !!this.companyProfile?.configuration?.fixedPricePerUnit;
  }

  private configuredPriceFor(semiProductId: number | string): number | null {
    const prices = this.companyProfile?.configuration?.fixedPricesBySemiProduct;
    const price = prices?.[String(semiProductId)];
    if (price === null || price === undefined || price === '' || isNaN(Number(price))) {
      return null;
    }
    return Number(price);
  }

  /**
   * Se aplica al elegir producto en una entrega nueva. Al editar una entrega ya
   * guardada no se toca: ese precio es el que se pago ese dia, no el de hoy.
   */
  private applyFixedPricePerUnit(semiProductId: number | string): void {
    if (!this.fixedPricePerUnit || this.update) {
      return;
    }

    const price = this.configuredPriceFor(semiProductId);
    if (price !== null) {
      this.stockOrderForm?.get('pricePerUnit')?.setValue(price);
    }
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
    return this.stockOrderForm.get('activityProofs') as FormArray;
  }

  get yesNo() {
    const obj = {};
    obj['true'] = $localize`:@@productLabelStockPurchaseOrdersModal.organic.yes:Yes`;
    obj['false'] = $localize`:@@productLabelStockPurchaseOrdersModal.organic.no:No`;
    return obj;
  }

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
      // Recalcula con companyProfile ya disponible (ngOnInit la llamó antes, sin
      // configuración todavía, solo para no mostrar el combo vacío un instante).
      this.initializeVarietyOptions();
      // Solo se ofrecen productores activos: suspendidos y retirados no admiten transacciones nuevas
      this.farmersCodebook = new CompanyUserCustomersByRoleService(this.companyControllerService, this.companyProfile?.id, 'FARMER', true);
      this.collectorsCodebook = new CompanyUserCustomersByRoleService(this.companyControllerService, this.companyProfile?.id, 'COLLECTOR', true);

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

    // Se vuelve a entrar acá después de cada guardado sin cerrar, y las opciones se
    // agregan con push: sin limpiar antes, el combo de Semiproducto acumularía una
    // copia de cada producto por cada entrega registrada.
    this.options = [];

    if (action === 'new') {

      this.update = false;
      this.title = this.newTitle(this.orderType);
      const facilityId = this.route.snapshot.params.facilityId;

      const response = await this.facilityControllerService.getFacility(facilityId).pipe(take(1)).toPromise();
      if (response && response.status === StatusEnum.OK && response.data) {
        this.facility = response.data;
        for (const item of this.facility.facilitySemiProductList) {
          if (item.buyable) {
            item.name = this.translateName(item);
            this.options.push(item);
          }
        }
        this.facilityNameForm.setValue(this.translateName(this.facility));
      }

    } else if (action === 'update') {

      this.update = true;

      const stockOrderResponse = await this.stockOrderControllerService.getStockOrder(this.purchaseOrderId).pipe(take(1)).toPromise();
      if (stockOrderResponse && stockOrderResponse.status === StatusEnum.OK && stockOrderResponse.data) {

        this.order = stockOrderResponse.data;
        this.title = this.updateTitle(this.orderType);
        this.facility = stockOrderResponse.data.facility;

        for (const item of this.facility.facilitySemiProductList) {
          if (item.buyable) {
            item.name = this.translateName(item);
            this.options.push(item);
          }
        }
        this.facilityNameForm.setValue(this.translateName(this.facility));
      }
    } else {
      throw Error('Wrong action.');
    }

    if (this.companyProfile) {
      const obj = {};
      for (const user of this.companyProfile.users) {
        obj[user.id.toString()] = user.name + ' ' + user.surname;
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

    this.stockOrderForm = generateFormFromMetadata(ApiStockOrder.formMetadata(), { facility: { id: this.facility.id } }, ApiStockOrderValidationScheme(this.orderType));

    // Initialize preferred way of payments
    this.codebookPreferredWayOfPayment = EnumSifrant.fromObject(this.preferredWayOfPaymentList);

    // Set initial data
    if (this.selectedCurrency !== '-') {
      this.stockOrderForm.get('currency').setValue(this.selectedCurrency);
    }

    this.stockOrderForm.get('orderType').setValue(this.orderType);
    this.stockOrderForm.get('womenShare')?.setValue(false);
    this.setDate();

    // Set current logged-in user as employee
    this.employeeForm.setValue(this.currentLoggedInUser?.id.toString());

    // If only one semi-product select it as a default
    if (this.options && this.options.length === 1) {
      this.modelChoice = this.options[0].id;
      this.stockOrderForm.get('semiProduct').setValue({ id: this.options[0].id });
      this.setMeasureUnit(this.modelChoice).then();
      this.applyFixedPricePerUnit(this.modelChoice);
    }

    // Add Week Number control (for cacao). Required only when cacao selected.
    if (!this.stockOrderForm.get('weekNumber')) {
      this.stockOrderForm.addControl('weekNumber', new FormControl(null));
    }
    // Add Parcel Lot control (for cacao). En modo texto libre arranca en 1 para no
    // tener que escribirlo en cada entrega (pedido de FV).
    if (!this.stockOrderForm.get('parcelLot')) {
      this.stockOrderForm.addControl(
        'parcelLot',
        new FormControl(this.parcelLotAsFreeText ? '1' : null),
      );
    }
    // El esquema trae un patron de solo digitos que no aplica al combo, donde el valor
    // es el nombre de la parcela. Se ajusta aca porque updateValidators() corre antes
    // de que exista este control.
    this.updateParcelLotValidator();
    // Add Variety control (for cacao)
    if (!this.stockOrderForm.get('variety')) {
      const defaultVariety = this.companyProfile?.configuration?.onlyNacionalVariety ? 'NACIONAL' : null;
      this.stockOrderForm.addControl('variety', new FormControl(defaultVariety));
    } else if (this.companyProfile?.configuration?.onlyNacionalVariety) {
      this.stockOrderForm.get('variety').setValue('NACIONAL');
    }
    // Add Organic Certification control
    if (!this.stockOrderForm.get('organicCertification')) {
      this.stockOrderForm.addControl('organicCertification', new FormControl(null));
    }
    // Add Moisture Percentage controls
    if (!this.stockOrderForm.get('finalPriceDiscount')) {
      this.stockOrderForm.addControl('finalPriceDiscount', new FormControl(null));
    }
    if (!this.stockOrderForm.get('moisturePercentage')) {
      this.stockOrderForm.addControl('moisturePercentage', new FormControl(null));
    }
    if (!this.stockOrderForm.get('moistureWeightDeduction')) {
      this.stockOrderForm.addControl('moistureWeightDeduction', new FormControl(null));
    }
    this.updateWeekNumberVisibilityAndValidation();

    this.prepareData();
    this.setupFormListeners();
  }

  private async editStockOrder() {

    // Generate the form
    this.stockOrderForm = generateFormFromMetadata(ApiStockOrder.formMetadata(), this.order, ApiStockOrderValidationScheme(this.orderType));

    // Initialize preferred way of payments
    this.codebookPreferredWayOfPayment = EnumSifrant.fromObject(this.preferredWayOfPaymentList);

    if (this.orderType === 'PURCHASE_ORDER') {
      this.selectedCurrency = this.stockOrderForm.get('currency').value ? this.stockOrderForm.get('currency').value : '-';
      this.searchFarmers.setValue(this.order.producerUserCustomer);
      if (this.order.representativeOfProducerUserCustomer && this.order.representativeOfProducerUserCustomer.id) {
        this.searchCollectors.setValue(this.order.representativeOfProducerUserCustomer);
      }
    }

    this.modelChoice = this.order.semiProduct?.id;
    if (this.modelChoice) {
      this.setMeasureUnit(this.modelChoice).then();
    }

    this.employeeForm.setValue(this.order.creatorId.toString());
    // TODO: set documents and payments if purchase order

    if (this.order.updatedBy && this.order.updatedBy.id) {
      const userUpdatedBy = this.order.updatedBy;
      this.userLastChanged = `${userUpdatedBy.name} ${userUpdatedBy.surname}`;
    } else if (this.order.createdBy && this.order.createdBy.id) {
      const userCreatedBy = this.order.createdBy;
      this.userLastChanged = `${userCreatedBy.name} ${userCreatedBy.surname}`;
    }

    if (this.stockOrderForm.get('organic').value != null) {
      this.stockOrderForm.get('organic').setValue(this.stockOrderForm.get('organic').value.toString());
    }

    if (this.stockOrderForm.get('priceDeterminedLater').value) {
      this.stockOrderForm.get('pricePerUnit').clearValidators();
      this.stockOrderForm.get('damagedPriceDeduction').clearValidators();
    }
    this.stockOrderForm.updateValueAndValidity();

    // Ensure weekNumber control exists and set value if backend provides it
    if (!this.stockOrderForm.get('weekNumber')) {
      this.stockOrderForm.addControl('weekNumber', new FormControl(null));
    }
    if ((this.order as any)?.weekNumber != null) {
      this.stockOrderForm.get('weekNumber').setValue((this.order as any).weekNumber);
    }
    // Ensure parcelLot control exists and set value if backend provides it
    if (!this.stockOrderForm.get('parcelLot')) {
      this.stockOrderForm.addControl('parcelLot', new FormControl(null));
    }
    this.updateParcelLotValidator();
    if ((this.order as any)?.parcelLot != null) {
      this.stockOrderForm.get('parcelLot').setValue((this.order as any).parcelLot);
    }
    // Entregas anteriores a este campo no tienen parcelLot; igual se cargan las
    // opciones del agricultor por si se quiere completar el dato ahora.
    this.refreshParcelLotOptions(this.order.producerUserCustomer?.id, (this.order as any)?.parcelLot);
    // Ensure variety control exists and set value if backend provides it
    if (!this.stockOrderForm.get('variety')) {
      const defaultVariety = this.companyProfile?.configuration?.onlyNacionalVariety ? 'NACIONAL' : null;
      this.stockOrderForm.addControl('variety', new FormControl(defaultVariety));
    }
    if ((this.order as any)?.variety != null) {
      this.ensureVarietyOption((this.order as any).variety);
      this.stockOrderForm.get('variety').setValue((this.order as any).variety);
    }
    // Si la empresa usa solo variedad Nacional, siempre sobrescribir con NACIONAL
    if (this.companyProfile?.configuration?.onlyNacionalVariety) {
      this.stockOrderForm.get('variety').setValue('NACIONAL');
    }
    // Ensure organicCertification control exists and set value if backend provides it
    if (!this.stockOrderForm.get('organicCertification')) {
      this.stockOrderForm.addControl('organicCertification', new FormControl(null));
    }
    if ((this.order as any)?.organicCertification != null) {
      const value = (this.order as any).organicCertification;
      this.stockOrderForm.get('organicCertification').setValue(value);
    } else {
      const keys = Object.keys(this.certificationTypeMap);
      if (keys.length > 0) {
        this.stockOrderForm.get('organicCertification').setValue(keys[0]);
      }
    }
    // Si la empresa solo tiene producción orgánica, forzar organic a 'true' y cargar certificaciones por defecto
    if (this.companyProfile?.configuration?.onlyOrganicProduction === true) {
      this.stockOrderForm.get('organic').setValue('true');
      if (!this.stockOrderForm.get('organicCertification').value) {
        const certs = this.getDefaultFDVCertifications();
        if (certs) {
          this.stockOrderForm.get('organicCertification').setValue(certs);
        }
      }
    }
    // Ensure moisture percentage controls exist
    if (!this.stockOrderForm.get('moisturePercentage')) {
      this.stockOrderForm.addControl('moisturePercentage', new FormControl(null));
    }
    if (!this.stockOrderForm.get('moistureWeightDeduction')) {
      this.stockOrderForm.addControl('moistureWeightDeduction', new FormControl(null));
    }
    this.updateWeekNumberVisibilityAndValidation();
    this.setupFormListeners();
  }

  private setupFormListeners() {
    const varietyControl = this.stockOrderForm.get('variety');
    if (varietyControl) {
      varietyControl.valueChanges.subscribe((val) => {
        if (this.isCcn51VarietyValue(val)) {
          const tKey = this.getTransitionCertificationKey();
          this.stockOrderForm.get('organicCertification')?.setValue(tKey);
        }
      });
    }

    const parcelLotControl = this.stockOrderForm.get('parcelLot');
    if (parcelLotControl) {
      // Al cargar una entrega ya guardada este listener todavia no existe (se registra
      // despues de volcar los datos), asi que abrir una entrega vieja no le pisa la
      // variedad ni la certificacion con los datos de hoy de la parcela.
      parcelLotControl.valueChanges.subscribe((val) => this.applyPlotDefaults(val));
    }

    const organicControl = this.stockOrderForm.get('organic');
    if (organicControl) {
      organicControl.valueChanges.subscribe((val) => {
        this.refreshCertificationTypeOptions();
        const certControl = this.stockOrderForm.get('organicCertification');
        if (certControl && (!certControl.value || val === 'false' || val === false)) {
          const tKey = this.getTransitionCertificationKey();
          certControl.setValue(tKey);
        }
      });
    }

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

    const productionDateControl = this.stockOrderForm.get('productionDate');
    if (productionDateControl) {
      productionDateControl.valueChanges.subscribe((val) => {
        if (val) {
          this.applyWeekNumberFor(val);
        }
      });
    }
  }

  calculateWeekNumber(dateInput: any): number | null {
    return calculateWeekNumber(dateInput, weekNumberingSchemeOf(this.companyProfile?.configuration));
  }

  /**
   * Escribe el numero de semana que corresponde a la fecha. Con el calendario de
   * Fortaleza el sabado y el domingo no tienen semana (no se trabaja): el campo se
   * deja vacio para que se escriba a mano, en vez de dejar el numero de otra fecha.
   */
  private applyWeekNumberFor(dateInput: any): void {
    const control = this.stockOrderForm.get('weekNumber');
    if (!control) {
      return;
    }

    const week = this.calculateWeekNumber(dateInput);
    if (week && week >= 1 && week <= 53) {
      control.setValue(week);
    } else {
      control.setValue(null);
    }
  }

  private updateWeekNumberFromDate(): void {
    const pd = this.stockOrderForm.get('productionDate')?.value;
    if (pd) {
      this.applyWeekNumberFor(pd);
    }
  }

  /** El color se muestra solo si la empresa lo tiene activado (hilo por saco). */
  get showWeekColor(): boolean {
    return weekColorCodesEnabled(this.companyProfile?.configuration);
  }

  get weekColor(): WeekColor | null {
    return this.showWeekColor ? weekColor(Number(this.stockOrderForm?.get('weekNumber')?.value)) : null;
  }

  private cannotUpdatePO() {
    this.prepareData();
    return (this.stockOrderForm.invalid || this.searchFarmers.invalid ||
      this.employeeForm.invalid || !this.modelChoice ||
      this.tareInvalidCheck || this.damagedPriceDeductionInvalidCheck);
  }

  onSelectedType(type: StockOrderType) {
    switch (type as StockOrderType) {
      case 'PURCHASE_ORDER':
        this.stockOrderForm.get('orderType').setValue(type);
        return;
      case 'GENERAL_ORDER':
      case 'PROCESSING_ORDER':
        return;
      default:
        throw Error('Wrong order type: ' + type);
    }
  }

  setFarmer(event: ApiUserCustomer) {

    if (event) {
      this.stockOrderForm.get('producerUserCustomer').setValue({ id: event.id });
    } else {
      this.stockOrderForm.get('producerUserCustomer').setValue(null);
    }

    this.stockOrderForm.get('producerUserCustomer').markAsDirty();
    this.stockOrderForm.get('producerUserCustomer').updateValueAndValidity();
    this.codebookPreferredWayOfPayment = EnumSifrant.fromObject(this.preferredWayOfPaymentList);
    this.refreshParcelLotOptions(event?.id, undefined, true);
  }

  setCollector(event: ApiUserCustomer) {

    if (event) {
      this.stockOrderForm.get('representativeOfProducerUserCustomer').setValue({ id: event.id });
      if (this.stockOrderForm.get('preferredWayOfPayment') && this.stockOrderForm.get('preferredWayOfPayment').value === 'UNKNOWN') {
        this.stockOrderForm.get('preferredWayOfPayment').setValue(null);
      }
    } else {
      this.stockOrderForm.get('representativeOfProducerUserCustomer').setValue(null);
      if (this.stockOrderForm.get('preferredWayOfPayment') && this.stockOrderForm.get('preferredWayOfPayment').value === 'CASH_VIA_COLLECTOR') {
        this.stockOrderForm.get('preferredWayOfPayment').setValue(null);
      }
    }

    this.stockOrderForm.get('representativeOfProducerUserCustomer').markAsDirty();
    this.stockOrderForm.get('representativeOfProducerUserCustomer').updateValueAndValidity();
    this.codebookPreferredWayOfPayment = EnumSifrant.fromObject(this.preferredWayOfPaymentList);
  }

  semiProductSelected(id: string) {

    if (id) {
      this.stockOrderForm.get('semiProduct').setValue({ id });
      this.setMeasureUnit(Number(id)).then();
      this.applyFixedPricePerUnit(id);
    } else {
      this.stockOrderForm.get('semiProduct').setValue(null);
    }

    this.stockOrderForm.get('semiProduct').markAsDirty();
    this.stockOrderForm.get('semiProduct').updateValueAndValidity();

    // Update week number requirement when semi-product changes
    this.updateWeekNumberVisibilityAndValidation();
  }

  async setMeasureUnit(semiProdId: number) {

    const res = await this.semiProductControllerService.getSemiProduct(semiProdId).pipe(take(1)).toPromise();
    if (res && res.status === StatusEnum.OK && res.data) {
      this.measureUnit = res.data.measurementUnitType.label;
    } else {
      this.measureUnit = '-';
    }
  }

  setToBePaid() {

    if (this.stockOrderForm && this.stockOrderForm.get('totalGrossQuantity').value && this.stockOrderForm.get('pricePerUnit').value) {
      const grossQuantity = Number(this.stockOrderForm.get('totalGrossQuantity').value);
      let baseWeight = grossQuantity;
      let pricePerUnit = this.stockOrderForm.get('pricePerUnit').value;

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
        const moistureDeduction = baseWeight * (moisturePercent / 100);
        netWeight = baseWeight - moistureDeduction;
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

      this.stockOrderForm.get('cost').setValue(Number(total).toFixed(2));
    } else {

      this.stockOrderForm.get('cost').setValue(null);
    }
  }

  setBalance() {

    if (this.stockOrderForm && this.stockOrderForm.get('cost').value !== null && this.stockOrderForm.get('cost').value !== undefined) {
        this.stockOrderForm.get('balance').setValue(this.stockOrderForm.get('cost').value);
    } else {

      this.stockOrderForm.get('balance').setValue(null);
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
    if (this.companyProfile?.configuration?.onlyOrganicProduction === true) {
      return false;
    }
    return this.facility && this.facility.displayOrganic || this.stockOrderForm.get('organic').value;
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
    return this.facility && this.facility.displayFinalPriceDiscount || this.stockOrderForm.get('finalPriceDiscount').value;
  }

  get showDamagedWeightDeduction() {
    return this.facility && this.facility.displayWeightDeductionDamage || this.stockOrderForm.get('damagedWeightDeduction').value;
  }

  get readonlyDamagedPriceDeduction() {
    return this.facility && !this.facility.displayPriceDeductionDamage || this.stockOrderForm.get('priceDeterminedLater').value;
  }

  get readonlyFinalPriceDiscount() {
    return this.facility && !this.facility.displayFinalPriceDiscount || this.stockOrderForm.get('priceDeterminedLater').value;
  }

  get readonlyDamagedWeightDeduction() {
    return this.facility && !this.facility.displayWeightDeductionDamage;
  }

  get showMoisturePercentage() {
    return this.facility && this.facility.displayMoisturePercentage || this.stockOrderForm.get('moisturePercentage').value;
  }

  get readonlyMoisturePercentage() {
    return this.facility && !this.facility.displayMoisturePercentage;
  }

  netWeight() {
    if (this.stockOrderForm && this.stockOrderForm.get('totalGrossQuantity').value) {
      const grossQuantity = Number(this.stockOrderForm.get('totalGrossQuantity').value);
      let baseWeight = grossQuantity;

      if (this.stockOrderForm.get('tare').value) {
        baseWeight -= Number(this.stockOrderForm.get('tare').value);
      }
      if (this.stockOrderForm.get('damagedWeightDeduction').value) {
        baseWeight -= Number(this.stockOrderForm.get('damagedWeightDeduction').value);
      }

      baseWeight = Math.max(0, baseWeight);

      let finalNetWeight = baseWeight;
      if (this.stockOrderForm.get('moisturePercentage').value) {
        const moisturePercent = Number(this.stockOrderForm.get('moisturePercentage').value);
        const moistureDeduction = baseWeight * (moisturePercent / 100);
        finalNetWeight = baseWeight - moistureDeduction;
        this.stockOrderForm.get('moistureWeightDeduction').setValue(moistureDeduction.toFixed(2), { emitEvent: false });
      } else {
        this.stockOrderForm.get('moistureWeightDeduction').setValue(null, { emitEvent: false });
      }

      finalNetWeight = Math.max(0, finalNetWeight);
      this.netWeightForm.setValue(finalNetWeight.toFixed(2));
    } else {
      this.netWeightForm.setValue(null);
    }
  }

  finalPrice() {
    if (this.stockOrderForm && this.stockOrderForm.get('pricePerUnit').value) {
      let finalPrice = this.stockOrderForm.get('pricePerUnit').value;
      if (this.stockOrderForm.get('damagedPriceDeduction').value) {
        finalPrice -= this.stockOrderForm.get('damagedPriceDeduction').value;
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
    this.updateParcelLotValidator();
    this.stockOrderForm.get('organic').setValidators(
        this.orderType === 'PURCHASE_ORDER' &&
        this.facility &&
        this.facility.displayOrganic ?
            [Validators.required] : []
    );
    this.stockOrderForm.get('organic').updateValueAndValidity();
    this.stockOrderForm.get('tare').setValidators([]);
    this.stockOrderForm.get('tare').setValue(null);
    this.stockOrderForm.get('tare').updateValueAndValidity();
    const damagedPriceDeductionControl = this.stockOrderForm.get('damagedPriceDeduction');
    damagedPriceDeductionControl.setValidators([]);
    damagedPriceDeductionControl.setValue(null);
    damagedPriceDeductionControl.updateValueAndValidity();

    const finalPriceDiscountControl = this.stockOrderForm.get('finalPriceDiscount');
    if (finalPriceDiscountControl) {
      finalPriceDiscountControl.setValidators([]);
      if (!(this.facility && this.facility.displayFinalPriceDiscount)) {
        finalPriceDiscountControl.setValue(null, { emitEvent: false });
      }
      finalPriceDiscountControl.updateValueAndValidity();
    }
    this.stockOrderForm.get('damagedWeightDeduction').setValidators(
        this.orderType === 'PURCHASE_ORDER' &&
        this.facility &&
        this.facility.displayWeightDeductionDamage ?
            [Validators.required] : []
    );
    this.stockOrderForm.get('damagedWeightDeduction').updateValueAndValidity();

    const moistureControl = this.stockOrderForm.get('moisturePercentage');
    if (moistureControl) {
      const moistureValidators = [Validators.min(0), Validators.max(100)];
      if (this.orderType === 'PURCHASE_ORDER' && this.facility && this.facility.displayMoisturePercentage) {
        moistureValidators.unshift(Validators.required);
      }
      moistureControl.setValidators(moistureValidators);
      if (!(this.facility && this.facility.displayMoisturePercentage)) {
        moistureControl.setValue(null);
        const moistureWeightControl = this.stockOrderForm.get('moistureWeightDeduction');
        if (moistureWeightControl) {
          moistureWeightControl.setValue(null);
        }
      }
      moistureControl.updateValueAndValidity();
    }
  }

  get tareInvalidCheck() {
      const tare: number = Number(this.stockOrderForm.get('tare').value).valueOf();
      const totalGrossQuantity: number = Number(this.stockOrderForm.get('totalGrossQuantity').value).valueOf();
      return tare && totalGrossQuantity && (tare > totalGrossQuantity);
  }

  get damagedPriceDeductionInvalidCheck() {
    const damagedPriceDeduction: number = Number(this.stockOrderForm.get('damagedPriceDeduction').value).valueOf();
    const pricePerUnit: number = Number(this.stockOrderForm.get('pricePerUnit').value).valueOf();
    return damagedPriceDeduction && pricePerUnit && (damagedPriceDeduction > pricePerUnit);
  }

  get damagedWeightDeductionInvalidCheck() {
    const damagedWeightDeduction = Number(this.stockOrderForm.get('damagedWeightDeduction').value).valueOf();
    const totalQuantity = Number(this.stockOrderForm.get('totalQuantity').value).valueOf();
    return damagedWeightDeduction && totalQuantity && (damagedWeightDeduction > totalQuantity);
  }

  async printDeliveryPdf() {
    if (!this.deliveryDetailsContainer?.nativeElement) {
      return;
    }

    const element = this.deliveryDetailsContainer.nativeElement;
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

    if (this.stockOrderForm.get('totalGrossQuantity').valid) {

      let quantity = parseFloat(this.stockOrderForm.get('totalGrossQuantity').value);

      if (this.stockOrderForm.get('tare').value) {
        quantity -= this.stockOrderForm.get('tare').value;
      }

      if (quantity < 0) {
        quantity = 0.00;
      }

      let form = this.stockOrderForm.get('totalQuantity');
      form.setValue(quantity);
      form.updateValueAndValidity();

      form = this.stockOrderForm.get('fulfilledQuantity');
      form.setValue(quantity);
      form.updateValueAndValidity();

      form = this.stockOrderForm.get('availableQuantity');
      form.setValue(quantity);
      form.updateValueAndValidity();
    }
  }

  private setDate() {
    const today = dateISOString(new Date());
    this.stockOrderForm.get('productionDate').setValue(today);
  }

  private prepareData() {
    this.setQuantities();
    const pd = this.stockOrderForm.get('productionDate').value;
    if (pd != null) {
      this.stockOrderForm.get('productionDate').setValue(dateISOString(pd));
    }
    this.updateWeekNumberFromDate();

    if (this.companyProfile?.configuration?.onlyOrganicProduction === true) {
      // Empresas con producción exclusivamente orgánica (ej. Fortaleza del Valle):
      // organic siempre 'true', certificación tomada del perfil de la empresa.
      this.stockOrderForm.get('organic').setValue('true');
      const certs = this.getDefaultFDVCertifications();
      if (certs) {
        this.stockOrderForm.get('organicCertification').setValue(certs);
      }
    } else {
      // Resto de empresas (ej. UNOCACE): CCN51 o "No" orgánico defaultea a
      // certificación de transición.
      const tKey = this.getTransitionCertificationKey();
      const isCCN51 = this.isCcn51VarietyValue(this.stockOrderForm.get('variety')?.value);
      if (isCCN51) {
        this.stockOrderForm.get('organicCertification')?.setValue(tKey);
      } else {
        const organicVal = this.stockOrderForm.get('organic')?.value;
        if (organicVal === 'false' || organicVal === false) {
          const certControl = this.stockOrderForm.get('organicCertification');
          if (certControl && !certControl.value) {
            certControl.setValue(tKey);
          }
        }
      }
    }
  }

  private getDefaultFDVCertifications(): string {
    if (this.companyProfile?.certifications && this.companyProfile.certifications.length > 0) {
      return this.companyProfile.certifications.map(c => c.type).filter(Boolean).join(', ');
    }
    return '';
  }

  private async setIdentifier() {

    const farmerResponse = await this.companyControllerService
      .getUserCustomer(this.stockOrderForm.get('producerUserCustomer').value?.id).pipe(take(1)).toPromise();

    if (farmerResponse && farmerResponse.status === StatusEnum.OK && farmerResponse.data) {
      const farmerId = farmerResponse.data.id;
      const productionDate = this.stockOrderForm.get('productionDate').value;
      const companyId = this.companyProfile?.id;

      let seq = 1;
      if (companyId && farmerId && productionDate) {
        const ordersRes = await this.stockOrderControllerService.getStockOrdersInFacilityForCustomerByMap({
          companyId,
          limit: 1000,
          offset: 0,
          companyCustomerId: farmerId
        }).pipe(take(1)).toPromise();

        if (ordersRes && ordersRes.status === StatusEnum.OK && ordersRes.data && ordersRes.data.items) {
          const sameDayOrders = ordersRes.data.items.filter(o => o.productionDate === productionDate && o.identifier?.startsWith('PT-'));
          seq = sameDayOrders.length + 1;
        }
      }

      const internalId = farmerResponse.data.farmerCompanyInternalId ? ` (${farmerResponse.data.farmerCompanyInternalId})` : '';
      const identifier = 'PT-' + farmerResponse.data.surname + internalId + '-' + productionDate + '-' + seq;
      this.stockOrderForm.get('identifier').setValue(identifier);
    }
  }

  private translateName(obj) {
    return this.codebookTranslations.translate(obj, 'name');
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
  isCacaoSelected(): boolean {
    return false;
  }

  get displayPriceDeterminedLater() {
    return this.facility.displayPriceDeterminedLater;
  }

  priceDeterminedLaterChanged() {
    // change validation for price per unit based on
    if (this.stockOrderForm.get('priceDeterminedLater').value) {
      this.stockOrderForm.get('pricePerUnit').clearValidators();
      this.stockOrderForm.get('pricePerUnit').setValue(null);
      this.stockOrderForm.get('damagedPriceDeduction').setValue(null);
      this.updateValidators();
    } else {
      this.stockOrderForm.get('pricePerUnit').setValidators(ApiStockOrderValidationScheme(this.orderType).fields.pricePerUnit.validators);
      this.updateValidators();
    }

    this.stockOrderForm.get('pricePerUnit').updateValueAndValidity();
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
      this.stockOrderForm.get('creatorId').setValue(this.employeeForm.value);

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

      const data: ApiStockOrder = _.cloneDeep(this.stockOrderForm.value);
      // Remove null/undefined keys
      Object.keys(data as any).forEach((key) => ((data as any)[key] == null) && delete (data as any)[key]);

      const res = await this.stockOrderControllerService
        .createOrUpdateStockOrderByMap({ ApiStockOrder: data })
        .pipe(take(1))
        .toPromise();

      if (res && res.status === 'OK') {
        if (close) {
          this.dismiss();
        } else {
          // Al quedarse en la pantalla no hay cambio de vista que confirme nada: sin
          // este aviso el formulario se vacía y parece que el registro se perdió.
          this.globalEventsManager.push({
            action: 'success',
            notificationType: 'success',
            title: $localize`:@@productLabelStockPurchaseOrdersModal.save.success.title:Guardado`,
            message: this.update
              ? $localize`:@@productLabelStockPurchaseOrdersModal.save.success.update:Los cambios se guardaron correctamente.`
              : $localize`:@@productLabelStockPurchaseOrdersModal.save.success.new:La entrega se registró correctamente. El formulario quedó listo para la siguiente.`,
          });
          this.stockOrderForm.markAsPristine();
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
