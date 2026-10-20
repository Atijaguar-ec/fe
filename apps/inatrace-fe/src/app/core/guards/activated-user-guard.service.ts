import { Injectable, inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { AuthService } from '../auth.service';
import { take } from 'rxjs/operators';
import { ApiUserGet } from '../../../api/model/apiUserGet';
import Keycloak from 'keycloak-js';

@Injectable({
  providedIn: 'root',
})
export class ActivatedUserGuardService {
  private keycloak = inject(Keycloak, { optional: true });

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Promise<boolean | UrlTree> {
    const res = await this.authService.userProfile$.pipe(take(1)).toPromise();

    if (res && res.status === ApiUserGet.StatusEnum.ACTIVE) {
      return true;
    }

    if (this.keycloak && !this.keycloak.authenticated) {
      const redirectUri = window.location.origin + state.url;
      await this.keycloak.login({ redirectUri });
      return false;
    }

    return false;
  }
}
