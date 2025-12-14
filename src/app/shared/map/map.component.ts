import { AfterViewInit, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { environment } from '../../../environments/environment';
import * as mapboxgl from 'mapbox-gl';
import * as maplibregl from 'maplibre-gl';
import { Observable, Subscription } from 'rxjs';
import { ApiPlotCoordinate } from '../../../api/model/apiPlotCoordinate';
import { PlotCoordinatesManagerService } from '../../shared-services/plot-coordinates-manager.service';
import { PlotActionWrapper, PlotCoordinateAction } from '../../shared-services/plot-coordinate-action-enum';
import { ApiPlot } from '../../../api/model/apiPlot';
import { GlobalEventManagerService } from '../../core/global-event-manager.service';
import { Subject } from 'rxjs/internal/Subject';
import { CompanyControllerService } from '../../../api/api/companyController.service';
import { FormControl } from '@angular/forms';
import { DEFAULT_MAP_OVERLAYS, MapOverlayConfig } from './map-overlays.config';

declare const $localize: (messageParts: TemplateStringsArray, ...expressions: unknown[]) => string;

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {

  private map: any;
  private mapApi: any;
  private MAPBOX_STYLE_BASE_PATH = 'mapbox://styles/mapbox/';

  private MAPBOX_SOURCE_PREFIX = 'ina_plot_';

  @Input()
  mapId = 'map';

  @Input()
  plotCoordinateDeletionEvent?: Observable<PlotCoordinateAction>;

  @Input()
  plotCoordinatesManager?: PlotCoordinatesManagerService;

  @Input()
  showPlotSubject?: Subject<boolean>;

  @Input()
  editMode = false;

  @Input()
  plotCoordinates: Array<ApiPlotCoordinate> = [];  // used for adding/editing single plot

  @Input()
  plots: Array<ApiPlot> = [];  // used for viewing multiple plots

  @Input()
  pin?: ApiPlotCoordinate;

  @Input()
  farmerId?: number;

  @Input()
  initialLat?: number;

  @Input()
  initialLng?: number;

  @Output()
  plotCoordinatesChange = new EventEmitter<Array<ApiPlotCoordinate>>();

  @Output()
  plotGeoIdChange = new EventEmitter<ApiPlot>();
  
  @Output()
  geoIdOpenChange = new EventEmitter<string>();

  @Input()
  showPlotVisible = false;

  @Input()
  editable = false;

  @Input()
  singlePinMode = false;

  @Input()
  overlays: MapOverlayConfig[] = DEFAULT_MAP_OVERLAYS;
  
  subscriptions: Subscription = new Subscription();
  markers: any[] = [];

  private overlayLayerIds: Set<string> = new Set();
  private overlaySourceIds: Set<string> = new Set();
  private mapReady = false;
  private mapInitAttempts = 0;

  overlayVisibility: Record<string, boolean> = {};

  mapStyle: FormControl = new FormControl('satellite-streets-v12');
  
  constructor(private globalEventsManager: GlobalEventManagerService,
              private companyControllerService: CompanyControllerService) {
  }

  private get useLegacyMaps(): boolean {
    return environment.useMapsGoogle;
  }

  private getBaseStyle(value: string): any {
    if (this.useLegacyMaps) {
      return `${this.MAPBOX_STYLE_BASE_PATH}${value}`;
    }

    const maptilerKey = environment.maptilerApiKey;
    if (maptilerKey) {
      if (value === 'outdoors-v12') {
        return `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${maptilerKey}`;
      }

      return {
        version: 8,
        sources: {
          'satellite-tiles': {
            type: 'raster',
            url: `https://api.maptiler.com/tiles/satellite-v2/tiles.json?key=${maptilerKey}`,
            tileSize: 256,
            attribution: '© MapTiler'
          }
        },
        layers: [
          {
            id: 'satellite-tiles',
            type: 'raster',
            source: 'satellite-tiles',
            minzoom: 0,
            maxzoom: 22
          }
        ]
      };
    }

    // Fallback: use ESRI satellite for satellite view, OSM for outdoors
    if (value === 'satellite-streets-v12') {
      return {
        version: 8,
        sources: {
          'esri-satellite': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            attribution: '© Esri, Maxar, Earthstar Geographics'
          }
        },
        layers: [
          {
            id: 'esri-satellite',
            type: 'raster',
            source: 'esri-satellite',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      };
    }

    return {
      version: 8,
      sources: {
        'osm-tiles': {
          type: 'raster',
          tiles: [
            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors'
        }
      },
      layers: [
        {
          id: 'osm-tiles',
          type: 'raster',
          source: 'osm-tiles',
          minzoom: 0,
          maxzoom: 19
        }
      ]
    };
  }

  private addConfiguredOverlays(): void {
    if (!this.mapReady || !this.map || !this.overlays?.length) {
      return;
    }

    this.ensureOverlayVisibilityState();

    this.overlays.forEach(overlay => {
      if (!overlay?.tiles?.length) {
        return;
      }

      if (!this.map.getSource(overlay.sourceId)) {
        const rasterSource: any = {
          type: 'raster',
          tiles: overlay.tiles,
          tileSize: overlay.tileSize ?? 256,
          attribution: overlay.attribution
        };

        if (typeof overlay.minZoom === 'number') {
          rasterSource.minzoom = overlay.minZoom;
        }
        if (typeof overlay.maxZoom === 'number') {
          rasterSource.maxzoom = overlay.maxZoom;
        }
        this.map.addSource(overlay.sourceId, rasterSource);
        this.overlaySourceIds.add(overlay.sourceId);
      }

      if (!this.map.getLayer(overlay.layerId)) {
        const rasterLayer: any = {
          id: overlay.layerId,
          type: 'raster',
          source: overlay.sourceId,
          layout: {
            visibility: overlay.visibility ?? 'visible'
          },
          paint: {
            'raster-opacity': overlay.opacity ?? 0.7
          }
        };

        if (typeof overlay.minZoom === 'number') {
          rasterLayer.minzoom = overlay.minZoom;
        }
        if (typeof overlay.maxZoom === 'number') {
          rasterLayer.maxzoom = overlay.maxZoom;
        }

        this.map.addLayer(rasterLayer, overlay.beforeLayerId);
        this.overlayLayerIds.add(overlay.layerId);
      }

      this.applyOverlayVisibility(overlay);
    });
  }

  private removeConfiguredOverlays(): void {
    if (!this.map) {
      this.overlayLayerIds.clear();
      this.overlaySourceIds.clear();
      return;
    }

    this.overlayLayerIds.forEach(layerId => {
      if (this.map.getLayer(layerId)) {
        this.map.removeLayer(layerId);
      }
    });
    this.overlayLayerIds.clear();

    this.overlaySourceIds.forEach(sourceId => {
      if (this.map.getSource(sourceId)) {
        this.map.removeSource(sourceId);
      }
    });
    this.overlaySourceIds.clear();
  }

  private updateConfiguredOverlays(): void {
    if (!this.mapReady) {
      return;
    }

    this.removeConfiguredOverlays();
    this.addConfiguredOverlays();
  }

  private ensureOverlayVisibilityState(): void {
    if (!this.overlays?.length) {
      this.overlayVisibility = {};
      return;
    }

    const existingState = { ...this.overlayVisibility };
    this.overlayVisibility = {};
    this.overlays.forEach(overlay => {
      const isVisible = existingState[overlay.layerId];
      if (typeof isVisible === 'boolean') {
        this.overlayVisibility[overlay.layerId] = isVisible;
      } else {
        this.overlayVisibility[overlay.layerId] = overlay.visibility === 'visible';
      }
    });
  }

  private applyOverlayVisibility(overlay: MapOverlayConfig): void {
    const shouldShow = this.overlayVisibility[overlay.layerId] ?? overlay.visibility === 'visible';
    this.overlayVisibility[overlay.layerId] = shouldShow;

    if (this.map && this.map.getLayer(overlay.layerId)) {
      this.map.setLayoutProperty(overlay.layerId, 'visibility', shouldShow ? 'visible' : 'none');
    }
  }

  private mapRightClicked() {
    if (!this.editable || !this.editMode || !this.singlePinMode) {
      return;
    }

    this.clearAllMarkers();
    this.plotCoordinatesChange.emit(this.plotCoordinates);
  }

  private clearAllMarkers(): void {
    this.markers.forEach(marker => marker.remove());
    this.markers = [];
    this.plotCoordinates = [];
  }

  onOverlayToggle(overlay: MapOverlayConfig, visible: boolean): void {
    this.overlayVisibility[overlay.layerId] = visible;

    if (!this.mapReady) {
      return;
    }

    if (this.map.getLayer(overlay.layerId)) {
      this.map.setLayoutProperty(overlay.layerId, 'visibility', visible ? 'visible' : 'none');
    }
  }

  ngOnInit(): void {
    this.ensureOverlayVisibilityState();
  }

  ngAfterViewInit() {
    this.initializeMap();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.removeConfiguredOverlays();
    this.mapReady = false;
    if (this.map) {
      this.map.remove();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['overlays'] && !changes['overlays'].firstChange) {
      this.ensureOverlayVisibilityState();
      this.updateConfiguredOverlays();
    }
  }

  handlePlotCoordinateEvent(actionWrapper: PlotActionWrapper) {

    switch (actionWrapper.action) {
      case PlotCoordinateAction.DELETE_LAST_COORDINATE:
        this.undoLastPlotCoordinate();
        break;
      case PlotCoordinateAction.DELETE_PLOT:
        this.deletePlot(actionWrapper.plotId);
        break;
      case PlotCoordinateAction.ADD_COORDINATE_CURRENT_LOCATION:
        this.addPlotCoordinateCurrentLocation();
        break;
    }
  }

  getInitialMapExtremes(coordinates: Array<ApiPlotCoordinate>): [[number, number], [number, number]] {
    const valid = (coordinates || []).filter(c => typeof c?.latitude === 'number' && typeof c?.longitude === 'number');
    const first = valid[0];
    if (!first) {
      const centerLng = this.initialLng ?? 14.995463;
      const centerLat = this.initialLat ?? 46.151241;
      const offset = 0.02;
      return [[centerLng - offset, centerLat - offset], [centerLng + offset, centerLat + offset]];
    }

    let latMin = first.latitude as number;
    let latMax = first.latitude as number;
    let lngMin = first.longitude as number;
    let lngMax = first.longitude as number;

    valid.forEach(v => {
      const lat = v.latitude as number;
      const lng = v.longitude as number;
      if (latMax < lat) { latMax = lat; }
      if (latMin > lat) { latMin = lat; }
      if (lngMax < lng) { lngMax = lng; }
      if (lngMin > lng) { lngMin = lng; }
    });
    const offset = 0.02;
    return [[lngMin - offset, latMin - offset], [lngMax + offset, latMax + offset]];
  }

  setExistingPlots(plots: Array<ApiPlot>) {

    this.markers.forEach(marker => marker.remove());
    this.markers = [];
    this.plotCoordinates = [];

    const allPlotsCoordinates: ApiPlotCoordinate[] = [];
    plots.forEach(plot => {
      const coords = (plot as any)?.coordinates as ApiPlotCoordinate[] | undefined;
      if (coords?.length) {
        allPlotsCoordinates.push(...coords);
      }
    });

    if (allPlotsCoordinates.length > 0) {
      this.map.fitBounds(this.getInitialMapExtremes(allPlotsCoordinates));

      plots.forEach(plot => {
        const plotName = (plot as any)?.plotName as string | undefined;
        const coords = (plot as any)?.coordinates as ApiPlotCoordinate[] | undefined;
        if (plotName && coords?.length) {
          this.showPlot(plotName, this.getCoordinatesArray(coords));
          this.setPlotCenterMarker(plot);
        }
      });
    }
  }

  setExistingPlotCoordinates(coordinates: Array<ApiPlotCoordinate>) {
    if (this.markers.length > 0) {
      this.deletePlot();
    }
    (coordinates || [])
      .filter(v => typeof v?.latitude === 'number' && typeof v?.longitude === 'number')
      .forEach(v => this.placeMarkerOnMap(v.latitude as number, v.longitude as number));
    this.map.fitBounds(this.getInitialMapExtremes(this.plotCoordinates));
    this.plotCoordinatesChange.emit(this.plotCoordinates);
  }

  undoLastPlotCoordinate() {

    this.showPlotSubject?.next(false);

    const lastMarker = this.markers.pop();
    if (lastMarker) {
      lastMarker.remove();
    }
    this.plotCoordinates.pop();
    this.plotCoordinatesChange.emit(this.plotCoordinates);

    setTimeout(() => {
      this.showPlotSubject?.next(true);
    }, 200);
  }

  deletePlot(plotId?: string) {

    if (plotId) {
      this.hidePlot(plotId);
    } else {
      this.markers.forEach(m => m.remove());
      this.markers = [];
      this.plotCoordinates = [];
      this.plotCoordinatesChange.emit(this.plotCoordinates);
    }

    setTimeout(() => {
      this.showPlotSubject?.next(false);
    }, 200);
  }

  addPlotCoordinateCurrentLocation() {
    navigator.geolocation.getCurrentPosition(pos => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      this.placeMarkerOnMap(lat, lng);
      this.plotCoordinatesChange.emit(this.plotCoordinates);
    }, err => console.error(`Error while getting current location: ${err.code} ${err.message}`));
  }
  
  initializeMap(): void {

    if (this.editMode) {
      if (this.editable && (this.initialLat == null || this.initialLng == null)) {
        this.flyToCurrentPosition();
      }
    } else {
      if ((!this.plots || this.plots.length === 0) && (this.initialLat == null || this.initialLng == null)) {
        this.flyToCurrentPosition();
      }
    }
    this.buildMap();

    this.subscriptions.add(
      this.mapStyle.valueChanges.subscribe(value => {
        if (!this.map) {
          return;
        }

        this.removeConfiguredOverlays();
        this.map.setStyle(this.getBaseStyle(value));

        this.map.once('style.load', () => {
          this.addConfiguredOverlays();

          if (!this.editMode) {
            if (this.plots && this.plots.length > 0) {
              this.setExistingPlots(this.plots);
            } else if (this.pin?.latitude && this.pin?.longitude) {
              this.setPin(this.pin);
              this.map.fitBounds(this.getInitialMapExtremes(this.plotCoordinates));
            }
          } else {
            if (this.showPlotVisible) {
              this.togglePlot(true);
            }
          }
        });
      })
    );
  }

  flyToCurrentPosition(): void {
    navigator.geolocation.getCurrentPosition( position => {
      if (!this.map) {
        return;
      }
      this.map.flyTo({
        center: [position.coords.longitude, position.coords.latitude]
      });
    });
  }
  
  buildMap(): void {
    const container = document.getElementById(this.mapId);
    if (!container) {
      if (this.mapInitAttempts < 10) {
        this.mapInitAttempts++;
        setTimeout(() => this.buildMap(), 0);
      }
      return;
    }

    this.mapApi = this.useLegacyMaps ? mapboxgl : maplibregl;

    const options: any = {
      container: this.mapId, // id of div that holds the map
      style: this.getBaseStyle(this.mapStyle.value),
      zoom: 10,
      center: [this.initialLng ?? 14.995463, this.initialLat ?? 46.151241]
    };

    if (this.useLegacyMaps) {
      options.accessToken = environment.mapboxAccessToken;
      options.cooperativeGestures = true;
    }

    this.map = new this.mapApi.Map(options);
    this.mapInitAttempts = 0;

    this.map.dragRotate.disable();

    this.map.touchZoomRotate.disableRotation();

    if (this.singlePinMode) {
      this.map.doubleClickZoom.disable();
      this.map.on('dblclick', (e: any) => {
        if (typeof e?.preventDefault === 'function') {
          e.preventDefault();
        }
        this.mapClicked(e);
      });
    } else {
      this.map.on('click', (e: any) => this.mapClicked(e));
    }

    this.map.on('contextmenu', () => this.mapRightClicked());
    this.map.on('load', () => this.mapLoaded());
  }

  placeMarkerOnMap(lat: number, lng: number, plot?: ApiPlot, isPin?: boolean) {
    const idx = this.plotCoordinates.length;

    const el = document.createElement('div');
    el.classList.add('marker');
    el.innerHTML = isPin ? '<span></span>' : '<span><b>' + (idx + 1) + '</b></span>';

    if (plot) {
      const cropLabel = $localize`:@@map.modal.crop.title:Crop:`;
      const sizeLabel = $localize`:@@map.modal.size.title:Size:`;
      const geoIdLabel = $localize`:@@map.modal.geoId.title:Geo-ID:`;
      const openInGeoIdLabel = $localize`:@@map.modal.openInWhisp.title:Open in Whisp`;
      const certificationLabel = $localize`:@@map.modal.certification.title:Certification:`;
      let euOrganic = $localize`:@@map.modal.eu.organic.title:EU Organic`;
      const name = plot.plotName;
      let crop = plot.crop?.name;
      if (crop === undefined) {
        crop = '/';
      }
      let size: any = plot.size;
      if (size === undefined) {
        size = '/';
      }
      let unit = plot.unit;
      if (unit === undefined) {
        unit = '';
      }

      const buttonId = 'refresh-geo-btn-' + idx;
      let geoId = plot.geoId;
      if (geoId === undefined) {
        const refreshText = $localize`:@@map.modal.button.refresh.title:Refresh`;
        geoId = `<button id="${buttonId}" class="btn btn-sm popup-button">${refreshText}</button>`;
      } else {
        geoId = `<span class="geoid-content">${geoId}</span>`;
      }
      
      const buttonOpenGeoIdLink = 'open-whisp-a-' + idx;
      let openGeoIdLinkHtml = '';
      if (plot.geoId !== undefined) {
        openGeoIdLinkHtml = `<div class="pt-2">
                                <button id="${buttonOpenGeoIdLink}" class="btn btn-sm popup-button">${openInGeoIdLabel}</button>
                             </div>`;
      }
      
      const isCertified = plot.organicStartOfTransition !== undefined;
      if (!isCertified) {
        euOrganic = '/';
      }
      const popupHtml = `<div class="marker-popup">
                                  <div class="marker-popup-row-header">${name}</div>
                                  <div class="marker-popup-row">
                                    <div class="row-left">${cropLabel}</div>
                                    <div class="row-right"><b>${crop}</b></div>
                                  </div>
                                  <div class="marker-popup-row">
                                    <div class="row-left">${sizeLabel}</div>
                                    <div class="row-right"><b>${size} ${unit}</b></div>
                                  </div>
                                  <div class="marker-popup-row">
                                    <div class="row-left align-content-center geoid-label">${geoIdLabel}</div>
                                    <div class="row-right"><b>${geoId}</b>
                                      ${openGeoIdLinkHtml}
                                    </div>
                                  </div>
                                  <div class="marker-popup-row">
                                    <div class="row-left">${certificationLabel}</div>
                                    <div class="row-right"><b>${euOrganic}</b></div>
                                  </div>
                                </div>`;

      const popup = new this.mapApi.Popup(
        {
          anchor: 'top',
          offset: { top: [0, -10]},
          closeOnClick: true
        }
      ).setHTML(popupHtml);

      if (plot.geoId === undefined) {
        popup.on('open', () => {
          const btn = document.getElementById(buttonId);
          if (!btn) {
            return;
          }
          btn.addEventListener('click', () => {
            this.refreshGeoId(this.farmerId ?? (plot as any)['farmerId'], plot, buttonId);
          });
        });
      } else {
        popup.on('open', () => {
          const btn = document.getElementById(buttonOpenGeoIdLink);
          if (!btn) {
            return;
          }
          const geoId = plot.geoId;
          if (!geoId) {
            return;
          }
          btn.addEventListener('click', () => {
            this.emitGeoIdOpenInWhispClick(geoId);
          });
        });
      }

      const marker = new this.mapApi.Marker(el)
        .setDraggable(false)
        .setPopup(popup)
        .setLngLat([lng, lat])
        .addTo(this.map);

      this.markers.push(marker);

    } else {
      const marker = new this.mapApi.Marker(el)
        .setDraggable(true)
        .setLngLat([lng, lat])
        .addTo(this.map);

      this.markers.push(marker);
    }

    const coord: ApiPlotCoordinate = {
      latitude: lat,
      longitude: lng
    };

    this.plotCoordinates.push(coord);
  }

  refreshGeoId(farmerId: number | undefined, plot: ApiPlot, buttonId: string) {
    if (typeof farmerId !== 'number') {
      return;
    }

    this.companyControllerService.refreshGeoIDForUserCustomerPlot(farmerId, (plot as any).id).subscribe(res => {
      const data = res.data;

      if (data?.geoId) {
        const dataGeoId = data.geoId;
        const el = document.getElementById(buttonId);
        if (el) {
          el.outerHTML = `<div style="text-align: end;"><b>${dataGeoId}</b></div>`;
        }
      }

      if (data) {
        this.emitRefreshedData(data);
      }
    });
  }

  emitRefreshedData(plot?: ApiPlot) {
    if (!plot) {
      return;
    }
    this.plotGeoIdChange.emit(plot);
  }
  
  emitGeoIdOpenInWhispClick(geoId: string) {
    this.geoIdOpenChange.emit(geoId);
  }
  
  mapClicked(e: any) {

    if (!this.editable) {
      return;
    }

    if (this.editMode) {

      this.showPlotSubject?.next(false);

      const lng = e.lngLat.wrap()['lng'] as number;
      const lat = e.lngLat.wrap()['lat'] as number;

      if (this.singlePinMode) {
        this.clearAllMarkers();
      }

      this.placeMarkerOnMap(lat, lng);
      this.plotCoordinatesChange.emit(this.plotCoordinates);

      setTimeout(() => {
        this.showPlotSubject?.next(true);
      }, 200);
    }
  }

  async mapLoaded() {

    this.map.resize();

    this.mapReady = true;
    this.addConfiguredOverlays();

    if (this.plotCoordinatesManager) {
      this.subscriptions.add(this.plotCoordinatesManager.plotCoordinateAction$.subscribe(actionWrapper => {
        this.handlePlotCoordinateEvent(actionWrapper);
      }));
    }

    if (!this.editMode) {
      if (this.plots && this.plots.length > 0) {
        this.setExistingPlots(this.plots);
      } else if (this.pin?.latitude && this.pin?.longitude) {
        this.setPin(this.pin);
        this.map.fitBounds(this.getInitialMapExtremes(this.plotCoordinates));
      }
    } else {
      if (this.showPlotSubject) {
        this.subscriptions.add(this.showPlotSubject.asObservable().subscribe(show => {
          this.togglePlot(show);
          this.showPlotVisible = show;
        }));
        setTimeout(() => {
          this.showPlotSubject?.next(true);
        }, 200);
      }

      if (this.plotCoordinates && this.plotCoordinates.length > 0) {
        const plotCoordinates = [...this.plotCoordinates];
        this.plotCoordinates = [];
        this.setExistingPlotCoordinates(plotCoordinates);
      }

      if (!this.editable) {
        this.markers.forEach(marker => marker.setDraggable(false));
      }
    }
  }

  private setPin(pin: ApiPlotCoordinate) {
    this.markers.forEach(m => m.remove());
    this.markers = [];
    this.plotCoordinates = [];

    if (typeof pin?.latitude !== 'number' || typeof pin?.longitude !== 'number') {
      return;
    }

    this.placeMarkerOnMap(pin.latitude, pin.longitude, undefined, true);
    this.plotCoordinatesChange.emit(this.plotCoordinates);
  }

  showPlot(name: string, coordinates: number[][]) {

    if (!name) {
      return;
    }

    if (this.map.getLayer(name)) {
      return;
    }

    if (coordinates.length < 3) {
      return;
    }

    const sourceName = this.MAPBOX_SOURCE_PREFIX + name;

    this.map.addSource(sourceName, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            coordinates
          ]
        },
        properties: {
          name: 'polygon'
        }
      }
    });

    this.map.addLayer({
      id: name,
      type: 'fill',
      source: sourceName, 
      layout: {},
      paint: {
      'fill-color': '#999933',
      'fill-opacity': 0.5
      }
    });

    const borderId = name + 'Border';

    this.map.addLayer({
      id: borderId,
      type: 'line',
      source: sourceName,
      layout: {},
      paint: {
      'line-color': '#999933',
      'line-width': 1
      }
    });
  }

  hidePlot(plotName?: string) {

    if (!plotName) {

      if (this.map.getLayer('polygonPreview')) {
        this.map.removeLayer('polygonPreview');
      }
      if (this.map.getLayer('polygonPreviewBorder')) {
        this.map.removeLayer('polygonPreviewBorder');
      }

      if (this.map.getSource(this.MAPBOX_SOURCE_PREFIX + 'polygonPreview')) {
        this.map.removeSource(this.MAPBOX_SOURCE_PREFIX + 'polygonPreview');
      }

    } else {

      if (this.map.getLayer(plotName)) {
        this.map.removeLayer(plotName);
      }
      const borderName = plotName + 'Border';
      if (this.map.getLayer(borderName)) {
        this.map.removeLayer(borderName);
      }

      if (this.map.getSource(this.MAPBOX_SOURCE_PREFIX + plotName)) {
        this.map.removeSource(this.MAPBOX_SOURCE_PREFIX + plotName);
      }
    }
  }

  togglePlot(show: boolean) {
    if (show) {
      this.showPlot('polygonPreview', this.getCoordinatesArray(this.plotCoordinates));
    } else {
      this.hidePlot();
    }
  }

  getCoordinatesArray(plotCoordinates: ApiPlotCoordinate[]): number[][] {
    const coords: number[][] = [];
    (plotCoordinates || [])
      .filter(v => typeof v?.longitude === 'number' && typeof v?.latitude === 'number')
      .forEach(v => coords.push([v.longitude as number, v.latitude as number]));
    coords.push(coords[0]);
    return coords;
  }

  private setPlotCenterMarker(plot: ApiPlot) {
    const plotCoordinates: ApiPlotCoordinate[] = ((plot as any)?.coordinates as ApiPlotCoordinate[]) || [];
    if (!plotCoordinates.length) {
      return;
    }

    let lonCenter = plotCoordinates.reduce( (sum, element) => sum += (element.longitude as number) , 0);
    lonCenter = lonCenter / plotCoordinates.length;

    let latCenter = plotCoordinates.reduce( (sum, element) => sum += (element.latitude as number) , 0);
    latCenter = latCenter / plotCoordinates.length;

    this.placeMarkerOnMap(latCenter, lonCenter, plot);
  }

}
