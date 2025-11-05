import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
  SelfOnboardingChecklistModalComponent
} from '../self-onboarding-checklist-modal/self-onboarding-checklist-modal.component';
import { NgbModalImproved } from '../../core/ngb-modal-improved/ngb-modal-improved.service';
import { SelfOnboardingService } from '../../shared-services/self-onboarding.service';
import { ApiUserGet } from '../../../api/model/apiUserGet';
import { EnvironmentInfoService } from '../../core/environment-info.service';

@Component({
  selector: 'app-self-onboarding-assistant-modal',
  templateUrl: './self-onboarding-assistant-modal.component.html',
  styleUrls: ['./self-onboarding-assistant-modal.component.scss']
})
export class SelfOnboardingAssistantModalComponent implements OnInit {

  @Input()
  userProfile!: ApiUserGet;

  iconPath = '/assets/icons/icon-self-onboarding-assistant.png';

  constructor(
      private activeModal: NgbActiveModal,
      private modalService: NgbModalImproved,
      private selfOnboardingService: SelfOnboardingService,
      public environmentInfoService: EnvironmentInfoService
  ) { }

  ngOnInit(): void {
    this.iconPath = this.environmentInfoService.getProductIconPath();
  }

  closeAssistantModal(): void {
    this.activeModal.dismiss();
  }

  openChecklistModal(): void {

    this.activeModal.dismiss();
    this.modalService.open(SelfOnboardingChecklistModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'md',
      windowClass: 'self-onboarding-checklist-modal-class',
    });
  }

  openGuidedTour(): void {
    this.selfOnboardingService.startGuidedTourStep();
    this.activeModal.dismiss();
  }

}
