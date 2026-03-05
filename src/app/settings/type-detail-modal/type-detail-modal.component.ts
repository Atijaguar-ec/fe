import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { generateFormFromMetadata, defaultEmptyObject } from 'src/shared/utils';
import { take } from 'rxjs/operators';
import {
  ApiFacilityTypeValidationScheme,
  ApiMeasureUnitTypeValidationScheme,
  ApiProcessingEvidenceTypeValidationScheme,
  ApiSemiProductValidationScheme,
  ApiProcessingEvidenceFieldValidationScheme,
  ApiProductTypeValidationScheme,
  ApiCertificationTypeValidationScheme
} from './validation';
import _ from 'lodash-es';
import { EnumSifrant } from '../../shared-services/enum-sifrant';
import { ActiveMeasureUnitTypeService } from '../../shared-services/active-measure-unit-types.service';
import { FacilityTypeControllerService } from '../../../api/api/facilityTypeController.service';
import { MeasureUnitTypeControllerService } from '../../../api/api/measureUnitTypeController.service';
import { ProcessingEvidenceTypeControllerService } from '../../../api/api/processingEvidenceTypeController.service';
import { ApiFacilityType } from '../../../api/model/apiFacilityType';
import { ApiMeasureUnitType } from '../../../api/model/apiMeasureUnitType';
import { ApiProcessingEvidenceType } from '../../../api/model/apiProcessingEvidenceType';
import { SemiProductControllerService } from '../../../api/api/semiProductController.service';
import { ApiSemiProduct } from '../../../api/model/apiSemiProduct';
import { ProcessingEvidenceFieldControllerService } from '../../../api/api/processingEvidenceFieldController.service';
import { ApiProcessingEvidenceField } from '../../../api/model/apiProcessingEvidenceField';
import { ApiSemiProductTranslation } from '../../../api/model/apiSemiProductTranslation';
import LanguageEnum = ApiSemiProductTranslation.LanguageEnum;
import { ProductTypeControllerService } from '../../../api/api/productTypeController.service';
import { ApiProductType } from '../../../api/model/apiProductType';
import { CertificationTypeControllerService } from '../../../api/api/certificationTypeController.service';
import { ApiCertificationType } from '../../../api/model/apiCertificationType';
import { ApiShrimpFlavorDefect } from '../../../api/model/apiShrimpFlavorDefect';
import { ApiShrimpColorGrade } from '../../../api/model/apiShrimpColorGrade';
import { ApiShrimpSizeGrade } from '../../../api/model/apiShrimpSizeGrade';
import { ApiShrimpProcessType } from '../../../api/model/apiShrimpProcessType';
import { ShrimpFlavorDefectControllerService } from '../../../api/api/shrimpFlavorDefectController.service';
import { ShrimpColorGradeControllerService } from '../../../api/api/shrimpColorGradeController.service';
import { ShrimpSizeGradeControllerService } from '../../../api/api/shrimpSizeGradeController.service';
import { ShrimpProcessTypeControllerService } from '../../../api/api/shrimpProcessTypeController.service';
import { ShrimpPresentationTypeControllerService } from '../../../api/api/shrimpPresentationTypeController.service';
// TODO: Uncomment after regenerating API TypeScript
// import { ShrimpQualityGradeControllerService } from '../../../api/api/shrimpQualityGradeController.service';
// import { ShrimpTreatmentTypeControllerService } from '../../../api/api/shrimpTreatmentTypeController.service';
import { ApiShrimpPresentationType } from '../../../api/model/apiShrimpPresentationType';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-type-detail-modal',
  templateUrl: './type-detail-modal.component.html',
  styleUrls: ['./type-detail-modal.component.scss']
})
export class TypeDetailModalComponent implements OnInit {

  @Input()
  title: string = null;

  @Input()
  type: string = null;

  @Input()
  update = false;

  @Input()
  typeElement = null;

  @Input()
  public saveCallback: () => string;

  form: FormGroup;
  submitted = false;

  codebookProcessingEvidenceTypeType = EnumSifrant.fromObject(this.processingEvidenceTypeType);
  codebookProcessingEvidenceFieldType = EnumSifrant.fromObject(this.processingEvidenceFieldType);
  codebookCertificationCategoryType = EnumSifrant.fromObject(this.certificationCategoryType);
  codebookCertificationStatusType = EnumSifrant.fromObject(this.certificationStatusType);
  codebookShrimpSizeType = EnumSifrant.fromObject(this.shrimpSizeType);
  codebookShrimpPresentationCategory = EnumSifrant.fromObject(this.shrimpPresentationCategory);

  // Allow English and Spanish for facility types and translations
  languages = [LanguageEnum.EN, LanguageEnum.ES];
  selectedLanguage = LanguageEnum.ES;

  isRegionalAdmin = false;

  constructor(
    public activeModal: NgbActiveModal,
    private facilityTypeService: FacilityTypeControllerService,
    private measureUnitTypeService: MeasureUnitTypeControllerService,
    private processingEvidenceTypeService: ProcessingEvidenceTypeControllerService,
    private processingEvidenceFieldService: ProcessingEvidenceFieldControllerService,
    private semiProductService: SemiProductControllerService,
    private productTypeService: ProductTypeControllerService,
    private certificationTypeService: CertificationTypeControllerService,
    private shrimpFlavorDefectService: ShrimpFlavorDefectControllerService,
    private shrimpColorGradeService: ShrimpColorGradeControllerService,
    private shrimpSizeGradeService: ShrimpSizeGradeControllerService,
    private shrimpProcessTypeService: ShrimpProcessTypeControllerService,
    private shrimpPresentationTypeService: ShrimpPresentationTypeControllerService,
    // TODO: Uncomment after regenerating API TypeScript
    // private shrimpQualityGradeService: ShrimpQualityGradeControllerService,
    // private shrimpTreatmentTypeService: ShrimpTreatmentTypeControllerService,
    public activeMeasureUnitTypeService: ActiveMeasureUnitTypeService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.authService.userProfile$.pipe(take(1)).subscribe(up => {
      this.isRegionalAdmin = up?.role === 'REGIONAL_ADMIN';
      this.init().then();
    });
  }

  get certificationCategoryType() {
    const obj = {};
    obj['CERTIFICATE'] = $localize`:@@certificationType.category.certificate:Certificate`;
    obj['SEAL'] = $localize`:@@certificationType.category.seal:Seal`;
    return obj;
  }

  get certificationStatusType() {
    const obj = {};
    obj['ACTIVE'] = $localize`:@@certificationType.status.active:Active`;
    obj['INACTIVE'] = $localize`:@@certificationType.status.inactive:Inactive`;
    return obj;
  }

  get shrimpSizeType() {
    const obj = {};
    obj['WHOLE'] = $localize`:@@shrimpSizeGrade.sizeType.whole:Entero`;
    obj['TAIL'] = $localize`:@@shrimpSizeGrade.sizeType.tail:Cola`;
    return obj;
  }

  get shrimpPresentationCategory() {
    const obj = {};
    obj['SHELL_ON'] = $localize`:@@shrimpPresentationType.category.shellOn:Shell-On (Cola)`;
    obj['BROKEN'] = $localize`:@@shrimpPresentationType.category.broken:Quebrado`;
    obj['OTHER'] = $localize`:@@shrimpPresentationType.category.other:Otros`;
    return obj;
  }

  dismiss() {
    this.activeModal.dismiss();
  }

  async init() {
    if (this.type === 'facility-types') {
      if (!this.update) {
        this.form = generateFormFromMetadata(ApiFacilityType.formMetadata(),
          defaultEmptyObject(ApiFacilityType.formMetadata()) as ApiFacilityType, ApiFacilityTypeValidationScheme);
      } else {
        this.form = generateFormFromMetadata(ApiFacilityType.formMetadata(), this.typeElement, ApiFacilityTypeValidationScheme);
      }
    }

    if (this.type === 'measurement-unit-types') {
      if (!this.update) {
        this.form = generateFormFromMetadata(ApiMeasureUnitType.formMetadata(),
          defaultEmptyObject(ApiMeasureUnitType.formMetadata()) as ApiMeasureUnitType, ApiMeasureUnitTypeValidationScheme);
      } else {
        this.form = generateFormFromMetadata(ApiMeasureUnitType.formMetadata(), this.typeElement, ApiMeasureUnitTypeValidationScheme);
      }
    }

    if (this.type === 'processing-evidence-types') {
      if (!this.update) {
        this.form = generateFormFromMetadata(
          ApiProcessingEvidenceType.formMetadata(),
          defaultEmptyObject(ApiProcessingEvidenceType.formMetadata()) as ApiProcessingEvidenceType,
          ApiProcessingEvidenceTypeValidationScheme);
      } else {
        this.form = generateFormFromMetadata(
          ApiProcessingEvidenceType.formMetadata(), this.typeElement, ApiProcessingEvidenceTypeValidationScheme);
      }
      this.updateProcessingEvidenceTypeTranslations();
    }

    if (this.type === 'processing-evidence-fields') {
      if (!this.update) {
        this.form = generateFormFromMetadata(
            ApiProcessingEvidenceField.formMetadata(),
            defaultEmptyObject(ApiProcessingEvidenceField.formMetadata()) as ApiProcessingEvidenceField,
            ApiProcessingEvidenceFieldValidationScheme);
      } else {
        this.form = generateFormFromMetadata(
            ApiProcessingEvidenceField.formMetadata(), this.typeElement, ApiProcessingEvidenceFieldValidationScheme);
      }
      this.updateProcessingEvidenceFieldTranslations();
    }

    if (this.type === 'semi-products') {
      if (!this.update) {
        this.form = generateFormFromMetadata(ApiSemiProduct.formMetadata(),
          defaultEmptyObject(ApiSemiProduct.formMetadata()) as ApiSemiProduct, ApiSemiProductValidationScheme);
      } else {
        this.form = generateFormFromMetadata(ApiSemiProduct.formMetadata(), this.typeElement, ApiSemiProductValidationScheme);
      }
      this.finalizeForm();
    }

    if (this.type === 'product-types') {
      if (!this.update) {
        this.form = generateFormFromMetadata(ApiProductType.formMetadata(),
          defaultEmptyObject(ApiProductType.formMetadata()) as ApiProductType, ApiProductTypeValidationScheme);
      } else {
        this.form = generateFormFromMetadata(ApiProductType.formMetadata(), this.typeElement, ApiProductTypeValidationScheme);
      }
      this.finalizeForm();
    }

    if (this.type === 'certification-types') {
      if (!this.update) {
        this.form = generateFormFromMetadata(ApiCertificationType.formMetadata(),
          defaultEmptyObject(ApiCertificationType.formMetadata()) as ApiCertificationType, ApiCertificationTypeValidationScheme);
      } else {
        this.form = generateFormFromMetadata(ApiCertificationType.formMetadata(), this.typeElement, ApiCertificationTypeValidationScheme);
      }
      if (!this.update) {
        this.form.get('status')?.setValue(ApiCertificationType.StatusEnum.ACTIVE);
        this.form.get('category')?.setValue(ApiCertificationType.CategoryEnum.CERTIFICATE);
      }
      this.updateCertificationTypeTranslations();
    }

    if (this.type === 'shrimp-flavor-defects') {
      if (!this.update) {
        this.form = generateFormFromMetadata(
          ApiShrimpFlavorDefect.formMetadata(),
          defaultEmptyObject(ApiShrimpFlavorDefect.formMetadata()) as ApiShrimpFlavorDefect
        );
        this.form.get('status')?.setValue(ApiShrimpFlavorDefect.StatusEnum.ACTIVE);
      } else {
        this.form = generateFormFromMetadata(
          ApiShrimpFlavorDefect.formMetadata(), this.typeElement as ApiShrimpFlavorDefect
        );
      }
      this.updateShrimpCatalogTranslations();
    }

    if (this.type === 'shrimp-color-grades') {
      if (!this.update) {
        this.form = generateFormFromMetadata(
          ApiShrimpColorGrade.formMetadata(),
          defaultEmptyObject(ApiShrimpColorGrade.formMetadata()) as ApiShrimpColorGrade
        );
        this.form.get('status')?.setValue(ApiShrimpColorGrade.StatusEnum.ACTIVE);
      } else {
        this.form = generateFormFromMetadata(
          ApiShrimpColorGrade.formMetadata(), this.typeElement as ApiShrimpColorGrade
        );
      }
    }

    if (this.type === 'shrimp-size-grades') {
      if (!this.update) {
        this.form = generateFormFromMetadata(
          ApiShrimpSizeGrade.formMetadata(),
          defaultEmptyObject(ApiShrimpSizeGrade.formMetadata()) as ApiShrimpSizeGrade
        );
        this.form.get('status')?.setValue(ApiShrimpSizeGrade.StatusEnum.ACTIVE);
      } else {
        this.form = generateFormFromMetadata(
          ApiShrimpSizeGrade.formMetadata(), this.typeElement as ApiShrimpSizeGrade
        );
      }
    }

    if (this.type === 'shrimp-process-types') {
      if (!this.update) {
        this.form = generateFormFromMetadata(
          ApiShrimpProcessType.formMetadata(),
          defaultEmptyObject(ApiShrimpProcessType.formMetadata()) as ApiShrimpProcessType
        );
        this.form.get('status')?.setValue(ApiShrimpProcessType.StatusEnum.ACTIVE);
      } else {
        this.form = generateFormFromMetadata(
          ApiShrimpProcessType.formMetadata(), this.typeElement as ApiShrimpProcessType
        );
      }
      this.updateShrimpCatalogTranslations();
    }

    if (this.type === 'shrimp-presentation-types') {
      if (!this.update) {
        this.form = generateFormFromMetadata(
          ApiShrimpPresentationType.formMetadata(),
          defaultEmptyObject(ApiShrimpPresentationType.formMetadata()) as ApiShrimpPresentationType
        );
        this.form.get('status')?.setValue(ApiShrimpPresentationType.StatusEnum.ACTIVE);
        this.form.get('category')?.setValue(ApiShrimpPresentationType.CategoryEnum.SHELLON);
      } else {
        this.form = generateFormFromMetadata(
          ApiShrimpPresentationType.formMetadata(), this.typeElement as ApiShrimpPresentationType
        );
      }
      this.updateShrimpPresentationTypeTranslations();
    }

    if (this.type === 'shrimp-quality-grades') {
      this.initSimpleShrimpCatalog('shrimp-quality-grades');
    }

    if (this.type === 'shrimp-treatment-types') {
      this.initSimpleShrimpCatalog('shrimp-treatment-types');
    }

    // If in edit mode and logged in as a Regional admin, disable the form (Regional admin cannot edit, only create)
    if (this.update && this.isRegionalAdmin) {
      this.form.disable();
    }
  }

  initSimpleShrimpCatalog(catalogType: string) {
    const defaultObj = {
      code: '',
      label: '',
      description: '',
      displayOrder: 1,
      status: 'ACTIVE',
      translations: []
    };
    if (!this.update) {
      this.form = new FormGroup({
        code: new FormControl(''),
        label: new FormControl(''),
        description: new FormControl(''),
        displayOrder: new FormControl(1),
        status: new FormControl('ACTIVE'),
        translations: new FormArray([])
      });
    } else {
      this.form = new FormGroup({
        id: new FormControl(this.typeElement?.id),
        code: new FormControl(this.typeElement?.code),
        label: new FormControl(this.typeElement?.label),
        description: new FormControl(this.typeElement?.description),
        displayOrder: new FormControl(this.typeElement?.displayOrder),
        status: new FormControl(this.typeElement?.status),
        translations: new FormArray([])
      });
    }
    this.updateSimpleShrimpCatalogTranslations();
  }

  updateSimpleShrimpCatalogTranslations() {
    const translations = this.form.get('translations') as FormArray;
    translations.clear();
    for (const lang of this.languages) {
      const existingTrans = this.typeElement?.translations?.find((t: any) => t.language === lang);
      translations.push(new FormGroup({
        language: new FormControl(lang),
        label: new FormControl(existingTrans?.label || ''),
        description: new FormControl(existingTrans?.description || '')
      }));
    }
  }

  async save() {
    if (this.type === 'processing-evidence-types' || this.type === 'processing-evidence-fields') {
      this.form.get('label').setValue(this.form.get('translations.0.label').value);
    }
    if (this.type === 'certification-types') {
      const labelValue = this.form.get('label')?.value;
      const translationsArray = this.form.get('translations') as FormArray;
      if (labelValue && translationsArray) {
        translationsArray.controls.forEach(ctrl => {
          const nameControl = ctrl.get('name');
          if (nameControl && !nameControl.value) {
            nameControl.setValue(labelValue);
          }
        });
      }
    }
    this.submitted = true;
    if (this.form.invalid) { return; }
    if (this.type === 'measurement-unit-types' && (!this.form.value.weight || this.form.value.weight.toString().trim() === '')) {
      this.form.get('weight').setValue(null);
    }
    const data = _.cloneDeep(this.form.value);
    Object.keys(data).forEach((key) => (data[key] == null) && delete data[key]);

    let res = null;

    if (this.type === 'facility-types') {
      // Ensure 'order' is sent as a number (not a string)
      if (data.hasOwnProperty('order')) {
        if (data.order === '' || data.order === undefined) {
          delete data.order; // optional field; omit if empty
        } else {
          const parsed = Number(data.order);
          if (!isNaN(parsed)) {
            data.order = parsed;
          } else {
            delete data.order; // avoid sending invalid value
          }
        }
      }
      res = await this.facilityTypeService.createOrUpdateFacilityType(data).pipe(take(1)).toPromise();
    }

    if (this.type === 'measurement-unit-types') {
      res = await this.measureUnitTypeService.createOrUpdateMeasurementUnitType(data).pipe(take(1)).toPromise();
    }

    if (this.type === 'processing-evidence-types') {
      res = await this.processingEvidenceTypeService.createOrUpdateProcessingEvidenceType(data).pipe(take(1)).toPromise();
    }

    if (this.type === 'processing-evidence-fields') {
      res = await this.processingEvidenceFieldService.createOrUpdateProcessingEvidenceField(data).pipe(take(1)).toPromise();
    }

    if (this.type === 'semi-products') {
      res = await this.semiProductService.createOrUpdateSemiProduct(data).pipe(take(1)).toPromise();
    }

    if (this.type === 'product-types') {
      if (data.id) {
        res = await this.productTypeService.updateProductType(data).pipe(take(1)).toPromise();
      } else {
        res = await this.productTypeService.createProductType(data).pipe(take(1)).toPromise();
      }
    }

    if (this.type === 'certification-types') {
      res = await this.certificationTypeService.createOrUpdateCertificationType(data).pipe(take(1)).toPromise();
    }

    if (this.type === 'shrimp-flavor-defects') {
      res = await this.shrimpFlavorDefectService.createOrUpdateShrimpFlavorDefect(data).pipe(take(1)).toPromise();
    }

    if (this.type === 'shrimp-color-grades') {
      res = await this.shrimpColorGradeService.createOrUpdateShrimpColorGrade(data).pipe(take(1)).toPromise();
    }

    if (this.type === 'shrimp-size-grades') {
      res = await this.shrimpSizeGradeService.createOrUpdateShrimpSizeGrade(data).pipe(take(1)).toPromise();
    }

    if (this.type === 'shrimp-process-types') {
      res = await this.shrimpProcessTypeService.createOrUpdateShrimpProcessType(data).pipe(take(1)).toPromise();
    }

    if (this.type === 'shrimp-presentation-types') {
      res = await this.shrimpPresentationTypeService.createOrUpdateShrimpPresentationType(data).pipe(take(1)).toPromise();
    }

    // TODO: Uncomment after regenerating API TypeScript
    // if (this.type === 'shrimp-quality-grades') {
    //   res = await this.shrimpQualityGradeService.createOrUpdateShrimpQualityGrade(data).pipe(take(1)).toPromise();
    // }
    // if (this.type === 'shrimp-treatment-types') {
    //   res = await this.shrimpTreatmentTypeService.createOrUpdateShrimpTreatmentType(data).pipe(take(1)).toPromise();
    // }

    if (res && res.status === 'OK') {
      if (this.saveCallback) { this.saveCallback(); }
      this.dismiss();
    }
  }

  get processingEvidenceTypeType() {
    const obj = {};
    obj['DOCUMENT'] = $localize`:@@processingEvidenceTypeType.document:Document`;
    obj['FIELD'] = $localize`:@@processingEvidenceTypeType.field:Field`;
    obj['CALCULATED'] = $localize`:@@processingEvidenceTypeType.calculated:Calculated`;
    return obj;
  }

  get processingEvidenceFieldType() {
    const obj = {};
    obj['STRING'] = $localize`:@@processingEvidenceFieldType.string:String`;
    obj['TEXT'] = $localize`:@@processingEvidenceFieldType.text:Text`;
    obj['NUMBER'] = $localize`:@@processingEvidenceFieldType.number:Number`;
    obj['INTEGER'] = $localize`:@@processingEvidenceFieldType.integer:Integer`;
    obj['DATE'] = $localize`:@@processingEvidenceFieldType.date:Date`;
    obj['OBJECT'] = $localize`:@@processingEvidenceFieldType.object:Object`;
    obj['PRICE'] = $localize`:@@processingEvidenceFieldType.price:Price`;
    obj['EXCHANGE_RATE'] = $localize`:@@processingEvidenceFieldType.exchange_rate:Exchange rate`;
    obj['TIMESTAMP'] = $localize`:@@processingEvidenceFieldType.timestamp:Timestamp`;
    return obj;
  }

  selectLanguage(lang: LanguageEnum) {
    this.selectedLanguage = lang;
  }

  finalizeForm() {
    if (!this.form.contains('translations')) {
      this.form.addControl('translations', new FormArray([]));
    }

    const translations = this.form.get('translations').value;
    this.form.removeControl('translations');
    this.form.addControl('translations', new FormArray([]));

    for (const lang of this.languages) {
      const translation = translations.find(t => t.language === lang);
      (this.form.get('translations') as FormArray).push(new FormGroup({
        name: new FormControl(translation ? translation.name : ''),
        description: new FormControl(translation ? translation.description : ''),
        language: new FormControl(lang)
      }));
    }
  }

  get languageEnum() {
    return LanguageEnum;
  }

  updateProcessingEvidenceFieldTranslations() {
    if (!this.form.contains('translations')) {
      this.form.addControl('translations', new FormArray([]));
    }

    const translations = this.form.get('translations').value;
    this.form.removeControl('translations');
    this.form.addControl('translations', new FormArray([]));

    for (const lang of this.languages) {
      const translation = translations.find(t => t.language === lang);
      (this.form.get('translations') as FormArray).push(new FormGroup({
        label: new FormControl(translation ? translation.label : ''),
        language: new FormControl(lang)
      }));
    }
  }

  updateProcessingEvidenceTypeTranslations() {
    if (!this.form.contains('translations')) {
      this.form.addControl('translations', new FormArray([]));
    }

    const translations = this.form.get('translations').value;
    this.form.removeControl('translations');
    this.form.addControl('translations', new FormArray([]));

    for (const lang of this.languages) {
      const translation = translations.find(t => t.language === lang);
      (this.form.get('translations') as FormArray).push(new FormGroup({
        label: new FormControl(translation ? translation.label : ''),
        language: new FormControl(lang)
      }));
    }
  }

  updateCertificationTypeTranslations() {
    if (!this.form.contains('translations')) {
      this.form.addControl('translations', new FormArray([]));
    }

    const translations = this.form.get('translations').value;
    this.form.removeControl('translations');
    this.form.addControl('translations', new FormArray([]));

    for (const lang of this.languages) {
      const translation = translations.find(t => t.language === lang);
      (this.form.get('translations') as FormArray).push(new FormGroup({
        name: new FormControl(translation ? translation.name : ''),
        language: new FormControl(lang)
      }));
    }
  }

  updateShrimpCatalogTranslations() {
    if (!this.form.contains('translations')) {
      this.form.addControl('translations', new FormArray([]));
    }

    const translations = this.form.get('translations').value || [];
    this.form.removeControl('translations');
    this.form.addControl('translations', new FormArray([]));

    for (const lang of this.languages) {
      const translation = translations.find(t => t.language === lang);
      (this.form.get('translations') as FormArray).push(new FormGroup({
        name: new FormControl(translation ? translation.name : ''),
        language: new FormControl(lang)
      }));
    }
  }

  isShrimpCatalogType(): boolean {
    return this.type === 'shrimp-flavor-defects' ||
           this.type === 'shrimp-color-grades' ||
           this.type === 'shrimp-size-grades' ||
           this.type === 'shrimp-process-types' ||
           this.type === 'shrimp-presentation-types' ||
           this.type === 'shrimp-quality-grades' ||
           this.type === 'shrimp-treatment-types';
  }

  shrimpCatalogHasTranslations(): boolean {
    return this.type === 'shrimp-flavor-defects' || 
           this.type === 'shrimp-process-types' || 
           this.type === 'shrimp-presentation-types' ||
           this.type === 'shrimp-quality-grades' ||
           this.type === 'shrimp-treatment-types';
  }

  updateShrimpPresentationTypeTranslations() {
    if (!this.form.contains('translations')) {
      this.form.addControl('translations', new FormArray([]));
    }

    const translations = this.form.get('translations').value || [];
    this.form.removeControl('translations');
    this.form.addControl('translations', new FormArray([]));

    for (const lang of this.languages) {
      const translation = translations.find(t => t.language === lang);
      (this.form.get('translations') as FormArray).push(new FormGroup({
        label: new FormControl(translation ? translation.label : ''),
        description: new FormControl(translation ? translation.description : ''),
        language: new FormControl(lang)
      }));
    }
  }

}
