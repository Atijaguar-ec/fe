import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-size-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './size-selector.component.html',
  styleUrls: ['./size-selector.component.css'],
})
export class SizeSelectorComponent {
  @Input() sizes: string[] = ['Entero', 'Cola', '21/25', '26/30', '31/35', '36/40'];
  @Output() sizeSelected = new EventEmitter<string>();

  onSizeClick(size: string) {
    if (navigator.vibrate) navigator.vibrate(30);
    this.sizeSelected.emit(size);
  }
}
