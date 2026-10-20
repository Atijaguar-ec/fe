import {
  Component,
  Input,
  OnChanges,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import * as QRCode from 'qrcode';

@Component({
  selector: 'qr-code',
  template: `<canvas #canvas></canvas>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class QrCodeComponent implements OnChanges {
  @Input() qrdata: string = '';
  @Input() value: string = ''; // alias used in some templates
  @Input() size: number = 150;
  @Input() foreground: string = '#000000';
  @Input() level: QRCode.QRCodeErrorCorrectionLevel = 'M';

  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;

  ngOnChanges(): void {
    const data = this.value || this.qrdata;
    if (data) {
      QRCode.toCanvas(this.canvas.nativeElement, data, {
        width: this.size,
        errorCorrectionLevel: this.level,
        color: {
          dark: this.foreground || '#000000',
        },
      }).catch(console.error);
    }
  }
}
