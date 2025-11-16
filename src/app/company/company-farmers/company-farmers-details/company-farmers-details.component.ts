import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import _ from 'lodash-es';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { ApiUserCustomer } from '../../../../api/model/apiUserCustomer';
import { CompanyControllerService } from '../../../../api/api/companyController.service';
import { defaultEmptyObject, generateFormFromMetadata } from '../../../../shared/utils';
import {
  ApiUserCustomerCooperativeValidationScheme,
  ApiUserCustomerValidationScheme
} from '../../company-collectors/company-collectors-details/validation';
import { ApiBankInformation } from '../../../../api/model/apiBankInformation';
import { ApiFarmInformation } from '../../../../api/model/apiFarmInformation';
import { ApiLocation } from '../../../../api/model/apiLocation';
import { ApiAddress } from '../../../../api/model/apiAddress';
import { debounceTime, first, startWith, take } from 'rxjs/operators';
import { EnumSifrant } from '../../../shared-services/enum-sifrant';
import { ThemeService } from '../../../shared-services/theme.service';
import { environment } from '../../../../environments/environment';
import { GlobalEventManagerService } from '../../../core/global-event-manager.service';
import { ApiCompany } from '../../../../api/model/apiCompany';
import { ListEditorManager } from '../../../shared/list-editor/list-editor-manager';
import { ApiUserCustomerCooperative } from '../../../../api/model/apiUserCustomerCooperative';
import UserCustomerTypeEnum = ApiUserCustomerCooperative.UserCustomerTypeEnum;
import { BehaviorSubject, Subscription } from 'rxjs';
import { ApiStockOrder } from '../../../../api/model/apiStockOrder';
import { ApiCertification } from '../../../../api/model/apiCertification';
import { ApiCertificationValidationScheme } from '../../../m-product/product-label/validation';
import { CompanyProductTypesService } from '../../../shared-services/company-product-types.service';
import { ApiProductType } from '../../../../api/model/apiProductType';
import { ListNotEmptyValidator } from '../../../../shared/validation';
import { ApiPayment } from '../../../../api/model/apiPayment';
import { ApiFarmPlantInformation } from '../../../../api/model/apiFarmPlantInformation';
import { SelectedUserCompanyService } from '../../../core/selected-user-company.service';
import { FileSaverService } from 'ngx-filesaver';
import { HttpClient } from '@angular/common/http';
import { SelfOnboardingService } from '../../../shared-services/self-onboarding.service';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { ProductFieldVisibilityService } from '../../../shared-services/product-field-visibility.service';

@Component({
  selector: 'app-company-farmers-details',
  templateUrl: './company-farmers-details.component.html',
  styleUrls: ['./company-farmers-details.component.scss']
})
export class CompanyFarmersDetailsComponent implements OnInit, OnDestroy {

  faTimes = faTimes;

  subscriptions: Subscription[] = [];

  title: string;
  update: boolean;
  company: ApiCompany;
  companyId;
  farmer: ApiUserCustomer;
  farmerForm: FormGroup;
  submitted = false;
  qrCodeSize = 110;
  appName = environment.appName;

  openBalanceOnly = false;
  deliveries = [];
  payments = [];

  // BehaviorSubject para pasar maxProductionQuantity a app-stock-unit-list
  maxProductionQuantityPing$ = new BehaviorSubject<number>(0);

  producersListManager;
  codebookAssoc: EnumSifrant;
  codebookCoop;
  assocCoop;
  assocForm = new FormControl(null);

  genderCodebook = EnumSifrant.fromObject({
    MALE: $localize`:@@collectorDetail.gender.male:Male`,
    FEMALE: $localize`:@@collectorDetail.gender.female:Female`,
    N_A: 'N/A',
    DIVERSE: $localize`:@@collectorDetail.gender.diverse:Diverse`
  });

  personTypeCodebook = EnumSifrant.fromObject({
    NATURAL: $localize`:@@collectorDetail.personType.natural:Persona natural`,
    LEGAL: $localize`:@@collectorDetail.personType.legal:Persona jurídica`
  });

  readonly farmerType = UserCustomerTypeEnum.FARMER;

  // payments table parameters
  showedPaymentOrders = 0;
  allPaymentOrders = 0;
  selectedPayments: ApiPayment[];

  farmerIdPing$ = new BehaviorSubject<number>(this.route.snapshot.params.id);
  productTypesForm = new FormControl(null);
  productTypes: Array<ApiProductType> = [];
  productTypesCodebook: CompanyProductTypesService;
  selectedProductTypesForm = new FormControl(null, [ListNotEmptyValidator()]);

  // Deliveries table parameters
  showedDeliveries = 0;
  allDeliveries = 0;
  selectedOrders: ApiStockOrder[];

  certificationListManager = null;

  sortOptionsPay = [
    {
      key: 'date',
      name: $localize`:@@collectorDetail.sortOptionsPay.date.name:Date`,
    },
    {
      key: 'number',
      name: $localize`:@@collectorDetail.sortOptionsPay.number.name:Receipt number`,
      inactive: true
    },
    {
      key: 'purpose',
      name: $localize`:@@collectorDetail.sortOptionsPay.purpose.name:Payment purpose`,
      inactive: true
    },
    {
      key: 'amount',
      name: $localize`:@@collectorDetail.sortOptionsPay.amount.name:Amount paid to farmer (RWF)`,
      inactive: true
    },
    {
      key: 'amountCollector',
      name: $localize`:@@collectorDetail.sortOptionsPay.amountCollector.name:Amount paid to collector (RWF)`,
      inactive: true
    },
    {
      key: 'purchase',
      name: $localize`:@@collectorDetail.sortOptionsPay.purchase.name:Purchase order`,
      inactive: true
    },
    {
      key: 'status',
      name: $localize`:@@collectorDetail.sortOptionsPay.status.name:Status`,
      inactive: true
    }
  ];

  sortOptionsPO = [
    {
      key: 'date',
      name: $localize`:@@collectorDetail.sortOptionsPO.date.name:Date`,
    },
    {
      key: 'identifier',
      name: $localize`:@@collectorDetail.sortOptionsPO.identifier.name:Name`,
      inactive: true
    },
    {
      key: 'quantity',
      name: $localize`:@@collectorDetail.sortOptionsPO.quantity.name:Quantity (kg)`,
      inactive: true
    },
    {
      key: 'payableAndBalance',
      name: $localize`:@@collectorDetail.sortOptionsPO.payableAndBalance.name:Payable / Balance`,
      inactive: true
    }
  ];

  @ViewChild('newFarmerTitleTooltip')
  newFarmerTitleTooltip: NgbTooltip;

  public areaTranslations = {
    totalCultivatedLabel: $localize`:@@collectorDetail.textinput.totalCultivatedArea.label:Total cultivated area`,
    totalCultivatedPlaceholder: $localize`:@@collectorDetail.textinput.totalCultivatedArea.placeholder:Enter total cultivated area`,
    plantCultivatedLabel: $localize`:@@collectorDetail.textinput.plantCultivatedArea.label:Area cultivated with`,
    plantCultivatedPlaceholder: $localize`:@@collectorDetail.textinput.plantCultivatedArea.placeholder:Enter area cultivated with`,
    organicCertifiedLabel: $localize`:@@collectorDetail.textinput.areaOrganicCertified.label:Organic certified area`,
    organicCertifiedPlaceholder: $localize`:@@collectorDetail.textinput.areaOrganicCertified.placeholder:Enter organic certified area`,
    numberOfPlantsLabel: $localize`:@@collectorDetail.textinput.numberOfPlants.label:Number of plants`,
    numberOfPlantsPlaceholder: $localize`:@@collectorDetail.textinput.numberOfPlants.placeholder:Enter number of plants`,
  };

  constructor(
      private location: Location,
      private route: ActivatedRoute,
      private companyService: CompanyControllerService,
      private globalEventsManager: GlobalEventManagerService,
      private selUserCompanyService: SelectedUserCompanyService,
      public theme: ThemeService,
      private fileSaverService: FileSaverService,
      private httpClient: HttpClient,
      private selfOnboardingService: SelfOnboardingService,
      private router: Router,
      private fieldVisibilityService: ProductFieldVisibilityService
  ) { }

  static ApiUserCustomerCooperativeCreateEmptyObject(): ApiUserCustomerCooperative {
    const obj: ApiUserCustomerCooperative = defaultEmptyObject(ApiUserCustomerCooperative.formMetadata());
    obj.company = defaultEmptyObject(ApiCompany.formMetadata());
    return obj;
  }

  static ApiUserCustomerCooperativeEmptyObjectFormFactory(): () => FormControl {
    return () => {
      return new FormControl(CompanyFarmersDetailsComponent.ApiUserCustomerCooperativeCreateEmptyObject(),
        ApiUserCustomerCooperativeValidationScheme.validators);
    };
  }

  static ApiCertificationCreateEmptyObject(): ApiCertification {
    const obj = ApiCertification.formMetadata();
    return defaultEmptyObject(obj) as ApiCertification;
  }

  static ApiCertificationEmptyObjectFormFactory(): () => FormControl {
    return () => {
      return new FormControl(CompanyFarmersDetailsComponent.ApiCertificationCreateEmptyObject(), ApiCertificationValidationScheme.validators);
    };
  }

  get certifications(): AbstractControl[] {
    return (this.farmerForm.get('certifications') as FormArray).controls;
  }

  get farmPlantInfos(): AbstractControl[] {
    return (this.farmerForm.get('farm.farmPlantInformationList') as FormArray).controls;
  }

  ngOnInit(): void {
    this.farmerForm = null;
    this.initData().then(() => {
      if (!this.update) {
        this.newFarmer();
      } else {
        this.editFarmer();
      }

      this.farmerForm.setControl('productTypes', this.selectedProductTypesForm);

      this.selectedProductTypesForm.setValue(this.productTypes);

      this.productTypesCodebook = new CompanyProductTypesService(this.companyService, this.companyId);

      this.initializeListManager();
      this.updateAreaUnitValidators();
      this.initValueChangeListeners();
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  async initData() {

    const action = this.route.snapshot.data.action;
    if (!action) { return; }

    this.company = await this.selUserCompanyService.selectedCompanyProfile$.pipe(take(1)).toPromise();
    if (!this.company) { return; }

    this.companyId = this.company.id;

    switch (action) {
      case 'new':
        this.title = $localize`:@@collectorDetail.newFarmer.title:New farmer`;
        this.update = false;
        // this code sets the default product type, when only 1 is available
        const defaultProdTypeCheck = await this.companyService.getCompanyProductTypes(this.companyId).pipe(take(1)).toPromise();
        if (defaultProdTypeCheck && defaultProdTypeCheck.status === 'OK') {
          if (defaultProdTypeCheck.data.count === 1) {
            this.productTypes = defaultProdTypeCheck.data.items;
          }
        }
        break;
      case 'update':
        this.title = $localize`:@@collectorDetail.editFarmer.title:Edit farmer`;
        this.update = true;
        const uc = await this.companyService.getUserCustomer(this.route.snapshot.params.id).pipe(first()).toPromise();
        if (uc && uc.status === 'OK') {
          this.farmer = uc.data;
          this.productTypes = uc.data.productTypes;
        }
        break;
      default:
        throw Error('Wrong action!');
    }

    this.listOfOrgProducer().then();
    this.listOfOrgAssociation().then();
  }

  private prefillFarmPlantInformation(): void {

    const farmPlantInformationList = this.farmerForm.get('farm.farmPlantInformationList') as FormArray;
    if (farmPlantInformationList == null) {
      return;
    }

    const listControls = (farmPlantInformationList).controls;
    const newListControls: AbstractControl[] = [];
    listControls.forEach(control => {
      const farmPlantInformation = control.value as ApiFarmPlantInformation;

      const formGroup = new FormGroup({
        productType: new FormControl(farmPlantInformation.productType),
        plantCultivatedArea: new FormControl(farmPlantInformation.plantCultivatedArea),
        numberOfPlants: new FormControl(farmPlantInformation.numberOfPlants)
      });

      this.addControlValueChangeListener(formGroup.get('plantCultivatedArea') as FormControl);

      newListControls.push(formGroup);
    });

    // add missing product type in lists
    const listProductTypeControls = (this.farmerForm.get('productTypes') as FormArray).controls;
    listProductTypeControls.forEach(ptControl =>  {
      const productType = ptControl.value as ApiProductType;

      const productFound = listControls.find(plantInfo => plantInfo.value.productType.id === productType.id);
      if ( productFound === undefined ) {
        const formGroup = new FormGroup({
          productType: new FormControl(productType),
          plantCultivatedArea: new FormControl(null),
          numberOfPlants: new FormControl(null)
        });

        this.addControlValueChangeListener(formGroup.get('plantCultivatedArea') as FormControl);

        newListControls.push(formGroup);
      }
    });

    (this.farmerForm.get('farm.farmPlantInformationList') as FormArray).clear();

    newListControls.forEach(newControl => {
      (this.farmerForm.get('farm.farmPlantInformationList') as FormArray).push(newControl);
    });
  }

  private addNewFarmPlantInformation(productType: ApiProductType): void {

    const formGroup = new FormGroup({
      productType: new FormControl(productType),
      plantCultivatedArea: new FormControl(null),
      numberOfPlants: new FormControl(null)
    });

    this.addControlValueChangeListener(formGroup.get('plantCultivatedArea') as FormControl);

    (this.farmerForm.get('farm.farmPlantInformationList') as FormArray).push(formGroup);
  }

  private removeFarmPlantInformation(productType: ApiProductType): void {

    const plantInfoListArray = this.farmerForm.get('farm.farmPlantInformationList') as FormArray;

    const resultArrayControls = plantInfoListArray.controls.filter(control => control.get('productType').value.id !== productType.id);

    plantInfoListArray.clear();
    resultArrayControls.forEach(res => plantInfoListArray.push(res));
  }

  initValueChangeListeners() {

    if (this.areaUnit != null) {
      this.subscriptions.push(this.areaUnit.valueChanges.pipe(
          startWith(null),
          debounceTime(100)).subscribe(
          val => {
            if (val !== null && val !== undefined) {
              this.updateAreaUnitValidators();
            }
          }
      ));
    }

    if (this.totalCultivatedArea != null) {
      this.subscriptions.push(this.totalCultivatedArea.valueChanges.pipe(
          startWith(null),
          debounceTime(100)).subscribe(
          val => {
            if (val !== null && val !== undefined) {
              this.updateAreaUnitValidators();
            }
          }
      ));
    }

    if (this.areaOrganicCertified != null) {
      this.subscriptions.push(this.areaOrganicCertified.valueChanges.pipe(
          startWith(null),
          debounceTime(100)).subscribe(
          val => {
            if (val !== null && val !== undefined) {
              this.updateAreaUnitValidators();
            }
          }
      ));
    }
  }

  private addControlValueChangeListener(control: FormControl) {
    this.subscriptions.push(control.valueChanges.pipe(
      startWith(null),
      debounceTime(100)).subscribe(
      val => {
        if (val !== null && val !== undefined) {
          this.updateAreaUnitValidators();
        }
      }
    ));
  }

  newFarmer() {

    this.farmerForm = generateFormFromMetadata(ApiUserCustomer.formMetadata(), this.emptyFarmer(), ApiUserCustomerValidationScheme);
    
    // Agregar campo temporal maxProductionQuantity hasta que se agregue al backend
    const farmGroup = this.farmerForm.get('farm') as FormGroup;
    if (farmGroup && !farmGroup.get('maxProductionQuantity')) {
      farmGroup.addControl('maxProductionQuantity', new FormControl(null));
    }

    // in case of 1 product (auto selection), also add empty fields in form
    if (this.productTypes?.length > 0) {
      setTimeout(() => {
        this.selectedProductTypesForm.setValue(this.productTypes);
        this.farmerForm.markAsDirty();
        this.productTypesForm.setValue(null);
        this.addNewFarmPlantInformation(this.productTypes[0]);
      });
    }

    this.subscriptions.push(
        this.selfOnboardingService.addFarmersCurrentStep$.subscribe(currentStep => {
          if (currentStep === 3) {
            setTimeout(() => this.newFarmerTitleTooltip.open());
          } else {
            setTimeout(() => this.newFarmerTitleTooltip.close());
          }
        })
    );

    this.setupMaxProductionQuantityListener();
    this.setupOrganicFieldDependencies();
    this.setupPersonTypeDependencies();
  }

  editFarmer() {
    this.prepareEdit();
    this.farmerForm = generateFormFromMetadata(ApiUserCustomer.formMetadata(), this.farmer, ApiUserCustomerValidationScheme);
    
    // Agregar campo temporal maxProductionQuantity hasta que se agregue al backend
    const farmGroup = this.farmerForm.get('farm') as FormGroup;
    if (farmGroup && !farmGroup.get('maxProductionQuantity')) {
      farmGroup.addControl('maxProductionQuantity', new FormControl((this.farmer?.farm as any)?.maxProductionQuantity || null));
    }

    this.prefillFarmPlantInformation();
    this.setupMaxProductionQuantityListener();
    this.setupOrganicFieldDependencies();
    this.setupPersonTypeDependencies();
  }

  /**
   * Configura el listener para cambios en maxProductionQuantity
   */
  private setupMaxProductionQuantityListener(): void {
    const maxProductionQuantityControl = this.farmerForm.get('farm.maxProductionQuantity');
    if (maxProductionQuantityControl) {
      // Emitir valor inicial (convertir null/undefined a 0)
      const initialValue = maxProductionQuantityControl.value || 0;
      this.maxProductionQuantityPing$.next(initialValue);
      
      // Escuchar cambios
      this.subscriptions.push(
        maxProductionQuantityControl.valueChanges.subscribe(value => {
          // Convertir null/undefined a 0
          const safeValue = value || 0;
          this.maxProductionQuantityPing$.next(safeValue);
        })
      );
    }
  }

  private setupPersonTypeDependencies(): void {
    if (!this.farmerForm) {
      return;
    }

    const personTypeControl = this.farmerForm.get('personType') as FormControl;
    const companyNameControl = this.farmerForm.get('companyName') as FormControl;
    const legalRepresentativeControl = this.farmerForm.get('legalRepresentative') as FormControl;
    const nameControl = this.farmerForm.get('name') as FormControl;
    const surnameControl = this.farmerForm.get('surname') as FormControl;
    const genderControl = this.farmerForm.get('gender') as FormControl;

    if (!personTypeControl) {
      return;
    }

    const updateValidators = (value: any) => {
      const isLegal = value === 'LEGAL';

      // Company name & representative are required only for legal entities
      if (companyNameControl) {
        companyNameControl.clearValidators();
        if (isLegal) {
          companyNameControl.setValidators([Validators.required]);
        }
        if (!isLegal) {
          companyNameControl.reset(null, { emitEvent: false });
        }
        companyNameControl.updateValueAndValidity({ emitEvent: false });
      }

      if (legalRepresentativeControl) {
        legalRepresentativeControl.clearValidators();
        if (isLegal) {
          legalRepresentativeControl.setValidators([Validators.required]);
        }
        if (!isLegal) {
          legalRepresentativeControl.reset(null, { emitEvent: false });
        }
        legalRepresentativeControl.updateValueAndValidity({ emitEvent: false });
      }

      // Manage name / surname / gender when person is legal entity
      if (nameControl || surnameControl || genderControl) {
        if (isLegal) {
          if (nameControl) {
            // Mantener opcional, pero asegurarse de que tenga un valor si el backend lo requiere
            nameControl.clearValidators();
            if (!nameControl.value && companyNameControl && companyNameControl.value) {
              nameControl.setValue(companyNameControl.value, { emitEvent: false });
            }
            nameControl.updateValueAndValidity({ emitEvent: false });
          }

          if (surnameControl) {
            // Quitar requerido y poner un valor neutro
            surnameControl.clearValidators();
            if (!surnameControl.value) {
              surnameControl.setValue('N/A', { emitEvent: false });
            }
            surnameControl.updateValueAndValidity({ emitEvent: false });
          }

          if (genderControl) {
            // Quitar requerido y fijar género N_A para personas jurídicas
            genderControl.clearValidators();
            if (!genderControl.value) {
              genderControl.setValue('N_A', { emitEvent: false });
            }
            genderControl.updateValueAndValidity({ emitEvent: false });
          }
        } else {
          // Restaurar validaciones originales para persona natural
          if (surnameControl) {
            surnameControl.setValidators([Validators.required]);
            surnameControl.updateValueAndValidity({ emitEvent: false });
          }

          if (genderControl) {
            genderControl.setValidators([Validators.required]);
            genderControl.updateValueAndValidity({ emitEvent: false });
          }

          if (nameControl) {
            // Nombre siempre fue opcional: sin Validators.required
            nameControl.clearValidators();
            nameControl.updateValueAndValidity({ emitEvent: false });
          }
        }
      }
    };

    if (!personTypeControl.value) {
      personTypeControl.setValue('NATURAL', { emitEvent: false });
    }

    updateValidators(personTypeControl.value);

    this.subscriptions.push(
      personTypeControl.valueChanges.subscribe(value => {
        updateValidators(value);
      })
    );
  }

  private setupOrganicFieldDependencies(): void {
    const organicControl = this.farmerForm.get('farm.organic') as FormControl;
    if (!organicControl) {
      return;
    }

    const dependentControls: FormControl[] = [];

    const areaOrganicCertifiedControl = this.farmerForm.get('farm.areaOrganicCertified') as FormControl;
    if (areaOrganicCertifiedControl) {
      dependentControls.push(areaOrganicCertifiedControl);
    }

    const startTransitionControl = this.farmerForm.get('farm.startTransitionToOrganic') as FormControl;
    if (startTransitionControl) {
      dependentControls.push(startTransitionControl);
    }

    const maxProductionControl = this.farmerForm.get('farm.maxProductionQuantity') as FormControl;
    if (maxProductionControl && this.fieldVisibilityService.shouldShowField('maxProductionQuantity')) {
      dependentControls.push(maxProductionControl);
    }

    const toggleDependentControls = (isOrganic: boolean) => {
      dependentControls.forEach(control => {
        if (isOrganic) {
          control.enable({ emitEvent: false });
          control.setValidators([Validators.required]);
        } else {
          control.reset(null, { emitEvent: false });
          control.clearValidators();
          control.disable({ emitEvent: false });
        }
        control.updateValueAndValidity({ emitEvent: false });
      });
    };

    toggleDependentControls(!!organicControl.value);

    this.subscriptions.push(
      organicControl.valueChanges.subscribe((value: boolean) => {
        toggleDependentControls(!!value);
      })
    );
  }

  async geoJSONSelectedToUpload($event: Event) {

    if (!this.update) {
      return;
    }

    const fileInput: HTMLInputElement = $event.target as HTMLInputElement;
    const file = fileInput.files[0];

    const formData = new FormData();
    formData.append('file', file);

    this.globalEventsManager.showLoading(true);
    try {
      await this.httpClient.post(
          `${ this.companyService.configuration.basePath }/api/company/userCustomers/${ this.farmer.id }/uploadGeoData`, formData, {observe: 'response'})
          .pipe(take(1))
          .toPromise();

      this.ngOnInit();
    } finally {
      this.globalEventsManager.showLoading(false);
    }
  }

  async exportGeoData() {

    if (!this.update) {
      return;
    }

    this.globalEventsManager.showLoading(true);
    try {
      const res = await this.companyService.exportUserCustomerGeoData(this.farmer.id)
          .pipe(take(1))
          .toPromise();
      this.fileSaverService.save(res, `${this.farmer.name}_${this.farmer.surname}_geo_data.json`);
    } finally {
      this.globalEventsManager.showLoading(false);
    }
  }

  emptyFarmer() {
    const farmer: ApiUserCustomer = defaultEmptyObject(ApiUserCustomer.formMetadata());

    farmer.bank = defaultEmptyObject(ApiBankInformation.formMetadata()) as ApiBankInformation;
    farmer.farm = defaultEmptyObject(ApiFarmInformation.formMetadata()) as ApiFarmInformation;
    farmer.location = defaultEmptyObject(ApiLocation.formMetadata()) as ApiLocation;
    farmer.location.address = defaultEmptyObject(ApiAddress.formMetadata()) as ApiAddress;
    (farmer as any).personType = 'NATURAL';

    return farmer;
  }

  prepareEdit() {
    if (this.farmer.bank == null) {
      this.farmer.bank = defaultEmptyObject(ApiBankInformation.formMetadata());
    }
  }

  prepareData() {
    this.farmerForm.get('type').setValue(UserCustomerTypeEnum.FARMER);

    if (this.farmerForm.get('hasSmartphone').value === null) {
      this.farmerForm.get('hasSmartphone').setValue(false);
    }

    if (this.farmerForm.get('farm.organic').value === null) {
      this.farmerForm.get('farm.organic').setValue(false);
    }

    const data = _.cloneDeep(this.farmerForm.value);

    Object.keys(data.location).forEach((key) => (data.location[key] == null) && delete data.location[key]);
    if (data.farmInfo) { Object.keys(data.farmInfo).forEach((key) => (data.farmInfo[key] == null) && delete data.farmInfo[key]); }
    if (data.contact) { Object.keys(data.contact).forEach((key) => (data.contact[key] == null) && delete data.contact[key]); }
    if (data.bankAccountInfo) { Object.keys(data.bankAccountInfo).forEach((key) => (data.bankAccountInfo[key] == null) && delete data.bankAccountInfo[key]); }

    Object.keys(data).forEach((key) => (data[key] == null) && delete data[key]);

    return data;
  }

  dismiss() {
    this.location.back();
  }

  async addSelectedProductType(productType: ApiProductType) {
    if (!productType) {
      return;
    }
    if (this.productTypes.some(pt => pt?.id === productType?.id)) {
      setTimeout(() => this.productTypesForm.setValue(null));
      return;
    }
    this.productTypes.push(productType);
    setTimeout(() => {
      this.selectedProductTypesForm.setValue(this.productTypes);
      this.farmerForm.markAsDirty();
      this.productTypesForm.setValue(null);
      this.addNewFarmPlantInformation(productType);
    });
  }

  deleteProductType(idx: number) {
    this.confirmProductTypeRemove().then(confirmed => {
      if (confirmed) {
        const productType = this.productTypes[idx];
        this.productTypes.splice(idx, 1);
        setTimeout(() => this.selectedProductTypesForm.setValue(this.productTypes));
        this.farmerForm.markAsDirty();
        this.removeFarmPlantInformation(productType);
      }
    });
  }

  private async confirmProductTypeRemove(): Promise<boolean> {

    const result = await this.globalEventsManager.openMessageModal({
      type: 'warning',
      message: $localize`:@@companyDetailProductTypeModal.removeProductType.confirm.message:Are you sure you want to remove the product type?`,
      options: {
        centered: true
      }
    });

    return result === 'ok';
  }

  async save(stayOnPage: boolean = false) {

    this.submitted = true;

    if (this.farmerForm.invalid) {
      return;
    }
    if (this.checkNullEmpty(this.areaUnit) && this.checkAreaFieldsRequired()) {
      this.updateAreaUnitValidators();
      return;
    }

    const data = this.prepareData();

    try {
      this.globalEventsManager.showLoading(true);
      let res;
      if (!this.update) {

        res = await this.companyService.addUserCustomer(this.companyId, data).toPromise();

      } else {
        res = await this.companyService.updateUserCustomer(data).toPromise();
      }

      if (res && res.status === 'OK') {

        const currentAddFarmerStep = await this.selfOnboardingService.addFarmersCurrentStep$.pipe(take(1)).toPromise();
        if (currentAddFarmerStep === 3) {
          this.selfOnboardingService.setAddFarmersCurrentStep('success');
          this.router.navigate(['/home']).then();
        } else {

          if (!stayOnPage) {
            this.dismiss();
          } else {
            this.ngOnInit();
          }
        }
      }
    } finally {
      this.globalEventsManager.showLoading(false);
    }
  }

  initializeListManager() {

    this.producersListManager = new ListEditorManager<ApiUserCustomerCooperative>(
        this.farmerForm.get('cooperatives') as FormArray,
        CompanyFarmersDetailsComponent.ApiUserCustomerCooperativeEmptyObjectFormFactory(),
        ApiUserCustomerCooperativeValidationScheme
    );

    this.certificationListManager = new ListEditorManager<ApiCertification>(
      (this.farmerForm.get('certifications')) as FormArray,
      CompanyFarmersDetailsComponent.ApiCertificationEmptyObjectFormFactory(),
      ApiCertificationValidationScheme
    );
  }

  async listOfOrgProducer() {

    const companiesObj = {};
    companiesObj[this.company.id] = this.company.name;
    this.codebookCoop = EnumSifrant.fromObject(companiesObj);
    this.assocCoop = companiesObj;
  }

  async listOfOrgAssociation() {

    const res = await this.companyService.getAssociations(this.companyId).pipe(take(1)).toPromise();

    if (res && res.status === 'OK' && res.data) {
      const companiesObj = {};
      for (const company of res.data.items) {
        companiesObj[company.id] = company.name;
      }
      this.codebookAssoc = EnumSifrant.fromObject(companiesObj);
    }
  }

  assocResultFormatter = (value: any) => {
    return this.codebookAssoc.textRepresentation(value);
  }

  assocInputFormatter = (value: any) => {
    return this.codebookAssoc.textRepresentation(value);
  }

  addAssociation(item, form) {
    if (!item) {
      return;
    }
    if (this.farmerForm.value.associations.some(a => a.company.id === item.id)) {
      form.setValue(null);
      return;
    }
    this.farmerForm.value.associations.push({
      company: {
        id: item.id,
        name: item.name
      }
    });
    setTimeout(() => form.setValue(null));
  }

  deleteAssociation(item, index) {
    this.farmerForm.value.associations.splice(index, 1);
  }

  updateAreaUnitValidators() {
    if (this.areaUnit == null) {
      return;
    }
    this.areaUnit.clearValidators();
    this.areaUnit.setValidators(
      this.checkAreaFieldsRequired() ?
        [Validators.required] : []
    );
    this.farmerForm.markAllAsTouched();
    this.farmerForm.updateValueAndValidity();
  }

  get checkAreaFieldInvalid() {
    return this.checkNullEmpty(this.areaUnit) && this.checkAreaFieldsRequired();
  }

  checkAreaFieldsRequired() {
    return (!this.checkNullEmpty(this.totalCultivatedArea) ||
      this.checkPlantsCultivatedAreaFields() ||
      !this.checkNullEmpty(this.areaOrganicCertified));
  }

  checkNullEmpty(control: FormControl){
    return control == null || control.value == null || control.value === '';
  }

  checkPlantsCultivatedAreaFields() {
    const farmPlantInformationList = this.farmerForm.get('farm.farmPlantInformationList') as FormArray;
    if (farmPlantInformationList != null) {
      const controls = farmPlantInformationList.controls;
      return controls.some(control => !this.checkNullEmpty(control.get('plantCultivatedArea') as FormControl));
    }
  }

  public get areaUnit(): FormControl {
    return this.farmerForm.get('farm.areaUnit') as FormControl;
  }

  public get totalCultivatedArea(): FormControl {
    return this.farmerForm.get('farm.totalCultivatedArea') as FormControl;
  }

  public get areaOrganicCertified(): FormControl {
    return this.farmerForm.get('farm.areaOrganicCertified') as FormControl;
  }
  
  appendAreaUnit(message: string, unit: string): string {
    if (unit && unit.length > 0) {
      return message + ` (${unit})`;
    }
    return message;
  }

  getProductTypeName(index: number): string {
    const selectedControl = (this.farmerForm.get('farm.farmPlantInformationList') as FormArray).controls[index];
    const productType = selectedControl.get('productType')?.value;
    return (productType) ? productType.name : '';
  }

  appendAreaUnitAndProductType(message: string, unit: string, index: number): string {
    const productTypeName = this.getProductTypeName(index);
    if (unit && unit.length > 0) {
      return message + ` ${productTypeName} (${unit})`;
    }
    return message + ` ${productTypeName}`;
  }

  appendProductType(message: string, index: number): string {
    const selectedControl = (this.farmerForm.get('farm.farmPlantInformationList') as FormArray).controls[index];
    const productType = selectedControl.get('productType')?.value;
    const productTypeName = (productType) ? `(${productType.name})` : '';
    return message + ` ${productTypeName}`;
  }

  /**
   * Determina si un campo específico debe ser visible para un tipo de producto
   * Usa el servicio global de configuración de campos
   * @param fieldName Nombre del campo (ej: 'numberOfPlants')
   * @param index Índice del producto en el array
   * @returns true si el campo debe ser visible
   */
  shouldShowFieldForProductType(fieldName: string, index: number): boolean {
    const selectedControl = (this.farmerForm.get('farm.farmPlantInformationList') as FormArray).controls[index];
    const productType = selectedControl.get('productType')?.value;
    
    return this.fieldVisibilityService.shouldShowField(fieldName, productType);
  }

  selectedIdsChanged(event, type?) {
    if (type === 'PURCHASE') {
      this.selectedOrders = event;
    }
    else {
      this.selectedPayments = event;
    }
  }

  onShowPO(event) {
    this.showedDeliveries = event;
  }

  onCountAllPO(event) {
    this.allDeliveries = event;
  }

  onShowPayments(event) {
    this.showedPaymentOrders = event;
  }

  onCountAllPayments(event) {
    this.allPaymentOrders = event;
  }

}
