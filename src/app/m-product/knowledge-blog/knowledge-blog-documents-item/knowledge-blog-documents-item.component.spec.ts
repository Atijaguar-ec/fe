import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastrModule } from 'ngx-toastr';
import { of } from 'rxjs';

import { SharedModule } from 'src/app/shared/shared.module';
import { GlobalEventManagerService } from 'src/app/core/global-event-manager.service';
import { CommonControllerService } from 'src/api/api/commonController.service';
import { FileSaverService } from 'ngx-filesaver';

import { KnowledgeBlogDocumentsItemComponent } from './knowledge-blog-documents-item.component';

describe('KnowledgeBlogDocumentsItemComponent', () => {
  let component: KnowledgeBlogDocumentsItemComponent;
  let fixture: ComponentFixture<KnowledgeBlogDocumentsItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        SharedModule,
        RouterTestingModule,
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        ToastrModule.forRoot()
      ],
      declarations: [ KnowledgeBlogDocumentsItemComponent ],
      providers: [
        { provide: GlobalEventManagerService, useValue: { push: () => {}, openMessageModal: () => Promise.resolve(null), showLoading: () => {} } },
        { provide: CommonControllerService, useValue: { getDocument: (_key: string) => of(new Blob()) } },
        { provide: FileSaverService, useValue: { save: jasmine.createSpy('save') } }
      ]
    })
    .compileComponents();
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
