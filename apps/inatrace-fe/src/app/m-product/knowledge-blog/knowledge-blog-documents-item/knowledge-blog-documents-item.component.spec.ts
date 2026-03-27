import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ToastrModule } from 'ngx-toastr';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { GlobalEventManagerService } from '../../../core/global-event-manager.service';

import { KnowledgeBlogDocumentsItemComponent } from './knowledge-blog-documents-item.component';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

describe('KnowledgeBlogDocumentsItemComponent', () => {
  let component: KnowledgeBlogDocumentsItemComponent;
  let fixture: ComponentFixture<KnowledgeBlogDocumentsItemComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [KnowledgeBlogDocumentsItemComponent],
      imports: [ToastrModule.forRoot()],
      providers: [
        { provide: GlobalEventManagerService, useValue: {} },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KnowledgeBlogDocumentsItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
