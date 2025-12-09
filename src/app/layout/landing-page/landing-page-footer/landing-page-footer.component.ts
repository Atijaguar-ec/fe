import { Component, OnInit } from '@angular/core';
import { EnvironmentInfoService } from '../../../core/environment-info.service';

@Component({
  selector: 'app-landing-page-footer',
  templateUrl: './landing-page-footer.component.html',
  styleUrls: ['./landing-page-footer.component.scss']
})
export class LandingPageFooterComponent implements OnInit {
  currentYear: number = new Date().getFullYear();
  companyName: string = '';
  companyLogoSrc: string = '';
  constructor(private envInfo: EnvironmentInfoService) { }

  ngOnInit(): void {
    this.companyName = this.envInfo.companyName;
    this.companyLogoSrc = this.envInfo.companyLogo;
  }

}
