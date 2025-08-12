import { HostListener, Directive } from '@angular/core';

/* tslint:disable:directive-class-suffix */

@Directive()
export abstract class ComponentCanDeactivate {

  abstract canDeactivate(): boolean;

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any) {
    if (!this.canDeactivate()) {
      $event.returnValue = true;
    }
  }
}
