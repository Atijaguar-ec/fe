import { Component, Inject, OnInit } from '@angular/core';
import { B2cPageComponent } from '../b2c-page.component';
import { ApiBusinessToCustomerSettings } from '../../../../api/model/apiBusinessToCustomerSettings';
import { ApiHistoryTimelineItem } from '../../../../api/model/apiHistoryTimelineItem';
import { HistoryTimelineItem } from './model';
import { JourneyMarker } from '../../../shared/mapbox-journey-map/mapbox-journey-map.component';

@Component({
  selector: 'app-b2c-journey',
  templateUrl: './b2c-journey.component.html',
  styleUrls: ['./b2c-journey.component.scss']
})
export class B2cJourneyComponent implements OnInit {

  constructor(
      @Inject(B2cPageComponent) private b2cPage: B2cPageComponent
  ) {
    this.productName = b2cPage.productName;
    this.b2cSettings = b2cPage.b2cSettings;
  }

  productName: string;

  b2cSettings: ApiBusinessToCustomerSettings;

  producerName = '';
  historyItems: HistoryTimelineItem[] = [];

  // Location data from label
  locations: { lat: number; lng: number }[] = [];

  // Mapbox configuration
  readonly defaultCenter = { lat: -1.831239, lng: -78.183406 };
  readonly defaultZoom = 2;
  readonly markerColor = '#25265E';
  readonly polylineColor = '#25265E';

  // Markers for the map
  mapMarkers: JourneyMarker[] = [];

  ngOnInit(): void {
    this.initLabel();
    this.initMapData();
  }

  styleForIconType(iconType: string) {
    switch (iconType) {
      case 'SHIP': return 'af-journey-dot-shape--ship';
      case 'LEAF': return 'af-journey-dot-shape--leaf';
      case 'WAREHOUSE': return 'af-journey-dot-shape--warehouse';
      case 'QRCODE': return 'af-journey-dot-shape--qr-code';
      case 'OTHER': return 'af-journey-dot-shape--other';
      default:
        return 'af-journey-dot-shape--leaf';
    }
  }

  addIconStyleForIconType(item: ApiHistoryTimelineItem): HistoryTimelineItem {

    let iconClass;
    if (!item.iconType) {
      if (item.type === 'TRANSFER') {
        iconClass = 'af-journey-dot-shape--ship';
      } else {
        iconClass = 'af-journey-dot-shape--leaf';
      }
    } else {
      iconClass = this.styleForIconType(item.iconType);
    }
    return {...item, iconClass};
  }

  initLabel() {

    const labelData = this.b2cPage.publicProductLabel;

    for (const item of labelData.fields) {
      if (item.name === 'name') {
        this.producerName = item.value;
      }
      if (item.name === 'journeyMarkers') {
        this.locations = item.value.map(marker => {
          return {
            lat: marker.latitude,
            lng: marker.longitude,
          };
        });
      }
    }
  }

  /**
   * Initialize map markers from locations and history timeline
   */
  initMapData(): void {
    const markers: JourneyMarker[] = [];

    // Add markers from journey locations (every other point)
    for (let i = 0; i < this.locations.length; i += 2) {
      markers.push({
        lat: this.locations[i].lat,
        lng: this.locations[i].lng,
        draggable: false
      });
    }

    // Add markers from QR history timeline if available
    if (this.b2cPage.qrTag !== 'EMPTY') {
      const qrData = this.b2cPage.qrProductLabel;
      if (qrData) {
        this.historyItems = qrData.historyTimeline.items.map(item => this.addIconStyleForIconType(item));
        this.producerName = qrData.producerName;

        qrData.historyTimeline.items.forEach(historyItem => {
          if (historyItem.longitude && historyItem.latitude) {
            markers.push({
              lat: historyItem.latitude,
              lng: historyItem.longitude,
              draggable: false
            });
          }
        });
      }
    }

    this.mapMarkers = markers;
  }

  formatDate(date) {
    if (date) {
      const split = date.split('-');
      return split[2] + '.' + split[1] + '.' + split[0];
    }
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    return day + '.' + month + '.' + year;
  }

}
