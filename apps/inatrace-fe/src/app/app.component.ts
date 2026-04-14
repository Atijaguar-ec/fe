import { Component, OnInit } from '@angular/core';
import { GlobalEventManagerService } from './core/global-event-manager.service';
import { environment } from 'src/environments/environment';
import { CookieManagementService } from './shared/directives/cookie-management.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  title = environment.appName;

  constructor(
    public globalEventsManager: GlobalEventManagerService,
    private cookieManagementService: CookieManagementService,
  ) {}

  ngOnInit() {
    // Auto-accept cookie consent in environments without analytics (dev/internal systems)
    // This prevents the cookie banner from blocking modal interactions
    if (!environment.googleAnalyticsId && !environment.facebookPixelId) {
      this.cookieManagementService.consentToAllCookies();
    }
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
