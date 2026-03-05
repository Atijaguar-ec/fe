import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { EnumSifrant } from '../../../../../shared-services/enum-sifrant';

declare const $localize: (messageParts: TemplateStringsArray, ...placeholders: any[]) => string;

@Component({
  selector: 'app-processing-output-lab-shrimp',
  templateUrl: './processing-output-lab-shrimp.component.html',
  styleUrls: ['./processing-output-lab-shrimp.component.scss']
})
export class ProcessingOutputLabShrimpComponent {
  @Input() tsoGroup!: FormGroup;
  @Input() submitted!: boolean;
  @Input() tsoIndex!: number;

  // Yes/No codebook for analysis approval (used by single-choice)
  approvalCodebook: EnumSifrant = EnumSifrant.fromObject({
    true: $localize`:@@productLabelStockProcessingOrderDetail.singleChoice.approvedForPurchase.yes:Yes`,
    false: $localize`:@@productLabelStockProcessingOrderDetail.singleChoice.approvedForPurchase.no:No`
  });
}
