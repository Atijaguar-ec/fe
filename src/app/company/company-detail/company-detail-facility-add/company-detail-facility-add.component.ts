import { Component, OnDestroy, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { defaultEmptyObject, generateFormFromMetadata } from '../../../../shared/utils';
import { ApiFacility } from '../../../../api/model/apiFacility';
import { ApiFacilityLocation } from '../../../../api/model/apiFacilityLocation';
import { ApiFacilityValidationScheme } from './validation';
import { FacilityControllerService } from '../../../../api/api/facilityController.service';
import { first, take, takeUntil } from 'rxjs/operators';
import { ActiveFacilityTypeService } from '../../../shared-services/active-facility-types.service';
import { ApiAddress } from '../../../../api/model/apiAddress';
import { ApiCompanyBase } from '../../../../api/model/apiCompanyBase';
import { EnumSifrant } from '../../../shared-services/enum-sifrant';
import { ApiSemiProduct } from '../../../../api/model/apiSemiProduct';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { Subject } from 'rxjs/internal/Subject';
import { ApiFacilityTranslation } from '../../../../api/model/apiFacilityTranslation';
import { FinalProductsForCompanyService } from '../../../shared-services/final-products-for-company.service';
import { FinalProductControllerService } from '../../../../api/api/finalProductController.service';
import { ApiFinalProduct } from '../../../../api/model/apiFinalProduct';
import { GlobalEventManagerService } from '../../../core/global-event-manager.service';
import { ApiValueChain } from '../../../../api/model/apiValueChain';
import { Subscription } from 'rxjs';
import { SemiProductControllerService } from '../../../../api/api/semiProductController.service';
import { CodebookTranslations } from '../../../shared-services/codebook-translations';
import { SemiProductsForValueChainsService } from '../../../shared-services/semi-products-for-value-chains.service';
import { ListNotEmptyValidator } from '../../../../shared/validation';
import { CompanyValueChainsService } from '../../../shared-services/company-value-chains.service';
import { CompanyControllerService } from '../../../../api/api/companyController.service';
import { FacilityProductStrategy } from './facility-product-strategy';
import LanguageEnum = ApiFacilityTranslation.LanguageEnum;

declare const $localize: (messageParts: TemplateStringsArray, ...expressions: any[]) => string;

@Component({
  selector: 'app-company-detail-facility-add',
  templateUrl: './company-detail-facility-add.component.html',
  styleUrls: ['./company-detail-facility-add.component.scss']
})
export class CompanyDetailFacilityAddComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<boolean>();

  public edit!: boolean;
  public title!: string;
  public form!: FormGroup;
  public submitted = false;
  public companyId!: string;

  semiProductsForValueChainsService: SemiProductsForValueChainsService | null = null;

  companyValueChainsCodebook!: CompanyValueChainsService;
  valueChainsForm = new FormControl(null);
  valueChains: Array<ApiValueChain> = [];
  selectedCompanyValueChainsControl = new FormControl(null as ApiValueChain[] | null, [ListNotEmptyValidator()]);

  levelControl = new FormControl(null, [Validators.min(0)]);

  codebookStatus = EnumSifrant.fromObject(this.publiclyVisible);
  semiProductsForm = new FormControl(null);
  semiProducts: Array<ApiSemiProduct> = [];

  finalProductsForCompanyCodebook!: FinalProductsForCompanyService;
  finalProductForm = new FormControl(null);
  finalProducts: Array<ApiFinalProduct> = [];

  faTimes = faTimes;

  // Limit UI languages to EN and ES; default to ES
  languages = [LanguageEnum.EN, LanguageEnum.ES];
  selectedLanguage = LanguageEnum.ES;

  private valueChainSubs?: Subscription;

  constructor(
      private route: ActivatedRoute,
      private location: Location,
      private globalEventsManager: GlobalEventManagerService,
      private facilityControllerService: FacilityControllerService,
      public activeFacilityTypeService: ActiveFacilityTypeService,
      private semiProductControllerService: SemiProductControllerService,
      private codebookTranslations: CodebookTranslations,
      private companyController: CompanyControllerService,
      private finalProductController: FinalProductControllerService,
      private facilityProductStrategy: FacilityProductStrategy
  ) { }

  ngOnInit(): void {

    this.edit = this.route.snapshot.params.facilityId;
    this.companyId = this.route.snapshot.params.id;

    this.finalProductsForCompanyCodebook = new FinalProductsForCompanyService(this.finalProductController, Number(this.companyId));

    if (!this.edit) {
      this.initValueChainData().then(() => {
        this.initializeNew();
      });
    } else {
      this.initializeEdit();
    }

    this.companyValueChainsCodebook = new CompanyValueChainsService(this.companyController, Number(this.companyId));

  }

  private registerFacilityTypeLevelDefaults(): void {
    const facilityTypeControl = this.form.get('facilityType');
    if (!facilityTypeControl) {
      return;
    }

    const applyDefault = (facilityType: ApiFacility['facilityType']) => {
      if (!this.edit && facilityType?.order != null && this.levelControl && this.levelControl.pristine) {
        this.levelControl.setValue(facilityType.order, { emitEvent: false });
      }
    };

    applyDefault(facilityTypeControl.value as ApiFacility['facilityType']);

    facilityTypeControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((facilityType: ApiFacility['facilityType']) => applyDefault(facilityType));
  }

  async initValueChainData() {
    const companyId = this.route.snapshot.params.id;
    // this code sets the default value-chain, when only 1 is available
    const defaultValChainCheck = await this.companyController.getCompanyValueChains(companyId).pipe(take(1)).toPromise();
    if (defaultValChainCheck?.status === 'OK' && defaultValChainCheck.data) {
      if (defaultValChainCheck.data.count === 1) {
        this.valueChains = (defaultValChainCheck.data.items ?? []) as ApiValueChain[];

        setTimeout(() => this.selectedCompanyValueChainsControl.setValue(this.valueChains));
      }
    }
  }

  private registerValueChainSubs() {
    this.valueChainSubs?.unsubscribe();
    const valueChainsControl = this.form.get('valueChains');
    if (!valueChainsControl) {
      return;
    }

    this.valueChainSubs = valueChainsControl.valueChanges.subscribe((valueChains: ApiValueChain[] | null) => {

      if (valueChains && valueChains.length > 0) {
        const valueChainIds = valueChains
          .map(valueChain => valueChain?.id)
          .filter((id): id is number => typeof id === 'number');
        // Initialize codebook services for semi-products
        this.semiProductsForValueChainsService = new SemiProductsForValueChainsService(this.semiProductControllerService, this.codebookTranslations, valueChainIds);

      } else {
        this.semiProductsForValueChainsService = null;
      }
    });
  }

  registerValidatorsOnUpdate() {
    const publiclyVisibleControl = this.fLoc?.controls?.publiclyVisible;
    if (!publiclyVisibleControl) {
      return;
    }

    publiclyVisibleControl.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe((val: string) => {
          if (val === 'true') {
            this.fLoc.controls.latitude.setValidators([Validators.required]);
            this.fLoc.controls.longitude.setValidators([Validators.required]);
          } else {
            this.fLoc.controls.latitude.clearValidators();
            this.fLoc.controls.longitude.clearValidators();
          }
          this.fLoc.controls.latitude.updateValueAndValidity();
          this.fLoc.controls.longitude.updateValueAndValidity();
        });
  }

  initializeNew() {
    this.title = $localize `:@@productLabelStockFacilityModal.newFacility.newTitle:New facility`;
    this.form = generateFormFromMetadata(ApiFacility.formMetadata(), this.emptyObject(), ApiFacilityValidationScheme);
    (this.form as FormGroup).setControl('valueChains', this.selectedCompanyValueChainsControl);
    this.finalizeForm();
    this.ensureClassificationProcessControl(false);
    this.ensureFreezingProcessControl(false);
    this.initializeLevelControl(null);
    this.registerFacilityTypeLevelDefaults();
    this.registerValidatorsOnUpdate();
    this.registerValueChainSubs();
  }

  initializeEdit() {

    this.title = $localize`:@@productLabelStockFacilityModal.newFacility.editTitle:Edit facility`;
    const facilityId = Number(this.route.snapshot.params.facilityId);
    this.facilityControllerService.getFacilityDetail(facilityId).pipe(first()).subscribe(res => {
      const facilityData = res?.data;
      if (!facilityData) {
        return;
      }

      this.form = generateFormFromMetadata(ApiFacility.formMetadata(), facilityData, ApiFacilityValidationScheme);
      this.initializeLevelControl(facilityData.level ?? facilityData.facilityType?.order ?? null);
      (this.form as FormGroup).setControl('valueChains', this.selectedCompanyValueChainsControl);

      this.valueChains = facilityData.facilityValueChains ?? [];
      this.semiProducts = facilityData.facilitySemiProductList ?? [];
      this.finalProducts = facilityData.facilityFinalProducts ?? [];

      setTimeout(() => this.selectedCompanyValueChainsControl.setValue(this.valueChains));

      const publiclyVisible = this.form.get('facilityLocation.publiclyVisible');
      const tmpVis = publiclyVisible?.value;
      if (tmpVis != null) { publiclyVisible?.setValue(tmpVis.toString()); }
      const isPublic = this.form.get('isPublic');
      const tmpPub = isPublic?.value;
      if (tmpPub != null) { isPublic?.setValue(tmpPub.toString()); }
      const isCollection = this.form.get('isCollectionFacility');
      const tmpCollection = isCollection?.value;
      if (tmpCollection != null) { isCollection?.setValue(tmpCollection.toString()); }

      this.finalizeForm();
      this.ensureClassificationProcessControl(Boolean(facilityData.isClassificationProcess));
      this.ensureFreezingProcessControl(Boolean(facilityData.isFreezingProcess));
      this.registerFacilityTypeLevelDefaults();
      this.registerValidatorsOnUpdate();
      this.registerValueChainSubs();
    });
  }

  private initializeLevelControl(initialValue: number | null) {
    let control = this.form.get('level') as FormControl | null;
    if (!control) {
      control = this.levelControl;
      this.form.addControl('level', control);
    } else {
      this.levelControl = control;
      control.setValidators([Validators.min(0)]);
    }

    control.setValue(initialValue, { emitEvent: false });
    control.markAsPristine();
    control.updateValueAndValidity({ emitEvent: false });
  }

  emptyObject() {
    const object = defaultEmptyObject(ApiFacility.formMetadata()) as ApiFacility;
    object.company = defaultEmptyObject(ApiCompanyBase.formMetadata()) as ApiCompanyBase;
    object.facilityLocation = defaultEmptyObject(ApiFacilityLocation.formMetadata()) as ApiFacilityLocation;
    object.facilityLocation.address = defaultEmptyObject(ApiAddress.formMetadata()) as ApiAddress;
    object.isFieldInspection = false;
    object.isClassificationProcess = false;
    object.isFreezingProcess = false;
    object.isCuttingProcess = false;
    object.isTreatmentProcess = false;
    object.isTunnelFreezing = false;
    object.isWashingArea = false;
    object.isRestArea = false;
    return object;
  }

  dismiss() {
    this.location.back();
  }

  save() {
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }
    const facility: ApiFacility = {
      ...this.form.value,
      level: this.levelControl?.value ?? undefined
    };
    facility.company = facility.company ?? ({} as ApiCompanyBase);
    if (!this.edit) {
      facility.company.id = Number(this.route.snapshot.params.id);
    }
    facility.facilityValueChains = this.valueChains;
    facility.facilitySemiProductList = this.semiProducts;
    facility.facilityFinalProducts = this.finalProducts;
    this.facilityControllerService.createOrUpdateFacility(facility).pipe(first()).subscribe(() => {
      this.location.back();
    });
  }

  get publiclyVisible() {
    return {
      true: $localize`:@@productLabelStockFacilityModal.publiclyVisible.yes:YES`,
      false: $localize`:@@productLabelStockFacilityModal.publiclyVisible.no:NO`
    } as Record<string, string>;
  }

  async addSelectedValueChain(valueChain: ApiValueChain) {
    if (!valueChain) {
      // no element is selected, only user input
      return;
    }
    if (this.valueChains.some(vch => vch?.id === valueChain?.id)) {
      // same element. do not add new, just refresh input form
      setTimeout(() => this.valueChainsForm.setValue(null));
      return;
    }

    this.valueChains.push(valueChain);
    setTimeout(() => {
      this.selectedCompanyValueChainsControl.setValue(this.valueChains);
      this.form.markAsDirty();
      this.valueChainsForm.setValue(null);
    });
  }

  async addSelectedSemiProduct(sp: ApiSemiProduct) {
    if (!sp) {
      // no element is selected, only user input
      return;
    }
    if (this.semiProducts.some(s => s.id === sp.id)) {
      // same element selected. refresh the input element, but do not update the list
      setTimeout(() => this.semiProductsForm.setValue(null));
      return;
    }
    this.semiProducts.push(sp);
    setTimeout(() => this.semiProductsForm.setValue(null));
  }

  async addSelectedFinalProduct(finalProduct: ApiFinalProduct) {
    if (!finalProduct) {
      // no element is selected, only user input
      return;
    }
    if (this.finalProducts.some(fp => fp.id === finalProduct.id)) {
      // same element selected. refresh the input element, but do not update the list
      setTimeout(() => this.finalProductForm.setValue(null));
      return;
    }
    this.finalProducts.push(finalProduct);
    setTimeout(() => this.finalProductForm.setValue(null));
  }

  deleteValueChain(idx: number) {
    this.confirmValueChainRemove().then(confirmed => {
      if (confirmed) {
        this.valueChains.splice(idx, 1);
        setTimeout(() => this.selectedCompanyValueChainsControl.setValue(this.valueChains));

        if (idx >= 0) {
          // also remove already selected fields and document types
          this.removeAllSemiProducts();
        }
      }
    });
  }

  private removeAllSemiProducts() {
    this.semiProducts.splice(0); // delete  all elements
  }

  deleteSemiProduct(sp: ApiSemiProduct, idx: number) {
    this.confirmSemiOrFinalProductRemove().then(confirmed => {
      if (confirmed) {
        this.semiProducts.splice(idx, 1);
      }
    });
  }

  deleteFinalProduct(sp: ApiFinalProduct, idx: number) {
    this.confirmSemiOrFinalProductRemove().then(confirmed => {
      if (confirmed) {
        this.finalProducts.splice(idx, 1);
      }
    });
  }

  private async confirmValueChainRemove(): Promise<boolean> {

    const result = await this.globalEventsManager.openMessageModal({
      type: 'warning',
      message: $localize`:@@productLabelStockFacilityModal.removeValueChain.confirm.message:Are you sure you want to remove the value chain? Proceeding will reset the selected semi-products.`,
      options: {
        centered: true
      }
    });

    return result === 'ok';
  }

  private async confirmSemiOrFinalProductRemove(): Promise<boolean> {

    const result = await this.globalEventsManager.openMessageModal({
      type: 'warning',
      message: $localize`:@@productLabelStockFacilityModal.removeSemiOrFinalProduct.confirm.message:Are you sure you want to remove the final product / semi-product? Processing on these products will not work anymore.`,
      options: {
        centered: true
      }
    });

    return result === 'ok';
  }

  get fLoc(): FormGroup {
    return this.form.controls.facilityLocation as FormGroup;
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
    if (this.valueChainSubs) {
      this.valueChainSubs.unsubscribe();
    }
  }

  selectLanguage(lang: LanguageEnum) {
    this.selectedLanguage = lang;
  }

  finalizeForm() {
    const translationsControl = this.form.get('translations');
    const existingTranslations = (translationsControl?.value ?? []) as ApiFacilityTranslation[];

    this.form.removeControl('translations');
    const translationsArray = new FormArray([]);
    this.form.addControl('translations', translationsArray);

    for (const lang of this.languages) {
      const translation = existingTranslations.find((item: ApiFacilityTranslation) => item.language === lang);
      translationsArray.push(new FormGroup({
        name: new FormControl(translation?.name ?? ''),
        language: new FormControl(lang)
      }));
    }
  }

  get languageEnum() {
    return LanguageEnum;
  }

  /**
   * Ensure the form contains the isClassificationProcess checkbox control
   * and apply default visibility rules. The flag only applies for shrimp.
   */
  private ensureClassificationProcessControl(initialValue: boolean) {
    this.facilityProductStrategy.ensureClassificationProcessControl(this.form, initialValue);
  }

  /**
   * Ensure the form contains the isFreezingProcess checkbox control
   * and apply default visibility rules. The flag only applies for shrimp.
   */
  private ensureFreezingProcessControl(initialValue: boolean) {
    this.facilityProductStrategy.ensureFreezingProcessControl(this.form, initialValue);
  }

  /**
   * Check if the current product type is SHRIMP
   */
  get isShrimpProduct(): boolean {
    return this.facilityProductStrategy.isShrimpProduct;
  }

}
