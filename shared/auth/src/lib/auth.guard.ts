import { createAuthGuard } from 'keycloak-angular';

export const requireAuthGuard = createAuthGuard(
  async (route, state, authData) => {
    if (authData.authenticated) {
      return true;
    }
    return false;
  }
);
