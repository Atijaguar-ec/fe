import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import * as maplibregl from 'maplibre-gl';
import { FormArray } from '@angular/forms';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface JourneyMarker {
  lat: number;
  lng: number;
  label?: string;
  infoText?: string;
  draggable?: boolean;
  data?: any;
}

export interface MarkerDragEvent {
  index: number;
  lat: number;
  lng: number;
}

export interface MapClickEvent {
  lat: number;
  lng: number;
  originalEvent: maplibregl.MapMouseEvent;
}

export interface JourneyMapLatLng {
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-maplibre-journey-map',
  templateUrl: './maplibre-journey-map.component.html',
  styleUrls: ['./maplibre-journey-map.component.scss']
})
export class MaplibreJourneyMapComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  private map!: maplibregl.Map;
  private mapMarkers: maplibregl.Marker[] = [];
  private popups: maplibregl.Popup[] = [];
  private mapReady = false;
  private subscriptions = new Subscription();

  private readonly POLYLINE_SOURCE_ID = 'journey-polyline-source';
  private readonly POLYLINE_LAYER_ID = 'journey-polyline-layer';

  @Input() mapId = 'journey-map';
  @Input() height = '380px';
  @Input() width = '100%';

  @Input() centerLat = -1.831239;
  @Input() centerLng = -78.183406;
  @Input() defaultZoom = 7;

  @Input() markers: JourneyMarker[] = [];

  @Input() markersForm: FormArray | null = null;

  @Input() editMode = false;
  @Input() showPolyline = false;
  @Input() polylinePath: JourneyMapLatLng[] = [];
  @Input() polylineColor = '#25265E';
  @Input() polylineWidth = 2;
  @Input() polylineDashArray: number[] = [2, 2];

  @Input() showStyleSelector = false;
  @Input() autoFitBounds = true;
  @Input() boundsPadding = 50;
  @Input() disableDoubleClickZoom = true;

  @Input() markerColor = '#25265E';

  @Output() mapClick = new EventEmitter<MapClickEvent>();
  @Output() mapDblClick = new EventEmitter<MapClickEvent>();
  @Output() markerClick = new EventEmitter<{ index: number; marker: JourneyMarker }>();
  @Output() markerRightClick = new EventEmitter<{ index: number; marker: JourneyMarker }>();
  @Output() markerDragEnd = new EventEmitter<MarkerDragEvent>();
  @Output() mapReady$ = new EventEmitter<maplibregl.Map>();

  currentStyle: 'satellite' | 'outdoors' = 'satellite';

  ngOnInit(): void {
    if (this.markersForm) {
      this.subscriptions.add(
        this.markersForm.valueChanges.subscribe(() => {
          if (this.mapReady) {
            this.updateMarkersFromForm();
            this.updatePolyline();
          }
        })
      );
    }
  }

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.mapReady) {
      return;
    }

    if (changes['markers'] && !changes['markers'].firstChange) {
      this.updateMarkersFromList();
      this.updatePolyline();
      if (this.autoFitBounds) {
        this.fitBounds();
      }
    }

    if (changes['showPolyline'] && !changes['showPolyline'].firstChange) {
      this.updatePolyline();
    }

    if (changes['polylinePath'] && !changes['polylinePath'].firstChange) {
      this.updatePolyline();
      if (this.autoFitBounds) {
        this.fitBounds();
      }
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.clearMarkers();
    if (this.map) {
      this.map.remove();
    }
  }

  fitBounds(): void {
    if (!this.mapReady || !this.map) {
      return;
    }

    const coordinates = this.getFitCoordinates();
    if (coordinates.length === 0) {
      this.map.setCenter([this.centerLng, this.centerLat]);
      this.map.setZoom(this.defaultZoom);
      return;
    }

    if (coordinates.length === 1) {
      this.map.setCenter([coordinates[0].lng, coordinates[0].lat]);
      this.map.setZoom(this.defaultZoom);
      return;
    }

    const bounds = new maplibregl.LngLatBounds();
    coordinates.forEach(coord => bounds.extend([coord.lng, coord.lat]));

    const offset = 0.02;
    const center = bounds.getCenter();
    bounds.extend([center.lng - offset, center.lat - offset]);
    bounds.extend([center.lng + offset, center.lat + offset]);

    this.map.fitBounds(bounds, {
      padding: this.boundsPadding,
      maxZoom: 15
    });
  }

  setStyle(style: 'satellite' | 'outdoors'): void {
    if (!this.map) {
      return;
    }

    this.currentStyle = style;
    this.map.setStyle(this.createStyle(style));

    this.map.once('style.load', () => {
      this.updatePolyline();
    });
  }

  flyTo(lat: number, lng: number, zoom?: number): void {
    if (!this.map) {
      return;
    }

    this.map.flyTo({
      center: [lng, lat],
      zoom: zoom || this.defaultZoom
    });
  }

  getMap(): maplibregl.Map {
    return this.map;
  }

  private hasWebGLSupport(): boolean {
    try {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        return false;
      }
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch {
      return false;
    }
  }

  private initializeMap(): void {
    if (!this.hasWebGLSupport()) {
      return;
    }

    try {
      this.map = new maplibregl.Map({
        container: this.mapId,
        style: this.createStyle(this.currentStyle),
        zoom: this.defaultZoom,
        center: [this.centerLng, this.centerLat],
        doubleClickZoom: !this.disableDoubleClickZoom
      });
    } catch {
      return;
    }

    this.map.dragRotate.disable();
    this.map.touchZoomRotate.disableRotation();

    this.map.on('load', () => this.onMapLoaded());
    this.map.on('click', (e: maplibregl.MapMouseEvent) => this.onMapClick(e));
    this.map.on('dblclick', (e: maplibregl.MapMouseEvent) => this.onMapDblClick(e));
  }

  private onMapLoaded(): void {
    this.mapReady = true;

    if (this.markersForm) {
      this.updateMarkersFromForm();
    } else if (this.markers.length > 0) {
      this.updateMarkersFromList();
    }

    this.updatePolyline();

    if (this.autoFitBounds) {
      this.fitBounds();
    }

    this.mapReady$.emit(this.map);
  }

  private onMapClick(e: maplibregl.MapMouseEvent): void {
    this.mapClick.emit({
      lat: e.lngLat.lat,
      lng: e.lngLat.lng,
      originalEvent: e
    });
  }

  private onMapDblClick(e: maplibregl.MapMouseEvent): void {
    this.mapDblClick.emit({
      lat: e.lngLat.lat,
      lng: e.lngLat.lng,
      originalEvent: e
    });
  }

  private clearMarkers(): void {
    this.mapMarkers.forEach(m => m.remove());
    this.mapMarkers = [];
    this.popups.forEach(p => p.remove());
    this.popups = [];
  }

  private updateMarkersFromList(): void {
    this.clearMarkers();
    this.markers.forEach((marker, index) => {
      this.addMarkerToMap(marker, index);
    });
  }

  private updateMarkersFromForm(): void {
    this.clearMarkers();
    if (!this.markersForm) {
      return;
    }

    this.markersForm.controls.forEach((control, index) => {
      const lat = control.get('latitude')?.value;
      const lng = control.get('longitude')?.value;
      if (lat != null && lng != null) {
        const marker: JourneyMarker = {
          lat,
          lng,
          label: control.get('pinName')?.value || (index + 1).toString(),
          infoText: control.get('pinName')?.value,
          draggable: this.editMode
        };
        this.addMarkerToMap(marker, index);
      }
    });
  }

  private addMarkerToMap(markerData: JourneyMarker, index: number): void {
    const el = document.createElement('div');
    el.className = 'maplibre-journey-marker';
    el.style.backgroundColor = this.markerColor;
    el.style.width = '28px';
    el.style.height = '28px';
    el.style.borderRadius = '50%';
    el.style.border = '2px solid white';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.color = 'white';
    el.style.fontWeight = 'bold';
    el.style.fontSize = '12px';
    el.style.cursor = markerData.draggable ? 'grab' : 'pointer';
    el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

    if (markerData.label) {
      el.textContent = markerData.label.substring(0, 3);
    }

    const marker = new maplibregl.Marker({
      element: el,
      draggable: markerData.draggable || false
    })
      .setLngLat([markerData.lng, markerData.lat])
      .addTo(this.map);

    if (markerData.infoText) {
      const popup = new maplibregl.Popup({
        offset: 25,
        closeButton: false
      }).setText(markerData.infoText);

      marker.setPopup(popup);
      this.popups.push(popup);
    }

    el.addEventListener('click', (event: MouseEvent) => {
      event.stopPropagation();
      this.markerClick.emit({ index, marker: markerData });
    });

    el.addEventListener('contextmenu', (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      this.markerRightClick.emit({ index, marker: markerData });
    });

    if (markerData.draggable) {
      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        this.markerDragEnd.emit({
          index,
          lat: lngLat.lat,
          lng: lngLat.lng
        });
        this.updatePolylineFromCurrentMarkers();
      });
    }

    this.mapMarkers.push(marker);
  }

  private updatePolyline(): void {
    if (!this.map || !this.mapReady) {
      return;
    }

    if (this.map.getLayer(this.POLYLINE_LAYER_ID)) {
      this.map.removeLayer(this.POLYLINE_LAYER_ID);
    }
    if (this.map.getSource(this.POLYLINE_SOURCE_ID)) {
      this.map.removeSource(this.POLYLINE_SOURCE_ID);
    }

    if (!this.showPolyline) {
      return;
    }

    const coordinates = (this.polylinePath && this.polylinePath.length > 0) ? this.polylinePath : this.getMarkerCoordinates();
    if (coordinates.length < 2) {
      return;
    }

    this.map.addSource(this.POLYLINE_SOURCE_ID, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: coordinates.map(c => [c.lng, c.lat])
        }
      }
    });

    this.map.addLayer({
      id: this.POLYLINE_LAYER_ID,
      type: 'line',
      source: this.POLYLINE_SOURCE_ID,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': this.polylineColor,
        'line-width': this.polylineWidth,
        'line-dasharray': this.polylineDashArray.length > 0 ? this.polylineDashArray : [1]
      }
    });
  }

  private updatePolylineFromCurrentMarkers(): void {
    if (!this.showPolyline || !this.map || !this.mapReady) {
      return;
    }

    if (this.polylinePath && this.polylinePath.length > 0) {
      return;
    }

    const coordinates = this.mapMarkers.map(m => {
      const lngLat = m.getLngLat();
      return [lngLat.lng, lngLat.lat];
    });

    const source = this.map.getSource(this.POLYLINE_SOURCE_ID) as maplibregl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates
        }
      });
    }
  }

  private getMarkerCoordinates(): { lat: number; lng: number }[] {
    if (this.markersForm) {
      return this.markersForm.controls
        .filter(c => c.get('latitude')?.value != null && c.get('longitude')?.value != null)
        .map(c => {
          const lat = c.get('latitude')?.value as number;
          const lng = c.get('longitude')?.value as number;
          return { lat, lng };
        });
    }

    return this.markers.map(m => ({ lat: m.lat, lng: m.lng }));
  }

  private getFitCoordinates(): { lat: number; lng: number }[] {
    const coords: Array<{ lat: number; lng: number }> = [];

    if (this.polylinePath && this.polylinePath.length > 0) {
      this.polylinePath.forEach(p => {
        if (typeof p?.lat === 'number' && typeof p?.lng === 'number') {
          coords.push({ lat: p.lat, lng: p.lng });
        }
      });
    }

    this.getMarkerCoordinates().forEach(p => coords.push(p));

    return coords;
  }

  private createStyle(style: 'satellite' | 'outdoors'): any {
    const maptilerKey = environment.maptilerApiKey;
    if (maptilerKey) {
      if (style === 'outdoors') {
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
}
