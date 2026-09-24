import { Injectable } from '@angular/core';
import { CanMatch, Route, UrlSegment } from '@angular/router';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ShrimpModuleGuard implements CanMatch {
  canMatch(route?: Route, segments?: UrlSegment[]): boolean {
    return Boolean(environment.enableShrimpModule);
  }
}
