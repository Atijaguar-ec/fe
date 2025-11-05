import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SelfOnboardingService } from '../../../shared-services/self-onboarding.service';
import { EnvironmentInfoService } from '../../../core/environment-info.service';

@Component({
    selector: 'app-checklist-add-farmers-success-modal',
    templateUrl: './checklist-add-farmers-success-modal.component.html',
    styleUrls: ['./checklist-add-farmers-success-modal.component.scss', '../self-onboarding-checklist-modal.component.scss']
})
export class ChecklistAddFarmersSuccessModalComponent implements OnInit {

    iconPath = '/assets/icons/icon-self-onboarding-assistant.png';

    constructor(
        private activeModal: NgbActiveModal,
        private selfOnboardingService: SelfOnboardingService,
        public environmentInfoService: EnvironmentInfoService
    ) {
    }

    ngOnInit(): void {
        this.iconPath = this.environmentInfoService.getProductIconPath();
    }

    showMeAround() {
        this.selfOnboardingService.clearAddFarmersCurrentStep();
        this.activeModal.dismiss();
        this.selfOnboardingService.startGuidedTourStep();
    }

    iAmGood() {
        this.selfOnboardingService.clearAddFarmersCurrentStep();
        this.activeModal.dismiss();
    }

}
