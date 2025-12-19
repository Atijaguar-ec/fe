import { Component, OnInit } from '@angular/core';
import { B2cPageComponent } from '../b2c-page.component';
import { ApiBusinessToCustomerSettings } from '../../../../api/model/apiBusinessToCustomerSettings';
import { ApiHistoryTimelineItem } from '../../../../api/model/apiHistoryTimelineItem';
import { HistoryTimelineItem } from './model';

@Component({
  selector: 'app-b2c-journey',
  templateUrl: './b2c-journey.component.html',
  styleUrls: ['./b2c-journey.component.scss']
})
export class B2cJourneyComponent implements OnInit {

  constructor(
      private b2cPage: B2cPageComponent
  ) {
    this.productName = b2cPage.productName;
    this.b2cSettings = b2cPage.b2cSettings;
  }

  productName: string;

  b2cSettings: ApiBusinessToCustomerSettings;

  producerName = '';
  historyItems: HistoryTimelineItem[] = [];

  polylinePath: Array<{ lat: number; lng: number }> = [];
  markers: Array<{ lat: number; lng: number }> = [];

  defaultCenter = {
    lat: -1.831239,
    lng: -78.183406
  };
  defaultZoom = 2;

  ngOnInit(): void {
    this.initLabel();
    this.data().then();
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

    const labelData: any = this.b2cPage.publicProductLabel as any;
    const fields: any[] = labelData?.fields || [];

    for (const item of fields) {
      if (item.name === 'name') {
        this.producerName = item.value || '';
      }
      if (item.name === 'journeyMarkers') {
        const markerValues: any[] = item.value || [];
        this.polylinePath = markerValues.map((marker: any) => {
          return {
            lat: marker.latitude,
            lng: marker.longitude,
          };
        });
      }
    }
  }

  async data() {

    for (let i = 0; i < this.polylinePath.length; i += 2) {
      this.markers.push({
        lat: this.polylinePath[i].lat,
        lng: this.polylinePath[i].lng
      });
    }

    if (this.b2cPage.qrTag !== 'EMPTY') {

      // Get the aggregated history for the QR code tag
      const qrData: any = this.b2cPage.qrProductLabel as any;
      if (qrData) {
        const items: ApiHistoryTimelineItem[] = (qrData.historyTimeline?.items || []) as ApiHistoryTimelineItem[];
        this.historyItems = items.map(item => this.addIconStyleForIconType(item));
        this.producerName = qrData.producerName || this.producerName;

        items.forEach(historyItem => {
          if (historyItem.longitude && historyItem.latitude) {
            this.markers.push({
              lat: historyItem.latitude,
              lng: historyItem.longitude
            });
          }
        });
      }
    }
  }

  formatDate(date: string | null | undefined) {
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
