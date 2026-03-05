import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { GoogleMap } from '@angular/google-maps';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GlobalEventManagerService } from '../../core/global-event-manager.service';

export interface JourneyMapLatLng {
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-journey-map',
  templateUrl: './journey-map.component.html',
  styleUrls: ['./journey-map.component.scss']
})
export class JourneyMapComponent implements OnInit, OnDestroy {
  @Input() mapId = 'journey-map';
  @Input() height = '380px';
  @Input() width = '100%';

  @Input() markers: JourneyMapLatLng[] = [];
  @Input() polylinePath: JourneyMapLatLng[] = [];

  @Input() defaultCenter: JourneyMapLatLng = { lat: -1.831239, lng: -78.183406 };
  @Input() defaultZoom = 2;
  @Input() boundsPadding = 50;
  @Input() showStyleSelector = false;

  useGoogle = environment.useMapsGoogle;
  googleMapsLoaded = false;

  googleMarkerOptions: any;
  googlePolylineOptions: any = {
    icons: [
      {
        icon: {
          path: 'M 0,-1 0,1',
          strokeOpacity: 1,
          scale: 2,
          strokeColor: '#25265E'
        },
        offset: '0',
        repeat: '20px'
      }
    ],
    strokeOpacity: 0
  };

  private subs: Subscription = new Subscription();
  private gMap: GoogleMap | null = null;

  constructor(private globalEventManager: GlobalEventManagerService) {}

  @ViewChild(GoogleMap)
  set map(map: GoogleMap) {
    if (map) {
      this.gMap = map;
      this.initializeGoogleMapOptionsAndBounds();
    }
  }

  ngOnInit(): void {
    if (this.useGoogle) {
      this.subs.add(
        this.globalEventManager.loadedGoogleMapsEmitter.subscribe(loaded => {
          this.googleMapsLoaded = loaded;
          this.initializeGoogleMapOptionsAndBounds();
        })
      );
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  get googleMarkers(): Array<{ position: JourneyMapLatLng } > {
    return (this.markers || []).map(m => ({ position: { lat: m.lat, lng: m.lng } }));
  }

  get maplibreMarkers(): any[] {
    return (this.markers || []).map(m => ({ lat: m.lat, lng: m.lng }));
  }

  private getFitPoints(): JourneyMapLatLng[] {
    const points: JourneyMapLatLng[] = [];
    (this.polylinePath || []).forEach(p => points.push(p));
    (this.markers || []).forEach(p => points.push(p));
    return points.filter(p => typeof p?.lat === 'number' && typeof p?.lng === 'number');
  }

  private initializeGoogleMapOptionsAndBounds(): void {
    if (!this.useGoogle || !this.googleMapsLoaded || !this.gMap) {
      return;
    }

    const g = (window as any).google;
    if (!g?.maps) {
      return;
    }

    const googleMap = this.gMap.googleMap;
    if (!googleMap) {
      return;
    }

    if (!this.googleMarkerOptions) {
      this.googleMarkerOptions = {
        icon: {
          path: g.maps.SymbolPath.CIRCLE,
          scale: 3,
          fillColor: '#25265E',
          fillOpacity: 1,
          strokeColor: '#25265E'
        }
      };
    }

    const points = this.getFitPoints();
    const bounds = new g.maps.LatLngBounds();
    points.forEach(p => bounds.extend(p));

    if (bounds.isEmpty()) {
      googleMap.setCenter(this.defaultCenter as any);
      googleMap.setZoom(this.defaultZoom);
      return;
    }

    const center = bounds.getCenter();
    const offset = 0.02;
    const northEast = new g.maps.LatLng(center.lat() + offset, center.lng() + offset);
    const southWest = new g.maps.LatLng(center.lat() - offset, center.lng() - offset);
    const minBounds = new g.maps.LatLngBounds(southWest, northEast);

    this.gMap.fitBounds(bounds.union(minBounds), this.boundsPadding as any);
  }
}
