import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'lib-numeric-keypad',
  standalone: true,
  templateUrl: './numeric-keypad.component.html',
  styleUrls: ['./numeric-keypad.component.css'],
})
export class NumericKeypadComponent {
  @Output() keyPress = new EventEmitter<string>();
  
  onKeyClick(key: string) {
    if (navigator.vibrate) {
      navigator.vibrate(50); // Haptic feedback ligero
    }
    this.keyPress.emit(key);
  }
}
