import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-open-plot-details-externally-modal',
  templateUrl: './open-plot-details-externally-modal.component.html',
  styleUrls: ['./open-plot-details-externally-modal.component.scss'],
  standalone: false,
})
export class OpenPlotDetailsExternallyModalComponent implements OnInit {
  @Input()
  geoId: string;

  externalUrl: SafeResourceUrl | null = null;
  rawExternalUrl: string | null = null;

  constructor(
    private sanitizer: DomSanitizer,
    public activeModal: NgbActiveModal,
  ) {}

  ngOnInit(): void {
    if (this.geoId && String(this.geoId).trim() !== '' && this.geoId !== 'null') {
      const layers =
        '%7B%22CocoaETH%22%3A%7B%22opacity%22%3A1%7D%2C%22JRCForestMask%22%3A%7B%22opacity%22%3A1%7D%2C%22OilPalmFDAP%22%3A%7B%22opacity%22%3A1%7D%7D';
      const map = '%7B%22zoom%22%3A15%2C%22mapType%22%3A%22satellite%22%7D';
      const scripts =
        '%7B%22WhispSummary%22%3A%7B%22dateRange%22%3A%5Bnull%2Cnull%5D%2C%22threshold%22%3Anull%2C%22extraThreshold%22%3Anull%2C%22multiCriteriaOption%22%3Anull%2C%22multiCriteriaOptionClass%22%3Anull%7D%7D';
      this.rawExternalUrl = `https://whisp.earthmap.org/?aoi=WHISP&boundary&geoId=${encodeURIComponent(this.geoId)}&layers=${layers}&map=${map}&scripts=${scripts}&statisticsOpen=true`;
      this.externalUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.rawExternalUrl);
    }
  }

  close() {
    this.activeModal.close();
  }
}
