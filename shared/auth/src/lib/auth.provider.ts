import { InjectionToken } from '@angular/core';
import { 
  provideKeycloak, 
  withAutoRefreshToken, 
  createInterceptorCondition, 
  IncludeBearerTokenCondition,
  AutoRefreshTokenService,
  UserActivityService,
  INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG
} from 'keycloak-angular';

/**
 * DI token that exposes the configured API base URL to any service in the
 * Nx workspace (host or MFE). Provided automatically by `provideInatraceAuth()`.
 *
 * Usage:
 * ```ts
 * constructor(@Inject(INATRACE_API_BASE_URL) private apiUrl: string) {}
 * ```
 */
export const INATRACE_API_BASE_URL = new InjectionToken<string>(
  'INATRACE_API_BASE_URL'
);

export interface InatraceAuthConfig {
  keycloakUrl: string;
  keycloakRealm: string;
  keycloakClientId: string;
  apiBaseUrl: string;
}

/**
 * Configure Keycloak Providers dynamically per environment.
 * Wires Keycloak init + Bearer token interceptor for API requests.
 *
 * The urlPattern is derived from the origin (protocol + host + port) of the
 * apiBaseUrl so that the Bearer token is injected for *any* path on the
 * backend host — regardless of whether the service builds its URL with or
 * without a trailing `/api` segment.
 */
export function provideInatraceAuth(config: InatraceAuthConfig) {
  // Extract origin: e.g. "http://localhost:8082/api" → "http://localhost:8082"
  const backendOrigin = (() => {
    try {
      const url = new URL(config.apiBaseUrl);
      return url.origin; // protocol + hostname + port, no path
    } catch {
      // Fallback: strip path manually
      return config.apiBaseUrl.replace(/\/api.*$/, '');
    }
  })();

  const escapedOrigin = backendOrigin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Matches ANY path on the backend host — covers /api/..., /api/api/..., etc.
  const apiCondition = createInterceptorCondition<IncludeBearerTokenCondition>({
    urlPattern: new RegExp(`^${escapedOrigin}(\\/.*)?$`, 'i'),
    bearerPrefix: 'Bearer'
  });

  return [
    provideKeycloak({
      config: {
        url: config.keycloakUrl,
        realm: config.keycloakRealm,
        clientId: config.keycloakClientId
      },
      initOptions: {
        onLoad: 'login-required',
        checkLoginIframe: false
      },
      features: [
        withAutoRefreshToken({
          sessionTimeout: 60000
        })
      ],
      providers: [
        AutoRefreshTokenService, 
        UserActivityService
      ]
    }),
    {
      provide: INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
      useValue: [apiCondition]
    },
    {
      provide: INATRACE_API_BASE_URL,
      useValue: config.apiBaseUrl
    }
  ];
}
