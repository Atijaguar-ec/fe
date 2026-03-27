import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-instructions-modal',
  templateUrl: './instructions-modal.component.html',
  styleUrls: ['./instructions-modal.component.scss'],
  standalone: false,
})
export class InstructionsModalComponent implements OnInit {
  @Input()
  instructions = null;

  @Input()
  title = 'Pomen ikon in gumbov';

  @Input()
  dismissable = true;

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit() {}
}
