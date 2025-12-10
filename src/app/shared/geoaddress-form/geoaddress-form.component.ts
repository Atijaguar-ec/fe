import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import _ from 'lodash-es';
import { CountryService } from '../../shared-services/countries.service';
import { EnumSifrant } from '../../shared-services/enum-sifrant';
import { JourneyMarker, MapboxJourneyMapComponent, MapClickEvent, MarkerDragEvent } from '../mapbox-journey-map/mapbox-journey-map.component';

@Component({
  selector: 'app-geoaddress-form',
  templateUrl: './geoaddress-form.component.html',
  styleUrls: ['./geoaddress-form.component.scss']
})
export class GeoaddressFormComponent implements OnInit, OnDestroy {

  @Input()
  form: FormGroup;

  @Input()
  submitted = false;

  @ViewChild(MapboxJourneyMapComponent) mapComponent: MapboxJourneyMapComponent;

  // Mapbox configuration
  readonly defaultCenter = { lat: -1.831239, lng: -78.183406 };
  readonly defaultZoom = 7;
  readonly markerColor = '#25265E';

  // Single marker for location
  mapMarkers: JourneyMarker[] = [];

  subs: Subscription[] = [];
  codebookStatus = EnumSifrant.fromObject(this.publiclyVisible);

  constructor(
      public countryCodes: CountryService
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.form.get('village').setValidators([Validators.required]);
      this.form.get('cell').setValidators([Validators.required]);
      this.form.get('sector').setValidators([Validators.required]);
    });

    // Initialize marker from form values
    this.initializeMarker();

    const sub3 = this.form.get('country').valueChanges
        .subscribe(value => {
          // Honduras specifics
          if (this.showHondurasFields()) {
            this.enableValidationHonduras();
          } else {
            this.disableValidationHonduras();
            this.clearValuesHonduras();
          }
          this.updateHonduras();

          // Rwanda specifics
          if (this.showVillageCellSector()) {
            this.enableValidationRwanda();
          } else {
            this.disableValidationRwanda();
            this.clearValuesRwanda();
          }
          this.updateRwanda();

          if (this.showHondurasFields() || this.showVillageCellSector()) {
            this.disableValidationOther();
            this.clearValuesOther();
          } else {
            this.enableValidationOther();
          }
          this.updateOther();

        });
    this.subs.push(sub3);

    // Trigger valueChanges to set validators accordingly
    this.form.get('country').updateValueAndValidity({emitEvent: true});
  }

  ngOnDestroy(): void {
    this.subs.forEach(sub => { sub.unsubscribe(); });
  }

  showVillageCellSector() {
    return this.form.get('country').invalid ||
        _.isEqual(this.form.get('country').value, { id: 184, code: 'RW', name: 'Rwanda' });
  }

  showHondurasFields() {
    return this.form.get('country') && _.isEqual(this.form.get('country').value, { id: 99, code: 'HN', name: 'Honduras'});
  }

  enableValidationHonduras() {
    this.form.get('hondurasDepartment').setValidators([Validators.required]);
    this.form.get('hondurasFarm').setValidators(null);
    this.form.get('hondurasMunicipality').setValidators([Validators.required]);
    this.form.get('hondurasVillage').setValidators([Validators.required]);
  }

  disableValidationHonduras() {
    this.form.get('hondurasDepartment').setValidators(null);
    this.form.get('hondurasFarm').setValidators(null);
    this.form.get('hondurasMunicipality').setValidators(null);
    this.form.get('hondurasVillage').setValidators(null);
  }

  clearValuesHonduras() {
    this.form.get('hondurasDepartment').setValue(null);
    this.form.get('hondurasFarm').setValue(null);
    this.form.get('hondurasMunicipality').setValue(null);
    this.form.get('hondurasVillage').setValue(null);
  }

  updateHonduras() {
    this.form.get('hondurasDepartment').updateValueAndValidity();
    this.form.get('hondurasFarm').updateValueAndValidity();
    this.form.get('hondurasMunicipality').updateValueAndValidity();
    this.form.get('hondurasVillage').updateValueAndValidity();
  }

  enableValidationRwanda() {
    this.form.get('village').setValidators([Validators.required]);
    this.form.get('cell').setValidators([Validators.required]);
    this.form.get('sector').setValidators([Validators.required]);
  }

  disableValidationRwanda() {
    this.form.get('village').setValidators(null);
    this.form.get('cell').setValidators(null);
    this.form.get('sector').setValidators(null);
  }

  clearValuesRwanda() {
    this.form.get('village').setValue(null);
    this.form.get('cell').setValue(null);
    this.form.get('sector').setValue(null);
  }

  updateRwanda() {
    this.form.get('village').updateValueAndValidity();
    this.form.get('cell').updateValueAndValidity();
    this.form.get('sector').updateValueAndValidity();
  }

  enableValidationOther() {
    this.form.get('address').setValidators(null);
    this.form.get('city').setValidators(null);
    this.form.get('state').setValidators(null);
    this.form.get('zip').setValidators(null);
  }

  disableValidationOther() {
    this.form.get('address').setValidators(null);
    this.form.get('city').setValidators(null);
    this.form.get('state').setValidators(null);
    this.form.get('zip').setValidators(null);
  }

  clearValuesOther() {
    this.form.get('address').setValue(null);
    this.form.get('city').setValue(null);
    this.form.get('state').setValue(null);
    this.form.get('zip').setValue(null);
  }

  updateOther() {
    this.form.get('address').updateValueAndValidity();
    this.form.get('city').updateValueAndValidity();
    this.form.get('state').updateValueAndValidity();
    this.form.get('zip').updateValueAndValidity();
  }

  initializeMarker(): void {
    const latCtrl = this.form.get('latitude');
    const lngCtrl = this.form.get('longitude');
    if (!latCtrl || !lngCtrl) { return; }
    const lat = latCtrl.value;
    const lng = lngCtrl.value;
    if (lng == null || lat == null) {
      this.mapMarkers = [];
      return;
    }
    this.mapMarkers = [{
      lat,
      lng,
      draggable: true
    }];
  }




  /**
   * Update form with marker coordinates
   */
  updateLonLat(): void {
    const lat = this.mapMarkers.length > 0 ? this.mapMarkers[0].lat : null;
    const lng = this.mapMarkers.length > 0 ? this.mapMarkers[0].lng : null;

    this.form.get('latitude')?.setValue(lat);
    this.form.get('longitude')?.setValue(lng);
    this.form.get('latitude')?.markAsDirty();
    this.form.get('longitude')?.markAsDirty();
  }

  /**
   * Handle map double-click - add or update marker
   */
  onMapDblClick(event: MapClickEvent): void {
    this.mapMarkers = [{
      lat: event.lat,
      lng: event.lng,
      draggable: true
    }];
    this.updateLonLat();
  }

  /**
   * Handle marker drag end
   */
  onMarkerDragEnd(event: MarkerDragEvent): void {
    this.mapMarkers = [{
      lat: event.lat,
      lng: event.lng,
      draggable: true
    }];
    this.updateLonLat();
  }

  /**
   * Handle marker right-click - remove marker
   */
  onMarkerRightClick(): void {
    this.mapMarkers = [];
    this.updateLonLat();
  }


  get publiclyVisible() {
    const obj = {};
    obj['true'] = $localize`:@@locationForm.publiclyVisible.yes:YES`;
    obj['false'] = $localize`:@@locationForm.publiclyVisible.no:NO`;
    return obj;
  }

}
