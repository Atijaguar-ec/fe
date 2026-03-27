import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ToastrModule } from 'ngx-toastr';
import { GlobalEventManagerService } from '../../core/global-event-manager.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { NgbModalImproved } from '../../core/ngb-modal-improved/ngb-modal-improved.service';

import { BatchDetailPageComponent } from './batch-detail-page.component';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

describe('BatchDetailPageComponent', () => {
  let component: BatchDetailPageComponent;
  let fixture: ComponentFixture<BatchDetailPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [BatchDetailPageComponent],
      imports: [ToastrModule.forRoot()],
      providers: [
        {
          provide: GlobalEventManagerService,
          useValue: { showLoading: () => {}, loadedGoogleMapsEmitter: of({}) },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ batchId: '1' }),
            snapshot: {
              params: { batchId: '1' },
              paramMap: { get: () => '1' },
            },
          },
        },
        { provide: NgbModalImproved, useValue: {} },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BatchDetailPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
