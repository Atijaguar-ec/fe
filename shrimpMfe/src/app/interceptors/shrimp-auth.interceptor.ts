import { HttpInterceptorFn } from '@angular/common/http';

/**
 * HTTP Interceptor that attaches Keycloak JWT token to all ms-shrimp API requests.
 * Reads the token from the parent Core INATrace app's storage.
 */
export const shrimpAuthInterceptor: HttpInterceptorFn = (req, next) => {
  // Only intercept requests to the shrimp API
  if (!req.url.includes('/api/shrimp')) {
    return next(req);
  }

  // Try to get token from multiple sources (Core app passes it via localStorage or cookie)
  const token = getKeycloakToken();

  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }

  return next(req);
};

/**
 * Attempts to retrieve the Keycloak token from available storage.
 * Priority: localStorage (Core INATrace) > sessionStorage > window.__token
 */
function getKeycloakToken(): string | null {
  try {
    // Core INATrace stores the token in localStorage
    const stored = localStorage.getItem('token') || localStorage.getItem('access_token');
    if (stored) return stored;

    // Fallback: sessionStorage
    const session = sessionStorage.getItem('token') || sessionStorage.getItem('access_token');
    if (session) return session;

    // Fallback: injected by parent app
    const win = window as any;
    if (win.__keycloak_token) return win.__keycloak_token;
    if (win.keycloak?.token) return win.keycloak.token;

    return null;
  } catch {
    return null;
  }
}
