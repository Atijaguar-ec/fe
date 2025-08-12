import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TestHelperService {

  constructor() { }

  // Mock for ToastrService
  public toastr = {
    success: jasmine.createSpy('success'),
    error: jasmine.createSpy('error'),
    warning: jasmine.createSpy('warning'),
    info: jasmine.createSpy('info')
  };

  // Mock for ActivatedRoute
  public activatedRoute = {
    snapshot: {
      params: {},
      queryParams: {},
      data: {}
    },
    params: new BehaviorSubject({}),
    queryParams: new BehaviorSubject({})
  };

  // Mock for NgbModal
  public ngbModal = {
    open: jasmine.createSpy('open').and.returnValue({
      componentInstance: {},
      result: Promise.resolve()
    })
  };

  // Mock for NgbActiveModal
  public ngbActiveModal = {
    close: jasmine.createSpy('close'),
    dismiss: jasmine.createSpy('dismiss')
  };
}
