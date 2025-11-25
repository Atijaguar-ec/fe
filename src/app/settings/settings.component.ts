import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { GlobalEventManagerService } from '../core/global-event-manager.service';
import { CommonControllerService } from 'src/api/api/commonController.service';
import { take } from 'rxjs/operators';
import { NgbModalImproved } from '../core/ngb-modal-improved/ngb-modal-improved.service';
import { Router } from '@angular/router';
import { TypeDetailModalComponent } from './type-detail-modal/type-detail-modal.component';
import { TabCommunicationService } from '../shared/tab-communication.service';
import { Subscription } from 'rxjs';
import { ComponentCanDeactivate } from '../shared-services/component-can-deactivate';
import { AuthorisedLayoutComponent } from '../layout/authorised/authorised-layout/authorised-layout.component';
import { AuthService } from '../core/auth.service';

@Component({
  template: ''
})
export class SettingsComponent extends ComponentCanDeactivate implements OnInit, OnDestroy, AfterViewInit {

  submitted = false;
  labelsHelperLink = new FormControl(null);
  unpublishedProductLabelText = new FormControl(null);

  allFacilities = 0;
  showedFacilities = 0;

  allMeasurements = 0;
  showedMeasurements = 0;

  allActions = 0;
  showedActions = 0;

  allProcEvidTypes = 0;
  showedProcEvidTypes = 0;

  allProcEvidFields = 0;
  showedProcEvidFields = 0;

  allProductTypes = 0;
  showedProductTypes = 0;

  allCertificationTypes = 0;
  showedCertificationTypes = 0;

  // Shrimp catalogs
  allShrimpFlavorDefects = 0;
  showedShrimpFlavorDefects = 0;
  allShrimpSizeGrades = 0;
  showedShrimpSizeGrades = 0;
  allShrimpColorGrades = 0;
  showedShrimpColorGrades = 0;
  allShrimpProcessTypes = 0;
  showedShrimpProcessTypes = 0;
  allShrimpPresentationTypes = 0;
  showedShrimpPresentationTypes = 0;
  allShrimpQualityGrades = 0;
  showedShrimpQualityGrades = 0;
  allShrimpTreatmentTypes = 0;
  showedShrimpTreatmentTypes = 0;

  parentReloadProcEvidTypes = false;
  parentReloadProcEvidFields = false;
  parentReloadFacility = false;
  parentReloadMeasure = false;
  parentReloadAction = false;
  parentReloadSemiProducts = false;
  parentReloadProductTypes = false;
  parentReloadCertificationTypes = false;

  // Shrimp catalogs reload flags
  parentReloadShrimpFlavorDefects = false;
  parentReloadShrimpSizeGrades = false;
  parentReloadShrimpColorGrades = false;
  parentReloadShrimpProcessTypes = false;
  parentReloadShrimpPresentationTypes = false;
  parentReloadShrimpQualityGrades = false;
  parentReloadShrimpTreatmentTypes = false;

  allSemiProducts = 0;
  showedSemiProducts = 0;

  // TABS ////////////////
  @ViewChild(AuthorisedLayoutComponent) authorizedLayout;
  rootTab = 0;
  tabs = [
    $localize`:@@settingsPage.tab0.title:Additional settings`,
    $localize`:@@settingsPage.tab1.title:Types`
  ];

  tabNames = [
    'additional',
    'types'
  ];

  selectedTab: Subscription;

  isRegionalAdmin = false;

  constructor(
    protected globalEventsManager: GlobalEventManagerService,
    protected commonController: CommonControllerService,
    protected modalService: NgbModalImproved,
    protected router: Router,
    protected authService: AuthService
  ) {
    super();
  }

  get tabCommunicationService(): TabCommunicationService {
    return this.authorizedLayout ? this.authorizedLayout.tabCommunicationService : null;
  }

  ngOnInit(): void {
    this.authService.userProfile$.pipe(take(1)).subscribe(up => {
      this.isRegionalAdmin = up?.role === 'REGIONAL_ADMIN';
      this.initializeLabelsHelperLink().then();
    });
  }

  ngAfterViewInit() {
    this.selectedTab = this.tabCommunicationService.subscribe(this.tabs, this.tabNames, this.rootTab, this.targetNavigate.bind(this));
  }

  targetNavigate(segment: string) {
    this.router.navigate(['settings', segment]).then();
  }

  public canDeactivate(): boolean {
    return (!this.labelsHelperLink || !this.labelsHelperLink.dirty) &&
      (!this.unpublishedProductLabelText || !this.unpublishedProductLabelText.dirty);
  }

  /////////////////////////
  onShow(event, type) {
    if (type === 'facility-types') { this.showedFacilities = event; }
    if (type === 'measurement-unit-types') { this.showedMeasurements = event; }
    if (type === 'action-types') { this.showedActions = event; }
    if (type === 'processing-evidence-types') { this.showedProcEvidTypes = event; }
    if (type === 'processing-evidence-fields') { this.showedProcEvidFields = event; }
    if (type === 'semi-products') { this.showedSemiProducts = event; }
    if (type === 'product-types') { this.showedProductTypes = event; }
    if (type === 'certification-types') { this.showedCertificationTypes = event; }
    // Shrimp catalogs
    if (type === 'shrimp-flavor-defects') { this.showedShrimpFlavorDefects = event; }
    if (type === 'shrimp-size-grades') { this.showedShrimpSizeGrades = event; }
    if (type === 'shrimp-color-grades') { this.showedShrimpColorGrades = event; }
    if (type === 'shrimp-process-types') { this.showedShrimpProcessTypes = event; }
    if (type === 'shrimp-presentation-types') { this.showedShrimpPresentationTypes = event; }
    if (type === 'shrimp-quality-grades') { this.showedShrimpQualityGrades = event; }
    if (type === 'shrimp-treatment-types') { this.showedShrimpTreatmentTypes = event; }
  }

  onCountAll(event, type) {
    if (type === 'facility-types') { this.allFacilities = event; }
    if (type === 'measurement-unit-types') { this.allMeasurements = event; }
    if (type === 'action-types') { this.allActions = event; }
    if (type === 'processing-evidence-types') { this.allProcEvidTypes = event; }
    if (type === 'processing-evidence-fields') { this.allProcEvidFields = event; }
    if (type === 'semi-products') { this.allSemiProducts = event; }
    if (type === 'product-types') { this.allProductTypes = event; }
    if (type === 'certification-types') { this.allCertificationTypes = event; }
    // Shrimp catalogs
    if (type === 'shrimp-flavor-defects') { this.allShrimpFlavorDefects = event; }
    if (type === 'shrimp-size-grades') { this.allShrimpSizeGrades = event; }
    if (type === 'shrimp-color-grades') { this.allShrimpColorGrades = event; }
    if (type === 'shrimp-process-types') { this.allShrimpProcessTypes = event; }
    if (type === 'shrimp-presentation-types') { this.allShrimpPresentationTypes = event; }
    if (type === 'shrimp-quality-grades') { this.allShrimpQualityGrades = event; }
    if (type === 'shrimp-treatment-types') { this.allShrimpTreatmentTypes = event; }
  }

  ngOnDestroy() {
    this.tabCommunicationService.announceTabTitles([]);
    if (this.selectedTab) { this.selectedTab.unsubscribe(); }
  }

  saveEnabled() {
    return (this.labelsHelperLink && this.labelsHelperLink.dirty) ||
        (!this.labelsHelperLink && this.labelsHelperLink.dirty) ||
        (this.unpublishedProductLabelText && this.unpublishedProductLabelText.dirty) ||
        (!this.unpublishedProductLabelText && this.unpublishedProductLabelText.dirty);
  }

  async save() {
    try {
      this.globalEventsManager.showLoading(true);
      const res = await this.commonController.updateGlobalSettings(
        this.globalEventsManager.globalSettingsKeys('UNPUBLISHED_PRODUCT_LABEL_TEXT'),
        { value: this.unpublishedProductLabelText.value, isPublic: true })
        .pipe(take(1)).toPromise();
      if (res && res.status === 'OK') {
        this.unpublishedProductLabelText.markAsPristine();
      }
    } catch (e) {

    } finally {
      this.globalEventsManager.showLoading(false);
    }
    try {
      this.globalEventsManager.showLoading(true);
      const res = await this.commonController.updateGlobalSettings(
        this.globalEventsManager.globalSettingsKeys('PRODUCT_LABELS_HELPER_LINK'),
        { value: this.labelsHelperLink.value, isPublic: false })
        .pipe(take(1)).toPromise();
      if (res && res.status === 'OK') {
        this.labelsHelperLink.markAsPristine();
      }
    } catch (e) {

    } finally {
      this.globalEventsManager.showLoading(false);
    }
  }

  async initializeLabelsHelperLink() {

    const resp0 = await this.commonController.getGlobalSettings(this.globalEventsManager.globalSettingsKeys('PRODUCT_LABELS_HELPER_LINK')).pipe(take(1)).toPromise();
    if (resp0 && resp0.data && resp0.data.value) { this.labelsHelperLink.setValue(resp0.data.value); }

    const resp1 = await this.commonController.getGlobalSettings(this.globalEventsManager.globalSettingsKeys('UNPUBLISHED_PRODUCT_LABEL_TEXT')).pipe(take(1)).toPromise();
    if (resp1 && resp1.data && resp1.data.value) { this.unpublishedProductLabelText.setValue(resp1.data.value); }
  }

  newType(type) {
    let addTitle = '';
    if (type === 'facility-types') { addTitle = $localize`:@@settingsPage.newFacilityType.addTitle:Add facility type`; }
    if (type === 'measurement-unit-types') { addTitle = $localize`:@@settingsPage.newMeasurementUnitType.addTitle:Add measurement unit type`; }
    if (type === 'action-types') { addTitle = $localize`:@@settingsPage.newActionType.addTitle:Add action type`; }
    if (type === 'processing-evidence-types') { addTitle = $localize`:@@settingsPage.newProcessingEvidenceType.addTitle:Add processing evidence type`; }
    if (type === 'processing-evidence-fields') { addTitle = $localize`:@@settingsPage.newProcessingEvidenceField.addTitle:Add processing evidence field`; }
    if (type === 'semi-products') { addTitle = $localize`:@@settingsPage.newSemiProducts.addTitle:Add new semi-product`; }
    if (type === 'product-types') { addTitle = $localize`:@@settingsPage.newProductTypes.addTitle:Add new product type`; }
    if (type === 'certification-types') { addTitle = $localize`:@@settingsPage.newCertificationType.addTitle:Add new certification type`; }
    // Shrimp catalogs
    if (type === 'shrimp-flavor-defects') { addTitle = $localize`:@@settingsPage.newShrimpFlavorDefect.addTitle:Agregar defecto de sabor`; }
    if (type === 'shrimp-size-grades') { addTitle = $localize`:@@settingsPage.newShrimpSizeGrade.addTitle:Agregar talla`; }
    if (type === 'shrimp-color-grades') { addTitle = $localize`:@@settingsPage.newShrimpColorGrade.addTitle:Agregar grado de color`; }
    if (type === 'shrimp-process-types') { addTitle = $localize`:@@settingsPage.newShrimpProcessType.addTitle:Agregar tipo de proceso`; }
    if (type === 'shrimp-presentation-types') { addTitle = $localize`:@@settingsPage.newShrimpPresentationType.addTitle:Agregar tipo de presentación`; }
    if (type === 'shrimp-quality-grades') { addTitle = $localize`:@@settingsPage.newShrimpQualityGrade.addTitle:Agregar grado de calidad`; }
    if (type === 'shrimp-treatment-types') { addTitle = $localize`:@@settingsPage.newShrimpTreatmentType.addTitle:Agregar tipo de tratamiento`; }

    this.modalService.open(TypeDetailModalComponent, {
      centered: true
    }, {
      title: addTitle,
      type,
      saveCallback: () => {
        if (type === 'facility-types') { this.parentReloadFacility = !this.parentReloadFacility; }
        if (type === 'measurement-unit-types') { this.parentReloadMeasure = !this.parentReloadMeasure; }
        if (type === 'action-types') { this.parentReloadAction = !this.parentReloadAction; }
        if (type === 'processing-evidence-types') { this.parentReloadProcEvidTypes = !this.parentReloadProcEvidTypes; }
        if (type === 'processing-evidence-fields') { this.parentReloadProcEvidFields = !this.parentReloadProcEvidFields; }
        if (type === 'semi-products') { this.parentReloadSemiProducts = !this.parentReloadSemiProducts; }
        if (type === 'product-types') { this.parentReloadProductTypes = !this.parentReloadProductTypes; }
        if (type === 'certification-types') { this.parentReloadCertificationTypes = !this.parentReloadCertificationTypes; }
        // Shrimp catalogs
        if (type === 'shrimp-flavor-defects') { this.parentReloadShrimpFlavorDefects = !this.parentReloadShrimpFlavorDefects; }
        if (type === 'shrimp-size-grades') { this.parentReloadShrimpSizeGrades = !this.parentReloadShrimpSizeGrades; }
        if (type === 'shrimp-color-grades') { this.parentReloadShrimpColorGrades = !this.parentReloadShrimpColorGrades; }
        if (type === 'shrimp-process-types') { this.parentReloadShrimpProcessTypes = !this.parentReloadShrimpProcessTypes; }
        if (type === 'shrimp-presentation-types') { this.parentReloadShrimpPresentationTypes = !this.parentReloadShrimpPresentationTypes; }
        if (type === 'shrimp-quality-grades') { this.parentReloadShrimpQualityGrades = !this.parentReloadShrimpQualityGrades; }
        if (type === 'shrimp-treatment-types') { this.parentReloadShrimpTreatmentTypes = !this.parentReloadShrimpTreatmentTypes; }
      }
    });
  }

}
