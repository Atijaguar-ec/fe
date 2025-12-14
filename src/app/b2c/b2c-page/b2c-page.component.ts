import { Component, HostListener, OnInit } from '@angular/core';
import { take } from 'rxjs/operators';
import { PublicControllerService } from '../../../api/api/publicController.service';
import { ActivatedRoute } from '@angular/router';
import { B2CTab } from '../b2c-tabs/b2c-tabs.component';
import { ApiBusinessToCustomerSettings } from '../../../api/model/apiBusinessToCustomerSettings';
import { ApiProductLabelFieldValue } from '../../../api/model/apiProductLabelFieldValue';
import { ViewportScroller } from '@angular/common';
import { environment } from 'src/environments/environment';
import { ApiProductLabelValuesExtended } from '../../../api/model/apiProductLabelValuesExtended';
import { ApiQRTagPublic } from '../../../api/model/apiQRTagPublic';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-b2c-page',
  templateUrl: './b2c-page.component.html',
  styleUrls: ['./b2c-page.component.scss']
})
export class B2cPageComponent implements OnInit {

  uuid = this.route.snapshot.params.uuid;
  qrTag = this.route.snapshot.params.qrTag;

  tab: B2CTab = B2CTab.NONE;

  constructor(
      private route: ActivatedRoute,
      private publicController: PublicControllerService,
      private scroll: ViewportScroller
  ) {
    this.route.url.subscribe({
      next: () => {
        const childPath = this.route.snapshot.firstChild?.routeConfig?.path;
        switch (childPath) {
          case B2CTab.JOURNEY:
          case B2CTab.FAIR_PRICES:
          case B2CTab.PRODUCERS:
          case B2CTab.QUALITY:
          case B2CTab.FEEDBACK:
            this.tab = childPath as B2CTab;
            break;
          case 'terms-of-use':
          case 'privacy-policy':
          default:
            this.tab = B2CTab.NONE;
            break;
        }
      }
    });
  }

  loading = true;

  productName: string;

  headerColor: string;
  footerColor: string;

  b2cSettings: ApiBusinessToCustomerSettings;
  publicProductLabel: ApiProductLabelValuesExtended;
  qrProductLabel: ApiQRTagPublic;

  // Social links
  facebook;
  twitter;
  instagram;
  youtube;
  other;

  termsText: string;
  privacyText: string;

  pageYOffset = 0;

  @HostListener('window:scroll', ['$event']) onScroll(event) {
    this.pageYOffset = window.pageYOffset;
  }

  ngOnInit(): void {
    forkJoin([
      this.publicController.getPublicProductLabelValues(this.uuid).pipe(take(1)),
      this.publicController.getQRTagPublicData(this.qrTag, true).pipe(take(1))
    ]).subscribe({
      next: ([label, qrTag]) => {
        this.processFields(label.data.fields);

        this.publicProductLabel = label.data;

        this.b2cSettings = label.data.businessToCustomerSettings;

        if (this.b2cSettings.productFont) {
          const node = document.createElement('style');
          node.innerHTML = `
            @font-face {
              font-family: 'custom-product';
              font-style: normal;
              font-weight: 400;
              src: url(${this.productFontHref});
            }`;
          document.body.appendChild(node);
        }

        if (this.b2cSettings.textFont) {
          const node = document.createElement('style');
          node.innerHTML = `
            @font-face {
              font-family: 'custom-text';
              font-style: normal;
              font-weight: 400;
              src: url(${this.textFontHref});
            }`;
          document.body.appendChild(node);
        }

        this.qrProductLabel = qrTag.data;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  processFields(fields) {
    this.extractName(fields);
    this.extractLinks(fields);
    this.extractTerms(fields);
    this.extractPrivacy(fields);
  }

  extractName(fields: ApiProductLabelFieldValue[]) {
    for (const field of fields) {
      if (field.name === 'name') {
        this.productName = field.value;
        break;
      }
    }
  }

  extractLinks(fields: ApiProductLabelFieldValue[]) {
    for (const field of fields) {
      if (field.name === 'company.mediaLinks.facebook' && field.value) {
        this.facebook = this.checkExternalLink(field.value);
      }
      if (field.name === 'company.mediaLinks.twitter' && field.value) {
        this.twitter = this.checkExternalLink(field.value);
      }
      if (field.name === 'company.mediaLinks.instagram' && field.value) {
        this.instagram = this.checkExternalLink(field.value);
      }
      if (field.name === 'company.mediaLinks.youtube' && field.value) {
        this.youtube = this.checkExternalLink(field.value);
      }
      if (field.name === 'company.mediaLinks.other' && field.value) {
        this.other = this.checkExternalLink(field.value);
      }
    }
  }

  extractTerms(fields: ApiProductLabelFieldValue[]) {
    for (const field of fields) {
      if (field.name === 'settings.termsOfUseText') {
        this.termsText = field.value;
      }
    }
  }

  extractPrivacy(fields: ApiProductLabelFieldValue[]) {
    for (const field of fields) {
      if (field.name === 'settings.privacyPolicyText') {
        this.privacyText = field.value;
      }
    }
  }

  checkExternalLink(link: string): string {
    if (!link) { return '#'; }
    if (!link.startsWith('https://') && !link.startsWith('http://')) {
      return 'http://' + link;
    }
    return link;
  }

  get showScrollToTop() {
    return this.pageYOffset > 0;
  }

  scrollToTop() {
    this.scroll.scrollToPosition([0, 0]);
  }

  get productFontHref() {
    return `${environment.appBaseUrl}/api/public/document/${this.b2cSettings.productFont.storageKey}`;
  }

  get textFontHref() {
    return `${environment.appBaseUrl}/api/public/document/${this.b2cSettings.textFont.storageKey}`;
  }

}
