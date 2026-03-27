import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ToastrModule } from 'ngx-toastr';
import { NgbModalImproved } from '../core/ngb-modal-improved/ngb-modal-improved.service';

import { KnowledgeBlogFrontComponent } from './knowledge-blog-front.component';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

describe('KnowledgeBlogFrontComponent', () => {
  let component: KnowledgeBlogFrontComponent;
  let fixture: ComponentFixture<KnowledgeBlogFrontComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [KnowledgeBlogFrontComponent],
      imports: [RouterTestingModule, ToastrModule.forRoot()],
      providers: [
        { provide: NgbModalImproved, useValue: {} },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KnowledgeBlogFrontComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
