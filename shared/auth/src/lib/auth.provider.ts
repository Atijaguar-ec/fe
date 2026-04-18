import { InjectionToken, APP_INITIALIZER } from '@angular/core';
import Keycloak from 'keycloak-js';
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
  let backendOrigin = '';
  let apiPath = '';

  try {
    const url = new URL(config.apiBaseUrl);
    backendOrigin = url.origin; // e.g. "https://testinatrace.espam.edu.ec"
    apiPath = url.pathname !== '/' ? url.pathname : ''; // e.g. "/api"
  } catch {
    apiPath = config.apiBaseUrl; // e.g. "/api"
  }

  const escapedOrigin = backendOrigin ? backendOrigin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
  const escapedPath = apiPath ? apiPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';

  let regexPattern = '';
  if (escapedOrigin) {
    if (escapedPath) {
      // Matches:
      // 1. Any absolute URL starting with backendOrigin (covers double /api/api prefixes)
      // 2. Relative URLs starting with escapedPath (e.g., /api/...)
      // 3. Relative URLs starting without leading slash (e.g., api/...)
      const pathNoSlash = escapedPath.replace(/^\\?\//, '');
      regexPattern = `^(?:${escapedOrigin}|${escapedPath}|${pathNoSlash})(\\/.*)?$`;
    } else {
      regexPattern = `^${escapedOrigin}(\\/.*)?$`;
    }
  } else {
    const pathNoSlash = escapedPath.replace(/^\\?\//, '');
    regexPattern = `^(?:${escapedPath}|${pathNoSlash})(\\/.*)?$`;
  }

  const apiCondition = createInterceptorCondition<IncludeBearerTokenCondition>({
    urlPattern: new RegExp(regexPattern, 'i'),
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
    },
    {
      provide: APP_INITIALIZER,
      useFactory: (kc: Keycloak) => {
        return () => {
          (window as any).__inatraceKeycloak = kc;
        }
      },
      deps: [Keycloak],
      multi: true
    }
  ];
}
