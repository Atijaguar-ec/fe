import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ProductControllerService } from 'src/api/api/productController.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FormGroup, FormControl } from '@angular/forms';
import { GlobalEventManagerService } from 'src/app/core/global-event-manager.service';
import { JourneyMarker, MapboxJourneyMapComponent } from 'src/app/shared/mapbox-journey-map/mapbox-journey-map.component';

@Component({
  selector: 'app-product-label-statistics-page',
  templateUrl: './product-label-statistics-page.component.html',
  styleUrls: ['./product-label-statistics-page.component.scss']
})
export class ProductLabelStatisticsPageComponent implements OnInit, OnDestroy {

  @ViewChild(MapboxJourneyMapComponent) mapComponent: MapboxJourneyMapComponent;

  // Mapbox configuration
  readonly defaultCenter = { lat: -1.831239, lng: -78.183406 };
  readonly defaultZoom = 7;
  readonly markerColor = '#25265E';

  // Markers for display (combined from all categories based on filter)
  mapMarkers: JourneyMarker[] = [];

  // Separate marker arrays for filtering
  private authMarkersData: JourneyMarker[] = [];
  private origMarkersData: JourneyMarker[] = [];
  private visitMarkersData: JourneyMarker[] = [];

  subs: Subscription[] = [];
  statistics = {};

  goToLink: string = this.router.url.substr(0, this.router.url.lastIndexOf('/'));

  showAuth = true;
  showOrig = true;

  locationsForm = new FormGroup({
    visitLoc: new FormControl(true),
    authLoc: new FormControl(false),
    origLoc: new FormControl(false)
    });

  constructor(
    private globalEventsManager: GlobalEventManagerService,
    private productController: ProductControllerService,
    private route: ActivatedRoute,
    private router: Router
  ) { }


  id = +this.route.snapshot.paramMap.get('labelId');

  ngOnInit(): void {
    this.getStatistics();
  }

  ngOnDestroy(): void {
    this.subs.forEach(sub => sub.unsubscribe());
  }

  getStatistics() {
    this.globalEventsManager.showLoading(true);

    const sub = this.productController.getProductLabel(this.id).
    subscribe(lab => {
      if(lab.status == 'OK') {
        this.getStatistcsData(lab.data.uuid);
      }
    }, err => this.globalEventsManager.showLoading(true)
    );
    this.subs.push(sub);
  }

  getStatistcsData(uuid: string) {
    const sub = this.productController.getProductLabelAnalytics(uuid)
    .subscribe(stat => {
      if (stat.status == 'OK') {
        this.statistics = stat.data;
        this.initializeMarkers(this.statistics);
      }
      this.globalEventsManager.showLoading(false);
    },
    err => this.globalEventsManager.showLoading(true)
    );
    this.subs.push(sub);
  }


  initializeMarkers(data: any): void {
    this.authMarkersData = [];
    this.origMarkersData = [];
    this.visitMarkersData = [];

    if (data) {
      // Parse auth locations
      if (data.authLocations) {
        Object.entries(data.authLocations).forEach(([key, value]) => {
          if (key !== 'unknown') {
            const pos = key.split(':');
            this.authMarkersData.push({
              lat: parseFloat(pos[0]),
              lng: parseFloat(pos[1]),
              draggable: false
            });
          }
        });
      }

      // Parse origin locations
      if (data.originLocations) {
        Object.entries(data.originLocations).forEach(([key, value]) => {
          if (key !== 'unknown') {
            const pos = key.split(':');
            this.origMarkersData.push({
              lat: parseFloat(pos[0]),
              lng: parseFloat(pos[1]),
              draggable: false
            });
          }
        });
      }

      // Parse visit locations
      if (data.visitsLocations) {
        Object.entries(data.visitsLocations).forEach(([key, value]) => {
          if (key !== 'unknown') {
            const pos = key.split(':');
            this.visitMarkersData.push({
              lat: parseFloat(pos[0]),
              lng: parseFloat(pos[1]),
              draggable: false
            });
          }
        });
      }
    }

    this.updateVisibleMarkers();
  }

  /**
   * Update visible markers based on checkbox filters
   */
  updateVisibleMarkers(): void {
    const markers: JourneyMarker[] = [];

    if (this.locationsForm.get('visitLoc')?.value) {
      markers.push(...this.visitMarkersData);
    }
    if (this.locationsForm.get('authLoc')?.value) {
      markers.push(...this.authMarkersData);
    }
    if (this.locationsForm.get('origLoc')?.value) {
      markers.push(...this.origMarkersData);
    }

    this.mapMarkers = markers;

    // Trigger map to fit bounds after markers update
    if (this.mapComponent) {
      setTimeout(() => this.mapComponent.fitBounds(), 100);
    }
  }

}
