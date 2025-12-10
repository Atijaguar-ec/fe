import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { CountryService } from '../../shared-services/countries.service';
import { FormGroup } from '@angular/forms';
import _ from 'lodash-es';
import { EnumSifrant } from '../../shared-services/enum-sifrant';
import { JourneyMarker, MapboxJourneyMapComponent, MapClickEvent, MarkerDragEvent } from '../mapbox-journey-map/mapbox-journey-map.component';

@Component({
  selector: 'app-location-form-new',
  templateUrl: './location-form-new.component.html',
  styleUrls: ['./location-form-new.component.scss']
})
export class LocationFormNewComponent implements OnInit {

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

  codebookStatus = EnumSifrant.fromObject(this.publiclyVisible);

  constructor(
      public countryCodes: CountryService
  ) { }

  ngOnInit(): void {
    this.initializeMarker();
  }

  initializeMarker(): void {
    const latCtrl = this.form.get('facilityLocation.latitude');
    const lngCtrl = this.form.get('facilityLocation.longitude');
    if (!latCtrl || !lngCtrl) {
      return;
    }
    const lat = latCtrl.value;
    const lng = lngCtrl.value;
    if (lat == null || lng == null) {
      this.mapMarkers = [];
      return;
    }
    this.mapMarkers = [{
      lat,
      lng,
      draggable: true
    }];
  }

  doShowVillage(): boolean {
    return this.form.get('facilityLocation.address.country').invalid
        || _.isEqual(this.form.get('facilityLocation.address.country').value, {id: 184, code: 'RW', name: 'Rwanda'});
  }

  get publiclyVisible() {
    const obj = {};
    obj['true'] = $localize`:@@locationForm.publiclyVisible.yes:YES`;
    obj['false'] = $localize`:@@locationForm.publiclyVisible.no:NO`;
    return obj;
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
    this.updateLatLng();
  }

  /**
   * Handle marker right-click - remove marker
   */
  onMarkerRightClick(): void {
    this.mapMarkers = [];
    this.updateLatLng();
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
    this.updateLatLng();
  }

  /**
   * Update form with marker coordinates
   */
  updateLatLng(): void {
    const lat = this.mapMarkers.length > 0 ? this.mapMarkers[0].lat : null;
    const lng = this.mapMarkers.length > 0 ? this.mapMarkers[0].lng : null;

    this.form.get('facilityLocation.latitude')?.setValue(lat);
    this.form.get('facilityLocation.longitude')?.setValue(lng);
    this.form.get('facilityLocation.latitude')?.markAsDirty();
    this.form.get('facilityLocation.longitude')?.markAsDirty();
  }

}
