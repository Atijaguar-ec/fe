import { TestBed } from '@angular/core/testing';
import { ToastrModule } from 'ngx-toastr';
import { GlobalEventManagerService } from './core/global-event-manager.service';

import { AboutAppInfoService } from './about-app-info.service';

describe('AboutAppInfoService', () => {
  let service: AboutAppInfoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ToastrModule.forRoot()],
      providers: [{ provide: GlobalEventManagerService, useValue: {} }],
    });
    service = TestBed.inject(AboutAppInfoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
