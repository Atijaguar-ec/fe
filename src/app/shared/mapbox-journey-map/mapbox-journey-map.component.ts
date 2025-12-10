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
import { environment } from '../../../environments/environment';
import * as mapboxgl from 'mapbox-gl';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';

/**
 * Marker configuration for the Mapbox Journey Map
 */
export interface JourneyMarker {
  /** Latitude coordinate */
  lat: number;
  /** Longitude coordinate */
  lng: number;
  /** Optional label text displayed on the marker */
  label?: string;
  /** Optional info text for popup */
  infoText?: string;
  /** Whether the marker is draggable */
  draggable?: boolean;
  /** Custom data attached to the marker */
  data?: any;
}

/**
 * Event emitted when a marker position changes
 */
export interface MarkerDragEvent {
  index: number;
  lat: number;
  lng: number;
}

/**
 * Event emitted when the map is clicked
 */
export interface MapClickEvent {
  lat: number;
  lng: number;
  originalEvent: mapboxgl.MapMouseEvent;
}

/**
 * MapboxJourneyMapComponent - A reusable Mapbox map component for journeys, markers, and polylines.
 * 
 * This component replaces Google Maps functionality with Mapbox GL JS.
 * It supports:
 * - Simple markers with labels and popups
 * - Draggable markers with drag events
 * - Polylines (journey paths)
 * - Click, double-click, and right-click events
 * - Auto-fit bounds to markers
 * 
 * @example
 * <!-- Simple markers display -->
 * <app-mapbox-journey-map
 *   [markers]="facilityMarkers"
 *   [height]="'380px'"
 *   (markerClick)="onMarkerClick($event)">
 * </app-mapbox-journey-map>
 * 
 * @example
 * <!-- Editable journey with polyline -->
 * <app-mapbox-journey-map
 *   [markersForm]="journeyForm"
 *   [showPolyline]="true"
 *   [editMode]="true"
 *   (mapClick)="addMarker($event)"
 *   (markerRightClick)="removeMarker($event)"
 *   (markerDragEnd)="updatePosition($event)">
 * </app-mapbox-journey-map>
 */
@Component({
  selector: 'app-mapbox-journey-map',
  templateUrl: './mapbox-journey-map.component.html',
  styleUrls: ['./mapbox-journey-map.component.scss']
})
export class MapboxJourneyMapComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {

  private map: mapboxgl.Map;
  private markers: mapboxgl.Marker[] = [];
  private popups: mapboxgl.Popup[] = [];
  private mapReady = false;
  private subscriptions = new Subscription();

  // Map style options
  private readonly MAPBOX_STYLE_SATELLITE = 'mapbox://styles/mapbox/satellite-streets-v12';
  private readonly MAPBOX_STYLE_OUTDOORS = 'mapbox://styles/mapbox/outdoors-v12';

  // Polyline layer IDs
  private readonly POLYLINE_SOURCE_ID = 'journey-polyline-source';
  private readonly POLYLINE_LAYER_ID = 'journey-polyline-layer';

  // ==================== INPUTS ====================

  /** Unique ID for the map container (required if multiple maps on same page) */
  @Input() mapId = 'journey-map';

  /** Map height (CSS value) */
  @Input() height = '380px';

  /** Map width (CSS value) */
  @Input() width = '100%';

  /** Initial center latitude */
  @Input() centerLat = -1.831239;

  /** Initial center longitude */
  @Input() centerLng = -78.183406;

  /** Initial zoom level */
  @Input() defaultZoom = 7;

  /** Array of markers to display (static mode) */
  @Input() markerList: JourneyMarker[] = [];

  /** FormArray of markers (reactive form mode) - each control must have 'latitude' and 'longitude' */
  @Input() markersForm: FormArray | null = null;

  /** Enable edit mode (allows adding/removing/dragging markers) */
  @Input() editMode = false;

  /** Show polyline connecting markers */
  @Input() showPolyline = false;

  /** Polyline color */
  @Input() polylineColor = '#25265E';

  /** Polyline width */
  @Input() polylineWidth = 2;

  /** Polyline dash pattern (empty for solid line) */
  @Input() polylineDashArray: number[] = [2, 2];

  /** Show style selector (satellite/outdoors) */
  @Input() showStyleSelector = false;

  /** Auto-fit bounds to markers on load */
  @Input() autoFitBounds = true;

  /** Bounds padding in pixels */
  @Input() boundsPadding = 50;

  /** Disable double-click zoom */
  @Input() disableDoubleClickZoom = true;

  /** Marker color */
  @Input() markerColor = '#25265E';

  // ==================== OUTPUTS ====================

  /** Emitted when map is clicked */
  @Output() mapClick = new EventEmitter<MapClickEvent>();

  /** Emitted when map is double-clicked */
  @Output() mapDblClick = new EventEmitter<MapClickEvent>();

  /** Emitted when a marker is clicked */
  @Output() markerClick = new EventEmitter<{ index: number; marker: JourneyMarker }>();

  /** Emitted when a marker is right-clicked */
  @Output() markerRightClick = new EventEmitter<{ index: number; marker: JourneyMarker }>();

  /** Emitted when a marker drag ends */
  @Output() markerDragEnd = new EventEmitter<MarkerDragEvent>();

  /** Emitted when the map finishes loading */
  @Output() mapReady$ = new EventEmitter<mapboxgl.Map>();

  // Current style
  currentStyle: 'satellite' | 'outdoors' = 'satellite';

  constructor() {}

  ngOnInit(): void {
    // Subscribe to form changes if markersForm is provided
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
    if (!this.mapReady) return;

    if (changes['markerList'] && !changes['markerList'].firstChange) {
      this.updateMarkersFromList();
      this.updatePolyline();
      if (this.autoFitBounds) {
        this.fitBounds();
      }
    }

    if (changes['showPolyline']) {
      this.updatePolyline();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.clearMarkers();
    if (this.map) {
      this.map.remove();
    }
  }

  // ==================== PUBLIC METHODS ====================

  /**
   * Programmatically fit the map bounds to all markers
   */
  fitBounds(): void {
    if (!this.mapReady || !this.map) return;

    const coordinates = this.getMarkerCoordinates();
    if (coordinates.length === 0) {
      this.map.setCenter([this.centerLng, this.centerLat]);
      this.map.setZoom(this.defaultZoom);
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();
    coordinates.forEach(coord => bounds.extend([coord.lng, coord.lat]));

    if (coordinates.length === 1) {
      // Single marker - center on it with default zoom
      this.map.setCenter([coordinates[0].lng, coordinates[0].lat]);
      this.map.setZoom(this.defaultZoom);
    } else {
      // Multiple markers - fit bounds with padding
      const offset = 0.02;
      const center = bounds.getCenter();
      bounds.extend([center.lng - offset, center.lat - offset]);
      bounds.extend([center.lng + offset, center.lat + offset]);
      
      this.map.fitBounds(bounds, {
        padding: this.boundsPadding,
        maxZoom: 15
      });
    }
  }

  /**
   * Change the map style
   */
  setStyle(style: 'satellite' | 'outdoors'): void {
    this.currentStyle = style;
    const styleUrl = style === 'satellite' ? this.MAPBOX_STYLE_SATELLITE : this.MAPBOX_STYLE_OUTDOORS;
    this.map.setStyle(styleUrl);

    // Re-add polyline after style change
    this.map.once('style.load', () => {
      this.updatePolyline();
    });
  }

  /**
   * Fly to a specific location
   */
  flyTo(lat: number, lng: number, zoom?: number): void {
    if (!this.map) return;
    this.map.flyTo({
      center: [lng, lat],
      zoom: zoom || this.defaultZoom
    });
  }

  /**
   * Get the Mapbox map instance
   */
  getMap(): mapboxgl.Map {
    return this.map;
  }

  // ==================== PRIVATE METHODS ====================

  private initializeMap(): void {
    this.map = new mapboxgl.Map({
      accessToken: environment.mapboxAccessToken,
      container: this.mapId,
      style: this.MAPBOX_STYLE_SATELLITE,
      zoom: this.defaultZoom,
      center: [this.centerLng, this.centerLat],
      doubleClickZoom: !this.disableDoubleClickZoom,
      cooperativeGestures: true
    });

    // Disable rotation
    this.map.dragRotate.disable();
    this.map.touchZoomRotate.disableRotation();

    // Map events
    this.map.on('load', () => this.onMapLoaded());
    this.map.on('click', (e: mapboxgl.MapMouseEvent) => this.onMapClick(e));
    this.map.on('dblclick', (e: mapboxgl.MapMouseEvent) => this.onMapDblClick(e));
  }

  private onMapLoaded(): void {
    this.mapReady = true;

    // Initialize markers
    if (this.markersForm) {
      this.updateMarkersFromForm();
    } else if (this.markerList.length > 0) {
      this.updateMarkersFromList();
    }

    // Initialize polyline
    this.updatePolyline();

    // Fit bounds if enabled
    if (this.autoFitBounds) {
      this.fitBounds();
    }

    // Emit ready event
    this.mapReady$.emit(this.map);
  }

  private onMapClick(e: mapboxgl.MapMouseEvent): void {
    this.mapClick.emit({
      lat: e.lngLat.lat,
      lng: e.lngLat.lng,
      originalEvent: e
    });
  }

  private onMapDblClick(e: mapboxgl.MapMouseEvent): void {
    this.mapDblClick.emit({
      lat: e.lngLat.lat,
      lng: e.lngLat.lng,
      originalEvent: e
    });
  }

  private clearMarkers(): void {
    this.markers.forEach(m => m.remove());
    this.markers = [];
    this.popups.forEach(p => p.remove());
    this.popups = [];
  }

  private updateMarkersFromList(): void {
    this.clearMarkers();
    this.markerList.forEach((marker, index) => {
      this.addMarkerToMap(marker, index);
    });
  }

  private updateMarkersFromForm(): void {
    this.clearMarkers();
    if (!this.markersForm) return;

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
    // Create marker element
    const el = document.createElement('div');
    el.className = 'mapbox-journey-marker';
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

    // Create Mapbox marker
    const marker = new mapboxgl.Marker({
      element: el,
      draggable: markerData.draggable || false
    })
      .setLngLat([markerData.lng, markerData.lat])
      .addTo(this.map);

    // Add popup if infoText is provided
    if (markerData.infoText) {
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false
      }).setText(markerData.infoText);
      
      marker.setPopup(popup);
      this.popups.push(popup);
    }

    // Marker events
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
        // Update polyline after drag
        this.updatePolylineFromCurrentMarkers();
      });
    }

    this.markers.push(marker);
  }

  private updatePolyline(): void {
    if (!this.map || !this.mapReady) return;

    // Remove existing polyline
    if (this.map.getLayer(this.POLYLINE_LAYER_ID)) {
      this.map.removeLayer(this.POLYLINE_LAYER_ID);
    }
    if (this.map.getSource(this.POLYLINE_SOURCE_ID)) {
      this.map.removeSource(this.POLYLINE_SOURCE_ID);
    }

    if (!this.showPolyline) return;

    const coordinates = this.getMarkerCoordinates();
    if (coordinates.length < 2) return;

    // Add polyline source
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

    // Add polyline layer
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
    if (!this.showPolyline || !this.map || !this.mapReady) return;

    const coordinates = this.markers.map(m => {
      const lngLat = m.getLngLat();
      return [lngLat.lng, lngLat.lat];
    });

    const source = this.map.getSource(this.POLYLINE_SOURCE_ID) as mapboxgl.GeoJSONSource;
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
        .map(c => ({
          lat: c.get('latitude')!.value,
          lng: c.get('longitude')!.value
        }));
    }
    return this.markerList.map(m => ({ lat: m.lat, lng: m.lng }));
  }
}
