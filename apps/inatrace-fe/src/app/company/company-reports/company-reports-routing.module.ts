import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SystemOrRegionalAdminGuardService } from '../../core/guards/system-or-regional-admin-guard.service';
import { CompanyReportsComponent } from './company-reports.component';
import { CompanyReportsStudioComponent } from './company-reports-studio/company-reports-studio.component';

const routes: Routes = [
  {
    path: '',
    component: CompanyReportsComponent,
    pathMatch: 'full',
  },
  {
    path: 'studio',
    component: CompanyReportsStudioComponent,
    canActivate: [SystemOrRegionalAdminGuardService],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CompanyReportsRoutingModule {}
