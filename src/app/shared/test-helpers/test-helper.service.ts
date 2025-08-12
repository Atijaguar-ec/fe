import { Injectable } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { convertToParamMap } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class TestHelperService {

  createActivatedRouteMock(params: any = {}): any {
    return {
      snapshot: {
        paramMap: convertToParamMap(params)
      },
      queryParams: of(params),
      params: of(params)
    };
  }

  createNgbActiveModalMock(): any {
    return {
      close: () => {},
      dismiss: () => {}
    };
  }

  createNgbModalImprovedMock(): any {
    return {
      open: () => ({
        result: Promise.resolve(),
        componentInstance: {}
      }),
      dismissAll: () => {}
    };
  }

  createToastrServiceMock(): any {
    return {
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {}
    };
  }

  createObservableMock(data: any): any {
    return of(data);
  }

  createErrorObservableMock(error: any): any {
    return throwError(error);
  }
}
