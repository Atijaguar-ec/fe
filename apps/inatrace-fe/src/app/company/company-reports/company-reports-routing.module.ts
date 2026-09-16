import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CompanyReportsComponent } from './company-reports.component';

const routes: Routes = [
  {
    path: '',
    component: CompanyReportsComponent,
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CompanyReportsRoutingModule {}
