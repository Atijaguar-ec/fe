import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import {FormArray, FormControl, FormGroup} from '@angular/forms';
import {ApiProductType} from '../../../../api/model/apiProductType';
import {CompanyProductTypesService} from '../../../shared-services/company-product-types.service';
import {ApiPlotCoordinate} from '../../../../api/model/apiPlotCoordinate';
import {PlotCoordinatesManagerService} from '../../../shared-services/plot-coordinates-manager.service';
import {ApiPlot} from '../../../../api/model/apiPlot';
import {ListEditorManager} from '../../../shared/list-editor/list-editor-manager';
import {defaultEmptyObject} from '../../../../shared/utils';
import {Subject} from 'rxjs/internal/Subject';
import {ApiPlotValidationScheme} from './validation';
import {NgbModalImproved} from '../../../core/ngb-modal-improved/ngb-modal-improved.service';
import {
  OpenPlotDetailsExternallyModalComponent
} from '../../company-farmers/open-plot-details-externally-modal/open-plot-details-externally-modal.component';

@Component({
  selector: 'app-plots-form',
  templateUrl: './plots-form.component.html',
  styleUrls: ['./plots-form.component.scss']
})
export class PlotsFormComponent implements OnInit {

  plotCoordinates: Array<ApiPlotCoordinate> = [];

  plots: Array<ApiPlot> = [];
  productTypes: Array<ApiProductType> = [];
  plotCoordinatesManager: PlotCoordinatesManagerService = new PlotCoordinatesManagerService();

  mapId = 'map-viewer';

  pin?: ApiPlotCoordinate;
  plotsListManager: any;

  drawPlotSubject = new Subject<boolean>();

  initialLat?: number;
  initialLng?: number;

  @Input()
  productTypesCodebook!: CompanyProductTypesService;

  @Input()
  form!: FormGroup; // contains the plots control

  @Input()
  submitted = false;

  @Input()
  updateMode = false;

  @Output()
  uploadGeoData = new EventEmitter<void>();

  @Output()
  exportGeoData = new EventEmitter<void>();

  @Output()
  savePlot = new EventEmitter<void>();

  @Output()
  deletePlot = new EventEmitter<void>();

  static ApiPlotCreateEmptyObject(): ApiPlot {
    const obj = ApiPlot.formMetadata();
    return defaultEmptyObject(obj) as ApiPlot;
  }

  static ApiPlotEmptyObjectFormFactory(): () => FormControl {
    return () => {
      return new FormControl(PlotsFormComponent.ApiPlotCreateEmptyObject(), ApiPlotValidationScheme.validators);
    };
  }
  
  constructor(private modalService: NgbModalImproved) {
  }

  ngOnInit(): void {

    const plotsCtrl = this.form.get('plots');
    this.plots = (plotsCtrl?.value as Array<ApiPlot>) ?? [];

    const formId = this.form.get('id')?.value;
    this.mapId = `map-viewer-${formId ?? 'new'}`;

    this.pin = {
      latitude: this.form.get('location.latitude')?.value,
      longitude: this.form.get('location.longitude')?.value,
    };

    this.initialLat = this.form.get('location')?.get('address')?.get('country')?.value?.latitude;
    this.initialLng = this.form.get('location')?.get('address')?.get('country')?.value?.longitude;

    this.initializeListManager();
    this.initializeMarker();
  }

  initializeMarker() {

    if (!this.form.get('location.latitude') || !this.form.get('location.longitude')) {
      return;
    }

    const lat = this.form.get('location.latitude')?.value;
    const lng = this.form.get('location.longitude')?.value;
    if (lng == null || lat == null) {
      return;
    }

    this.pin = {
      latitude: lat,
      longitude: lng
    };
  }

  initializeListManager() {
    const plotsControl = this.form.get('plots');
    if (!(plotsControl instanceof FormArray)) {
      return;
    }

    this.plotsListManager = new ListEditorManager<ApiPlot>(
      plotsControl,
      PlotsFormComponent.ApiPlotEmptyObjectFormFactory(),
      ApiPlotValidationScheme
    );
  }

  updateLonLat(coordinates: Array<ApiPlotCoordinate>) {
    const latCtrl = this.form.get('location.latitude');
    const lngCtrl = this.form.get('location.longitude');
    if (!latCtrl || !lngCtrl) {
      return;
    }

    if (coordinates) {
      latCtrl.setValue(coordinates[0].latitude);
      lngCtrl.setValue(coordinates[0].longitude);
    } else {
      latCtrl.setValue(null);
      lngCtrl.setValue(null);
    }
    latCtrl.markAsDirty();
    lngCtrl.markAsDirty();
  }

  drawPlot() {
    this.drawPlotSubject.next(true);
  }

  updateFormGeoId(apiPlot: ApiPlot) {
    const plotsCtrl = this.form.get('plots');
    if (!plotsCtrl) {
      return;
    }

    const currentPlotsValue = (plotsCtrl.value as Array<ApiPlot>) ?? [];
    currentPlotsValue.forEach(plot => {
      if (plot.id === apiPlot.id) {
        plot.geoId = apiPlot.geoId;
      }
    });
    // update
    plotsCtrl.setValue(currentPlotsValue);
  }

  openGeoIdWhisp($geoId: string) {
    const modalRef = this.modalService.open(OpenPlotDetailsExternallyModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'xxl',
      scrollable: true
    });
    Object.assign(modalRef.componentInstance, {
      geoId: $geoId
    });
    modalRef.result.then();
  }
}
