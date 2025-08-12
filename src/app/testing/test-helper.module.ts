import { NgModule } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ToastrModule } from 'ngx-toastr';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  imports: [
    HttpClientTestingModule,
    RouterTestingModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot(),
    NgbModule
  ],
  exports: [
    HttpClientTestingModule,
    RouterTestingModule,
    BrowserAnimationsModule,
    ToastrModule,
    NgbModule
  ]
})
export class TestHelperModule {}
