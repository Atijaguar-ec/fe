import { Component, Input, OnInit } from '@angular/core';
import { CountryService } from '../../shared-services/countries.service';
import { UntypedFormGroup } from '@angular/forms';
import _ from 'lodash-es';
import { EnumSifrant } from '../../shared-services/enum-sifrant';
import { ApiPlotCoordinate } from '../../../api/model/apiPlotCoordinate';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-location-form-new',
  templateUrl: './location-form-new.component.html',
  styleUrls: ['./location-form-new.component.scss'],
  standalone: false,
})
export class LocationFormNewComponent implements OnInit {
  @Input()
  form: UntypedFormGroup;

  @Input()
  submitted = false;

  mapId = `facility-location-map-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  plotCoordinates: ApiPlotCoordinate[] = [];
  showPlotSubject = new Subject<boolean>();
  defaultCenter = {
    lat: 5.274054,
    lng: 21.514503,
  };

  codebookStatus = EnumSifrant.fromObject(this.publiclyVisible);

  constructor(
    public countryCodes: CountryService
  ) {}

  ngOnInit(): void {
    this.initializePlotCoordinates();
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

  doShowVillage(): boolean {
    return (
      this.form.get('facilityLocation.address.country').invalid ||
      _.isEqual(this.form.get('facilityLocation.address.country').value, {
        id: 184,
        code: 'RW',
        name: 'Rwanda',
      })
    );
  }

  get publiclyVisible() {
    const obj = {};
    obj['true'] = $localize`:@@locationForm.publiclyVisible.yes:YES`;
    obj['false'] = $localize`:@@locationForm.publiclyVisible.no:NO`;
    return obj;
  }
}

