import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompanyFarmersListComponent } from './company-farmers-list/company-farmers-list.component';
import { LayoutModule } from '../../layout/layout.module';
import { CompanyCommonModule } from '../company-common/company-common.module';
import { CompanyFarmersRoutingModule } from './company-farmers-routing.module';
import { SharedModule } from '../../shared/shared.module';
import {
  NgbPaginationModule,
  NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';
import { CompanyFarmersDetailsComponent } from './company-farmers-details/company-farmers-details.component';
import { QrCodeModule } from '@app/shared/qr-code/qr-code.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ProductStakeholdersModule } from '../../m-product/product-stakeholders/product-stakeholders.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CompanyFarmersImportComponent } from './company-farmers-import/company-farmers-import.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CompanyFarmersPlotsImportComponent } from './company-farmers-plots-import/company-farmers-plots-import.component';
import { OpenPlotDetailsExternallyModalComponent } from './open-plot-details-externally-modal/open-plot-details-externally-modal.component';

@NgModule({
  declarations: [
    CompanyFarmersListComponent,
    CompanyFarmersDetailsComponent,
    CompanyFarmersImportComponent,
    CompanyFarmersPlotsImportComponent,
    OpenPlotDetailsExternallyModalComponent,
  ],
  imports: [
    CommonModule,
    LayoutModule,
    CompanyCommonModule,
    CompanyFarmersRoutingModule,
    SharedModule,
    NgbPaginationModule,
    QrCodeModule,
    DragDropModule,
    ProductStakeholdersModule,
    FontAwesomeModule,
    FormsModule,
    ReactiveFormsModule,
    NgbTooltipModule,
  ],
})
export class CompanyFarmersModule {}
