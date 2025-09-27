import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Layout components
import { ProductLabelFrontTopNavComponent } from './product-label-front/product-label-front-top-nav/product-label-front-top-nav.component';
import { PageContentComponent } from './page-content/page-content.component';
import { LandingPageFooterComponent } from './landing-page/landing-page-footer/landing-page-footer.component';
import { SystemLeftPanelComponent } from '../system-left-panel/system-left-panel.component';

@NgModule({
  declarations: [
    ProductLabelFrontTopNavComponent,
    PageContentComponent,
    LandingPageFooterComponent,
    SystemLeftPanelComponent
  ],
  imports: [
    CommonModule,
    RouterModule
  ],
  exports: [
    ProductLabelFrontTopNavComponent,
    PageContentComponent,
    LandingPageFooterComponent,
    SystemLeftPanelComponent
  ]
})
export class LayoutSharedModule { }
