import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonControllerService } from 'src/api/api/commonController.service';
import { GlobalEventManagerService } from 'src/app/core/global-event-manager.service';
import { NgbModalImproved } from 'src/app/core/ngb-modal-improved/ngb-modal-improved.service';
import { SettingsComponent } from '../settings.component';
import { AuthService } from '../../core/auth.service';
import { EnvironmentInfoService } from '../../core/environment-info.service';

@Component({
  selector: 'app-settings-types',
  templateUrl: './settings-types.component.html',
  styleUrls: ['../settings.component.scss']
})
export class SettingsTypesComponent extends SettingsComponent {

  rootTab = 1;

  constructor(
    protected globalEventsManager: GlobalEventManagerService,
    protected commonController: CommonControllerService,
    protected modalService: NgbModalImproved,
    protected router: Router,
    protected authService: AuthService,
    public environmentService: EnvironmentInfoService
  ) {
    super(
        globalEventsManager, commonController, modalService, router, authService);
  }

  /**
   * Check if shrimp catalogs should be displayed
   */
  get isShrimp(): boolean {
    return this.environmentService.isProductType('shrimp');
  }

}
