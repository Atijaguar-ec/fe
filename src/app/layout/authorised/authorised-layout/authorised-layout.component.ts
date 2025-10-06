import { Component, OnInit, Input } from '@angular/core';
import { TabCommunicationService } from 'src/app/shared/tab-communication.service';
import { EnvironmentInfoService } from 'src/app/core/environment-info.service';

@Component({
  selector: 'app-authorised-layout',
  templateUrl: './authorised-layout.component.html',
  styleUrls: ['./authorised-layout.component.scss']
})
export class AuthorisedLayoutComponent implements OnInit {

  @Input()
  returnUrl: string = null;

  tabCommunicationService: TabCommunicationService;

  environmentBadgeClass = '';
  environmentBadgeLabel = '';
  productBadgeLabel = '';

  constructor(private environmentInfoService: EnvironmentInfoService) {
    this.tabCommunicationService = new TabCommunicationService();
  }

  ngOnInit(): void {
    this.environmentBadgeClass = this.environmentInfoService.getEnvironmentBadgeClass();
    this.environmentBadgeLabel = this.environmentInfoService.getEnvironmentBadgeLabel();
    this.productBadgeLabel = this.environmentInfoService.getProductBadgeLabel();
  }

}
