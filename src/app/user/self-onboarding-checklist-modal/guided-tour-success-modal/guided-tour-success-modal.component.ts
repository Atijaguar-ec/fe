import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SelfOnboardingService } from '../../../shared-services/self-onboarding.service';
import { EnvironmentInfoService } from '../../../core/environment-info.service';

@Component({
  selector: 'app-guided-tour-success-modal',
  templateUrl: './guided-tour-success-modal.component.html',
  styleUrls: ['./guided-tour-success-modal.component.scss', '../self-onboarding-checklist-modal.component.scss']
})
export class GuidedTourSuccessModalComponent implements OnInit {

  iconPath = '/assets/icons/icon-self-onboarding-assistant.svg';

  constructor(
      private activeModal: NgbActiveModal,
      private selfOnboardingService: SelfOnboardingService,
      public environmentInfoService: EnvironmentInfoService
  ) { }

  ngOnInit(): void {
    this.iconPath = this.environmentInfoService.getProductIconPath();
  }

  ok() {
    this.selfOnboardingService.endGuidedTour();
    this.activeModal.dismiss();
  }

}
