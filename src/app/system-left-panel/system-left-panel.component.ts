import { Component, OnInit, Input } from '@angular/core';
import { EnvironmentInfoService } from '../core/environment-info.service';

@Component({
  selector: 'app-system-left-panel',
  templateUrl: './system-left-panel.component.html',
  styleUrls: ['./system-left-panel.component.scss']
})
export class SystemLeftPanelComponent implements OnInit {

  @Input()
  title: string = null;

  @Input()
  isAdmin = false;

  environmentBadgeLabel = '';
  environmentDisplayName = '';
  environmentBadgeClass = '';
  productBadgeLabel = '';

  constructor(private environmentInfoService: EnvironmentInfoService) { }

  ngOnInit(): void {
    this.environmentBadgeLabel = this.environmentInfoService.getEnvironmentBadgeLabel();
    this.environmentDisplayName = this.environmentInfoService.getEnvironmentDisplayName();
    this.environmentBadgeClass = this.environmentInfoService.getEnvironmentBadgeClass();
    this.productBadgeLabel = this.environmentInfoService.getProductBadgeLabel();
  }

}
