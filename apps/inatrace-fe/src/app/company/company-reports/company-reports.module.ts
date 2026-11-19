import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CompanyReportsRoutingModule } from './company-reports-routing.module';
import { CompanyReportsComponent } from './company-reports.component';
import { CompanyReportsStudioComponent } from './company-reports-studio/company-reports-studio.component';
import { LayoutModule } from '../../layout/layout.module';
import { SharedModule } from '../../shared/shared.module';
import { CompanyCommonModule } from '../company-common/company-common.module';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  declarations: [CompanyReportsComponent, CompanyReportsStudioComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CompanyReportsRoutingModule,
    LayoutModule,
    SharedModule,
    CompanyCommonModule,
    NgbNavModule,
  ],
})
export class CompanyReportsModule {}
