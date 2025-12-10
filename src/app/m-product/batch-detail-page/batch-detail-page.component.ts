import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { FormGroup, FormArray, FormControl } from '@angular/forms';
import { ApiProductLabelBatch } from 'src/api/model/apiProductLabelBatch';
import { dateISOString, generateFormFromMetadata } from 'src/shared/utils';
import { ApiProductLabelBatchValidationScheme } from '../batches-list/batch-edit-modal/validation';
import { ProductControllerService } from 'src/api/api/productController.service';
import { Location } from '@angular/common';
import { take } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { PrefillLocationsFromProductModalComponent } from './prefill-locations-from-product-modal/prefill-locations-from-product-modal.component';
import { GlobalEventManagerService } from 'src/app/core/global-event-manager.service';
import { Subscription } from 'rxjs';
import { NgbModalImproved } from 'src/app/core/ngb-modal-improved/ngb-modal-improved.service';
import {
  MapboxJourneyMapComponent,
  MapClickEvent,
  MarkerDragEvent,
  JourneyMarker
} from 'src/app/shared/mapbox-journey-map/mapbox-journey-map.component';


@Component({
  selector: 'app-batch-detail-page',
  templateUrl: './batch-detail-page.component.html',
  styleUrls: ['./batch-detail-page.component.scss']
})
export class BatchDetailPageComponent implements OnInit, OnDestroy {

  @ViewChild(MapboxJourneyMapComponent) mapComponent: MapboxJourneyMapComponent;

  constructor(
    private globalEventsManager: GlobalEventManagerService,
    private productController: ProductControllerService,
    private location: Location,
    private route: ActivatedRoute,
    private modalService: NgbModalImproved,
    private router: Router
  ) { }

  get mode() {
    const id = this.route.snapshot.params.batchId;
    return id == null ? 'create' : 'update';
  }

  get origCheck() {
    return this.batchDetailForm.get('traceOrigin').value == null || !this.batchDetailForm.get('traceOrigin').value ||
    (this.batchDetailForm.get('traceOrigin').value && this.batchDetailForm.get('locations').value.length > 0);
  }

  get changed() {
    return this.batchDetailForm.dirty;
  }

  // origin location helper methods
  get originLocations(): FormArray {
    return this.batchDetailForm.get('locations') as FormArray;
  }

  goToLink: string = this.router.url.substr(0, this.router.url.lastIndexOf('/'));

  faTrashAlt = faTrashAlt;

  // Mapbox map configuration
  readonly defaultCenter = { lat: -1.831239, lng: -78.183406 };
  readonly defaultZoom = 7;
  readonly markerColor = '#25265E';

  // Markers for display (converted from originLocations for MapboxJourneyMapComponent)
  mapMarkers: JourneyMarker[] = [];

  batch: ApiProductLabelBatch = {};

  batchDetailForm: FormGroup;
  submitted = false;
  rootImageUrl: string = environment.relativeImageUploadUrlAllSizes;
  title = '';

  subs: Subscription[] = [];

  public canDeactivate(): boolean {
    return !this.batchDetailForm || !(this.changed);
  }

  ngOnDestroy(): void {
    this.subs.forEach(sub => sub.unsubscribe());
  }

  ngOnInit(): void {
    if (this.mode === 'create') {
      this.newBatch();
      this.title = $localize`:@@batchDetail.title.new:Add batch`;
    } else {
      this.getBatch();
      this.title = $localize`:@@batchDetail.title.edit:Edit batch`;
    }
  }

  newBatch() {
    this.batchDetailForm = generateFormFromMetadata(ApiProductLabelBatch.formMetadata(), {}, ApiProductLabelBatchValidationScheme);
  }

  getBatch(): void {
    this.globalEventsManager.showLoading(true);
    const id = +this.route.snapshot.paramMap.get('batchId');
    const sub = this.productController.getProductLabelBatch(id)
      .subscribe(batch => {
        this.batch = batch.data;

        this.batchDetailForm = generateFormFromMetadata(ApiProductLabelBatch.formMetadata(), batch.data, ApiProductLabelBatchValidationScheme);
        this.initializeOriginLocations(this.originLocations.value);

        this.initializeMarkers(this.originLocations.value);

        this.globalEventsManager.showLoading(false);
      },
        error => {
          this.globalEventsManager.showLoading(false);
        });
    this.subs.push(sub);
  }


  goBack(): void {
    this.location.back();
  }


  async saveBatch(goBack = true) {
    this.submitted = true;
    if (this.batchDetailForm.invalid || !this.validateLocations()) {
      this.globalEventsManager.push({
        action: 'error',
        notificationType: 'error',
        title: $localize`:@@batchDetail.saveBatch.error.title:Error`,
        message: $localize`:@@batchDetail.saveBatch.error.message:Errors on page. Please check!`
      });
      return;
    }

    this.prepareRequest();
    const params = this.route.snapshot.params;
    const res = await this.productController.updateProductLabelBatch({ ...params, ...this.batchDetailForm.value }).pipe(take(1)).toPromise();
    if (res && res.status == 'OK' && goBack) {
      this.batchDetailForm.markAsPristine();
      this.goBack();
    }
  }

  async createBatch(goBack = true) {
    this.submitted = true;
    if (this.batchDetailForm.invalid || !this.validateLocations()) {
      this.globalEventsManager.push({
        action: 'error',
        notificationType: 'error',
        title: $localize`:@@batchDetail.createBatch.error.title:Error`,
        message: $localize`:@@batchDetail.createBatch.error.message:Errors on page. Please check!`
      });
      return;
    }

    this.prepareRequest();
    const res = await this.productController.createProductLabelBatch(this.batchDetailForm.value).pipe(take(1)).toPromise();
    if (res && res.status == 'OK' && goBack) {
      this.batchDetailForm.markAsPristine();
      this.goBack();
      this.globalEventsManager.showLoading(false);
    }

  }

  validateLocations() {
    return this.origCheck;
  }

  prepareRequest() {
    const pd = this.batchDetailForm.get('productionDate').value;
    if (pd != null) { this.batchDetailForm.get('productionDate').setValue(dateISOString(pd)); }
    const ed = this.batchDetailForm.get('expiryDate').value;
    if (ed != null) { this.batchDetailForm.get('expiryDate').setValue(dateISOString(ed)); }
    if (this.mode == 'create') { this.batchDetailForm.get('labelId').setValue(Number(this.route.snapshot.params.labelId)); }
  }

  onFileUpload(event: any) {
  }

  // ==================== MAP METHODS (Mapbox) ====================

  /**
   * Create a FormGroup for a location
   */
  createOrFillOriginLocationsItem(loc: any, create: boolean): FormGroup {
    return new FormGroup({
      latitude: new FormControl(create ? loc.lat : loc.latitude),
      longitude: new FormControl(create ? loc.lng : loc.longitude),
      pinName: new FormControl(create ? null : loc.pinName),
      numberOfFarmers: new FormControl(create ? null : loc.numberOfFarmers),
    });
  }

  /**
   * Initialize origin locations FormArray from data
   */
  initializeOriginLocations(locs: any[]): void {
    const tmp = new FormArray([]);
    for (const loc of locs) {
      tmp.push(this.createOrFillOriginLocationsItem(loc, false));
    }
    (this.batchDetailForm as FormGroup).setControl('locations', tmp);
    this.batchDetailForm.updateValueAndValidity();
  }

  /**
   * Convert origin locations to JourneyMarker array for the map
   */
  initializeMarkers(locs: any[]): void {
    this.mapMarkers = locs.map((loc, index) => ({
      lat: loc.latitude,
      lng: loc.longitude,
      label: loc.numberOfFarmers ? String(loc.numberOfFarmers) : String(index + 1),
      infoText: loc.pinName || '',
      draggable: true
    }));
  }

  /**
   * Refresh map markers from the form array
   */
  refreshMapMarkers(): void {
    this.mapMarkers = this.originLocations.controls.map((ctrl, index) => ({
      lat: ctrl.get('latitude')?.value,
      lng: ctrl.get('longitude')?.value,
      label: ctrl.get('numberOfFarmers')?.value ? String(ctrl.get('numberOfFarmers')?.value) : String(index + 1),
      infoText: ctrl.get('pinName')?.value || '',
      draggable: true
    }));
  }

  /**
   * Handle map double-click - add new location
   */
  onMapDblClick(event: MapClickEvent): void {
    this.originLocations.push(this.createOrFillOriginLocationsItem({ lat: event.lat, lng: event.lng }, true));
    this.refreshMapMarkers();
    this.batchDetailForm.markAsDirty();
  }

  /**
   * Handle marker right-click - remove location
   */
  onMarkerRightClick(event: { index: number }): void {
    this.removeOriginLocation(event.index);
  }

  /**
   * Handle marker drag end - update location coordinates
   */
  onMarkerDragEnd(event: MarkerDragEvent): void {
    const ctrl = this.originLocations.at(event.index);
    if (ctrl) {
      ctrl.get('latitude')?.setValue(event.lat);
      ctrl.get('longitude')?.setValue(event.lng);
      this.refreshMapMarkers();
      this.batchDetailForm.markAsDirty();
    }
  }

  /**
   * Remove a location by index
   */
  removeOriginLocation(index: number): void {
    this.originLocations.removeAt(index);
    this.refreshMapMarkers();
    this.batchDetailForm.markAsDirty();
  }

  /**
   * Handle pin name change - update marker info text
   */
  onKey(event: any, index: number): void {
    // The form is already updated via two-way binding
    // Just refresh markers to update the infoText
    this.refreshMapMarkers();
  }

  async prefillFromProduct() {
    const modalRef = this.modalService.open(PrefillLocationsFromProductModalComponent, { centered: true });
    Object.assign(modalRef.componentInstance, {
      title: $localize`:@@batchDetail.prefillFromProduct.title:Prefill locations from product?`,
      instructionsHtml: $localize`:@@batchDetail.prefillFromProduct.instructionsHtml:This action will replace all your current locations with product's locations`
    });
    const confiem = await modalRef.result;
    if (confiem) {
      const productId = +this.route.snapshot.paramMap.get('id')!;
      this.productController.getProduct(productId).pipe(take(1))
        .subscribe(resp => {
          if (resp.status === 'OK') {
            this.prefillLocations(resp.data.origin.locations);
          }
        });
    }
  }

  prefillLocations(prodLocations: any[]): void {
    this.initializeOriginLocations(prodLocations);
    this.initializeMarkers(prodLocations);
    this.batchDetailForm.markAsDirty();
    // Map will auto-fit bounds via autoFitBounds input
  }

}
