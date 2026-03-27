import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';

@Component({
  selector: 'app-document-preview',
  templateUrl: './document-preview.component.html',
  styleUrls: ['./document-preview.component.scss'],
  standalone: false,
})
export class DocumentPreviewComponent implements OnInit {
  constructor() {}

  @Input()
  document: UntypedFormControl;

  ngOnInit(): void {}
}
