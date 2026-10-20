import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { QrCodeModule } from '../shared/qr-code/qr-code.module';
import { PublicDeliveryReceiptRoutingModule } from './public-delivery-receipt-routing.module';
import { PublicDeliveryReceiptComponent } from './public-delivery-receipt.component';

@NgModule({
  declarations: [PublicDeliveryReceiptComponent],
  imports: [
    CommonModule,
    RouterModule,
    FontAwesomeModule,
    QrCodeModule,
    PublicDeliveryReceiptRoutingModule,
  ],
})
export class PublicDeliveryReceiptModule {}
