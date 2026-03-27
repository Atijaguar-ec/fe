import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';

@Component({
  selector: 'app-color-input',
  templateUrl: './color-input.component.html',
  styleUrls: ['./color-input.component.scss'],
  standalone: false,
})
export class ColorInputComponent implements OnInit {
  constructor() {}

  @Input()
  control: UntypedFormControl;

  @Input()
  disabled = false;

  ngOnInit(): void {}
}
