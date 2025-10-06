import { Component, OnInit } from '@angular/core';
import { environment } from '../../environments/environment';
import { ApiLogRequest } from '../../api/model/apiLogRequest';
import { PublicControllerService } from '../../api/api/publicController.service';
import { take } from 'rxjs/operators';

import { EnvironmentInfoService } from '../core/environment-info.service';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss']
})
export class LandingPageComponent implements OnInit {

  appName = environment.appName;
  environmentDisplayName = '';
  productDisplayName = '';
  companyDisplayName = '';

  constructor(
    private publicController: PublicControllerService,
    private environmentInfoService: EnvironmentInfoService
  ) { }

  ngOnInit(): void {
    this.environmentDisplayName = this.environmentInfoService.getEnvironmentDisplayName();
    this.productDisplayName = this.environmentInfoService.getProductDisplayName();
    this.companyDisplayName = this.environmentInfoService.companyName;

    this.publicController
      .logPublicRequest({token: environment.tokenForPublicLogRoute, type: ApiLogRequest.TypeEnum.LANDINGPAGE})
      .pipe(take(1)).toPromise().then();
  }

}
