import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-processing-output-lab-shrimp',
  templateUrl: './processing-output-lab-shrimp.component.html',
  styleUrls: ['./processing-output-lab-shrimp.component.scss']
})
export class ProcessingOutputLabShrimpComponent {
  @Input() tsoGroup!: FormGroup;
  @Input() submitted!: boolean;
  @Input() tsoIndex!: number;
}
