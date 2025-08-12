import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { KnowledgeBlogFrontComponent } from './knowledge-blog-front.component';
import { ProductControllerService } from 'src/api/api/productController.service';
import { GlobalEventManagerService } from '../core/global-event-manager.service';
import { ActivatedRoute } from '@angular/router';
import { MessageModalService } from '../core/message-modal/message-modal.service';
import { NgbModalImproved } from '../core/ngb-modal-improved/ngb-modal-improved.service';

describe('KnowledgeBlogFrontComponent', () => {
  let component: KnowledgeBlogFrontComponent;
  let fixture: ComponentFixture<KnowledgeBlogFrontComponent>;
  let mockActivatedRoute: any;
  let mockToastrService: any;
  let mockGlobalEventManagerService: any;
  let mockMessageModalService: any;
  let mockNgbModalImproved: any;

  beforeEach(async(() => {
    // Mock ActivatedRoute
    mockActivatedRoute = {
      snapshot: {
        params: {
          knowledgeBlogId: '1',
          type: 'product',
          id: '1'
        }
      }
    };
    
    // Mock ToastrService
    mockToastrService = {
      success: jasmine.createSpy('success'),
      error: jasmine.createSpy('error'),
      warning: jasmine.createSpy('warning'),
      info: jasmine.createSpy('info')
    };
    
    // Mock NgbModalImproved
    mockNgbModalImproved = {
      open: jasmine.createSpy('open').and.returnValue({
        componentInstance: {},
        result: Promise.resolve()
      })
    };
    
    // Mock MessageModalService
    mockMessageModalService = {
      open: jasmine.createSpy('open').and.returnValue(Promise.resolve())
    };
    
    // Mock GlobalEventManagerService
    mockGlobalEventManagerService = {
      showLoading: jasmine.createSpy('showLoading'),
      showLoadingSpinner: jasmine.createSpy('showLoadingSpinner'),
      hideLoadingSpinner: jasmine.createSpy('hideLoadingSpinner'),
      push: jasmine.createSpy('push')
    };

    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        BrowserAnimationsModule,
        ToastrModule.forRoot(),
        NgbModule
      ],
      declarations: [ KnowledgeBlogFrontComponent ],
      providers: [
        ProductControllerService,
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ToastrService, useValue: mockToastrService },
        { provide: NgbModalImproved, useValue: mockNgbModalImproved },
        { provide: MessageModalService, useValue: mockMessageModalService },
        { provide: GlobalEventManagerService, useValue: mockGlobalEventManagerService }
      ]
    })
    .compileComponents();
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
