import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { CountryService } from '../../shared-services/countries.service';
import { GlobalEventManagerService } from '../../core/global-event-manager.service';
import { FormGroup } from '@angular/forms';
import _ from 'lodash-es';
import { EnumSifrant } from '../../shared-services/enum-sifrant';
import { GoogleMap } from '@angular/google-maps';
import { environment } from '../../../environments/environment';
import { ApiPlotCoordinate } from '../../../api/model/apiPlotCoordinate';

declare const $localize: (messageParts: TemplateStringsArray, ...expressions: unknown[]) => string;

@Component({
  selector: 'app-location-form-new',
  templateUrl: './location-form-new.component.html',
  styleUrls: ['./location-form-new.component.scss']
})
export class LocationFormNewComponent implements OnInit {

  @Input()
  form!: FormGroup;

  @Input()
  submitted = false;

  @ViewChild(GoogleMap) set map(map: GoogleMap) {
    if (map) { this.gMap = map; this.fitBounds(); }
  }

  gMap: GoogleMap | null = null;
  isGoogleMapsLoaded = false;
  marker: { position: { lat: number; lng: number } } | null = null;
  mapId = `facility-location-map-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  plotCoordinates: ApiPlotCoordinate[] = [];
  bounds: google.maps.LatLngBounds | null = null;
  initialBounds: { lat: number; lng: number }[] = [];
  defaultCenter = {
    lat: -1.831239,
    lng: -78.183406
  };
  defaultZoom = 7;

  codebookStatus = EnumSifrant.fromObject(this.publiclyVisible);

  constructor(
      public countryCodes: CountryService,
      public globalEventsManager: GlobalEventManagerService
  ) { }

  ngOnInit(): void {
    this.globalEventsManager.loadedGoogleMapsEmitter.subscribe(loaded => {
      if (loaded) {
        this.isGoogleMapsLoaded = true;
        this.initializeMarker();
      }
    });

    this.initializePlotCoordinates();
  }

  get useMapsGoogle(): boolean {
    return environment.useMapsGoogle;
  }

  initializePlotCoordinates(): void {
    const latCtrl = this.form.get('facilityLocation.latitude');
    const lngCtrl = this.form.get('facilityLocation.longitude');
    const lat = latCtrl?.value;
    const lng = lngCtrl?.value;
    if (typeof lat === 'number' && typeof lng === 'number') {
      this.plotCoordinates = [{ latitude: lat, longitude: lng }];
    } else {
      this.plotCoordinates = [];
    }
  }

  onMapCoordinatesChange(coords: ApiPlotCoordinate[]): void {
    const latCtrl = this.form.get('facilityLocation.latitude');
    const lngCtrl = this.form.get('facilityLocation.longitude');
    if (!latCtrl || !lngCtrl) {
      return;
    }

    if (!coords || coords.length === 0) {
      this.plotCoordinates = [];
      latCtrl.setValue(null);
      lngCtrl.setValue(null);
    } else {
      const last = coords[coords.length - 1];
      this.plotCoordinates = [{ latitude: last.latitude, longitude: last.longitude }];
      latCtrl.setValue(last.latitude);
      lngCtrl.setValue(last.longitude);
    }

    latCtrl.markAsDirty();
    lngCtrl.markAsDirty();
  }

  initializeMarker() {
    const latCtrl = this.form.get('facilityLocation.latitude');
    const lngCtrl = this.form.get('facilityLocation.longitude');
    if (!latCtrl || !lngCtrl) {
      return;
    }

    const lat = latCtrl.value;
    const lng = lngCtrl.value;
    if (lat == null || lng == null) {
      return;
    }
    const tmp = {
      position: {
        lat,
        lng
      }
    };
    this.marker = tmp;
    this.initialBounds.push(tmp.position);
  }

  doShowVillage(): boolean {
    const countryCtrl = this.form.get('facilityLocation.address.country');
    return countryCtrl?.invalid
        || _.isEqual(countryCtrl?.value, {id: 184, code: 'RW', name: 'Rwanda'});
  }

  get publiclyVisible() {
    const obj: Record<string, string> = {};
    obj['true'] = $localize`:@@locationForm.publiclyVisible.yes:YES`;
    obj['false'] = $localize`:@@locationForm.publiclyVisible.no:NO`;
    return obj;
  }

  dblClick(event: google.maps.MouseEvent) {
    if (this.marker) {
      this.updateMarkerLocation(event.latLng.toJSON());
    } else {
      this.marker = {
        position: event.latLng.toJSON()
      };
      this.updateLatLng();
    }
  }

  removeMarker() {
    this.marker = null;
  }

  updateLatLng() {
    const latCtrl = this.form.get('facilityLocation.latitude');
    const lngCtrl = this.form.get('facilityLocation.longitude');
    if (!latCtrl || !lngCtrl) {
      return;
    }

    latCtrl.setValue(this.marker ? this.marker.position.lat : null);
    lngCtrl.setValue(this.marker ? this.marker.position.lng : null);

    latCtrl.markAsDirty();
    lngCtrl.markAsDirty();
  }

  updateMarkerLocation(location: google.maps.LatLngLiteral) {
    this.marker = {
      position: location
    };
    this.updateLatLng();
  }

  dragEnd(event: google.maps.MapMouseEvent) {
    const latLng = event.latLng;
    if (!latLng) {
      return;
    }
    this.updateMarkerLocation(latLng.toJSON());
  }

  fitBounds() {
    if (!this.gMap || !this.gMap.googleMap) {
      return;
    }
    
    this.bounds = new google.maps.LatLngBounds();
    for (const bound of this.initialBounds) {
      if (bound && bound.lat != null && bound.lng != null) {
        this.bounds.extend(bound);
      }
    }
    
    if (this.bounds.isEmpty()) {
      this.gMap.googleMap.setCenter(this.defaultCenter);
      this.gMap.googleMap.setZoom(this.defaultZoom);
      return;
    }
    
    const center = this.bounds.getCenter();
    if (!center) {
      this.gMap.googleMap.setCenter(this.defaultCenter);
      this.gMap.googleMap.setZoom(this.defaultZoom);
      return;
    }
    
    const offset = 0.02;
    const northEast = new google.maps.LatLng(
        center.lat() + offset,
        center.lng() + offset
    );
    const southWest = new google.maps.LatLng(
        center.lat() - offset,
        center.lng() - offset
    );
    const minBounds = new google.maps.LatLngBounds(southWest, northEast);
    this.gMap.fitBounds(this.bounds.union(minBounds));
  }

}
