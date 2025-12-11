import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CookieManagementService } from './shared/directives/cookie-management.service';
import { GlobalEventManagerService } from './core/global-event-manager.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  title = environment.appName;

  constructor(
    public globalEventsManager: GlobalEventManagerService,
    private cookieManagementService: CookieManagementService
    ){}

  ngOnInit() {
    this.cookieManagementService.loadConsentedCookies();
  }

  hasDefinedConsentToAllCookies() {
    return this.cookieManagementService.hasDefinedConsentToAllActiveCookies();
  }

  consentToAllCookies() {
    this.cookieManagementService.consentToAllCookies();
  }

  get cookieInfoUrl() {
    return this.cookieManagementService.cookieInfoUrl;
  }

}
