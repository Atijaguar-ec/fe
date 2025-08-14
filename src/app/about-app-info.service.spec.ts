import { TestBed } from '@angular/core/testing';
import { GlobalEventManagerService } from './core/global-event-manager.service';

import { AboutAppInfoService } from './about-app-info.service';

describe('AboutAppInfoService', () => {
  let service: AboutAppInfoService;

  const mockGlobalEventManager: Partial<GlobalEventManagerService> = {
    openMessageModal: () => Promise.resolve(undefined)
  } as Partial<GlobalEventManagerService>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: GlobalEventManagerService, useValue: mockGlobalEventManager }
      ]
    });
    service = TestBed.inject(AboutAppInfoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
