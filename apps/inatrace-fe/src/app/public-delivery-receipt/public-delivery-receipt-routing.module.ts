import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PublicDeliveryReceiptComponent } from './public-delivery-receipt.component';

const routes: Routes = [
  {
    path: '',
    component: PublicDeliveryReceiptComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PublicDeliveryReceiptRoutingModule {}
